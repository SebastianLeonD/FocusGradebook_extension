/**
 * CONTENT-CALCULATIONS.JS  
 * Grade calculation engine and data management for Focus Grade Calculator
 * 
 * RESPONSIBILITIES:
 * - Weighted and unweighted grade calculations
 * - Grade display and UI updates 
 * - Hypothetical assignment management (add, undo, redo)
 * - Original data preservation and restoration
 * - Table row manipulation and visual updates
 * - Category data management for weighted mode
 * - Individual assignment deletion with hover effects
 */

/**
 * Handles adding a new hypothetical assignment
 * Validates input, creates assignment data, updates display, and recalculates grades
 */
let editedScores = {};
let originalScoreSnapshots = {};
let lastClassKey = null;  // Track the last class to detect switches
let scoreEditHistory = [];  // Track score edit history for undo
let scoreRedoHistory = [];  // Track undone score edits for redo
let calculateDebounceTimer = null;  // Debounce timer for calculate()

const EXCLUDED_SCORE_PATTERNS = [
    /^NG/i,           // NG or NG / 100
    /^Z/i,            // Z or Z / 100
    /^X/i,            // X or X / 100
    /\*/,             // * or * / 10
    /EXC/i,           // Exclude / EXC
    /EXCLUDE/i,       // Excluded
    /^✓/,             // Check mark
    /^[\u2713\u2714]/ // Unicode check marks
];

const SCORE_COMPARE_EPSILON = 0.0001;

function nearlyEqual(a, b, epsilon = SCORE_COMPARE_EPSILON) {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isFinite(na) || !Number.isFinite(nb)) return false;
    return Math.abs(na - nb) <= epsilon;
}

function getEditorCellCSS(height) {
    return `padding: 4px 8px; text-align: left; vertical-align: middle; height: ${height}px; max-height: ${height}px; overflow: visible; box-sizing: border-box;`;
}

function getFlexContainerCSS() {
    return 'display: flex; align-items: center; justify-content: flex-start; gap: 4px; height: 100%;';
}

function hasActiveScoreEditsForClass(classKey) {
    try {
        if (!classKey) {
            return Object.keys(editedScores).length > 0;
        }

        return Object.keys(editedScores).some((rowId) => {
            const edit = editedScores[rowId];
            if (!edit) return false;
            if (edit.classKey === classKey) return true;
            if (!edit.classKey && edit.row) {
                const rowClassId = edit.row.getAttribute?.("data-class-id");
                if (rowClassId && rowClassId === classKey) {
                    return true;
                }
            }
            if (!edit.classKey) {
                // Conservative fallback: treat as active so displays remain
                return true;
            }
            return false;
        });
    } catch (error) {
        console.error("Error checking score edits:", error);
        return false;
    }
}

function parseScoreCell(row, scoreCell) {
    try {
        const snapshot = {
            html: scoreCell.innerHTML,
            text: "",
            earned: null,
            total: null,
            wasExcluded: false
        };
        
        const nameCell = row.querySelector("td:nth-child(2)");
        if (nameCell && nameCell.hasAttribute("data-assignment-info")) {
            try {
                const assignmentData = JSON.parse(nameCell.getAttribute("data-assignment-info"));
                if (typeof assignmentData.earned === "number") {
                    snapshot.earned = assignmentData.earned;
                }
                if (typeof assignmentData.total === "number") {
                    snapshot.total = assignmentData.total;
                }
            } catch (error) {
            }
        }
        
        const clonedCell = scoreCell.cloneNode(true);
        const buttons = clonedCell.querySelectorAll("button");
        buttons.forEach((btn) => btn.remove());
        
        const rawText = clonedCell.textContent.replace(/\s+/g, " ").trim();
        const upperText = rawText.toUpperCase();
        snapshot.text = rawText;

        // Only check if the SCORE CELL itself contains excluded patterns
        // Don't check other columns to avoid false positives from "Excused" status columns
        const patternExcluded = EXCLUDED_SCORE_PATTERNS.some((pattern) => pattern.test(upperText));

        // Additional check: Make sure it's not a valid numeric score like "40/50"
        const hasValidNumericScore = /\d+\s*\/\s*\d+/.test(upperText);

        snapshot.wasExcluded = patternExcluded && !hasValidNumericScore;
        
        const parseNumber = (value) => {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? null : parsed;
        };
        
        if (snapshot.wasExcluded) {
            snapshot.earned = 0;
            const denominatorMatch = upperText.match(/\/\s*([0-9.]+)/);
            if (denominatorMatch) {
                snapshot.total = parseNumber(denominatorMatch[1]);
            }
        }
        
        if (snapshot.earned === null || snapshot.total === null) {
            const scoreMatch = upperText.match(/(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)/);
            if (scoreMatch) {
                snapshot.earned = parseNumber(scoreMatch[1]);
                snapshot.total = parseNumber(scoreMatch[2]);
            } else {
                const numbers = upperText.match(/(\d+\.?\d*)/g);
                if (numbers && numbers.length >= 2) {
                    snapshot.earned = parseNumber(numbers[0]);
                    snapshot.total = parseNumber(numbers[1]);
                } else if (numbers && numbers.length === 1) {
                    if (upperText.includes("/")) {
                        snapshot.earned = 0;
                        snapshot.total = parseNumber(numbers[0]);
                        snapshot.wasExcluded = true;
                    } else {
                        snapshot.earned = parseNumber(numbers[0]);
                        snapshot.total = parseNumber(numbers[0]);
                    }
                }
            }
        }
        
        if (snapshot.total === null && !snapshot.wasExcluded && snapshot.earned !== null) {
            snapshot.total = snapshot.earned;
        }

        const totalIsValid = typeof snapshot.total === "number" && !isNaN(snapshot.total) && snapshot.total > 0;
        snapshot.wasExcluded = snapshot.wasExcluded || !totalIsValid;
        return snapshot;
    } catch (error) {
        console.error("parseScoreCell - Error extracting score data:", error);
        return {
            html: scoreCell.innerHTML,
            text: scoreCell.textContent.trim(),
            earned: null,
            total: null,
            wasExcluded: false
        };
    }
}

function captureOriginalScoreSnapshot(row, scoreCell, rowId) {
    try {
        if (!rowId) return null;
        if (originalScoreSnapshots[rowId]) return originalScoreSnapshots[rowId];
        
        const snapshot = parseScoreCell(row, scoreCell);
        originalScoreSnapshots[rowId] = snapshot;
        return snapshot;
    } catch (error) {
        console.error("captureOriginalScoreSnapshot - Error:", error);
        return null;
    }
}

function applySnapshotToCell(cell, snapshot) {
    if (!cell || !snapshot) return;
    cell.innerHTML = "";
    if (typeof snapshot.html === "string") {
        cell.innerHTML = snapshot.html;
    } else if (typeof snapshot.text === "string") {
        cell.textContent = snapshot.text;
    }
    cell.style.cursor = "pointer";
    cell.style.backgroundColor = "";
    cell.style.padding = "";
    cell.style.textAlign = "";
    cell.style.height = "";
    cell.style.maxHeight = "";
    cell.style.lineHeight = "";
    cell.style.fontSize = "";
    cell.style.whiteSpace = "";
    cell.style.overflow = "";
    cell.style.verticalAlign = "";
    cell.style.boxSizing = "";
    cell.title = "Click to edit score";
    cell.removeAttribute("data-score-modified");
}


/**
 * Handles adding a new hypothetical assignment
 * Re-enables score editing after adding so new hypothetical is editable
 */
function handleAdd() {
    try {
        
        const nameInput = document.getElementById("fgs-name");
        const earnedInput = document.getElementById("fgs-earned");
        const totalInput = document.getElementById("fgs-total");
        const categoryDropdown = document.getElementById("fgs-category-dropdown");
        const categoryInput = document.getElementById("fgs-category-input");
        if (!earnedInput || !totalInput) return;
        
        const name = nameInput ? nameInput.value.trim() : "";
        const earned = earnedInput.value;
        const total = totalInput.value;
        const isWeighted = mode === "weighted";
        let category = "";
        
        if (isWeighted && categoryDropdown) {
            category = categoryDropdown.value;
        } else if (!isWeighted && categoryInput) {
            category = categoryInput.value.trim();
        }
        if (!earned || !total || (isWeighted && !category)) {
            alert("Please fill out all required fields.");
            return;
        }
        
        const data = { 
            earned: parseFloat(earned), 
            total: parseFloat(total), 
            category: category, 
            name: name, 
            classKey: getCurrentClassKey() 
        };
        
        // Use smart color detection
        nextRowColor = getNextColorFromTable();
        
        redoHistory = redoHistory.filter((r) => r.classKey !== getCurrentClassKey());
        actionRedoHistory = actionRedoHistory.filter((r) => r.classKey !== getCurrentClassKey());
        hypotheticals.push(data);
        actionHistory.push({ type: 'hypothetical', classKey: getCurrentClassKey(), timestamp: Date.now() });
        addRow(data);
        calculate();
        
        const keepValues = document.getElementById("fgs-keep-values");
        if (keepValues && !keepValues.checked) {
            earnedInput.value = "";
            totalInput.value = "";
            if (nameInput) nameInput.value = "";
        }
        
        // Re-enable score editing to include the new hypothetical
        setTimeout(() => {
            if (typeof makeScoresEditable === 'function') {
                makeScoresEditable();
            }
        }, 200);
        
    } catch (error) {
        console.error("ADD OPERATION - Error:", error);
    }
}
    
    /**
    * Main calculation dispatcher - routes to weighted or unweighted calculation
    * Determines calculation method based on current mode setting
    */
    
