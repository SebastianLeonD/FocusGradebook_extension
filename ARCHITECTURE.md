# Focus Grade Calculator — Architecture Reference

> **Single source of truth** for the codebase. Read this before modifying any file.
> Update this file whenever a component's behavior changes.

---

## Data Flow Overview

```
User clicks extension icon
  → background.js checks URL
  → Valid Focus URL? Send "openFloatingCalculator" message
  → content-main.js receives message → creates floating popup
  → User interacts with popup
    → Add hypothetical → content-calculations.js:handleAdd() → addRow() → calculate()
    → Edit score → openScoreEditor() → saveScoreEdit() → calculate()
    → Undo/Redo → undo()/redo() → calculate()
    → GPA Calculator → gpa-calculator.js
    → Theme change → theme-system.js:applyPopupTheme()
```

---

## js/core/background.js

**Purpose**: Service worker that controls extension icon behavior.

### Functions

| Function | Params | Returns | Description |
|----------|--------|---------|-------------|
| `isFocusUrl(url)` | `string` | `boolean` | Checks if URL contains `focusschoolsoftware.com` |
| `updateIconBehavior(tabId, url)` | `number, string` | `void` | Sets popup to `wrong_page.html` on non-Focus URLs, clears popup on Focus URLs so `onClicked` fires |

### Listeners
- `chrome.tabs.onUpdated` — Re-checks URL on navigation
- `chrome.tabs.onActivated` — Re-checks URL on tab switch
- `chrome.action.onClicked` — Sends `openFloatingCalculator` message to content script (only fires when popup is empty string)

### Edge Cases
- `chrome.runtime.lastError` is silently caught when `sendMessage` fails (e.g., content script not loaded)

---

## js/core/content-utilities.js

**Purpose**: Shared global state, utility functions, and dynamic column detection.

### Global State Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `hypotheticals` | `Array<{earned, total, category, classKey, name}>` | `[]` | All hypothetical assignments across classes |
| `hypotheticalCount` | `number` | `1` | Auto-incrementing counter for naming |
| `originalRowsByClass` | `Object<classKey, string>` | `{}` | Saved original table HTML per class |
| `mode` | `"weighted"\|"unweighted"` | `"unweighted"` | Current grading mode |
| `currentClassId` | `string\|null` | `null` | Current class dropdown value |
| `redoHistory` | `Array` | `[]` | Legacy redo stack (kept for compatibility with `redoHypothetical`) |
| `actionHistory` | `Array<{type, classKey, timestamp, ...}>` | `[]` | Unified action history. Types: `"add"`, `"scoreEdit"`, `"deleteHypothetical"` |
| `actionRedoHistory` | `Array` | `[]` | Unified redo history (mirrors actionHistory structure) |
| `floatingPopup` | `HTMLElement\|null` | `null` | Reference to popup DOM element |
| `helpModal` | `HTMLElement\|null` | `null` | Reference to help modal |
| `isDragging` | `boolean` | `false` | Whether popup is being dragged |
| `nextRowColor` | `string` | `"#FFFFFF"` | Next alternating row color |
| `originalCategoryData` | `Object<classKey, Object>` | `{}` | Original weighted category scores per class |
| `isInitialized` | `boolean` | `false` | Prevents double initialization |
| `columnIndexMap` | `Object\|null` | `null` | Maps column names to header indices |
| `classChangeObserver` | `MutationObserver\|null` | `null` | Watches class dropdown for changes |
| `lastDetectedClassValue` | `string\|null` | `null` | Previous class dropdown value |
| `classChangeTimeoutId` | `number\|null` | `null` | Debounce timeout for class change |
| `classChangePollingId` | `number\|null` | `null` | 1500ms polling interval for programmatic class changes |

### Functions

