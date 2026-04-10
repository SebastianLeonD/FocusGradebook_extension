# Issues Log — Focus Grade Calculator

> **MANDATORY**: Every bug, error, or unexpected behavior must be logged here after resolving.
>
> **Before fixing ANY issue**, search this file first for similar past problems.
> This is how the AI learns across sessions and avoids repeating the same mistakes.

---

## Entry Template

```
### #[NUMBER] — [SHORT TITLE]
- **Date**: YYYY-MM-DD
- **Symptom**: What the user saw / what went wrong
- **Root Cause**: Why it happened (be specific — include the exact code path)
- **Fix**: What was changed and in which files
- **Files Changed**: List of files modified
- **Lesson**: One-line takeaway to prevent recurrence
```

---

## Resolved Issues

### #001 — Class switching not detected when calculator is open
- **Date**: 2026-03-11
- **Symptom**: Changing classes in the Focus dropdown while the calculator was open did not reset hypotheticals or recalculate. Old assignments from the previous class remained visible.
- **Root Cause**: Focus SIS changes the `<select>` value programmatically (not via user interaction), which doesn't fire the `change` event. MutationObserver also doesn't detect it because `value` is a DOM property, not an HTML attribute.
- **Fix**: Added a 1500ms polling interval in `setupClassChangeMonitoring()` that compares `sel.value` against `lastDetectedClassValue` and calls `handleClassChange()` on mismatch.
- **Files Changed**: `js/core/content-utilities.js`
- **Lesson**: DOM property changes (like `select.value`) are invisible to MutationObserver — use polling as a fallback.

### #002 — X/10 score edit doesn't update weighted grade
- **Date**: 2026-03-11
- **Symptom**: Editing an "X / 10" score to a numeric value (e.g., "8 / 10") did not update the weighted grade display. The edit appeared to work visually but the grade didn't change.
- **Root Cause**: The `category` field was empty in the `editedScores` entry. `getModifiedScores()` passed an empty category to `calculateWeighted()`, which skipped it at `if (!category) return;`. The category cell wasn't found because the Focus SIS uses `data-field="assignment_type_title"` instead of `data-field="category_title"` in some views.
- **Fix**: (1) Added `altAttr: 'td[data-field="assignment_type_title"]'` to `COLUMN_SELECTORS.category`. (2) Updated `getCell()` to check `spec?.altAttr`. (3) Added last-resort fallback that scans all `<td>` cells for text matching known weighted categories.
- **Files Changed**: `js/core/content-utilities.js`, `js/calculations/content-calculations.js`
- **Lesson**: Always check both `category_title` and `assignment_type_title` data-field attributes. Category detection needs multiple fallbacks because Focus SIS is inconsistent.

### #003 — Reset All doesn't clear edited scores (red cells remain)
- **Date**: 2026-03-11
- **Symptom**: After editing scores on original assignments (not hypotheticals), clicking "Reset All" did not restore the red modified cells back to their original values. The cells stayed red with the edited values.
- **Root Cause**: `saveOriginalRows()` was only called when adding hypothetical assignments, not at calculator launch. If the user only edited scores without adding hypotheticals, `restoreOriginalRows()` had nothing to restore from. Additionally, `data-score-modified` and `data-fgs-edit-bound` attributes were not cleaned up.
- **Fix**: (1) Called `saveOriginalRows()` in `launchGradeCalculator()` right after `buildColumnIndexMap()`. (2) Added safety net in `clearAll()` that removes `data-score-modified`, `data-percent-modified`, `data-letter-modified`, and `data-fgs-edit-bound` attributes from all elements after restoration.
- **Files Changed**: `js/core/content-main.js`, `js/calculations/content-calculations.js`
- **Lesson**: Always save original state at startup, not just when the first modification happens. Add DOM attribute cleanup as a safety net after any bulk restoration.