function calculate() {
        try {
                // Clear edited scores if class has changed
                const classKey = getCurrentClassKey();
                if (lastClassKey !== null && lastClassKey !== classKey) {
                    editedScores = {};
                    originalScoreSnapshots = {};
                    scoreEditHistory = [];
                    scoreRedoHistory = [];
                }
                lastClassKey = classKey;

                if (mode === "weighted") {
                        calculateWeighted();
                } else {
                        calculateUnweighted();
                }
        } catch (error) {
                console.error("Error in calculate:", error);
        }
    }

    /**
     * Debounced version of calculate to prevent rapid recalculations
     * Waits 100ms after last call before executing
     */
    function debouncedCalculate() {
        if (calculateDebounceTimer) {
            clearTimeout(calculateDebounceTimer);
        }
        calculateDebounceTimer = setTimeout(() => {
            calculate();
            calculateDebounceTimer = null;
        }, 100);
    }

    /**
         * Weighted calculation now properly adds denominator for excluded assignments
         * Find this function in content-calculations.js and replace the section that handles modifications
         */
        function calculateWeighted() {
    try {
        const classKey = getCurrentClassKey();
        const table = document.querySelector(".student-gb-grades-weighted-grades");
        if (!table) return;

        const categoryMap = {};
        const rows = table.querySelectorAll("tr");
        const percentRow = rows[1]?.querySelectorAll("td");
        const labelRow = rows[0]?.querySelectorAll("td");
        const scoreRow = rows[2]?.querySelectorAll("td");
        if (!percentRow || !labelRow || !scoreRow) return;
        const originalData = originalCategoryData[classKey];
        
        
        // Extract category weights and ORIGINAL scores from saved data
        for (let i = 1; i < percentRow.length - 1; i++) {
            try {
                const label = labelRow[i]?.innerText?.trim();
                const weight = parseFloat(percentRow[i]?.innerText?.replace("%", "").trim());
                
                if (label && !isNaN(weight)) {
                    categoryMap[label.toLowerCase()] = { 
                        weight, 
                        earned: 0, 
                        total: 0, 
                        hasHypotheticals: false
                    };
                    
                    const originalCellData = originalData?.[label.toLowerCase()];
                    if (originalCellData && originalCellData.originalText) {
                        const originalText = originalCellData.originalText.trim();
                        const scoreMatch = originalText.match(/^([0-9.]+)\/([0-9.]+)/);
                        if (scoreMatch) {
                            categoryMap[label.toLowerCase()].earned = parseFloat(scoreMatch[1]);
                            categoryMap[label.toLowerCase()].total = parseFloat(scoreMatch[2]);
                        }
                    }
                }
            } catch (error) {
                console.error("Error parsing category at index", i, error);
            }
        }
        
        
        // Add hypothetical assignments
        const classHypotheticals = hypotheticals.filter(h => h.classKey === classKey);
        classHypotheticals.forEach((hypo) => {
            try {
                const category = hypo.category?.toLowerCase();
                if (!category || !categoryMap[category]) return;

                // Hypothetical assignments have earned and total properties directly
                const earned = parseFloat(hypo.earned);
                const total = parseFloat(hypo.total);

                if (!isNaN(earned) && categoryMap[category]) {
                    if (!isNaN(total) && total !== 0) {
                        categoryMap[category].earned += earned;
                        categoryMap[category].total += total;
                    } else if (total === 0 && earned > 0) {
                        categoryMap[category].earned += earned;
                    }
                    categoryMap[category].hasHypotheticals = true;
                }
            } catch (error) {
                console.error("Error processing hypothetical assignment row:", error);
            }
        });
        
        // Apply modified scores with proper logic for each case
        const modifications = getModifiedScores();
        modifications.forEach((mod) => {
            try {
                const category = mod.category;
                if (!category) return;


                if (!categoryMap[category]) {
                    categoryMap[category] = {
                        weight: 0,
                        earned: 0,
                        total: 0,
                        hasHypotheticals: false
                    };
                }

                const categoryData = categoryMap[category];
                const modifiedEarned = Number.isFinite(mod.modifiedEarned) ? mod.modifiedEarned : 0;
                const modifiedTotal = Number.isFinite(mod.modifiedTotal) ? mod.modifiedTotal : 0;
                


                if (mod.wasExcluded) {
                    // Case: Excluded grade (x, ng, *, ✓) → Add BOTH numerator and denominator
                    categoryData.earned += modifiedEarned;
                    categoryData.total += modifiedTotal;
                } else {
                    // Case: Normal grade or zero grade → Subtract old, add new numerator
                    categoryData.earned -= mod.originalEarned;

                    categoryData.earned += modifiedEarned;
                }

                categoryData.hasHypotheticals = true;


            } catch (error) {
                console.error("Error processing score modification:", error);
            }
        });
        
        
        // Calculate final weighted grade
        let final = 0;
        let usedWeightSum = 0;
        for (const cat in categoryMap) {
            try {
                const { earned, total, weight } = categoryMap[cat];
                if (total > 0 || earned > 0) {
                    const avg = total > 0 ? earned / total : earned > 0 ? 1 : 0;
                    final += avg * (weight / 100);
                    usedWeightSum += weight;
                    
                }
            } catch (error) {
                console.error("Error calculating category:", cat, error);
            }
        }
        
        const finalPercent = usedWeightSum > 0 
            ? Math.round((final / (usedWeightSum / 100)) * 100) 
            : 100;
        
        updateCategoryCells(categoryMap);
        showWeightedGrade(finalPercent, getLetterGrade(finalPercent));
    } catch (error) {
        console.error("Error in calculateWeighted:", error);
    }
        }
    
    /**
    * Updates category cells in weighted gradebook with new calculated values
    * Preserves original formatting while displaying updated scores
    */
    function updateCategoryCells(categoryMap) {
        try {
                const table = document.querySelector(".student-gb-grades-weighted-grades");
                if (!table) return;
                const rows = table.querySelectorAll("tr");
                const labelRow = rows[0]?.querySelectorAll("td");
                const scoreRow = rows[2]?.querySelectorAll("td");
                if (!labelRow || !scoreRow) return;
                const classKey = getCurrentClassKey();
                const originalData = originalCategoryData[classKey];
                for (let i = 1; i < labelRow.length - 1; i++) {
                        try {
                                const label = labelRow[i]?.innerText?.trim();
                                const categoryData = categoryMap[label?.toLowerCase()];
                               if (label && categoryData && scoreRow[i]) {
    const { earned, total, hasHypotheticals } = categoryData;
    const cell = scoreRow[i];
    
    if (hasHypotheticals) {
        const percent = total > 0 ? Math.round((earned / total) * 100) : earned > 0 ? 100 : 0;
        const letter = getLetterGrade(percent);
        const originalCellData = originalData?.[label.toLowerCase()];
        if (originalCellData) {
            cell.style.height = originalCellData.originalHeight || "auto";
            cell.style.maxHeight = originalCellData.originalMaxHeight !== "none" ? originalCellData.originalMaxHeight : originalCellData.originalHeight;
            cell.style.lineHeight = originalCellData.originalLineHeight || "normal";
            cell.style.fontSize = originalCellData.originalFontSize || "inherit";
        }
        cell.style.padding = "0";
        cell.style.margin = "0";
        cell.style.whiteSpace = "nowrap";
        cell.style.overflow = "visible";
        cell.style.verticalAlign = "top";
        cell.style.boxSizing = "border-box";
        const earnedDisplay = formatNumber(earned);
        const totalDisplay = formatNumber(total);
        cell.innerHTML = `${earnedDisplay}/${totalDisplay} ${percent}% ${letter}`;
        cell.setAttribute('data-fgs-modified', 'true');
        
    } else {
        // No hypotheticals for this category, restore original if modified
        if (cell.getAttribute('data-fgs-modified') === 'true') {
            const cellData = originalData?.[label.toLowerCase()];
            if (cellData) {
                cell.innerHTML = cellData.originalHTML;
                ["height", "maxHeight", "minHeight", "padding", "margin", "whiteSpace", "overflow", "verticalAlign", "boxSizing", "lineHeight", "fontSize"].forEach((prop) => {
                    cell.style[prop] = "";
                });
                cell.removeAttribute('data-fgs-modified');
            }
        }
    }
}
                        } catch (error) {
                                console.error("Error updating cell at index", i, error);
                        }
                }
        } catch (error) {
                console.error("Error in updateCategoryCells:", error);
        }
    }
    
    /**
         * Unweighted calculation now properly adds denominator for excluded assignments
         * Find this function in content-calculations.js and replace it
         */
        function calculateUnweighted() {
    try {
        const classKey = getCurrentClassKey();
        const rows = [...document.querySelectorAll(".grades-grid.dataTable tbody tr")];
        let totalEarned = 0,
            totalPossible = 0;

        const modifications = getModifiedScores();
        const modificationMap = {};
        modifications.forEach((mod) => {
            modificationMap[mod.rowId] = mod;
        });
        
        // First pass: Add up all assignments exactly as they appear in the table
        rows.forEach((row, index) => {
            try {
                if (row.classList.contains("hypothetical") && row.getAttribute("data-class-id") !== currentClassId) return;
                
                const tds = row.querySelectorAll("td");
                if (tds.length < 11) return;
                const raw = (tds[2]?.innerText || "").split("/").map((s) => s.trim());
                
                const assumedRowId = row.getAttribute("data-original-row-id") ||
                    (row.classList.contains("hypothetical")
                        ? `hypothetical-row-${row.getAttribute("data-fgs-row-id") || index}`
                        : `original-row-${index}`);
                
                const modEntry = assumedRowId ? modificationMap[assumedRowId] : null;
                if (modEntry) {
                    // For modified rows: Add original denominator (if not excluded), skip numerator
                    if (!modEntry.wasExcluded) {
                        const originalTotal = Number.isFinite(modEntry.originalTotal) ? modEntry.originalTotal : 0;
                        totalPossible += originalTotal;
                    }
                    return;
                }
                
                if (!isValid(raw[0], raw[1])) return;
                const earned = raw[0].toUpperCase() === "Z" ? 0 : parseFloat(raw[0]);
                const total = parseFloat(raw[1]);
                
                if (!isNaN(earned)) {
                    if (!isNaN(total) && total > 0) {
                        totalEarned += earned;
                        totalPossible += total;
                    } else if (total === 0 && earned > 0) {
                        totalEarned += earned;
                    }
                }
            } catch (error) {
                console.error("Error processing unweighted row:", error);
            }
        });
        
        
        // Second pass: Apply modifications with proper logic for each case
        modifications.forEach((mod) => {
            try {

                const modifiedEarned = Number.isFinite(mod.modifiedEarned) ? mod.modifiedEarned : 0;
                const modifiedTotal = Number.isFinite(mod.modifiedTotal) ? mod.modifiedTotal : 0;

                if (mod.wasExcluded) {
                    // Case: Excluded grade (x, ng, *, ✓) → Add BOTH numerator and denominator
                    totalEarned += modifiedEarned;
                    totalPossible += modifiedTotal;
                } else {
                    // Case: Normal grade or zero grade → First pass already skipped this assignment, just add new value
                    totalEarned += modifiedEarned;
                }


            } catch (error) {
                console.error("Error applying edited row contribution:", error);
            }
        });
        
        // Prevent negative values
        if (totalEarned < 0) totalEarned = 0;
        if (totalPossible < 0) totalPossible = 0;
        
        
        const finalPercent = totalPossible > 0 
            ? Math.round((totalEarned / totalPossible) * 100) 
            : 0;
        
        showGrade(finalPercent, getLetterGrade(finalPercent));
    } catch (error) {
        console.error("Error in calculateUnweighted:", error);
    }
}
    
    /**
    * Displays weighted grade in the gradebook table
    * Creates new table cells to show hypothetical grade alongside original data
    */
    function showWeightedGrade(percent, letter) {
        try {
                const table = document.querySelector(".student-gb-grades-weighted-grades");
                if (!table) {
                        return;
                }
                document.querySelectorAll(".injected-hypo-weighted").forEach((e) => {
                        if (e.getAttribute("data-class-id") === currentClassId) e.remove();
                });
                const rows = table.querySelectorAll("tr");
                let headerRow, percentRow, scoreRow;
                for (const row of rows) {
                        try {
                                const text = row.innerText.trim().toLowerCase();
                                if (text.includes("percent of grade")) percentRow = row;
                                else if (text.includes("score")) scoreRow = row;
                                else if (!headerRow) headerRow = row;
                        } catch (error) {
                                console.error("Error processing table row:", error);
                        }
                }
                if (headerRow && percentRow && scoreRow) {
                        try {
                                const addCell = (row, content, isScore = false) => {
                                        const cell = document.createElement("td");
                                        cell.className = isScore ? "student-gb-grades-weighted-grades-score-cell injected-hypo-weighted" : "student-gb-grades-weighted-grades-cell injected-hypo-weighted";
                                        cell.innerText = content;
                                        cell.style.cssText = "background: #2f4f6f; color: white; font-weight: bold; text-align: left; font-size: " + (isScore ? "13px" : "12px") + "; width: auto; max-width: none;";
                                        cell.setAttribute("data-class-id", currentClassId);
                                        row.appendChild(cell);
                                };
                                addCell(headerRow, "Hypothetical Grade");
                                addCell(percentRow, "");
                                addCell(scoreRow, `${percent}% ${letter}`, true);
                        } catch (error) {
                                console.error("Error adding cells to table:", error);
                        }
                }
        } catch (error) {
                console.error("Error in showWeightedGrade:", error);
        }
    }
    
    /**
    * Displays unweighted grade next to the original grade display
    * Adds hypothetical grade indicator without modifying original gradebook
    */
    function showGrade(percent, letter) {
        try {
                document.getElementById("hypothetical-grade")?.remove();
                document.querySelectorAll(".injected-hypo-grade").forEach((e) => e.remove());
                const container = document.querySelector(".gradebook-grid-title") || document.querySelector(".student-gb-grade-summary") || document.querySelector(".gradebook-grid-title-container");
                if (container) {
                        const span = document.createElement("span");
                        span.id = "hypothetical-grade";
                        span.className = "injected-hypo-grade";
                        span.style.cssText = "color: red; font-weight: bold; margin-left: 10px;";
                        span.innerText = `(Hypothetical: ${percent}% ${letter})`;
                        span.setAttribute("data-class-id", currentClassId);
                        container.appendChild(span);
                }
        } catch (error) {
                console.error("Error in showGrade:", error);
        }
    }
    
/**
 * Adds a new hypothetical assignment row with permanent delete button
 * Creates visual representation with always-visible delete button
 */