| Function | Params | Returns | Description |
|----------|--------|---------|-------------|
| `detectClassType()` | none | `"weighted"\|"unweighted"` | Checks for `.student-gb-grades-weighted-grades-container` |
| `setupClassChangeMonitoring()` | none | `void` | MutationObserver + 1500ms polling on class dropdown |
| `handleClassChange()` | none | `void` | Clears all state, removes hypothetical rows, re-detects mode after 1000ms |
| `getLetterGrade(percent)` | `number` | `string` | A:>=90, B:>=80, C:>=70, D:>=60, F:<60 |
| `isValid(earned, total)` | `string, string` | `boolean` | Returns false only if earned or total is "NG" |
| `getCurrentClassKey()` | none | `string` | Priority: `.gb-title` > dropdown text > URL param > fallback |
| `getNextColorFromTable()` | none | `string` | Returns opposite of first row's color for alternation |
| `extractCategories()` | none | `string[]` | Gets category names from weighted header. Fallback: `["Tests","Labs & Projects","Quizzes","Classwork & Homework"]` |
| `getDateTime()` | none | `string` | Formatted date string with randomized minutes |
| `buildColumnIndexMap()` | none | `void` | Scans `<th>` headers, maps to column indices |
| `getCell(row, columnName)` | `HTMLElement, string` | `HTMLElement\|null` | 5-step resolution: CSS class → data-field → alt attr → child→parent → header index |

### COLUMN_SELECTORS

```javascript
{
  assignment:   { child: '.assignment-name-link' },
  points:       { cls: 'td.points-cell' },
  percent:      { cls: 'td.student-percent' },
  grade:        { cls: 'td.student-letter' },
  category:     { attr: 'td[data-field="category_title"]',
                  altAttr: 'td[data-field="assignment_type_title"]' },
  comment:      { attr: 'td[data-field="comment"]' },
  resources:    { attr: 'td[data-field="resources"]' },
  lastModified: { child: '[data-field="updated_at"]' }
}
```

### Key Behavior
- `handleClassChange()` clears: `hypotheticals`, `redoHistory`, `actionHistory`, `actionRedoHistory`, `editedScores`, `originalScoreSnapshots`, `scoreEditHistory`, `scoreRedoHistory`, `fgsRowIdCounter`
- Polling catches programmatic `<select>` value changes that don't fire `change` events
- `getCell()` returns `null` for missing columns — all callers must guard with `if (cell)`

---

## js/calculations/content-calculations.js

**Purpose**: Grade calculation engine, hypothetical assignment management, inline score editing, undo/redo system.

### Local State

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `editedScores` | `Object<rowId, EditData>` | `{}` | Active score modifications |
| `originalScoreSnapshots` | `Object<rowId, Snapshot>` | `{}` | Original cell state before editing |
| `lastClassKey` | `string\|null` | `null` | Tracks class changes |
| `scoreEditHistory` | `Array` | `[]` | Score edit entries for undo |
| `scoreRedoHistory` | `Array` | `[]` | Undone score edits for redo |
| `calculateDebounceTimer` | `number\|null` | `null` | 100ms debounce timer |
| `fgsRowIdCounter` | `number` | `0` | Monotonic counter for row IDs |

### EditData Shape
```javascript
{
  originalHTML: string,        // Original cell innerHTML
  original: string,            // Original text (e.g., "85 / 100")
  originalEarned: number,      // Original earned points
  total: number,               // Total points possible
  modifiedEarned: number,      // User-entered earned points
  modifiedTotal: number,       // Modified total (usually same as total)
  wasExcluded: boolean,        // Was NG/X/*/etc. before editing
  modified: string,            // "earned/total" string
  row: HTMLElement,            // Reference to <tr>
  classKey: string,            // Class identifier
  category: string             // Category name (weighted mode)
}
```

### Snapshot Shape
```javascript
{
  html: string,          // Original cell innerHTML
  text: string,          // Original text content
  earned: number|null,   // Parsed earned value
  total: number|null,    // Parsed total value
  wasExcluded: boolean   // Whether excluded pattern matched
}
```

### UI Functions

| Function | Description |
|----------|-------------|
| `showToast(message, type, duration)` | Toast notification — replaces `alert()`. Types: `error`, `warning`, `info` |
| `showInlineConfirm(message, onYes)` | Yes/No confirmation bar — replaces `confirm()` |
| `showInlinePrompt(message, onSubmit)` | Input + OK/Cancel bar — replaces `prompt()` |

### Calculation Functions

| Function | Description |
|----------|-------------|
| `calculate()` | Routes to `calculateWeighted()` or `calculateUnweighted()` based on `mode` |
| `debouncedCalculate()` | Wraps `calculate()` with 100ms debounce |
| `calculateWeighted()` | Reads category weights from `.student-gb-grades-weighted-grades`, adds hypotheticals, applies score edits, updates category cells |
| `calculateUnweighted()` | Sums earned/total from all rows, adds hypotheticals, applies score edits, displays result |
| `getModifiedScores()` | Iterates `editedScores`, computes `{originalEarned, originalTotal, modifiedEarned, modifiedTotal, category, wasExcluded}` for each |

