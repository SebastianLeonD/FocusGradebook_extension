# Focus Grade Calculator — AI Instructions

## Mandatory Workflow

Every session, follow this order:

1. **Check ISSUES_LOG.md** — Search for similar past bugs before fixing anything
2. **Read ARCHITECTURE.md** — Understand the component you're modifying before touching it
3. **Plan changes** — Know what files you'll edit and why
4. **Implement** — Make the changes
5. **Log issues** — If you hit a bug or unexpected behavior, add it to ISSUES_LOG.md
6. **Verify build** — Run `node --check` on every modified JS file

## Stack

- **Platform**: Chrome Extension (Manifest V3)
- **Language**: Vanilla JavaScript (no frameworks, no build step)
- **UI**: All injected via JS template strings — no separate HTML/CSS for the popup
- **APIs**: Chrome Extensions API (tabs, runtime, action), Web3Forms (anonymous feedback)
- **Target site**: Focus Student Information System (`focusschoolsoftware.com`)
- **Version**: 1.7.0 (published on Chrome Web Store)
- **Indentation**: Tabs (not spaces)

## Project Structure

```
focus-grade-calculator/
├── manifest.json                          # MV3 manifest — permissions, content script load order
├── CLAUDE.md                              # This file — AI rules and project context
├── ARCHITECTURE.md                        # Detailed codebase reference (read before editing)
├── ISSUES_LOG.md                          # Bug/error memory (check before fixing bugs)
├── readme.md                              # User-facing project description
├── privacy-policy.html                    # CWS privacy policy
├── 16.png / 32.png / 48.png / 128.png     # Extension icons
├── popup/
│   ├── wrong_page.html                    # Shown when clicked on non-Focus pages
│   └── *.mp4                              # Tutorial videos (web accessible)
├── js/
│   ├── core/
│   │   ├── background.js                  # Service worker: icon behavior, message routing
│   │   ├── content-main.js                # Popup lifecycle, drag-drop, event wiring (~1400 lines)
│   │   └── content-utilities.js           # Global state, grade utils, DOM helpers (~440 lines)
│   ├── calculations/
│   │   └── content-calculations.js        # Grade engine, hypotheticals, undo/redo, editing (~4000 lines)
│   ├── features/
│   │   ├── gpa-calculator.js              # GPA calc with BCPS formula (~2000 lines)
│   │   ├── feedback-system.js             # Anonymous feedback via Web3Forms (~340 lines)
│   │   └── help-modal/
│   │       ├── help-modal-html.js         # Help modal HTML template
│   │       └── help-modal-css.js          # Help modal CSS template
│   └── ui/
│       ├── popup-html.js                  # Main popup HTML template (~800 lines)
│       └── theme-system.js               # 9 themes, CSS generation (~1000 lines)
└── .claude/
    ├── errors.md                          # AI error log (check before editing)
    └── settings.local.json                # Local Claude settings
```

## Content Script Load Order (DO NOT CHANGE)

```
1. popup-html.js           → HTML template function
2. help-modal-html.js       → Help HTML template
3. help-modal-css.js        → Help CSS template
4. content-utilities.js     → Shared globals & utilities (must be early)
5. theme-system.js          → Theme CSS generation
6. content-calculations.js  → Calculation engine
7. gpa-calculator.js        → GPA calculations
8. feedback-system.js       → Feedback handling
9. content-main.js          → Main entry point (uses everything above)
```

Files depend on earlier scripts' globals. Changing this order will break the extension.

## Code Rules

### Must Follow
- **Never use `alert()` or `confirm()` or `prompt()`** — use `showToast()`, `showInlineConfirm()`, `showInlinePrompt()` from content-calculations.js
- **Never add `console.log`** — this is a CWS-published extension
- **All content scripts share one global scope** — check `content-utilities.js` globals before adding new variables
- **Run `node --check <file>` after every edit** — catch syntax errors before they ship
- **Preserve tab indentation** — this project uses tabs, not spaces
- **No dead code** — remove unused functions/variables, don't comment them out
- **No speculative files** — don't create files "just in case"
- **Types/constants defined once** — `EXCLUDED_SCORE_PATTERNS`, `COLUMN_SELECTORS`, grade tables live in one place
- **Escape user-facing DOM text** — use `escapeHTML()` when inserting scraped text into `innerHTML`

### Common Pitfalls
- Content scripts run in **page context**, not extension context — no direct `chrome.storage`
- Adding a variable that shadows a global from `content-utilities.js`
- Breaking weighted/unweighted detection by modifying DOM selectors without testing both modes
- Editing `popup-html.js` template strings without escaping backticks
- Forgetting that `addRow()` generates a NEW `data-fgs-row-id` each time — undo/redo must account for ID changes
- `getCell()` returns `null` for missing columns — always guard with `if (cell)`
- `isValid()` only checks for "NG" — other excluded patterns are handled by `EXCLUDED_SCORE_PATTERNS`

## Critical Selectors (Focus SIS DOM)

| Selector | Purpose |
|----------|---------|
| `.grades-grid.dataTable` | Main grade table |
| `.student-gb-grades-weighted-grades-container` | Weighted grades wrapper |
| `.student-gb-grades-weighted-grades-header` | Category headers |
| `select.student-gb-grades-course` | Class dropdown |
| `.gb-title` | Class title display |
| `td.points-cell` | Score cell (position-independent) |
| `td.student-percent` | Percentage cell |
| `td.student-letter` | Letter grade cell |
| `td[data-field="category_title"]` | Category cell |

## Environment

- **No `.env` file** — no server-side secrets
- **Web3Forms API key** is in `feedback-system.js` (public, anonymous-only endpoint)
- **No database** — all state is in-memory JS variables, cleared on page reload
- **No auth** — reads publicly visible DOM on the user's own grades page
- **localStorage key**: `fgs-selected-theme` — persists theme preference

## Local Development

1. Open `chrome://extensions` in Chrome
2. Enable "Developer mode"
3. Click "Load unpacked" and select this directory
4. Navigate to a Focus SIS grades page to test
5. Click the extension icon to launch

### Gotchas
- Changes to `manifest.json` require clicking "Reload" on the extensions page
- Changes to `background.js` require the same reload
- Changes to content scripts take effect on the next page load (or hard refresh)
- The extension only activates on `focusschoolsoftware.com/focus/Modules.php?*Grades*`
- Testing requires an active Focus SIS student account

## Deployment

1. Update `version` in `manifest.json`
2. Run `node --check` on all JS files
3. Zip the project directory (excluding `.claude/`, `advertising-video/`, `.git/`)
4. Upload to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
5. Submit for review

## Key References

- **ARCHITECTURE.md** — Detailed function-level documentation for every file. Read before modifying any component.
- **ISSUES_LOG.md** — Bug memory. Search before fixing any issue. Log after resolving any bug.
- **.claude/errors.md** — AI-specific error log for coding mistakes made during edits.