function addRow(data) {
        try {
                
                // Use smart color detection right before adding
                nextRowColor = getNextColorFromTable();
                
                saveOriginalRows();
                const table = document.querySelector(".grades-grid.dataTable tbody");
                const baseRow = table?.querySelector("tr");
                if (!table || !baseRow) {
                        console.error("ADD ROW OPERATION - Table or base row not found");
                        return;
                }
                const clone = baseRow.cloneNode(true);
                clone.classList.add("hypothetical");
                clone.setAttribute("data-class-id", currentClassId);
                clone.removeAttribute("data-original-row-id");
                clone.removeAttribute("data-fgs-edit-bound");
                
                // Generate unique ID for this row
                const rowId = `fgs-hypo-row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                clone.setAttribute("data-fgs-row-id", rowId);
                
                const earned = data.earned;
                const total = data.total;
                const percent = total === 0 && earned > 0 ? 100 : Math.round((earned / total) * 100);
                const letter = getLetterGrade(percent);
                const tds = clone.querySelectorAll("td");
                if (tds.length >= 11) {
                        const scoreCellClone = tds[2];
                        if (scoreCellClone) {
                                scoreCellClone.removeAttribute("data-fgs-edit-bound");
                                scoreCellClone.removeAttribute("data-score-modified");
                        }
                        const assignmentName = data.name && data.name.trim() !== "" ? data.name : `Hypothetical ${hypotheticalCount++}`;
                        
                        // Create assignment name cell with proper structure
                        const nameCell = tds[1];
                        
                        // Create clickable blue link for assignment name
                        const assignmentLink = document.createElement('a');
                        assignmentLink.href = '#';
                        assignmentLink.className = 'fgs-assignment-link';
                        assignmentLink.style.cssText = 'color: #2c5aa0; text-decoration: none; cursor: pointer; margin-right: 25px; display: inline-block; vertical-align: middle;';
                        assignmentLink.textContent = assignmentName;
                        
                        // Store assignment data for popup
                        nameCell.setAttribute('data-assignment-info', JSON.stringify(data));
                        
                        // Add click event listener for assignment details
                        assignmentLink.addEventListener('click', (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                showAssignmentDetails(data);
                        });
                        
                        // Hover effect like real Focus links
                        assignmentLink.addEventListener('mouseenter', () => {
                                assignmentLink.style.textDecoration = 'underline';
                        });
                        assignmentLink.addEventListener('mouseleave', () => {
                                assignmentLink.style.textDecoration = 'none';
                        });
                        
                        // CREATE HOVER-ACTIVATED DELETE BUTTON
                        const deleteButton = document.createElement("button");
                        deleteButton.textContent = "X";
                        deleteButton.title = "Delete this assignment";
                        deleteButton.setAttribute("data-row-id", rowId);
                        deleteButton.className = "fgs-hover-delete-btn";
                        deleteButton.style.cssText = `
                                background: #dc3545;
                                color: white;
                                border: none;
                                width: 18px;
                                height: 18px;
                                border-radius: 2px;
                                cursor: pointer;
                                font-size: 10px;
                                font-weight: bold;
                                margin-left: 5px;
                                float: right;
                                opacity: 0;
                                visibility: hidden;
                                transition: all 0.2s ease;
                                transform: scale(0.8);
                        `;
                        
                        // Add delete functionality
                        deleteButton.addEventListener('click', (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteSpecificAssignment(rowId);
                        });
                        
                        // Enhanced hover effect for delete button
                        deleteButton.addEventListener('mouseenter', () => {
                                deleteButton.style.background = '#c82333';
                                deleteButton.style.transform = 'scale(1.1)';
                        });
                        
                        deleteButton.addEventListener('mouseleave', () => {
                                deleteButton.style.background = '#dc3545';
                                deleteButton.style.transform = 'scale(1)';
                        });
                        
                        // Clear the entire cell properly and rebuild structure
                        nameCell.innerHTML = '';
                        nameCell.style.verticalAlign = 'middle';
                        
                        // Create the proper wrapper div structure to match Focus
                        const wrapperDiv = document.createElement('div');
                        wrapperDiv.className = 'assignment-name-link g-flex-cell';
                        wrapperDiv.style.cssText = 'display: flex; align-items: center; justify-content: space-between;';
                        
                        // Add assignment link and delete button to wrapper
                        wrapperDiv.appendChild(assignmentLink);
                        wrapperDiv.appendChild(deleteButton);
                        
                        // Add wrapper to cell
                        nameCell.appendChild(wrapperDiv);
                        
                        // ADD ROW HOVER EFFECTS (delete button visibility)
                        clone.addEventListener('mouseenter', () => {
                                deleteButton.style.opacity = '1';
                                deleteButton.style.visibility = 'visible';
                                deleteButton.style.transform = 'scale(1)';
                        });
                        
                        clone.addEventListener('mouseleave', () => {
                                deleteButton.style.opacity = '0';
                                deleteButton.style.visibility = 'hidden';
                                deleteButton.style.transform = 'scale(0.8)';
                        });
                        
                        tds[9].textContent = data.category || "";
                        tds[2].textContent = `${earned} / ${total}`;
                        tds[3].textContent = `${percent}%`;
                        tds[4].textContent = letter;
                        tds[5].textContent = "";
                        tds[8].textContent = getDateTime();
                }
                
                clone.style.backgroundColor = nextRowColor;
                
                setTimeout(() => {
                const scoreCell = clone.querySelector("td:nth-child(3)");
                if (scoreCell && typeof makeScoresEditable === 'function') {
                        // The score cell will be automatically made editable when makeScoresEditable runs
                        // But we can ensure it has the right structure
                        scoreCell.style.cursor = "pointer";
                        scoreCell.title = "Click to edit score";
                }
                }, 100);

                table.insertBefore(clone, table.firstChild);
                
                // Update nextRowColor for the next addition
                nextRowColor = getNextColorFromTable();
        } catch (error) {
                console.error("ADD ROW OPERATION - Error:", error);
        }
}
/**
 * Deletes a specific assignment by row ID and flips colors of rows above
 * More robust score extraction that handles edited cells and edge cases
 */
function deleteSpecificAssignment(rowId) {
        try {
                
                // Find the row element
                const rowElement = document.querySelector(`[data-fgs-row-id="${rowId}"]`);
                if (!rowElement) {
                        console.error("DELETE SPECIFIC - Row element not found");
                        return;
                }
                
                // METHOD 1: Try to get assignment data from data attribute (most reliable)
                const nameCell = rowElement.querySelector("td:nth-child(2)");
                let earned = null;
                let total = null;
                
                if (nameCell && nameCell.hasAttribute('data-assignment-info')) {
                        try {
                                const assignmentData = JSON.parse(nameCell.getAttribute('data-assignment-info'));
                                earned = assignmentData.earned;
                                total = assignmentData.total;
                        } catch (e) {
                        }
                }
                
                // METHOD 2: Fallback to parsing the score cell
                if (earned === null || total === null) {
                        const scoreCell = rowElement.querySelector("td:nth-child(3)");
                        
                        if (!scoreCell) {
                                console.error("DELETE SPECIFIC - Could not find score cell");
                                return;
                        }
                        
                        // Get all text content from the score cell
                        const scoreText = scoreCell.textContent.trim();
                        
                        // Try to extract numbers from the text
                        const numbers = scoreText.match(/(\d+\.?\d*)/g);
                        
                        if (numbers && numbers.length >= 2) {
                                earned = parseFloat(numbers[0]);
                                total = parseFloat(numbers[1]);
                        } else if (numbers && numbers.length === 1) {
                                // Special case: only one number found (like "/23")
                                // Try to determine if it's earned or total
                                if (scoreText.startsWith('/')) {
                                        earned = 0;
                                        total = parseFloat(numbers[0]);
                                } else {
                                        earned = parseFloat(numbers[0]);
                                        total = parseFloat(numbers[0]); // Assume same
                                }
                        }
                }
                
                // METHOD 3: Last resort - search hypotheticals array by row ID pattern
                if ((earned === null || total === null) && rowId) {
                        const classKey = getCurrentClassKey();
                        
                        // Try to find by matching recent additions for this class
                        const recentAssignments = hypotheticals
                                .filter(h => h.classKey === classKey)
                                .slice(-10); // Last 10 additions
                        
                        if (recentAssignments.length > 0) {
                                // Use the first match as a fallback
                                const fallbackAssignment = recentAssignments[recentAssignments.length - 1];
                                earned = fallbackAssignment.earned;
                                total = fallbackAssignment.total;
                        }
                }
                
                // If we still don't have the data, we can't proceed
                if (earned === null || total === null) {
                        console.error("DELETE SPECIFIC - Could not extract score data");
                        
                        // BUT - we can still try to delete by just removing the most recent hypothetical
                        const classKey = getCurrentClassKey();
                        const classHypotheticals = hypotheticals.filter(h => h.classKey === classKey);
                        
                        if (classHypotheticals.length > 0) {
                                const lastAssignment = classHypotheticals[classHypotheticals.length - 1];
                                const globalIndex = hypotheticals.indexOf(lastAssignment);
                                
                                
                                if (globalIndex !== -1) {
                                        hypotheticals.splice(globalIndex, 1);
                                        redoHistory.push({
                                                assignment: { ...lastAssignment },
                                                classKey: classKey,
                                                nextRowColor: nextRowColor
                                        });

                                        // Add to unified action history
                                        actionHistory.push({
                                                type: 'deleteHypothetical',
                                                classKey: classKey,
                                                deletedAssignment: { ...lastAssignment },
                                                timestamp: Date.now()
                                        });
                                        actionRedoHistory = actionRedoHistory.filter(a => a.classKey !== classKey);

                                        // Remove the row
                                        rowElement.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                                        rowElement.style.transform = 'translateX(-100%)';
                                        rowElement.style.opacity = '0';
                                        
                                        setTimeout(() => {
                                                rowElement.remove();

                                                // Clean up score edit history for this row
                                                const deletedRowId = rowElement.getAttribute("data-original-row-id") || rowElement.getAttribute("data-fgs-row-id");
                                                if (deletedRowId) {
                                                        scoreEditHistory = scoreEditHistory.filter(e => e.rowId !== deletedRowId);
                                                        scoreRedoHistory = scoreRedoHistory.filter(r => r.rowId !== deletedRowId);
                                                        if (editedScores[deletedRowId]) {
                                                                delete editedScores[deletedRowId];
                                                        }
                                                }

                                                const remainingHypotheticals = hypotheticals.filter(h => h.classKey === classKey);
                                                if (remainingHypotheticals.length > 0) {
                                                        calculate();
                                                } else {
                                                        clearDisplays();
                                                        if (mode === "weighted") {
                                                                restoreOriginalCategoryData();
                                                        }
                                                }
                                                nextRowColor = getNextColorFromTable();
                                        }, 300);
                                        
                                        return;
                                }
                        }
                        
                        alert("Unable to delete this assignment. Please try using Reset All instead.");
                        return;
                }
                
                const classKey = getCurrentClassKey();

                const findAssignmentIndex = () => {
                        const exactIndex = hypotheticals.findIndex(h => h.classKey === classKey && h.earned === earned && h.total === total);
                        if (exactIndex !== -1) {
                                return exactIndex;
                        }

                        const fuzzyIndex = hypotheticals.findIndex(h => h.classKey === classKey && nearlyEqual(h.earned, earned) && nearlyEqual(h.total, total));
                        if (fuzzyIndex !== -1) {
                                return fuzzyIndex;
                        }

                        return -1;
                };

                const classHypotheticals = hypotheticals.filter(h => h.classKey === classKey);
                let assignmentIndex = findAssignmentIndex();

                if (assignmentIndex === -1 && classHypotheticals.length > 0) {
                        // As a final fallback, match by stored metadata (name/order) if available
                        const dataInfo = nameCell?.getAttribute?.('data-assignment-info');
                        if (dataInfo) {
                                try {
                                        const parsed = JSON.parse(dataInfo);
                                        const infoMatch = hypotheticals.findIndex(h => h.classKey === classKey && h.name === parsed.name && nearlyEqual(h.total, parsed.total));
                                        if (infoMatch !== -1) {
                                                assignmentIndex = infoMatch;
                                        }
                                } catch (_) { /* ignore */ }
                        }

                        if (assignmentIndex === -1) {
                                const fallbackAssignment = classHypotheticals[classHypotheticals.length - 1];
                                assignmentIndex = hypotheticals.indexOf(fallbackAssignment);
                        }
                }

                if (assignmentIndex === -1) {
                        console.error("DELETE SPECIFIC - Assignment not found in hypotheticals array after fallbacks");
                        return;
                }
                
                const deletedAssignment = hypotheticals[assignmentIndex];
                
                // Get all rows above the deleted row for color flipping
                const table = document.querySelector(".grades-grid.dataTable tbody");
                const allRows = Array.from(table.querySelectorAll("tr"));
                const deletedRowIndex = allRows.indexOf(rowElement);
                const rowsAbove = allRows.slice(0, deletedRowIndex);
                
                
                // Remove from hypotheticals array
                hypotheticals.splice(assignmentIndex, 1);

                // Add to redo history (legacy)
                redoHistory.push({
                        assignment: { ...deletedAssignment },
                        classKey: classKey,
                        nextRowColor: nextRowColor
                });

                // Add to unified action history so undo/redo tracks this deletion
                actionHistory.push({
                        type: 'deleteHypothetical',
                        classKey: classKey,
                        deletedAssignment: { ...deletedAssignment },
                        timestamp: Date.now()
                });

                // Clear redo history since a new action was taken
                actionRedoHistory = actionRedoHistory.filter(a => a.classKey !== classKey);
                
                // Remove the row element with smooth animation
                rowElement.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                rowElement.style.transform = 'translateX(-100%)';
                rowElement.style.opacity = '0';
                
                setTimeout(() => {
                        rowElement.remove();

                        // Clean up score edit history for this row
                        const deletedRowId = rowElement.getAttribute("data-original-row-id") || rowElement.getAttribute("data-fgs-row-id");
                        if (deletedRowId) {
                                // Remove from edit history
                                scoreEditHistory = scoreEditHistory.filter(e => e.rowId !== deletedRowId);
                                scoreRedoHistory = scoreRedoHistory.filter(r => r.rowId !== deletedRowId);
                                // Remove from edited scores
                                if (editedScores[deletedRowId]) {
                                        delete editedScores[deletedRowId];
                                }
                        }

                        // Flip colors of all rows above the deleted row
                        rowsAbove.forEach((row) => {
                                try {
                                        const currentColor = row.style.backgroundColor;
                                        let newColor;
                                        
                                        if (currentColor === "rgb(255, 255, 255)" || currentColor === "#FFFFFF" || currentColor === "#ffffff" || 
                                            currentColor === "rgb(245, 245, 245)" || currentColor === "#f5f5f5") {
                                                newColor = "#DDEEFF";
                                        } else if (currentColor === "rgb(221, 238, 255)" || currentColor === "#DDEEFF" || currentColor === "#ddeeff" ||
                                                 currentColor === "rgb(223, 239, 255)" || currentColor === "#dfefff") {
                                                newColor = "#FFFFFF";
                                        } else {
                                                newColor = "#FFFFFF";
                                        }
                                        
                                        row.style.backgroundColor = newColor;
                                        
                                } catch (error) {
                                        console.error("DELETE SPECIFIC - Error flipping color for row:", error);
                                }
                        });
                        
                        // Recalculate grades
                        const remainingHypotheticals = hypotheticals.filter(h => h.classKey === classKey);
                        const hasScoreEdits = hasActiveScoreEditsForClass(classKey);

                        if (remainingHypotheticals.length > 0 || hasScoreEdits) {
                                calculate();
                                if (remainingHypotheticals.length === 0 && hasScoreEdits) {
                                }
                        } else {
                                clearDisplays();
                                if (mode === "weighted") {
                                        restoreOriginalCategoryData();
                                }
                        }
                        
                        nextRowColor = getNextColorFromTable();
                        
                }, 300);
                
                
        } catch (error) {
                console.error("DELETE SPECIFIC - Error:", error);
        }
}

/**
 * Makes existing assignment scores editable on click
 * Now includes hypothetical assignments too
 */
function makeScoresEditable() {
    try {
        
        // Find ALL assignment rows (including hypotheticals now!)
        const rows = document.querySelectorAll(".grades-grid.dataTable tbody tr");
        
        if (rows.length === 0) {
            return;
        }
        
        rows.forEach((row, index) => {
            const scoreCell = row.querySelector("td:nth-child(3)"); // The score column (X/Y)
            const percentCell = row.querySelector("td:nth-child(4)"); // The percentage column
            if (!scoreCell) return;

            // Skip rows that already have edit listeners bound to prevent duplicates
            if (scoreCell.getAttribute("data-fgs-edit-bound") === "true") return;
            scoreCell.setAttribute("data-fgs-edit-bound", "true");

            // Check if this is a hypothetical or original row
            const isHypothetical = row.classList.contains("hypothetical");
            const existingRowId = row.getAttribute("data-original-row-id");
            const hypoIdentifier = row.getAttribute("data-fgs-row-id") || index;
            const rowId = existingRowId || (isHypothetical
                ? `hypothetical-row-${hypoIdentifier}`
                : `original-row-${index}`);

            if (!existingRowId) {
                row.setAttribute("data-original-row-id", rowId);
            }

            captureOriginalScoreSnapshot(row, scoreCell, rowId);

            // Make score cell clickable
            scoreCell.style.cursor = "pointer";
            scoreCell.style.transition = "background-color 0.2s ease";
            scoreCell.title = "Click to edit score";

            // Add hover effect
            scoreCell.addEventListener("mouseenter", () => {
                if (!scoreCell.getAttribute("data-score-modified")) {
                    scoreCell.style.backgroundColor = "rgba(42, 127, 220, 0.1)";
                }
            });

            scoreCell.addEventListener("mouseleave", () => {
                if (!scoreCell.getAttribute("data-score-modified")) {
                    scoreCell.style.backgroundColor = "";
                }
            });

            // Add click event listener
            scoreCell.addEventListener("click", (e) => {
                e.stopPropagation();
                openScoreEditor(scoreCell, rowId, row);
            });

            // Right-click to reset
            scoreCell.addEventListener("contextmenu", (e) => {
                if (scoreCell.getAttribute("data-score-modified") === "true") {
                    e.preventDefault();
                    e.stopPropagation();

                    const confirmReset = confirm("Reset this score back to original?");
                    if (confirmReset) {
                        resetSingleScore(rowId, scoreCell);
                    }
                }
            });

            // Make percentage cell clickable and editable (only if total points > 0)
            if (percentCell) {
                // Check if assignment has 0 total points
                const scoreText = scoreCell.textContent.trim();
                const totalMatch = scoreText.match(/\/\s*(\d+\.?\d*)/);
                const totalPoints = totalMatch ? parseFloat(totalMatch[1]) : null;

                // Only make percentage editable if total points > 0
                if (totalPoints !== null && totalPoints > 0) {
                    percentCell.style.cursor = "pointer";
                    percentCell.style.transition = "background-color 0.2s ease";
                    percentCell.title = "Click to edit percentage";

                    // Add hover effect for percentage cell
                    percentCell.addEventListener("mouseenter", () => {
                        if (!percentCell.getAttribute("data-percent-modified")) {
                            percentCell.style.backgroundColor = "rgba(42, 127, 220, 0.1)";
                        }
                    });

                    percentCell.addEventListener("mouseleave", () => {
                        if (!percentCell.getAttribute("data-percent-modified")) {
                            percentCell.style.backgroundColor = "";
                        }
                    });

                    // Add click event listener for percentage
                    percentCell.addEventListener("click", (e) => {
                        e.stopPropagation();
                        openPercentageEditor(percentCell, scoreCell, rowId, row);
                    });

                    // Right-click to reset percentage
                    percentCell.addEventListener("contextmenu", (e) => {
                        if (percentCell.getAttribute("data-percent-modified") === "true") {
                            e.preventDefault();
                            e.stopPropagation();

                            const confirmReset = confirm("Reset this percentage back to original?");
                            if (confirmReset) {
                                resetSingleScore(rowId, scoreCell);
                            }
                        }
                    });
                }
            }

            // Make letter grade cell clickable and editable (only if total points > 0)
            const letterCell = row.querySelector("td:nth-child(5)"); // The letter grade column
            if (letterCell) {
                // Check if assignment has 0 total points
                const scoreText = scoreCell.textContent.trim();
                const totalMatch = scoreText.match(/\/\s*(\d+\.?\d*)/);
                const totalPoints = totalMatch ? parseFloat(totalMatch[1]) : null;

                // Only make letter grade editable if total points > 0
                if (totalPoints !== null && totalPoints > 0) {
                    letterCell.style.cursor = "pointer";
                    letterCell.style.transition = "background-color 0.2s ease";
                    letterCell.title = "Click to edit letter grade";

                    // Add hover effect for letter grade cell
                    letterCell.addEventListener("mouseenter", () => {
                        if (!letterCell.getAttribute("data-letter-modified")) {
                            letterCell.style.backgroundColor = "rgba(42, 127, 220, 0.1)";
                        }
                    });

                    letterCell.addEventListener("mouseleave", () => {
                        if (!letterCell.getAttribute("data-letter-modified")) {
                            letterCell.style.backgroundColor = "";
                        }
                    });

                    // Add click event listener for letter grade
                    letterCell.addEventListener("click", (e) => {
                        e.stopPropagation();
                        openLetterGradeEditor(letterCell, scoreCell, percentCell, rowId, row);
                    });

                    // Right-click to reset letter grade
                    letterCell.addEventListener("contextmenu", (e) => {
                        if (letterCell.getAttribute("data-letter-modified") === "true") {
                            e.preventDefault();
                            e.stopPropagation();

                            const confirmReset = confirm("Reset this letter grade back to original?");
                            if (confirmReset) {
                                resetSingleScore(rowId, scoreCell);
                            }
                        }
                    });
                }
            }

        });

    } catch (error) {
        console.error("SCORE EDIT - Error:", error);
    }
}

/**
 * COMPLETE openScoreEditor FUNCTION - Ready to copy/paste
 * Opens inline editor with enhanced excluded assignment detection
 * Properly detects NG, Z, X, asterisk, EXC, and check marks
 */
function openScoreEditor(cell, rowId, row) {
    try {

        const classKey = getCurrentClassKey();

        // IMPORTANT: Store original letter grade HTML if not already stored
        const letterCell = row.querySelector("td:nth-child(5)");
        if (letterCell && !letterCell.getAttribute("data-original-letter-html")) {
            letterCell.setAttribute("data-original-letter-html", letterCell.innerHTML);
            letterCell.setAttribute("data-original-letter-text", letterCell.textContent.trim());
        }

        // FORCE CLEAR: Remove any existing inputs in this cell first
        // Set flag to prevent blur handler from firing saveScoreEdit during removal
        cell._fgsSkipBlurSave = true;
        const existingInputs = cell.querySelectorAll("input");
        if (existingInputs.length > 0) {
            existingInputs.forEach(input => input.remove());
        }
        // Clear flag after synchronous blur events have fired
        delete cell._fgsSkipBlurSave;

        let originalEarned = null;
        let totalPoints = null;
        let wasExcluded = false;  // Track if originally excluded
        let currentText = "";

        const baseSnapshot = captureOriginalScoreSnapshot(row, cell, rowId);

        // If already edited, use STORED original values (don't re-parse!)
        if (editedScores[rowId]) {
            originalEarned = editedScores[rowId].originalEarned;
            totalPoints = editedScores[rowId].total;
            wasExcluded = editedScores[rowId].wasExcluded;
        } else {
            if (baseSnapshot) {
                originalEarned = typeof baseSnapshot.earned === "number" ? baseSnapshot.earned : originalEarned;
                totalPoints = typeof baseSnapshot.total === "number" ? baseSnapshot.total : totalPoints;
                wasExcluded = baseSnapshot.wasExcluded;
                currentText = (baseSnapshot.text || "").toUpperCase();
            }
            
            if (originalEarned === null || totalPoints === null) {
                
                const clonedCell = cell.cloneNode(true);
                const buttons = clonedCell.querySelectorAll("button");
                buttons.forEach((btn) => btn.remove());
                
                currentText = clonedCell.textContent
                    .replace(/\s+/g, " ")
                    .trim()
                    .toUpperCase();
                
                
                // Only check if the SCORE CELL itself contains excluded patterns
                // Don't check other columns to avoid false positives from "Excused" status columns
                const scoreTextMatches = EXCLUDED_SCORE_PATTERNS.some((pattern) => pattern.test(currentText));

                // Additional check: Make sure it's not a valid numeric score like "40/50"
                const hasValidNumericScore = /\d+\s*\/\s*\d+/.test(currentText);

                if (scoreTextMatches && !hasValidNumericScore) {
                    wasExcluded = true;
                    originalEarned = 0;
                    const denominatorMatch = currentText.match(/\/\s*(\d+\.?\d*)/);
                    if (denominatorMatch) {
                        totalPoints = parseFloat(denominatorMatch[1]);
                    }
                }
                
                if (originalEarned === null || totalPoints === null) {
                    let scoreMatch = currentText.match(/(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)/);
                    
                    if (scoreMatch) {
                        originalEarned = parseFloat(scoreMatch[1]);
                        totalPoints = parseFloat(scoreMatch[2]);
                    } else {
                        const numbers = currentText.match(/(\d+\.?\d*)/g);
                        if (numbers && numbers.length >= 2) {
                            originalEarned = parseFloat(numbers[0]);
                            totalPoints = parseFloat(numbers[1]);
                        } else if (numbers && numbers.length === 1) {
                            if (currentText.includes("/")) {
                                originalEarned = 0;
                                totalPoints = parseFloat(numbers[0]);
                                wasExcluded = true;
                            } else {
                                originalEarned = parseFloat(numbers[0]);
                                totalPoints = parseFloat(numbers[0]);
                            }
                        }
                    }
                }
            }
            
            if (wasExcluded && (totalPoints === null || isNaN(totalPoints))) {
                const promptText = (baseSnapshot?.text || currentText || "").trim() || "this assignment";
                const userTotal = prompt(
                    `This assignment (${promptText}) doesn't have a point value.\n\n` +
                    `Enter the total points possible for this assignment:\n` +
                    `(This will be the denominator, like the "100" in "85/100")`
                );
                
                if (userTotal === null || userTotal.trim() === "") {
                    return;
                }
                
                const parsedTotal = parseFloat(userTotal);
                if (isNaN(parsedTotal) || parsedTotal <= 0) {
                    alert("Invalid point value. Please enter a number greater than 0.");
                    return;
                }
                
                totalPoints = parsedTotal;
            }
            
            if (originalEarned === null || totalPoints === null) {
                console.error("Could not parse score from snapshot/text");
                console.error("Cell HTML:", cell.innerHTML);
                console.error("Row HTML:", row.innerHTML);
                
                alert(
                    "Unable to parse score format.\n\n" +
                    "Found text: '" + (baseSnapshot?.text || currentText) + "'\n\n" +
                    "Please report this to the developer with:\n" +
                    "1. This screenshot\n" +
                    "2. The course name\n" +
                    "3. The assignment name you clicked on"
                );
                return;
            }
            
        } // End of else block (first time editing)
        
        // Store original if not already edited (only on first edit)
        const originalCellHTML = baseSnapshot?.html ?? cell.innerHTML;
        const originalCellText = baseSnapshot?.text ?? cell.textContent.trim();
        
        if (!editedScores[rowId]) {
            editedScores[rowId] = {
                originalHTML: originalCellHTML,
                original: originalCellText || `${originalEarned} / ${totalPoints}`,
                originalEarned: parseFloat(originalEarned),
                total: parseFloat(totalPoints),
                row: row,
                wasExcluded: wasExcluded,  // Store if originally excluded
                classKey: classKey
            };
        } else if (!editedScores[rowId].classKey) {
            editedScores[rowId].classKey = classKey;
        }

        // Store original cell height to prevent expansion
        const originalHeight = cell.offsetHeight;
        
        // COMPLETELY CLEAR the cell but maintain size - LEFT ALIGNED
        cell.innerHTML = "";
        cell.style.cssText = getEditorCellCSS(originalHeight);

        // Create LEFT-ALIGNED container
        const container = document.createElement("div");
        container.style.cssText = getFlexContainerCSS();
        
        // Create input field
        const input = document.createElement("input");
        input.type = "number";
        input.value = originalEarned;
        input.step = "1";
        input.min = "0";
        input.style.cssText = `
            width: 45px;
            padding: 3px 5px;
            font-size: 13px;
            font-weight: bold;
            border: 2px solid #2a7fdc;
            border-radius: 3px;
            background: #ffffff;
            color: #0a2540;
            text-align: center;
            box-shadow: 0 1px 4px rgba(42, 127, 220, 0.3);
            outline: none;
            height: 24px;
            line-height: 1;
            box-sizing: border-box;
        `;
        
        // Compact slash and total
        const slash = document.createElement("span");
        slash.textContent = "/";
        slash.style.cssText = "font-weight: bold; font-size: 13px; line-height: 1;";
        
        const totalSpan = document.createElement("span");
        totalSpan.textContent = totalPoints;
        totalSpan.style.cssText = "font-weight: bold; font-size: 13px; line-height: 1;";
        
        // Build the structure
        container.appendChild(input);
        container.appendChild(slash);
        container.appendChild(totalSpan);
        cell.appendChild(container);
        
        // Focus and select
        setTimeout(() => {
            input.focus();
            input.select();
        }, 10);
        
        // Save on blur (skip if cell is being re-opened to prevent glitch)
        input.addEventListener("blur", () => {
            if (cell._fgsSkipBlurSave) return;
            saveScoreEdit(cell, rowId, input.value, totalPoints);
        });
        
        // Handle Enter key
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                input.blur();
            } else if (e.key === "Escape") {
                e.preventDefault();
                restoreOriginalScore(cell, rowId);
            }
        });
        

    } catch (error) {
        console.error("SCORE EDIT - Error:", error);
        alert("Error opening editor: " + error.message);
    }
}