### Hypothetical Management

| Function | Description |
|----------|-------------|
| `handleAdd()` | Validates form inputs, creates hypothetical, calls `addRow()` + `calculate()` |
| `addRow(data)` | Clones a table row, fills with hypothetical data, prepends to table. Assigns unique `data-fgs-row-id` |
| `deleteSpecificAssignment(rowId)` | Finds row by `data-fgs-row-id`, removes from `hypotheticals` array, saves to undo history (with modified values if score was edited), animates removal |

### Score Editing

| Function | Description |
|----------|-------------|
| `makeScoresEditable()` | Binds click handlers on score/percent/letter cells. Right-click shows reset confirmation |
| `openScoreEditor(cell, rowId, row)` | Parses score, detects excluded patterns, prompts for total if unknown, calls `continueOpenEditor()` |
| `continueOpenEditor(cell, rowId, row, earned, total, wasExcluded, snapshot, classKey)` | Creates inline input, stores original in `editedScores`, handles save/cancel/blur |
| `saveScoreEdit(cell, rowId, newEarned, totalPoints)` | Updates `editedScores`, builds modified cell UI, updates percent/letter cells, pushes to history, calls `calculate()` |
| `checkAndRestoreOriginal(editMeta, earned, total, cell, rowId)` | If user enters the original value back, restores cell and cleans up edit state |
| `buildModifiedScoreCellUI(scoreCell, earned, total, rowId)` | Creates the red "X/Y" display with revert button |

### Undo/Redo System

| Function | Description |
|----------|-------------|
| `undo()` | Pops last `actionHistory` entry. Routes by type: `scoreEdit` → `resetSingleScore()`, `deleteHypothetical` → re-add via `addRow()`, default → remove last hypothetical |
| `redo()` | Pops last `actionRedoHistory` entry. Routes: `scoreEdit` → `redoScoreEdit()`, `deleteHypothetical` → `redoDeleteHypothetical()`, default → `redoHypothetical()` |
| `redoScoreEdit(classKey)` | Restores edited score from `scoreRedoHistory`, rebuilds cell UI |
| `redoHypothetical(classKey)` | Re-adds assignment from `redoHistory`, restores saved score redo entries with new row ID |
| `redoDeleteHypothetical(classKey, action)` | Re-deletes the restored assignment |
| `resetSingleScore(rowId, cellOverride, fromUndo)` | Restores cell to original state. If `fromUndo=false`, saves to redo history |
| `clearAll()` | Removes all hypotheticals + score edits for current class. Calls `restoreOriginalRows()` |

### Key Behavior: Excluded Scores

**Patterns** (from `EXCLUDED_SCORE_PATTERNS`):
`/^NG/i`, `/^Z/i`, `/^X/i`, `/\*/`, `/EXC/i`, `/EXCLUDE/i`, `/^✓/`, `/^[\u2713\u2714]/`

**Treatment**:
- X, NG, *, EXC, checkmark: `wasExcluded = true` — when edited, BOTH earned and total are added (they contributed 0/0 originally)
- Z: `wasExcluded = true` BUT Focus already counts Z's denominator in the grade total. Special handling in `getModifiedScores()` zeroes `modifiedTotal` so only earned is added

### Key Behavior: Undo/Redo with Hypotheticals

When undoing an 'add' that removes a hypothetical row:
- Any pending `scoreRedoHistory` entries for that row are saved into the redo entry as `savedScoreRedos`
- Modified earned/total values are captured into the saved assignment
- When redoing the add, `savedScoreRedos` are restored with the new row's ID

When deleting a hypothetical with score edits:
- Modified earned/total are captured into the `deleteHypothetical` action entry
- When undoing the delete, `addRow()` uses the modified values

### Data Flow: Score Edit → Recalculation

```
User clicks score cell
  → openScoreEditor() parses cell, stores original in editedScores
  → User types new value, presses Enter or blurs
  → saveScoreEdit() updates editedScores[rowId].modifiedEarned/modifiedTotal
  → calculate() → calculateWeighted/Unweighted()
    → getModifiedScores() reads editedScores
    → For wasExcluded: adds both earned + total
    → For normal: subtracts originalEarned, adds modifiedEarned
    → Updates display
```