### #004 — Clicking revert button on edited grade prevents redo
- **Date**: 2026-03-11
- **Symptom**: After editing a score and then clicking the revert (X) button on the modified cell, pressing Redo did nothing. The score edit was lost and could not be redone.
- **Root Cause**: `resetSingleScore()` deleted the edit data from `editedScores` and removed the entry from `scoreEditHistory`, but did NOT push to `scoreRedoHistory` or `actionRedoHistory`. The redo system had no record of the edit.
- **Fix**: Added code in `resetSingleScore()` (when `fromUndo=false`) to push the edit data to `scoreRedoHistory` and move the corresponding `actionHistory` entry to `actionRedoHistory` before deleting the edit data.
- **Files Changed**: `js/calculations/content-calculations.js`
- **Lesson**: Any action that removes an edit must save its data to the redo history. The pattern is: save to redo BEFORE deleting from active state.

### #005 — Missing category in redo cycle
- **Date**: 2026-03-11
- **Symptom**: After undo then redo of a score edit on a weighted class, the grade didn't update correctly. The modification was applied but without a category, so `calculateWeighted()` ignored it.
- **Root Cause**: `redoScoreEdit()` didn't include `category` when reconstructing `editedScores[rowId]`. The undo path also didn't include `category` when pushing to `scoreRedoHistory`.
- **Fix**: Added `category: lastRedo.editData.category || ""` to the restored object in `redoScoreEdit()`. Added `category: editData.category` to the undo path's `scoreRedoHistory.push()`.
- **Files Changed**: `js/calculations/content-calculations.js`
- **Lesson**: Every field in `editedScores` must be preserved through the full undo→redo cycle. When adding new fields to EditData, update all three places: save, undo-push, redo-restore.

### #006 — Deleted hypothetical with edited score loses edits on undo
- **Date**: 2026-03-11
- **Symptom**: Add a hypothetical, edit its score, delete it. Undo the delete — assignment comes back but with the original score, not the edited one.
- **Root Cause**: `deleteSpecificAssignment()` pushed the original `deletedAssignment` (from the `hypotheticals` array) to `actionHistory`, but the `hypotheticals` array still had the original earned/total values. The score edit was stored only in `editedScores[rowId]`, which was purged on delete. When undo called `addRow(deletedAssignment)`, it used the original values.
- **Fix**: Before pushing to `actionHistory`, check if `editedScores[deletedRowId]` exists and copy the modified earned/total into the `savedAssignment`. Both code paths in `deleteSpecificAssignment()` were updated.
- **Files Changed**: `js/calculations/content-calculations.js`
- **Lesson**: When deleting something that has modifications, capture the modified state (not just the original) into the undo/redo history.

### #007 — Undo all + Redo all loses score edits on hypotheticals
- **Date**: 2026-03-11
- **Symptom**: Add multiple hypotheticals, edit scores on them, undo everything (edits undo, then assignments undo). Redo everything — assignments come back but score edits are gone.
- **Root Cause**: When undoing an 'add' (removing a hypothetical row), lines 2863-2864 purged all `scoreRedoHistory` entries for that row's ID. When later redoing the add, `addRow()` created a new row with a new `data-fgs-row-id`, so the old score redo entries (now purged) couldn't be found anyway.
- **Fix**: (1) Before purging `scoreRedoHistory`, save entries into the `redoHistory` entry as `savedScoreRedos`. (2) In `redoHypothetical()`, after `addRow()` creates the new row, restore `savedScoreRedos` with the new row's ID and push corresponding `actionRedoHistory` entries. (3) Fixed `redoScoreEdit()` to also search `data-fgs-row-id` (not just `data-original-row-id`) when looking up rows.
- **Files Changed**: `js/calculations/content-calculations.js`
- **Lesson**: When removing a row that has redo data, save that data into the removal action's redo entry. When re-creating the row, update saved entries with the new row ID. Always search both `data-original-row-id` and `data-fgs-row-id` when looking up rows.