/**
 * Returns modified scores with proper total points for excluded assignments
 * Now correctly adds denominator when editing NG/Z/X/asterisk assignments
 */
function getModifiedScores() {
    try {
        const modifications = [];
        
        Object.keys(editedScores).forEach(rowId => {
            const editData = editedScores[rowId];
            if (!editData.modified) return;
            
            const row = editData.row;
            const categoryCell = row.querySelector("td:nth-child(10)");
            const category = categoryCell ? 
                categoryCell.textContent.trim() : "";
            
            // Parse original values
            const originalEarnedRaw = typeof editData.originalEarned === "number"
                ? editData.originalEarned
                : parseFloat(editData.originalEarned);
            const originalTotalRaw = typeof editData.total === "number"
                ? editData.total
                : parseFloat(editData.total);
            
            // Parse modified values
            const modifiedEarnedRaw = typeof editData.modifiedEarned === "number"
                ? editData.modifiedEarned
                : parseFloat(editData.modifiedEarned);
            const modifiedTotalRaw = typeof editData.modifiedTotal === "number"
                ? editData.modifiedTotal
                : parseFloat(editData.modifiedTotal ?? originalTotalRaw);
            
            // Determine edit type
            const wasExcluded = editData.wasExcluded === true;
            
            // Original contributions: excluded rows counted as 0/0
            const originalEarned = wasExcluded
                ? 0
                : (Number.isFinite(originalEarnedRaw) ? originalEarnedRaw : 0);
            const originalTotal = wasExcluded
                ? 0
                : (Number.isFinite(originalTotalRaw) ? originalTotalRaw : 0);
            
            // Modified contributions must always use entered values (fallback to original raw)
            const originalTextValue = typeof editData.original === 'string' ? editData.original : '';
            const modifiedEarned = Number.isFinite(modifiedEarnedRaw) ? modifiedEarnedRaw : originalEarned;
            let modifiedTotal = Number.isFinite(modifiedTotalRaw) ? modifiedTotalRaw : originalTotalRaw;
            if (!Number.isFinite(modifiedTotal)) {
                modifiedTotal = originalTotalRaw;
            }
            const forceKeepOriginalDenominator = originalTextValue.trim().toUpperCase().startsWith('Z');
            if (forceKeepOriginalDenominator) {
                modifiedTotal = 0;
            }
            
            
            modifications.push({
                originalEarned,
                originalTotal,
                modifiedEarned,
                modifiedTotal,
                category: category.toLowerCase(),
                rowId,
                wasExcluded
            });
        });
        
        return modifications;
    } catch (error) {
        console.error("SCORE EDIT - Error getting modifications:", error);
        return [];
    }
}

/**
 * Saves the edited score and recalculates grades
 * Now properly preserves wasExcluded flag for excluded assignments
 */
function saveScoreEdit(cell, rowId, newEarned, totalPoints) {
    try {

        // Handle empty string - treat as 0 for NG grades
        let earnedValue = newEarned;
        if (earnedValue === "" || earnedValue === null || earnedValue === undefined) {
            // Check if this was originally an excluded grade (NG, X, etc.)
            const editMeta = editedScores[rowId];
            if (editMeta && editMeta.wasExcluded) {
                // For excluded grades, empty string means user wants 0
                earnedValue = "0";
            } else {
                alert("Please enter a number for the earned points (or 0 for no points earned)");
                restoreOriginalScore(cell, rowId);
                return;
            }
        }

        const earnedNum = parseFloat(earnedValue);
        const totalNum = parseFloat(totalPoints);

        // Explicitly allow 0 as a valid value
        if (isNaN(earnedNum) || earnedNum < 0) {
            alert("Please enter a valid number (0 or greater)");
            restoreOriginalScore(cell, rowId);
            return;
        }

        const editMeta = editedScores[rowId];
        if (editMeta) {
            if (checkAndRestoreOriginal(editMeta, earnedNum, totalNum, cell, rowId)) return;
        }

        // Preserve wasExcluded flag when updating!
        if (editMeta) {
            editMeta.modified = `${earnedNum}/${totalNum}`;
            editMeta.modifiedEarned = earnedNum;
            editMeta.modifiedTotal = totalNum;
            if (!editMeta.classKey) {
                editMeta.classKey = getCurrentClassKey();
            }

            // DO NOT update data-assignment-info - it should always contain ORIGINAL values
            // The modified values are tracked in editedScores[rowId].modifiedEarned/modifiedTotal
            // Updating data-assignment-info corrupts the original data, causing denominator bugs
            // when snapshots are recaptured after clearing or class changes
        }

        buildModifiedScoreCellUI(cell, earnedNum, totalNum, rowId);

        // Update the percentage cell as well
        const row = editMeta.row;
        const percentCell = row.querySelector("td:nth-child(4)");
        if (percentCell && totalNum > 0) {
            const calculatedPercent = (earnedNum / totalNum) * 100;
            updatePercentageCell(percentCell, calculatedPercent, rowId);
        } else if (percentCell && totalNum === 0) {
            percentCell.innerHTML = "";
            percentCell.style.cssText = "";
        }

        // Update the letter grade cell as well
        const letterCell = row.querySelector("td:nth-child(5)");
        if (letterCell && totalNum > 0) {
            const calculatedPercent = (earnedNum / totalNum) * 100;
            const letterGrade = getLetterGrade(Math.round(calculatedPercent));
            updateLetterGradeCell(letterCell, letterGrade, rowId);
        } else if (letterCell && totalNum === 0) {
            letterCell.innerHTML = "";
            letterCell.style.cssText = "";
        }

        const classKey = getCurrentClassKey();
        recordEditAction(rowId, classKey);

        // Recalculate grades with debouncing
        debouncedCalculate();

    } catch (error) {
        console.error("SCORE EDIT - Error saving:", error);
        restoreOriginalScore(cell, rowId);
    }
}

/**
 * HELPER: Format number intelligently - show decimals only when needed
 */
function formatNumber(value, decimals = 2) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '0';
    if (Number.isInteger(value)) {
        return value.toString();
    } else {
        // Has decimals - show up to specified decimal places, but remove trailing zeros
        return parseFloat(value.toFixed(decimals)).toString();
    }
}

/**
 * Checks if new earned/total values match the original and restores cells if so.
 * Returns true if values matched original (restoration was performed), false otherwise.
 */