### Data Flow: Weighted Calculation

```
calculateWeighted()
  1. Read category weights from header row
  2. Read original scores from saved originalCategoryData
  3. Add hypotheticals (from hypotheticals array) to categories
  4. Apply score edits (from getModifiedScores()) to categories
  5. For each category: score = earned/total, weighted = score * weight/100
  6. Final grade = sum(weighted) / sum(used weights) * 100
  7. Update category cells and display
```

---

## js/core/content-main.js

**Purpose**: Popup lifecycle management, event wiring, drag-and-drop, settings.

### Local State

| Variable | Type | Description |
|----------|------|-------------|
| `isPopupInitializing` | `boolean` | Prevents race condition during popup creation |
| `lastClickTime` | `number` | Debounce timestamp (300ms) |
| `cachedElements` | `Object` | DOM element cache for `getCachedElement()` |
| `previousScreenBeforeSettings` | `string\|null` | Tracks which screen was visible before settings opened |

### Key Functions

| Function | Description |
|----------|-------------|
| `handleExtensionClick()` | Debounces (300ms), toggles existing popup or creates new one |
| `createFloatingPopup()` | Creates `#focus-grade-simulator-popup`, injects HTML/CSS, wires up all events |
| `launchGradeCalculator()` | Validates page, detects mode, saves original rows, builds column map, shows calculator UI |
| `launchGPACalculator()` | Validates page for `StudentRCGrades.php`, shows GPA interface |
| `showModeSelection()` | Shows mode selection screen, hides other screens |
| `showHelp()` | Creates/shows help modal |
| `toggleSettingsDropdown()` | Shows/hides settings, remembers previous screen |
| `setupDrag()` | Makes popup draggable via header |
| `isOnGradeCalculatorPage()` | Checks URL for correct Focus grades page |

### Initialization Flow

```
chrome.runtime.onMessage("openFloatingCalculator")
  → handleExtensionClick()
  → First time: createFloatingPopup()
    → getPopupHTML() (from popup-html.js)
    → generateThemedCSS() (from theme-system.js)
    → setupEvents() — binds all button handlers
    → setupDrag() — drag-and-drop on header
    → setupGPACalculatorEvents() (from gpa-calculator.js)
    → setupFeedbackSystem() (from feedback-system.js)
    → setupNewFeaturesSection() (from feedback-system.js)
    → setupClassChangeMonitoring() (from content-utilities.js)
  → Subsequent: toggle visibility
```

---

## js/features/gpa-calculator.js

**Purpose**: GPA calculation engine using BCPS (Broward County Public Schools) formula.

### State

```javascript
gpaCalculatorData = {
  classes: [],                // Auto-detected from Focus
  selectedClasses: [],        // User-selected for calculation
  baselineStats: null,        // Current cumulative GPA stats
  projectedGPAs: {},          // Calculated results
  currentStep: 1,             // Wizard step (1 or 2)
  selectedSemester: 'semester2'  // semester1 | semester2 | fullYear
}

forgivenessData = {
  allClasses: [],             // All classes
  eligibleClasses: [],        // Classes with D+, D, or F
  selectedActions: [],        // Forgiveness choices
  results: null               // Forgiveness calculation results
}
```

### BCPS Grade Points

| Grade | Quarter Points | Exam Points |
|-------|---------------|-------------|
| A | 12.0 | 8.0 |
| B+ | 9.3 | 6.2 |
| B | 9.0 | 6.0 |
| C+ | 6.3 | 4.2 |
| C | 6.0 | 4.0 |
| D+ | 3.3 | 2.2 |
| D | 3.0 | 2.0 |
| F | 0 | 0 |

### Semester Calculation

**Weights**: Quarter 1 (37.5%) + Quarter 2 (37.5%) + Exam (25%)

**2-of-3 Passing Rule**: If fewer than 2 of {Q1, Q2, Exam} are passing (D or higher) → semester grade is F regardless of calculated points.

**Exam Exemption**: If exempt, weight redistributed: each quarter gets 50%.

### Weight Bonuses (GPA only)
- Honors/HON/HNR: +1.0
- AP/AICE/IB/DE: +2.0 (only if grade is C or higher)

