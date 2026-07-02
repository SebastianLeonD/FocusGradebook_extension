# AI Error Log

> Every time the AI makes a mistake while editing this codebase, it should log it here.
> Before editing any file, the AI should read this log to avoid repeating past mistakes.

## Format
```
### [SHORT TITLE]
- **Date**: YYYY-MM-DD
- **File**: path/to/file.js
- **What went wrong**: Brief description of the error
- **Root cause**: Why it happened
- **Fix**: How it was resolved
- **Lesson**: One-line takeaway to prevent recurrence
```

---

## Errors

### Stale variable reference in showCoreGPAHelp()
- **Date**: 2026-03-15
- **File**: js/features/gpa-calculator.js
- **What went wrong**: `popup.appendChild(formula)` referenced a variable `formula` that no longer existed — it was renamed to `disclaimer` when the percent error formula was replaced with a disclaimer div.
- **Root cause**: Variable was renamed from `formula` to `disclaimer` but the `appendChild` call was not updated to match.
- **Fix**: Changed `popup.appendChild(formula)` to `popup.appendChild(disclaimer)`.
- **Lesson**: After renaming a variable, search for ALL references to the old name in the same function before finishing.