function checkAndRestoreOriginal(editMeta, earnedPoints, totalPoints, scoreCell, rowId) {
    const originalEarnedVal = Number(editMeta.originalEarned);
    const originalTotalVal = Number(editMeta.total);
    const sameEarned = nearlyEqual(originalEarnedVal, earnedPoints);
    const comparisonTotal = Number.isFinite(originalTotalVal) ? originalTotalVal : originalEarnedVal;
    const sameTotal = nearlyEqual(comparisonTotal, totalPoints);

    if (sameEarned && sameTotal && !editMeta.wasExcluded) {
        applySnapshotToCell(scoreCell, { html: editMeta.originalHTML, text: editMeta.original });

        const row = editMeta.row;
        if (row) {
            const percentCell = row.querySelector("td:nth-child(4)");
            if (percentCell) {
                restoreOriginalPercentage(percentCell, rowId);
                percentCell.removeAttribute("data-original-percent-html");
                percentCell.removeAttribute("data-original-percent-text");
            }

            const letterCell = row.querySelector("td:nth-child(5)");
            if (letterCell) {
                restoreOriginalLetterGrade(letterCell, rowId);
                letterCell.removeAttribute("data-original-letter-html");
                letterCell.removeAttribute("data-original-letter-text");
            }
        }

        delete editedScores[rowId];
        if (scoreEditHistory.length > 0) {
            scoreEditHistory = scoreEditHistory.filter((entry) => entry.rowId !== rowId);
        }
        debouncedCalculate();
        return true;
    }

    // Check if value matches current modified value (editor re-opened but nothing changed)
    if (editMeta.modifiedEarned !== undefined) {
        const sameAsModified = nearlyEqual(Number(editMeta.modifiedEarned), earnedPoints) &&
                               nearlyEqual(Number(editMeta.modifiedTotal || editMeta.total), totalPoints);
        if (sameAsModified) {
            rebuildModifiedScoreCell(scoreCell, rowId, earnedPoints, totalPoints);
            return true;
        }
    }

    return false;
}

/**
 * Builds the red-highlighted modified score cell display with pencil icon.
 * Sets up the cell with earned/total in red and a reset button.
 */
function buildModifiedScoreCellUI(scoreCell, earnedNum, totalNum, rowId) {
    const originalHeight = scoreCell.offsetHeight;
    scoreCell.innerHTML = "";
    scoreCell.style.cssText = getEditorCellCSS(originalHeight) + ' cursor: pointer;';
    scoreCell.title = "Click to edit | Right-click to reset (Modified)";
    scoreCell.setAttribute("data-score-modified", "true");

    const container = document.createElement("div");
    container.style.cssText = getFlexContainerCSS();

    const earnedSpan = document.createElement("span");
    earnedSpan.textContent = formatNumber(earnedNum);
    earnedSpan.style.cssText = "color: #dc3545; font-weight: bold; font-size: 13px;";

    const slash = document.createElement("span");
    slash.textContent = "/";
    slash.style.cssText = "font-size: 13px;";

    const totalSpan = document.createElement("span");
    totalSpan.textContent = formatNumber(totalNum);
    totalSpan.style.cssText = "font-size: 13px;";

    const resetBtn = document.createElement("button");
    resetBtn.textContent = "\u21ba";
    resetBtn.title = "Reset to original";
    resetBtn.style.cssText = `
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 3px;
        padding: 0 3px;
        margin-left: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: bold;
        height: 18px;
        line-height: 1;
    `;
    resetBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        resetSingleScore(rowId, scoreCell);
    });

    container.appendChild(earnedSpan);
    container.appendChild(slash);
    container.appendChild(totalSpan);
    container.appendChild(resetBtn);
    scoreCell.appendChild(container);
}

/**
 * Records a score edit action: clears redo history for the class and pushes to edit/action history.
 */
function recordEditAction(rowId, classKey) {
    scoreRedoHistory = scoreRedoHistory.filter(r => r.classKey !== classKey);
    actionRedoHistory = actionRedoHistory.filter(a => a.classKey !== classKey);

    const editTimestamp = Date.now();
    scoreEditHistory.push({
        rowId,
        classKey,
        action: 'edit',
        timestamp: editTimestamp
    });
    actionHistory.push({ type: 'scoreEdit', classKey, rowId, timestamp: editTimestamp });
}

/**
 * Updates the percentage cell display with red highlighting
 */
function updatePercentageCell(percentCell, percentValue, rowId) {
    try {
        // Store original HTML and text if not already stored
        if (!percentCell.getAttribute("data-original-percent-html")) {
            percentCell.setAttribute("data-original-percent-html", percentCell.innerHTML);
            percentCell.setAttribute("data-original-percent-text", percentCell.textContent.trim());
        }
        if (!percentCell.getAttribute("data-original-percent")) {
            const originalText = percentCell.textContent.trim();
            percentCell.setAttribute("data-original-percent", originalText);
        }

        // Clear and update the percentage cell
        const originalHeight = percentCell.offsetHeight;
        percentCell.innerHTML = "";
        percentCell.style.cssText = getEditorCellCSS(originalHeight) + ' cursor: pointer;';
        percentCell.title = "Click to edit | Right-click to reset (Modified)";
        percentCell.setAttribute("data-percent-modified", "true");

        // Create container for red percentage
        const container = document.createElement("div");
        container.style.cssText = getFlexContainerCSS();

        // Red percentage text - format intelligently (no .00 for integers)
        const percentSpan = document.createElement("span");
        percentSpan.textContent = `${formatNumber(percentValue)}%`;
        percentSpan.style.cssText = "color: #dc3545; font-weight: bold; font-size: 13px;";

        // Small reset button
        const resetBtn = document.createElement("button");
        resetBtn.textContent = "↺";
        resetBtn.title = "Reset to original";
        resetBtn.style.cssText = `
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 3px;
            padding: 0 3px;
            margin-left: 4px;
            cursor: pointer;
            font-size: 11px;
            font-weight: bold;
            height: 18px;
            line-height: 1;
        `;
        resetBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            resetSingleScore(rowId, null);
        });

        container.appendChild(percentSpan);
        container.appendChild(resetBtn);
        percentCell.appendChild(container);

    } catch (error) {
        console.error("Error updating percentage cell:", error);
    }
}

/**
 * Opens an editor for the percentage cell
 */
function openPercentageEditor(percentCell, scoreCell, rowId, row) {
    try {

        // IMPORTANT: Store the original HTML and text BEFORE any changes
        if (!percentCell.getAttribute("data-original-percent-html")) {
            percentCell.setAttribute("data-original-percent-html", percentCell.innerHTML);
            percentCell.setAttribute("data-original-percent-text", percentCell.textContent.trim());
        }

        // IMPORTANT: Store original letter grade HTML if not already stored
        const letterCell = row.querySelector("td:nth-child(5)");
        if (letterCell && !letterCell.getAttribute("data-original-letter-html")) {
            letterCell.setAttribute("data-original-letter-html", letterCell.innerHTML);
            letterCell.setAttribute("data-original-letter-text", letterCell.textContent.trim());
        }

        // Clear any existing editor to prevent glitch on re-click
        percentCell._fgsSkipBlurSave = true;
        const existingInputs = percentCell.querySelectorAll("input");
        if (existingInputs.length > 0) {
            existingInputs.forEach(input => input.remove());
        }
        delete percentCell._fgsSkipBlurSave;

        // Get current percentage value
        let currentPercent = 0;
        const percentText = percentCell.textContent.trim().replace('%', '');
        currentPercent = parseFloat(percentText);

        if (isNaN(currentPercent)) {
            currentPercent = 0;
        }

        // Store original height
        const originalHeight = percentCell.offsetHeight;

        // Clear cell
        percentCell.innerHTML = "";
        percentCell.style.cssText = getEditorCellCSS(originalHeight);

        // Create container
        const container = document.createElement("div");
        container.style.cssText = getFlexContainerCSS();

        // Create input field
        const input = document.createElement("input");
        input.type = "text";
        input.value = currentPercent;
        input.style.cssText = `
            width: 60px;
            padding: 3px 5px;
            font-size: 13px;
            font-weight: bold;
            border: 2px solid #2a7fdc;
            border-radius: 3px;
            background: #ffffff;
            color: #0a2540;
            text-align: center;
            box-shadow: 0 1px 4px rgba(42, 127, 220, 0.3);
            outline: none;
            height: 24px;
            line-height: 1;
            box-sizing: border-box;
        `;

        // Add % symbol
        const percentSymbol = document.createElement("span");
        percentSymbol.textContent = "%";
        percentSymbol.style.cssText = "font-weight: bold; font-size: 13px; line-height: 1;";

        container.appendChild(input);
        container.appendChild(percentSymbol);
        percentCell.appendChild(container);

        // Focus and select
        setTimeout(() => {
            input.focus();
            input.select();
        }, 10);

        // Save on blur (skip if cell is being re-opened)
        input.addEventListener("blur", () => {
            if (percentCell._fgsSkipBlurSave) return;
            savePercentageEdit(percentCell, scoreCell, rowId, input.value, row);
        });

        // Handle Enter key
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                input.blur();
            } else if (e.key === "Escape") {
                e.preventDefault();
                restoreOriginalPercentage(percentCell, rowId);
            }
        });


    } catch (error) {
        console.error("PERCENT EDIT - Error:", error);
        alert("Error opening percentage editor: " + error.message);
    }
}

/**
 * Saves the percentage edit and calculates corresponding points
 */
function savePercentageEdit(percentCell, scoreCell, rowId, percentInput, row) {
    try {

        // Parse percentage input (allow with or without % symbol)
        let percentValue = percentInput.toString().trim().replace('%', '');
        percentValue = parseFloat(percentValue);

        if (isNaN(percentValue) || percentValue < 0 || percentValue > 100) {
            alert("Please enter a valid percentage between 0 and 100");
            restoreOriginalPercentage(percentCell, rowId);
            return;
        }

        // Get total points from the score cell
        const editMeta = editedScores[rowId];
        let totalPoints = null;

        if (editMeta && editMeta.total) {
            totalPoints = parseFloat(editMeta.total);
        } else {
            // Parse from score cell
            const scoreText = scoreCell.textContent.trim();
            const scoreMatch = scoreText.match(/\/\s*(\d+\.?\d*)/);
            if (scoreMatch) {
                totalPoints = parseFloat(scoreMatch[1]);
            }
        }

        if (!totalPoints || isNaN(totalPoints)) {
            alert("Cannot determine total points for this assignment");
            restoreOriginalPercentage(percentCell, rowId);
            return;
        }

        if (totalPoints === 0) {
            alert("Cannot edit percentage for an assignment worth 0 points");
            restoreOriginalPercentage(percentCell, rowId);
            return;
        }

        // Calculate earned points from percentage (no rounding)
        const earnedPoints = (percentValue / 100) * totalPoints;

        // Update or create edit metadata
        if (!editMeta) {
            // First time editing - capture original
            const baseSnapshot = captureOriginalScoreSnapshot(row, scoreCell, rowId);
            const classKey = getCurrentClassKey();

            editedScores[rowId] = {
                originalHTML: baseSnapshot?.html ?? scoreCell.innerHTML,
                original: baseSnapshot?.text ?? scoreCell.textContent.trim(),
                originalEarned: baseSnapshot?.earned ?? 0,
                total: totalPoints,
                row: row,
                wasExcluded: baseSnapshot?.wasExcluded ?? false,
                classKey: classKey
            };
        }

        // Check if values match original - if so, restore to original state
        if (editMeta) {
            if (checkAndRestoreOriginal(editMeta, earnedPoints, totalPoints, scoreCell, rowId)) return;
        }

        // Update the modification
        editedScores[rowId].modified = `${earnedPoints}/${totalPoints}`;
        editedScores[rowId].modifiedEarned = earnedPoints;
        editedScores[rowId].modifiedTotal = totalPoints;

        buildModifiedScoreCellUI(scoreCell, earnedPoints, totalPoints, rowId);

        // Update percentage cell with red highlighting
        updatePercentageCell(percentCell, percentValue, rowId);

        // Update the letter grade cell as well
        const letterCell = row.querySelector("td:nth-child(5)");
        if (letterCell) {
            const letterGrade = getLetterGrade(Math.round(percentValue));
            updateLetterGradeCell(letterCell, letterGrade, rowId);
        }

        const classKey = getCurrentClassKey();
        recordEditAction(rowId, classKey);

        // Recalculate grades
        debouncedCalculate();

    } catch (error) {
        console.error("PERCENT EDIT - Error saving:", error);
        restoreOriginalPercentage(percentCell, rowId);
    }
}

/**
 * Restores the original percentage display
 */
function restoreOriginalPercentage(percentCell, rowId) {
    try {
        // Use stored original HTML if available
        const originalHTML = percentCell.getAttribute("data-original-percent-html");
        const originalText = percentCell.getAttribute("data-original-percent-text");

        if (originalHTML) {
            // Restore the complete original HTML structure
            percentCell.innerHTML = originalHTML;
            percentCell.removeAttribute("data-percent-modified");
            percentCell.removeAttribute("data-original-percent");
            percentCell.style.cssText = "";
        } else {
            // No stored HTML - cell was likely never modified or row was recreated
            // Just clean up any modification markers
            percentCell.removeAttribute("data-percent-modified");
            percentCell.removeAttribute("data-original-percent");
            percentCell.style.cssText = "";
        }
    } catch (error) {
        console.error("Error restoring percentage:", error);
    }
}

/**
 * Opens letter grade editor for user input
 */
function openLetterGradeEditor(letterCell, scoreCell, percentCell, rowId, row) {
    try {

        // IMPORTANT: Store the original HTML and text BEFORE any changes
        if (!letterCell.getAttribute("data-original-letter-html")) {
            letterCell.setAttribute("data-original-letter-html", letterCell.innerHTML);
            letterCell.setAttribute("data-original-letter-text", letterCell.textContent.trim());
        }

        // IMPORTANT: Store original percentage HTML if not already stored
        if (percentCell && !percentCell.getAttribute("data-original-percent-html")) {
            percentCell.setAttribute("data-original-percent-html", percentCell.innerHTML);
            percentCell.setAttribute("data-original-percent-text", percentCell.textContent.trim());
        }

        // Clear any existing editor to prevent glitch on re-click
        letterCell._fgsSkipBlurSave = true;
        const existingLetterInputs = letterCell.querySelectorAll("input");
        if (existingLetterInputs.length > 0) {
            existingLetterInputs.forEach(inp => inp.remove());
        }
        delete letterCell._fgsSkipBlurSave;

        // Get current letter grade value
        let currentLetter = letterCell.textContent.trim();

        // Store original height
        const originalHeight = letterCell.offsetHeight;

        // Clear cell
        letterCell.innerHTML = "";
        letterCell.style.cssText = getEditorCellCSS(originalHeight);

        // Create container
        const container = document.createElement("div");
        container.style.cssText = getFlexContainerCSS();

        // Create input field
        const input = document.createElement("input");
        input.type = "text";
        input.value = currentLetter;
        input.placeholder = "A, B+, C-, etc.";
        input.style.cssText = `
            width: 50px;
            padding: 3px 5px;
            font-size: 13px;
            font-weight: bold;
            border: 2px solid #2a7fdc;
            border-radius: 3px;
            background: #ffffff;
            color: #0a2540;
            text-align: center;
            box-shadow: 0 1px 4px rgba(42, 127, 220, 0.3);
            outline: none;
            height: 24px;
            line-height: 1;
            box-sizing: border-box;
            text-transform: uppercase;
        `;

        container.appendChild(input);
        letterCell.appendChild(container);

        // Focus and select
        setTimeout(() => {
            input.focus();
            input.select();
        }, 10);

        // Save on blur (skip if cell is being re-opened)
        input.addEventListener("blur", () => {
            if (letterCell._fgsSkipBlurSave) return;
            saveLetterGradeEdit(letterCell, scoreCell, percentCell, rowId, input.value, row);
        });

        // Handle Enter key
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                input.blur();
            } else if (e.key === "Escape") {
                e.preventDefault();
                restoreOriginalLetterGrade(letterCell, rowId);
            }
        });


    } catch (error) {
        console.error("LETTER EDIT - Error:", error);
        alert("Error opening letter grade editor: " + error.message);
    }
}