### Key Functions

| Function | Description |
|----------|-------------|
| `escapeHTML(str)` | Prevents XSS when inserting scraped text into innerHTML |
| `bcpsSemesterAnalysis(grades, type)` | Calculates semester grade from quarters + exam |
| `bcpsFullYearAnalysis(grades)` | Combines S1 + S2 analyses |
| `calculateGPA(classes, semester)` | Main GPA calculation with weighted/unweighted |
| `normalizeBCPSLetter(letter)` | Normalizes input ("EX" → exempt, etc.) |
| `isFocusStudentGradesURL()` | Checks for `StudentRCGrades.php` in URL |

---

## js/features/feedback-system.js

**Purpose**: Anonymous user feedback collection via Web3Forms API.

### Functions

| Function | Description |
|----------|-------------|
| `setupFeedbackSystem()` | Initializes after 500ms delay |
| `setupFeedbackEvents(retries)` | Binds feedback form handlers, retries up to 5 times |
| `toggleFeedbackBox()` | Collapse/expand feedback section |
| `handleSendFeedback()` | Validates and sends feedback |
| `sendViaWeb3Forms(text)` | POST to `api.web3forms.com/submit` with anonymous data |
| `setupNewFeaturesSection()` | Binds "What's New" button |
| `openNewFeaturesModal()` | Creates and shows feature announcement modal |

### Data Sent (anonymous only)
- Feedback message text
- Extension version number
- Page URL (origin + pathname only)
- User agent string
- Timestamp
- **No PII**: dummy name/email used

---

## js/ui/popup-html.js

**Purpose**: Returns complete HTML string for the floating popup.

### Sections
1. **Header** — Title, tutorial/help/settings/minimize/close buttons
2. **Mode Selection** — "Calculate grades" and "GPA Calculator" buttons
3. **Grade Calculator Form** — Assignment name, earned/total inputs, category, add/reset/undo/redo buttons
4. **GPA Calculator** — Step 1 (class selection + grades) and Step 2 (results)
5. **Settings Dropdown** — Theme selector (9 themes)
6. **Feedback Box** — Collapsible textarea + send button

### Key IDs
- `#focus-grade-simulator-popup` — Main popup container
- `#fgs-earned`, `#fgs-total`, `#fgs-name` — Calculator inputs
- `#fgs-category-dropdown` — Category select (weighted)
- `#fgs-add-btn`, `#fgs-reset-btn` — Action buttons
- `#fgs-undo-btn`, `#fgs-redo-btn` — Undo/redo buttons
- `#fgs-gpa-classes-list` — GPA class list container

---

## js/ui/theme-system.js

**Purpose**: 9-theme system with complete CSS generation.

### Themes
`default` (Blue), `emerald` (Green), `transparent` (Glass), `bright` (White), `sunset` (Orange), `ocean` (Teal), `purple` (Haze), `dark` (Mode), `forest` (Green)

### Key Functions

| Function | Description |
|----------|-------------|
| `applyPopupTheme(name)` | Swaps theme CSS, calls `applySizingForCurrentInterface()` |
| `generateThemedCSS(theme)` | Returns full CSS string for a theme. Handles sizing, layout, colors |
| `applySizingForCurrentInterface()` | Adjusts popup dimensions for current screen |
| `setPopupSizeForInterface(interface)` | Sets size class: small/medium/large/xlarge |

### Sizing Classes
- `.size-small` — 520px (mode selection)
- `.size-medium` — 550px (grade calculator)
- `.size-large` — 650px (GPA calculator)
- `.size-xlarge` — 800px (GPA step 2)

### Persistence
Theme saved to `localStorage` as `fgs-selected-theme`.

---

## js/features/help-modal/

### help-modal-html.js
Returns HTML string for help modal. Sections: GPA requirements, grade calculator workflow, GPA workflow, special cases, contact info.

### help-modal-css.js
Returns CSS string for help modal. Responsive, scrollable, with styled sections and step badges.

---

## popup/wrong_page.html

Static HTML page shown when extension is clicked on a non-Focus URL. Contains instructions for navigating to the correct grades page with screenshots.

---

## privacy-policy.html

Chrome Web Store privacy policy. Key claims: 100% local processing, no grade/personal data collection, anonymous feedback only via Web3Forms.