### #008 — Editing Z score shows 600% instead of correct percentage
- **Date**: 2026-04-09
- **Symptom**: In a class with Z/5, Z/30, X/5, NG/12, editing Z/30 → 30/30 showed "Hypothetical: 600% A" instead of ~86% B. The 30-point denominator was completely lost from the calculation.
- **Root Cause**: Two interacting flaws: (1) `getModifiedScores()` had a Z-specific hack (`forceKeepOriginalDenominator`) that zeroed `modifiedTotal` for Z scores. (2) `calculateUnweighted()` used a two-pass system where the first pass skipped modified excluded rows' denominators. Combined: Z/30's denominator vanished → 30/5 = 600%. The hack was designed for weighted mode (where Focus's summary already includes Z denominators) but broke unweighted mode.
- **Fix**: (1) Treat Z/N as `wasExcluded=false, earned=0, total=N` in `parseScoreCell()` — Focus counts Z denominators, so they're not excluded. (2) Removed the `forceKeepOriginalDenominator` hack. (3) Simplified `calculateUnweighted()` to single-pass that reads directly from `editedScores`. (4) Simplified `calculateWeighted()` to use a universal delta approach. (5) Fixed `openScoreEditor()` fallback to match. (6) Extracted `classifyScoreText()` so Z/excluded detection lives in one place. (7) Added early-return guard in `calculate()` to clear displays when no modifications exist.
- **Files Changed**: `js/calculations/content-calculations.js`
- **Lesson**: Never use score-type-specific hacks in shared functions — use a unified delta formula (`modified - original`) that works for all cases. When Z/excluded detection logic exists in multiple places, they WILL drift and cause bugs. Extract to a single function.

### #009 — Hypothetical grade text stays after undoing all changes
- **Date**: 2026-04-09
- **Symptom**: After editing a score and then undoing the change, the red "(Hypothetical: 0% F)" text remained visible even though no modifications existed.
- **Root Cause**: `calculate()` always called `calculateUnweighted()`/`calculateWeighted()` which always called `showGrade()`/`showWeightedGrade()`, even when there were no hypotheticals or score edits. The display was never cleared.
- **Fix**: Added an early-return guard in `calculate()` that checks `hypotheticals` array and `hasActiveScoreEditsForClass()`. If both are empty, calls `clearDisplays()` (and `restoreOriginalCategoryData()` in weighted mode) and returns without running the calculation.
- **Files Changed**: `js/calculations/content-calculations.js`
- **Lesson**: Always check if modifications exist before displaying hypothetical results. The display lifecycle must match the data lifecycle — when data is cleared, the display must be cleared too.

---

## Patterns to Watch For

These recurring themes caused multiple bugs:

1. **Row ID changes**: `addRow()` generates a new `data-fgs-row-id` every time. Any undo/redo data referencing the old ID becomes stale. Always update saved references when re-creating rows.

2. **Missing category**: Score edits in weighted mode MUST have a `category` field. If missing, `calculateWeighted()` silently ignores the modification. Use multiple fallbacks: `getCell(row, 'category')` → `data-assignment-info` JSON → cell text scan.

3. **Redo data preservation**: Every action that removes state (delete, undo-add, reset) must save enough data to reconstruct that state on redo. The pattern is always: save BEFORE deleting.

4. **DOM property vs attribute**: Focus SIS sometimes sets DOM properties (like `select.value`) instead of HTML attributes. MutationObserver can't detect property changes — use polling as fallback.

5. **Original state capture timing**: Save original state at calculator launch, not at first modification. Otherwise, "restore to original" has nothing to restore from if the user only edits (without adding hypotheticals).

6. **Z score semantics**: Z/N means "zero grade with denominator" — Focus counts Z's denominator in the total. Treat as `wasExcluded=false, earned=0, total=N`. All Z/excluded detection MUST go through `classifyScoreText()` to prevent drift between parsing locations.

7. **Display lifecycle**: Hypothetical grade displays must be cleared when all modifications are removed. The `calculate()` early-return guard handles this — don't bypass it.