/**
 * Saves the letter grade edit and calculates corresponding points and percentage
 */
function saveLetterGradeEdit(letterCell, scoreCell, percentCell, rowId, letterInput, row) {
    try {

        // Parse and validate letter grade input
        let letterValue = letterInput.toString().trim().toUpperCase();

        // Remove any spaces or extra characters
        letterValue = letterValue.replace(/\s+/g, '');

        // Validate letter grade format (A, A+, A-, B, B+, B-, etc.)
        const validGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
        if (!validGrades.includes(letterValue)) {
            alert("Please enter a valid letter grade: A, A+, A-, B, B+, B-, C, C+, C-, D, D+, D-, or F");
            restoreOriginalLetterGrade(letterCell, rowId);
            return;
        }

        // Convert letter grade to percentage (using midpoint of range)
        let percentValue;
        switch(letterValue) {
            case 'A+': percentValue = 97; break;  // 95-100
            case 'A':  percentValue = 93; break;  // 90-94
            case 'A-': percentValue = 90; break;  // 90 (lower end)
            case 'B+': percentValue = 87; break;  // 85-89
            case 'B':  percentValue = 83; break;  // 80-84
            case 'B-': percentValue = 80; break;  // 80 (lower end)
            case 'C+': percentValue = 77; break;  // 75-79
            case 'C':  percentValue = 73; break;  // 70-74
            case 'C-': percentValue = 70; break;  // 70 (lower end)
            case 'D+': percentValue = 67; break;  // 65-69
            case 'D':  percentValue = 63; break;  // 60-64
            case 'D-': percentValue = 60; break;  // 60 (lower end)
            case 'F':  percentValue = 50; break;  // 0-59 (using 50 as midpoint)
            default:   percentValue = 93; break;  // Default to A
        }

        // Get total points from the score cell
        const editMeta = editedScores[rowId];
        let totalPoints = null;

        if (editMeta && editMeta.total) {
            totalPoints = parseFloat(editMeta.total);
        } else {
            // Parse from score cell
            const scoreText = scoreCell.textContent.trim();
            const scoreMatch = scoreText.match(/\/\s*(\d+\.?\d*)/);
            if (scoreMatch) {
                totalPoints = parseFloat(scoreMatch[1]);
            }
        }

        if (!totalPoints || isNaN(totalPoints)) {
            alert("Cannot determine total points for this assignment");
            restoreOriginalLetterGrade(letterCell, rowId);
            return;
        }

        if (totalPoints === 0) {
            alert("Cannot edit letter grade for an assignment worth 0 points");
            restoreOriginalLetterGrade(letterCell, rowId);
            return;
        }

        // Calculate earned points from percentage (no rounding)
        const earnedPoints = (percentValue / 100) * totalPoints;

        // Update or create edit metadata
        if (!editMeta) {
            // First time editing - capture original
            const baseSnapshot = captureOriginalScoreSnapshot(row, scoreCell, rowId);
            const classKey = getCurrentClassKey();

            editedScores[rowId] = {
                originalHTML: baseSnapshot?.html ?? scoreCell.innerHTML,
                original: baseSnapshot?.text ?? scoreCell.textContent.trim(),
                originalEarned: baseSnapshot?.earned ?? 0,
                total: totalPoints,
                row: row,
                wasExcluded: baseSnapshot?.wasExcluded ?? false,
                classKey: classKey
            };
        }

        // Check if values match original - if so, restore to original state
        if (editMeta) {
            if (checkAndRestoreOriginal(editMeta, earnedPoints, totalPoints, scoreCell, rowId)) return;
        }

        // Update the modification
        editedScores[rowId].modified = `${earnedPoints}/${totalPoints}`;
        editedScores[rowId].modifiedEarned = earnedPoints;
        editedScores[rowId].modifiedTotal = totalPoints;

        buildModifiedScoreCellUI(scoreCell, earnedPoints, totalPoints, rowId);

        // Update percentage cell with red highlighting
        updatePercentageCell(percentCell, percentValue, rowId);

        // Update letter grade cell with the new letter
        updateLetterGradeCell(letterCell, letterValue, rowId);

        const classKey = getCurrentClassKey();
        recordEditAction(rowId, classKey);

        // Recalculate grades
        debouncedCalculate();

    } catch (error) {
        console.error("LETTER EDIT - Error saving:", error);
        restoreOriginalLetterGrade(letterCell, rowId);
    }
}

/**
 * Updates letter grade cell display with highlighting
 */
function updateLetterGradeCell(letterCell, letterValue, rowId) {
    try {
        const originalHeight = letterCell.offsetHeight;
        letterCell.innerHTML = "";
        letterCell.style.cssText = getEditorCellCSS(originalHeight) + ' cursor: pointer;';
        letterCell.title = "Click to edit | Right-click to reset (Modified)";
        letterCell.setAttribute("data-letter-modified", "true");

        const container = document.createElement("div");
        container.style.cssText = getFlexContainerCSS();

        const letterSpan = document.createElement("span");
        letterSpan.textContent = letterValue;
        letterSpan.style.cssText = "color: #dc3545; font-weight: bold; font-size: 13px;";

        container.appendChild(letterSpan);
        letterCell.appendChild(container);

    } catch (error) {
        console.error("Error updating letter grade cell:", error);
    }
}

/**
 * Restores the original letter grade display
 */
function restoreOriginalLetterGrade(letterCell, rowId) {
    try {
        // Use stored original HTML if available
        const originalHTML = letterCell.getAttribute("data-original-letter-html");
        const originalText = letterCell.getAttribute("data-original-letter-text");

        if (originalHTML) {
            // Restore the complete original HTML structure
            letterCell.innerHTML = originalHTML;
            letterCell.removeAttribute("data-letter-modified");
            letterCell.removeAttribute("data-original-letter");
            letterCell.style.cssText = "";
        } else {
            // No stored HTML - cell was likely never modified or row was recreated
            // Just clean up any modification markers
            letterCell.removeAttribute("data-letter-modified");
            letterCell.removeAttribute("data-original-letter");
            letterCell.style.cssText = "";
        }
    } catch (error) {
        console.error("Error restoring letter grade:", error);
    }
}

function restoreOriginalScore(cell, rowId) {
    try {
        
        let editData = editedScores[rowId];
        let snapshot = originalScoreSnapshots[rowId];
        
        if (!editData && !snapshot) {
            const rowElement = cell?.closest("tr") || document.querySelector(`[data-original-row-id="${rowId}"]`);
            const scoreCell = rowElement?.querySelector("td:nth-child(3)");
            if (rowElement && scoreCell) {
                snapshot = captureOriginalScoreSnapshot(rowElement, scoreCell, rowId);
            }
        }
        
        if (!editData && !snapshot) {
            return;
        }
        
        const sourceData = editData
            ? { html: editData.originalHTML, text: editData.original }
            : snapshot;
        
        const rowElement = cell?.closest("tr") || editData?.row || document.querySelector(`[data-original-row-id="${rowId}"]`);
        const appliedSnapshot = sourceData || (rowElement ? captureOriginalScoreSnapshot(rowElement, rowElement.querySelector("td:nth-child(3)") || cell, rowId) : null);
        
        applySnapshotToCell(cell, appliedSnapshot);

    } catch (error) {
        console.error("SCORE EDIT - Error restoring:", error);
    }
}

/**
 * Rebuilds the modified score cell display without pushing to history.
 * Used when an editor is dismissed without changing the value.
 */
function rebuildModifiedScoreCell(cell, rowId, earnedNum, totalNum) {
    try {
        const originalHeight = cell.offsetHeight;
        while (cell.firstChild) cell.removeChild(cell.firstChild);
        cell.style.cssText = getEditorCellCSS(originalHeight) + ' cursor: pointer;';
        cell.title = "Click to edit | Right-click to reset (Modified)";
        cell.setAttribute("data-score-modified", "true");

        const container = document.createElement("div");
        container.style.cssText = getFlexContainerCSS();

        const earnedSpan = document.createElement("span");
        earnedSpan.textContent = formatNumber(earnedNum);
        earnedSpan.style.cssText = "color: #dc3545; font-weight: bold; font-size: 13px;";

        const slash = document.createElement("span");
        slash.textContent = "/";
        slash.style.cssText = "font-size: 13px;";

        const totalSpan = document.createElement("span");
        totalSpan.textContent = formatNumber(totalNum);
        totalSpan.style.cssText = "font-size: 13px;";

        const resetBtn = document.createElement("button");
        resetBtn.textContent = "\u21ba";
        resetBtn.title = "Reset to original";
        resetBtn.style.cssText = 'background: #dc3545; color: white; border: none; border-radius: 3px; padding: 0 3px; margin-left: 4px; cursor: pointer; font-size: 11px; font-weight: bold; height: 18px; line-height: 1;';
        resetBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            resetSingleScore(rowId, cell);
        });

        container.appendChild(earnedSpan);
        container.appendChild(slash);
        container.appendChild(totalSpan);
        container.appendChild(resetBtn);
        cell.appendChild(container);
    } catch (error) {
        // Silent error handling
    }
}


function resetSingleScore(rowId, cellOverride = null, fromUndo = false) {
    try {
        
        let editData = editedScores[rowId];
        let snapshot = originalScoreSnapshots[rowId];
        
        let row = editData?.row || cellOverride?.closest?.("tr");
        if (!row && rowId) {
            row = document.querySelector(`[data-original-row-id="${rowId}"]`);
        }

        let scoreCell = cellOverride || null;
        if (!scoreCell && row) {
            scoreCell = row.querySelector("td:nth-child(3)");
        }

        if (!editData && !snapshot) {
            const probeRow = row || scoreCell?.closest?.("tr") || null;
            const probeCell = scoreCell || probeRow?.querySelector?.("td:nth-child(3)");
            if (probeRow && probeCell) {
                snapshot = captureOriginalScoreSnapshot(probeRow, probeCell, rowId);
            }
        }

        if (!editData && !snapshot) {
            return;
        }

        if (!scoreCell) {
            return;
        }

        const sourceData = editData
            ? { html: editData.originalHTML, text: editData.original }
            : snapshot;

        const appliedSnapshot = sourceData || (row ? captureOriginalScoreSnapshot(row, scoreCell, rowId) : null);
        if (!appliedSnapshot) {
            return;
        }

        applySnapshotToCell(scoreCell, appliedSnapshot);

        // Also restore the percentage cell and letter grade cell
        if (row) {
            const percentCell = row.querySelector("td:nth-child(4)");
            if (percentCell) {
                restoreOriginalPercentage(percentCell, rowId);
                // Clean up stored attributes after restoration
                percentCell.removeAttribute("data-original-percent-html");
                percentCell.removeAttribute("data-original-percent-text");
            }

            // Restore the letter grade cell
            const letterCell = row.querySelector("td:nth-child(5)");
            if (letterCell) {
                restoreOriginalLetterGrade(letterCell, rowId);
                // Clean up stored attributes after restoration
                letterCell.removeAttribute("data-original-letter-html");
                letterCell.removeAttribute("data-original-letter-text");
            }
        }

        if (editData) {
            delete editedScores[rowId];
        }

        if (!fromUndo && scoreEditHistory.length > 0) {
            scoreEditHistory = scoreEditHistory.filter((entry) => entry.rowId !== rowId);
        }

        calculate();

    } catch (error) {
        console.error("SCORE RESET - Error:", error);
    }
}

/**
 * Clears all score edits
 */
function clearAllScoreEdits() {
    try {
            
            Object.keys(editedScores).forEach(rowId => {
                    const editData = editedScores[rowId];
                    const row = editData.row;
                    const scoreCell = row.querySelector("td:nth-child(3)");
                    const percentCell = row.querySelector("td:nth-child(4)");
                    const letterCell = row.querySelector("td:nth-child(5)");

                    if (scoreCell) {
                        const sourceData = editData.originalHTML
                            ? { html: editData.originalHTML, text: editData.original }
                            : originalScoreSnapshots[rowId];
                        const appliedSnapshot = sourceData || captureOriginalScoreSnapshot(row, scoreCell, rowId);
                        applySnapshotToCell(scoreCell, appliedSnapshot);
                    }

                    // Also restore percentage cell
                    if (percentCell) {
                        restoreOriginalPercentage(percentCell, rowId);
                        // Clean up stored attributes
                        percentCell.removeAttribute("data-original-percent-html");
                        percentCell.removeAttribute("data-original-percent-text");
                    }

                    // Also restore letter grade cell
                    if (letterCell) {
                        restoreOriginalLetterGrade(letterCell, rowId);
                        // Clean up stored attributes
                        letterCell.removeAttribute("data-original-letter-html");
                        letterCell.removeAttribute("data-original-letter-text");
                    }
            });

            editedScores = {};
            originalScoreSnapshots = {};
            scoreEditHistory = [];
            scoreRedoHistory = [];
            calculate();

    } catch (error) {
            console.error("SCORE EDIT - Error clearing:", error);
    }
}

    
    /**
    * Undoes the last action (hypothetical or score edit) in chronological order
    * Uses unified actionHistory to determine what to undo next
    */
    function undo() {
        try {
                const classKey = getCurrentClassKey();

                // Find the last action for this class from the unified history
                const classActions = actionHistory.filter(a => a.classKey === classKey);
                if (classActions.length === 0) return;

                const lastAction = classActions[classActions.length - 1];

                // Remove from unified history
                const actionIdx = actionHistory.lastIndexOf(lastAction);
                if (actionIdx !== -1) actionHistory.splice(actionIdx, 1);

                // Push to unified redo history
                actionRedoHistory.push({ ...lastAction });

                if (lastAction.type === 'scoreEdit') {
                        // Undo the last score edit - use rowId from actionHistory for reliable matching
                        const targetRowId = lastAction.rowId;
                        const classScoreEdits = scoreEditHistory.filter(e => e.classKey === classKey);
                        let lastEdit = null;

                        // Match by rowId from the action entry if available
                        if (targetRowId) {
                                const rowEdits = classScoreEdits.filter(e => e.rowId === targetRowId);
                                lastEdit = rowEdits[rowEdits.length - 1];
                        }
                        // Fallback to last entry for this class
                        if (!lastEdit) {
                                lastEdit = classScoreEdits[classScoreEdits.length - 1];
                        }

                        if (lastEdit) {
                                const editData = editedScores[lastEdit.rowId];
                                if (editData) {
                                        scoreRedoHistory.push({
                                                rowId: lastEdit.rowId,
                                                classKey: lastEdit.classKey,
                                                editData: {
                                                        modifiedEarned: editData.modifiedEarned,
                                                        modifiedTotal: editData.modifiedTotal,
                                                        originalEarned: editData.originalEarned,
                                                        total: editData.total,
                                                        wasExcluded: editData.wasExcluded,
                                                        originalHTML: editData.originalHTML,
                                                        original: editData.original
                                                },
                                                timestamp: Date.now()
                                        });
                                }

                                resetSingleScore(lastEdit.rowId, null, true);
                                const editIndex = scoreEditHistory.indexOf(lastEdit);
                                if (editIndex !== -1) scoreEditHistory.splice(editIndex, 1);
                        }
                } else if (lastAction.type === 'deleteHypothetical') {
                        // Undo a deletion: re-add the deleted assignment
                        const deletedAssignment = lastAction.deletedAssignment;
                        if (deletedAssignment) {
                                hypotheticals.push(deletedAssignment);
                                addRow(deletedAssignment);

                                // Also remove the corresponding entry from legacy redoHistory
                                // (it was pushed there during deleteSpecificAssignment)
                                const legacyIdx = redoHistory.findIndex(r => r.classKey === classKey &&
                                        r.assignment && nearlyEqual(r.assignment.earned, deletedAssignment.earned) &&
                                        nearlyEqual(r.assignment.total, deletedAssignment.total));
                                if (legacyIdx !== -1) redoHistory.splice(legacyIdx, 1);

                                // Make the restored row editable
                                setTimeout(() => {
                                        if (typeof makeScoresEditable === 'function') makeScoresEditable();
                                }, 200);
                        }
                } else {
                        // Undo the last hypothetical assignment
                        const classHypotheticals = hypotheticals.filter((h) => h.classKey === classKey);
                        if (classHypotheticals.length === 0) return;

                        const lastAssignment = classHypotheticals[classHypotheticals.length - 1];

                        redoHistory.push({ assignment: { ...lastAssignment }, classKey: classKey, nextRowColor: nextRowColor });

                        const globalIndex = hypotheticals.findIndex((h) => h === lastAssignment);
                        if (globalIndex !== -1) hypotheticals.splice(globalIndex, 1);

                        const hypotheticalRows = document.querySelectorAll('.hypothetical[data-class-id="' + currentClassId + '"]');
                        if (hypotheticalRows.length > 0) {
                                // Rows are prepended (insertBefore firstChild), so [0] is the most recently added
                                const removedRow = hypotheticalRows[0];

                                const removedRowId = removedRow.getAttribute("data-original-row-id") || removedRow.getAttribute("data-fgs-row-id");
                                if (removedRowId) {
                                        scoreEditHistory = scoreEditHistory.filter(e => e.rowId !== removedRowId);
                                        scoreRedoHistory = scoreRedoHistory.filter(r => r.rowId !== removedRowId);
                                        if (editedScores[removedRowId]) {
                                                delete editedScores[removedRowId];
                                        }
                                }

                                removedRow.remove();
                                nextRowColor = getNextColorFromTable();
                        }

                        if (hypotheticalCount > 1) hypotheticalCount--;
                }

                // Recalculate or clear
                const remaining = hypotheticals.filter((h) => h.classKey === classKey);
                const hasScoreEdits = hasActiveScoreEditsForClass(classKey);

                if (remaining.length > 0 || hasScoreEdits) {
                        calculate();
                        nextRowColor = getNextColorFromTable();
                } else {
                        clearDisplays();
                        if (mode === "weighted") {
                                restoreOriginalCategoryData();
                        }
                        nextRowColor = getNextColorFromTable();
                }
        } catch (error) {
                console.error("UNDO OPERATION - Error:", error);
        }
    }
    
    /**
    * Redoes the last undone action in chronological order
    * Uses unified actionRedoHistory to determine what to redo next
    */
    function redo() {
        try {
                const classKey = getCurrentClassKey();

                // Find the last undone action for this class
                const classRedoActions = actionRedoHistory.filter(a => a.classKey === classKey);
                if (classRedoActions.length === 0) return;

                const lastAction = classRedoActions[classRedoActions.length - 1];

                // Remove from unified redo history
                const actionIdx = actionRedoHistory.lastIndexOf(lastAction);
                if (actionIdx !== -1) actionRedoHistory.splice(actionIdx, 1);

                // Push back to unified action history
                actionHistory.push({ ...lastAction, timestamp: Date.now() });

                if (lastAction.type === 'scoreEdit') {
                        redoScoreEdit(classKey);
                } else if (lastAction.type === 'deleteHypothetical') {
                        redoDeleteHypothetical(classKey, lastAction);
                } else {
                        redoHypothetical(classKey);
                }

        } catch (error) {
                console.error("REDO OPERATION - Error:", error);
        }
    }

    /** Redo a score edit (extracted for clarity) */
    function redoScoreEdit(classKey) {
                const classScoreRedos = scoreRedoHistory.filter(r => r.classKey === classKey);
                if (classScoreRedos.length === 0) return;

                const lastRedo = classScoreRedos[classScoreRedos.length - 1];

                const row = document.querySelector('[data-original-row-id="' + lastRedo.rowId + '"]');
                if (!row) {
                        const redoIndex = scoreRedoHistory.indexOf(lastRedo);
                        if (redoIndex !== -1) scoreRedoHistory.splice(redoIndex, 1);
                        return;
                }

                const scoreCell = row.querySelector("td:nth-child(3)");
                const percentCell = row.querySelector("td:nth-child(4)");
                if (!scoreCell) return;

                editedScores[lastRedo.rowId] = {
                        originalHTML: lastRedo.editData.originalHTML,
                        original: lastRedo.editData.original,
                        originalEarned: lastRedo.editData.originalEarned,
                        total: lastRedo.editData.total,
                        modifiedEarned: lastRedo.editData.modifiedEarned,
                        modifiedTotal: lastRedo.editData.modifiedTotal,
                        wasExcluded: lastRedo.editData.wasExcluded,
                        modified: lastRedo.editData.modifiedEarned + '/' + lastRedo.editData.modifiedTotal,
                        row: row,
                        classKey: lastRedo.classKey
                };

                const earnedNum = lastRedo.editData.modifiedEarned;
                const totalNum = lastRedo.editData.modifiedTotal;
                const originalHeight = scoreCell.offsetHeight;

                // Clear cell safely
                while (scoreCell.firstChild) scoreCell.removeChild(scoreCell.firstChild);
                scoreCell.style.cssText = getEditorCellCSS(originalHeight) + ' cursor: pointer;';
                scoreCell.title = "Click to edit | Right-click to reset (Modified)";
                scoreCell.setAttribute("data-score-modified", "true");

                const container = document.createElement("div");
                container.style.cssText = getFlexContainerCSS();

                const earnedSpan = document.createElement("span");
                earnedSpan.textContent = formatNumber(earnedNum);
                earnedSpan.style.cssText = "color: #dc3545; font-weight: bold; font-size: 13px;";

                const slash = document.createElement("span");
                slash.textContent = "/";
                slash.style.cssText = "font-size: 13px;";

                const totalSpan = document.createElement("span");
                totalSpan.textContent = formatNumber(totalNum);
                totalSpan.style.cssText = "font-size: 13px;";

                const resetBtn = document.createElement("button");
                resetBtn.textContent = "\u21ba";
                resetBtn.title = "Reset to original";
                resetBtn.style.cssText = 'background: #dc3545; color: white; border: none; border-radius: 3px; padding: 0 3px; margin-left: 4px; cursor: pointer; font-size: 11px; font-weight: bold; height: 18px; line-height: 1;';
                resetBtn.addEventListener("click", function(e) {
                        e.stopPropagation();
                        resetSingleScore(lastRedo.rowId, scoreCell);
                });

                container.appendChild(earnedSpan);
                container.appendChild(slash);
                container.appendChild(totalSpan);
                container.appendChild(resetBtn);
                scoreCell.appendChild(container);

                if (percentCell && totalNum > 0) {
                        const calculatedPercent = (earnedNum / totalNum) * 100;
                        updatePercentageCell(percentCell, calculatedPercent, lastRedo.rowId);
                } else if (percentCell && totalNum === 0) {
                        while (percentCell.firstChild) percentCell.removeChild(percentCell.firstChild);
                        percentCell.style.cssText = "";
                }

                scoreEditHistory.push({
                        rowId: lastRedo.rowId,
                        classKey: lastRedo.classKey,
                        action: 'edit',
                        timestamp: Date.now()
                });

                const redoIndex = scoreRedoHistory.indexOf(lastRedo);
                if (redoIndex !== -1) scoreRedoHistory.splice(redoIndex, 1);

                calculate();
    }

    /** Redo a hypothetical addition (extracted for clarity) */
    function redoHypothetical(classKey) {
                const classRedos = redoHistory.filter(function(r) { return r.classKey === classKey; });
                if (classRedos.length === 0) return;

                const lastRedo = classRedos[classRedos.length - 1];
                redoHistory.splice(redoHistory.lastIndexOf(lastRedo), 1);

                hypotheticals.push(lastRedo.assignment);
                addRow(lastRedo.assignment);
                calculate();

                // Re-bind score editing listeners on the new row
                setTimeout(() => {
                        if (typeof makeScoresEditable === 'function') makeScoresEditable();
                }, 200);
    }

    /** Redo a delete-by-X (re-delete the assignment that was restored by undo) */
    function redoDeleteHypothetical(classKey, lastAction) {
                const deletedAssignment = lastAction.deletedAssignment;
                if (!deletedAssignment) return;

                // Find and remove from hypotheticals array
                const assignmentIndex = hypotheticals.findIndex(h =>
                        h.classKey === classKey &&
                        nearlyEqual(h.earned, deletedAssignment.earned) &&
                        nearlyEqual(h.total, deletedAssignment.total));

                if (assignmentIndex !== -1) {
                        hypotheticals.splice(assignmentIndex, 1);
                }

                // Find and remove the DOM row
                const hypotheticalRows = document.querySelectorAll('.hypothetical[data-class-id="' + currentClassId + '"]');
                let removedRow = null;

                // Try to find the exact row by matching score data
                for (const row of hypotheticalRows) {
                        const nameCell = row.querySelector("td:nth-child(2)");
                        if (nameCell && nameCell.hasAttribute('data-assignment-info')) {
                                try {
                                        const info = JSON.parse(nameCell.getAttribute('data-assignment-info'));
                                        if (nearlyEqual(info.earned, deletedAssignment.earned) &&
                                            nearlyEqual(info.total, deletedAssignment.total)) {
                                                removedRow = row;
                                                break;
                                        }
                                } catch (_) { /* ignore */ }
                        }
                }

                // Fallback: remove the most recently added (first in DOM since prepended)
                if (!removedRow && hypotheticalRows.length > 0) {
                        removedRow = hypotheticalRows[0];
                }

                if (removedRow) {
                        // Clean up score edit data for this row
                        const removedRowId = removedRow.getAttribute("data-original-row-id") || removedRow.getAttribute("data-fgs-row-id");
                        if (removedRowId) {
                                scoreEditHistory = scoreEditHistory.filter(e => e.rowId !== removedRowId);
                                scoreRedoHistory = scoreRedoHistory.filter(r => r.rowId !== removedRowId);
                                if (editedScores[removedRowId]) delete editedScores[removedRowId];
                        }

                        removedRow.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                        removedRow.style.transform = 'translateX(-100%)';
                        removedRow.style.opacity = '0';
                        setTimeout(() => {
                                removedRow.remove();
                                nextRowColor = getNextColorFromTable();

                                // Recalculate
                                const remaining = hypotheticals.filter(h => h.classKey === classKey);
                                const hasScoreEdits = hasActiveScoreEditsForClass(classKey);
                                if (remaining.length > 0 || hasScoreEdits) {
                                        calculate();
                                } else {
                                        clearDisplays();
                                        if (mode === "weighted") restoreOriginalCategoryData();
                                }
                        }, 300);
                } else {
                        // No row found, just recalculate
                        const remaining = hypotheticals.filter(h => h.classKey === classKey);
                        const hasScoreEdits = hasActiveScoreEditsForClass(classKey);
                        if (remaining.length > 0 || hasScoreEdits) {
                                calculate();
                        } else {
                                clearDisplays();
                                if (mode === "weighted") restoreOriginalCategoryData();
                        }
                        nextRowColor = getNextColorFromTable();
                }
    }


        /**
         * Clears all hypothetical assignments for the current class
         * Re-enables score editing after clearing so you don't have to reopen calculator
         */
        function clearAll() {
        try {
                
                const classKey = getCurrentClassKey();
                const removedCount = hypotheticals.filter((h) => h.classKey === classKey).length;
                
                // Clear all score edits
                clearAllScoreEdits();
                
                hypotheticals = hypotheticals.filter((h) => h.classKey !== classKey);
                redoHistory = redoHistory.filter((r) => r.classKey !== classKey);
                actionHistory = actionHistory.filter((a) => a.classKey !== classKey);
                actionRedoHistory = actionRedoHistory.filter((a) => a.classKey !== classKey);
                hypotheticalCount = 1;
                
                document.querySelectorAll(".hypothetical").forEach((e) => e.remove());
                clearDisplays();
                restoreOriginalRows();
                if (mode === "weighted") {
                restoreOriginalCategoryData();
                }
                
                // Use smart color detection after clearing
                nextRowColor = getNextColorFromTable();
                
                // Clean up assignment detail popup if it exists
                if (typeof assignmentDetailPopup !== 'undefined' && assignmentDetailPopup) {
                assignmentDetailPopup.remove();
                assignmentDetailPopup = null;
                }
                
                // Re-enable score editing after clearing
                // This lets you continue editing without backing out and reopening
                setTimeout(() => {
                if (typeof makeScoresEditable === 'function') {
                        makeScoresEditable();
                }
                }, 300);
                
        } catch (error) {
                console.error("CLEAR ALL OPERATION - Error:", error);
        }
        }
    
    /**
    * Removes all hypothetical grade displays from the interface
    * Cleans up injected elements without affecting original gradebook
    */
    function clearDisplays() {
        try {
                document.getElementById("hypothetical-grade")?.remove();
                document.querySelectorAll(".injected-hypo-grade").forEach((e) => e.remove());
                document.querySelectorAll(".injected-hypo-weighted").forEach((e) => e.remove());
        } catch (error) {
                console.error("Error clearing displays:", error);
        }
    }
    
    /**
    * Saves original category cell data for weighted gradebook
    * Preserves styling and content for later restoration
    */
    function saveOriginalCategoryData() {
        try {
                const classKey = getCurrentClassKey();
                if (originalCategoryData[classKey]) return;
                const table = document.querySelector(".student-gb-grades-weighted-grades");
                if (!table) return;
                const rows = table.querySelectorAll("tr");
                const labelRow = rows[0]?.querySelectorAll("td");
                const scoreRow = rows[2]?.querySelectorAll("td");
                if (!labelRow || !scoreRow) return;
                originalCategoryData[classKey] = {};
                for (let i = 1; i < labelRow.length - 1; i++) {
                        try {
                                const label = labelRow[i]?.innerText?.trim();
                                const scoreCell = scoreRow[i];
                                if (label && scoreCell) {
                                        const computedStyle = window.getComputedStyle(scoreCell);
                                        originalCategoryData[classKey][label.toLowerCase()] = {
                                                originalHTML: scoreCell.innerHTML,
                                                originalText: scoreCell.innerText,
                                                originalHeight: computedStyle.height,
                                                originalMaxHeight: computedStyle.maxHeight,
                                                originalMinHeight: computedStyle.minHeight,
                                                originalLineHeight: computedStyle.lineHeight,
                                                originalFontSize: computedStyle.fontSize,
                                        };
                                }
                        } catch (error) {
                                console.error("Error saving category data at index", i, error);
                        }
                }
        } catch (error) {
                console.error("Error in saveOriginalCategoryData:", error);
        }
    }
    
    /**
    * Restores original category cell data for weighted gradebook
    * Returns cells to their original state after clearing hypotheticals
    */
    function restoreOriginalCategoryData() {
        try {
                const classKey = getCurrentClassKey();
                const originalData = originalCategoryData[classKey];
                if (!originalData) return;
                const table = document.querySelector(".student-gb-grades-weighted-grades");
                if (!table) return;
                const rows = table.querySelectorAll("tr");
                const labelRow = rows[0]?.querySelectorAll("td");
                const scoreRow = rows[2]?.querySelectorAll("td");
                if (!labelRow || !scoreRow) return;
                for (let i = 1; i < labelRow.length - 1; i++) {
                        try {
                                const label = labelRow[i]?.innerText?.trim();
                                const scoreCell = scoreRow[i];
                                if (label && scoreCell && originalData[label.toLowerCase()]) {
                                        const cellData = originalData[label.toLowerCase()];
                                        scoreCell.innerHTML = cellData.originalHTML;
                                        ["height", "maxHeight", "minHeight", "padding", "margin", "whiteSpace", "overflow", "verticalAlign", "boxSizing", "lineHeight", "fontSize"].forEach((prop) => {
                                                scoreCell.style[prop] = "";
                                        });
                                }
                        } catch (error) {
                                console.error("Error restoring category at index", i, error);
                        }
                }
        } catch (error) {
                console.error("Error in restoreOriginalCategoryData:", error);
        }
    }
    
    /**
    * Saves original table rows for the current class
    * Creates backup copies before adding hypothetical assignments
    */
    function saveOriginalRows() {
        try {
                const classKey = getCurrentClassKey();
                if (!originalRowsByClass[classKey]) {
                        const tableRows = document.querySelectorAll(".grades-grid.dataTable tbody tr");
                        if (tableRows.length > 0) {
                                originalRowsByClass[classKey] = [...tableRows].map((row) => row.cloneNode(true));
                        }
                }
        } catch (error) {
                console.error("Error saving original rows:", error);
        }
    }
    
    /**
    * Restores original table rows for the current class
    * Removes all hypothetical rows and returns table to original state
    */
    function restoreOriginalRows() {
        try {
                const table = document.querySelector(".grades-grid.dataTable tbody");
                const classKey = getCurrentClassKey();
                const originalRows = originalRowsByClass[classKey];
                if (table && originalRows) {
                        table.innerHTML = "";
                        originalRows.forEach((row) => table.appendChild(row.cloneNode(true)));
                }
        } catch (error) {
                console.error("Error restoring original rows:", error);
        }
    }

    /**
 * ASSIGNMENT DETAIL POPUP FUNCTIONS
 * Creates and manages Focus-style assignment detail popups for hypothetical assignments
 */

// Check if assignmentDetailPopup is already declared, if not declare it
if (typeof assignmentDetailPopup === 'undefined') {
    var assignmentDetailPopup = null;
}

function createAssignmentDetailPopup() {
    try {
        if (assignmentDetailPopup) {
            assignmentDetailPopup.remove();
        }
        
        assignmentDetailPopup = document.createElement("div");
        assignmentDetailPopup.id = "fgs-assignment-detail-popup";
        assignmentDetailPopup.innerHTML = `
            <div class="fgs-assignment-overlay">
                <div class="fgs-assignment-content">
                    <header class="fgs-web-page-top">
                        <div class="fgs-header-filler"></div>
                        <div class="fgs-header-title-extra">
                            <a class="fgs-back-link" href="#" id="fgs-assignment-back">
                                Back to Assignment List
                                <i class="fgs-back-icon"></i>
                            </a>
                        </div>
                    </header>
                    
                    <div class="fgs-web-page-content">
                        <div class="fgs-web-page-main-content">
                            <section class="fgs-web-page-core">
                                <header class="fgs-web-page-main-content-header">
                                    <div class="fgs-main-content-header-center">
                                        <h1 class="fgs-main-content-header-title" id="fgs-assignment-title">Assignment Name</h1>
                                    </div>
                                </header>
                                
                                <div class="fgs-web-page-core-content">
                                        <div class="fgs-edit-assignment-details-container">
                                                
                                                <div class="fgs-student-assignment-grade-container">
                                                <div class="fgs-personal-grade">
                                                        <div class="fgs-personal-grade-top">
                                                        <div class="fgs-personal-grade-left">
                                                                <div class="fgs-personal-letter-grade" id="fgs-detail-letter">A</div>
                                                                <div class="fgs-personal-points-grade" id="fgs-detail-points-text">20 / 20 Points</div>
                                                        </div>
                                                        <div class="fgs-personal-grade-right">
                                                                <div class="fgs-personal-percent-grade" id="fgs-detail-percent">100%</div>
                                                        </div>
                                                        </div>
                                                </div>
                                                </div>

                                                <div class="fgs-post-content fgs-view-assignment-content">
                                                <div class="fgs-edit-assignment-item">
                                                        <span class="fgs-edit-assignment-label"></span>
                                                        <span class="fgs-view-assignment-value">
                                                        <span class="fgs-assignment-points" id="fgs-detail-points">20</span>
                                                        </span>
                                                </div>
                                                
                                                <div class="fgs-edit-assignment-item">
                                                        <span class="fgs-edit-assignment-label">Questions</span>
                                                        <span class="fgs-view-assignment-value" id="fgs-detail-questions">N/A</span>
                                                </div>
                                                
                                                <div class="fgs-edit-assignment-item">
                                                        <span class="fgs-edit-assignment-label">Category</span>
                                                        <span class="fgs-view-assignment-value" id="fgs-detail-category">Assignments</span>
                                                </div>
                                                
                                                <div class="fgs-edit-assignment-item">
                                                        <span class="fgs-edit-assignment-label">Assigned Date</span>
                                                        <span class="fgs-view-assignment-value">
                                                        <span id="fgs-detail-assigned">09/05/2025</span>
                                                        <span id="fgs-detail-assigned-time">12:00 am</span>
                                                        </span>
                                                </div>
                                                
                                                <div class="fgs-edit-assignment-item">
                                                        <span class="fgs-edit-assignment-label">Due Date</span>
                                                        <span class="fgs-view-assignment-value">
                                                        <span id="fgs-detail-due">09/16/2025</span>
                                                        <span id="fgs-detail-due-time">11:59 pm</span>
                                                        </span>
                                                </div>
                                                
                                                <div class="fgs-edit-assignment-item">
                                                        <span class="fgs-edit-assignment-label">Publish Date</span>
                                                        <span class="fgs-view-assignment-value">
                                                        <span id="fgs-detail-publish">09/05/2025</span>
                                                        <span id="fgs-detail-publish-time">12:00 am</span>
                                                        </span>
                                                </div>
                                                
                                                <div class="fgs-edit-assignment-item">
                                                        <span class="fgs-edit-assignment-label">Marking Period</span>
                                                        <span class="fgs-view-assignment-value" id="fgs-detail-period">1st 9 Weeks</span>
                                                </div>
                                                
                                                <div class="fgs-assignment-details-filler"></div>
                                                <div class="fgs-assignment-details-filler"></div>
                                                </div>
                                                
                                                <span class="fgs-edit-assignment-label fgs-page-description-label">Description</span>
                                        </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add CSS
        const style = document.createElement("style");
        style.id = "fgs-assignment-detail-styles";
        style.textContent = getAssignmentDetailCSS();
        
        const existingStyle = document.getElementById("fgs-assignment-detail-styles");
        if (existingStyle) {
            existingStyle.remove();
        }
        
        document.head.appendChild(style);
        document.body.appendChild(assignmentDetailPopup);
        
        // Add event listeners
        const backBtn = document.getElementById("fgs-assignment-back");
        if (backBtn) {
            backBtn.addEventListener("click", (e) => {
                e.preventDefault();
                hideAssignmentDetails();
            });
        }
        
        const overlay = assignmentDetailPopup.querySelector(".fgs-assignment-overlay");
        if (overlay) {
            overlay.addEventListener("click", (e) => {
                if (e.target === overlay) {
                    hideAssignmentDetails();
                }
            });
        }
        
        // ESC key support
        document.addEventListener("keydown", handleAssignmentDetailKeydown);
        
    } catch (error) {
        console.error("Error creating assignment detail popup:", error);
    }
}

function showAssignmentDetails(data) {
    try {
        if (!assignmentDetailPopup) {
            createAssignmentDetailPopup();
        }
        
        // Calculate dates and times
        const now = new Date();
        const assignedDate = new Date(now);
        assignedDate.setDate(assignedDate.getDate() - 1);
        const dueDate = new Date(now);
        const publishDate = new Date(assignedDate);
        
        // Format dates
        const formatDate = (date) => {
            return date.toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit", 
                year: "numeric"
            });
        };
        
        // Calculate grade info
        const percent = data.total > 0 ? Math.round((data.earned / data.total) * 100) : 100;
        const letter = getLetterGrade(percent);
        
        // Populate data
        const title = data.name && data.name.trim() !== "" ? data.name : "Hypothetical Assignment";
        document.getElementById("fgs-assignment-title").textContent = title;
        document.getElementById("fgs-detail-letter").textContent = letter;
        document.getElementById("fgs-detail-points-text").textContent = `${data.earned} / ${data.total} Points`;
        document.getElementById("fgs-detail-percent").textContent = `${percent}%`;
        document.getElementById("fgs-detail-points").textContent = data.total;
        document.getElementById("fgs-detail-questions").textContent = "N/A";
        document.getElementById("fgs-detail-category").textContent = data.category || "N/A";
        document.getElementById("fgs-detail-assigned").textContent = formatDate(assignedDate);
        document.getElementById("fgs-detail-assigned-time").textContent = "12:00 am";
        document.getElementById("fgs-detail-due").textContent = formatDate(dueDate);
        document.getElementById("fgs-detail-due-time").textContent = "11:59 pm";
        document.getElementById("fgs-detail-publish").textContent = formatDate(publishDate);
        document.getElementById("fgs-detail-publish-time").textContent = "12:00 am";
        document.getElementById("fgs-detail-period").textContent = "";
        
        // Show popup
        assignmentDetailPopup.style.display = "block";
        
    } catch (error) {
        console.error("Error showing assignment details:", error);
    }
}

/**
 * Hides assignment details popup
 */
function hideAssignmentDetails() {
    try {
        if (assignmentDetailPopup) {
            assignmentDetailPopup.style.display = "none";
        }
    } catch (error) {
        console.error("Error hiding assignment details:", error);
    }
}

/**
 * Handles ESC key for assignment detail popup
 */
function handleAssignmentDetailKeydown(e) {
    if (e.key === "Escape" && assignmentDetailPopup && assignmentDetailPopup.style.display !== "none") {
        hideAssignmentDetails();
    }
}

function getAssignmentDetailCSS() {
    return `
        #fgs-assignment-detail-popup {
            position: fixed;
            top: 70px;
            left: 230px;
            right: 0;
            bottom: 0;
            z-index: 1000;
            display: none;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif;
        }
        
        .fgs-assignment-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #ffffff;
            overflow-y: auto;
        }
        
        .fgs-assignment-content {
            background: #ffffff;
            width: 100%;
            min-height: 100%;
        }
        
        /* Header */
        .fgs-web-page-top {
            background: transparent;
            padding: 15px 30px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .fgs-back-link {
            color: #1e4a7a;
            text-decoration: none;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
        }
        
        .fgs-back-link:hover {
            text-decoration: underline;
        }
        
        .fgs-back-icon::before {
            content: "◄";
            font-size: 12px;
        }
        
        /* Main Content */
        .fgs-web-page-content {
            background: #ffffff;
        }
        
        .fgs-web-page-main-content-header {
            padding: 30px 40px 25px 40px;
            background: #ffffff;
        }
        
        .fgs-main-content-header-title {
            color: #1e4a7a;
            font-size: 28px;
            font-weight: 600;
            margin: 0;
            line-height: 1.3;
        }
        
        /* Core content container */
        .fgs-web-page-core-content {
            padding: 0;
        }
        
        .fgs-edit-assignment-details-container {
            padding: 0;
        }
        
        /* Grade Container */
        .fgs-student-assignment-grade-container {
            padding: 0 40px 20px 40px;
        }
        
        .fgs-personal-grade {
            background: #e8e9f3;
            padding: 20px 25px;
        }
        
        .fgs-personal-grade-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .fgs-personal-grade-left {
            display: flex;
            align-items: center;
            gap: 20px;
        }
        
        .fgs-personal-letter-grade {
            font-size: 52px;
            font-weight: 300;
            color: #1e4a7a;
            line-height: 1;
        }
        
        .fgs-personal-points-grade {
            font-size: 15px;
            color: #333333;
            font-weight: 400;
        }
        
        .fgs-personal-percent-grade {
            font-size: 36px;
            font-weight: 300;
            color: #1e4a7a;
        }
        
        /* Assignment Details - single column layout like Focus */
        .fgs-post-content {
            padding: 0 40px;
        }
        
        .fgs-edit-assignment-item {
            display: flex;
            padding: 10px 0;
            border-bottom: none;
        }
        
        .fgs-edit-assignment-label {
            font-weight: 600;
            color: #666666;
            font-size: 13px;
            min-width: 130px;
            flex-shrink: 0;
        }
        
        .fgs-view-assignment-value {
            color: #333333;
            font-size: 13px;
            flex: 1;
        }
        
        .fgs-assignment-details-filler {
            height: 10px;
        }
        
        .fgs-page-description-label {
            display: block;
            padding: 20px 40px 10px 40px;
            font-weight: 600;
            color: #666666;
            font-size: 13px;
        }
        
        @media (max-width: 768px) {
            #fgs-assignment-detail-popup {
                left: 0;
                top: 60px;
            }
            
            .fgs-web-page-main-content-header,
            .fgs-student-assignment-grade-container,
            .fgs-post-content,
            .fgs-page-description-label {
                padding-left: 20px;
                padding-right: 20px;
            }
        }
    `;
}
