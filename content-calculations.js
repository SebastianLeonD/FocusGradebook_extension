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
function handleAdd() {
        try {
                console.log("ðŸš€ ADD OPERATION - Starting...");
                
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
                
                const data = { earned: parseFloat(earned), total: parseFloat(total), category: category, name: name, classKey: getCurrentClassKey() };
                console.log("ðŸš€ ADD OPERATION - Assignment data:", data);
                
                // Use smart color detection
                nextRowColor = getNextColorFromTable();
                console.log("ðŸŽ¨ ADD OPERATION - Smart detected nextRowColor:", nextRowColor);
                
                redoHistory = redoHistory.filter((r) => r.classKey !== getCurrentClassKey());
                hypotheticals.push(data);
                addRow(data);
                calculate();
                
                const keepValues = document.getElementById("fgs-keep-values");
                if (keepValues && !keepValues.checked) {
                        earnedInput.value = "";
                        totalInput.value = "";
                        if (nameInput) nameInput.value = "";
                }
                
                console.log("âœ… ADD OPERATION - Completed successfully");
        } catch (error) {
                console.error("âŒ ADD OPERATION - Error:", error);
        }
}
    
    /**
    * Main calculation dispatcher - routes to weighted or unweighted calculation
    * Determines calculation method based on current mode setting
    */
    function calculate() {
        try {
                console.log("ðŸ§® Starting calculation, mode:", mode);
                if (mode === "weighted") {
                        calculateWeighted();
                } else {
                        calculateUnweighted();
                }
        } catch (error) {
                console.error("âŒ Error in calculate:", error);
        }
    }
    
    /**
    * FIXED: Performs weighted grade calculation using category-based grading
    * Uses original category data from Focus instead of parsing assignment rows
    */
    function calculateWeighted() {
        try {
                console.log("âš–ï¸ Starting weighted calculation...");
                const table = document.querySelector(".student-gb-grades-weighted-grades");
                if (!table) return;
                
                const categoryMap = {};
                const rows = table.querySelectorAll("tr");
                const percentRow = rows[1]?.querySelectorAll("td");
                const labelRow = rows[0]?.querySelectorAll("td");
                const scoreRow = rows[2]?.querySelectorAll("td");
                if (!percentRow || !labelRow || !scoreRow) return;
                
                const classKey = getCurrentClassKey();
                const originalData = originalCategoryData[classKey];
                
                console.log("ðŸ“Š WEIGHTED CALC - Original category data available:", !!originalData);
                
                // Extract category weights and ORIGINAL scores from saved data
                for (let i = 1; i < percentRow.length - 1; i++) {
                        try {
                                const label = labelRow[i]?.innerText?.trim();
                                const weight = parseFloat(percentRow[i]?.innerText?.replace("%", "").trim());
                                
                                if (label && !isNaN(weight)) {
                                        // Initialize with weight
                                        categoryMap[label.toLowerCase()] = { 
                                                weight, 
                                                earned: 0, 
                                                total: 0, 
                                                hasHypotheticals: false
                                        };
                                        
                                        // Get ORIGINAL scores from saved data, not current display
                                        const originalCellData = originalData?.[label.toLowerCase()];
                                        if (originalCellData && originalCellData.originalText) {
                                                const originalText = originalCellData.originalText.trim();
                                                console.log(`ðŸ“Š WEIGHTED CALC - ${label} original text: "${originalText}"`);
                                                
                                                // Parse original format like "43.5/69 63% D"
                                                const scoreMatch = originalText.match(/^([0-9.]+)\/([0-9.]+)/);
                                                if (scoreMatch) {
                                                        const originalEarned = parseFloat(scoreMatch[1]);
                                                        const originalTotal = parseFloat(scoreMatch[2]);
                                                        categoryMap[label.toLowerCase()].earned = originalEarned;
                                                        categoryMap[label.toLowerCase()].total = originalTotal;
                                                        console.log(`ðŸ“Š WEIGHTED CALC - ${label} parsed: ${originalEarned}/${originalTotal}`);
                                                }
                                        }
                                }
                        } catch (error) {
                                console.error("âŒ Error processing category at index", i, error);
                        }
                }
                
                console.log("ðŸ“Š WEIGHTED CALC - Categories after original data:", 
                        Object.fromEntries(Object.entries(categoryMap).map(([k, v]) => 
                                [k, { earned: v.earned, total: v.total, weight: v.weight }])));
                
                // Add hypothetical scores for current class only
                const assignmentRows = [...document.querySelectorAll(".grades-grid.dataTable tbody tr")];
                assignmentRows.forEach((row) => {
                        try {
                                // Only include hypotheticals for current class
                                if (!row.classList.contains("hypothetical")) return;
                                if (row.getAttribute("data-class-id") !== currentClassId) return;
                                
                                const tds = row.querySelectorAll("td");
                                if (tds.length < 11) return;
                                const category = tds[9]?.innerText?.trim().toLowerCase();
                                const raw = (tds[2]?.innerText || "").split("/").map((s) => s.trim());
                                if (!isValid(raw[0], raw[1])) return;
                                const earned = raw[0].toUpperCase() === "Z" ? 0 : parseFloat(raw[0]);
                                const total = parseFloat(raw[1]);
                                
                                console.log("âž• WEIGHTED CALC - Adding hypothetical:", {
                                        category,
                                        earned,
                                        total,
                                        assignment: tds[1]?.innerText?.trim()
                                });
                                
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
                                console.error("âŒ Error processing hypothetical assignment row:", error);
                        }
                });
                
                console.log("ðŸ“Š WEIGHTED CALC - After adding hypotheticals:", 
                        Object.fromEntries(Object.entries(categoryMap).map(([k, v]) => 
                                [k, { earned: v.earned, total: v.total, weight: v.weight, hasHypo: v.hasHypotheticals }])));
                
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
                                        
                                        console.log(`ðŸ“Š WEIGHTED CALC - Category ${cat}: ${earned}/${total} = ${(avg * 100).toFixed(1)}% (weight: ${weight}%)`);
                                }
                        } catch (error) {
                                console.error("âŒ Error calculating category:", cat, error);
                        }
                }
                
                const finalPercent = usedWeightSum > 0 ? Math.round((final / (usedWeightSum / 100)) * 100) : 100;
                console.log("ðŸŽ¯ Final weighted grade:", finalPercent);
                updateCategoryCells(categoryMap);
                showWeightedGrade(finalPercent, getLetterGrade(finalPercent));
        } catch (error) {
                console.error("âŒ Error in calculateWeighted:", error);
        }
    }
    
    /**
    * Updates category cells in weighted gradebook with new calculated values
    * Preserves original formatting while displaying updated scores
    */
    function updateCategoryCells(categoryMap) {
        try {
                console.log("ðŸ”„ Updating category cells...");
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
        cell.innerHTML = `${earned}/${total} ${percent}% ${letter}`;
        cell.setAttribute('data-fgs-modified', 'true');
        
        console.log(`ðŸ”„ CELL UPDATE - ${label}: ${earned}/${total} = ${percent}% ${letter}`);
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
                console.log(`ðŸ”„ CELL RESTORE - ${label}: restored to original`);
            }
        }
    }
}
                        } catch (error) {
                                console.error("âŒ Error updating cell at index", i, error);
                        }
                }
        } catch (error) {
                console.error("âŒ Error in updateCategoryCells:", error);
        }
    }
    
    /**
    * Performs unweighted grade calculation using simple points-based system
    * Sums all earned and possible points, calculates final percentage
    */
    function calculateUnweighted() {
        try {
                console.log("ðŸ“Š Starting unweighted calculation...");
                const rows = [...document.querySelectorAll(".grades-grid.dataTable tbody tr")];
                let totalEarned = 0,
                        totalPossible = 0;
                rows.forEach((row) => {
                        try {
                                if (row.classList.contains("hypothetical") && row.getAttribute("data-class-id") !== currentClassId) return;
                                const tds = row.querySelectorAll("td");
                                if (tds.length < 11) return;
                                const raw = (tds[2]?.innerText || "").split("/").map((s) => s.trim());
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
                                console.error("âŒ Error processing unweighted row:", error);
                        }
                });
                const finalPercent = totalPossible ? Math.round((totalEarned / totalPossible) * 100) : 100;
                console.log("ðŸŽ¯ Unweighted final grade:", finalPercent);
                showGrade(finalPercent, getLetterGrade(finalPercent));
        } catch (error) {
                console.error("âŒ Error in calculateUnweighted:", error);
        }
    }
    
    /**
    * Displays weighted grade in the gradebook table
    * Creates new table cells to show hypothetical grade alongside original data
    */
    function showWeightedGrade(percent, letter) {
        try {
                console.log("ðŸ“º Showing weighted grade:", percent, letter);
                const table = document.querySelector(".student-gb-grades-weighted-grades");
                if (!table) {
                        console.warn("âŒ Weighted grades table not found");
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
                                console.error("âŒ Error processing table row:", error);
                        }
                }
                if (headerRow && percentRow && scoreRow) {
                        try {
                                const addCell = (row, content, isScore = !1) => {
                                        const cell = document.createElement("td");
                                        cell.className = isScore ? "student-gb-grades-weighted-grades-score-cell injected-hypo-weighted" : "student-gb-grades-weighted-grades-cell injected-hypo-weighted";
                                        cell.innerText = content;
                                        cell.style.cssText = "background: #2f4f6f; color: white; font-weight: bold; text-align: left; font-size: " + (isScore ? "13px" : "12px") + "; width: auto; max-width: none;";
                                        cell.setAttribute("data-class-id", currentClassId);
                                        row.appendChild(cell);
                                };
                                addCell(headerRow, "Hypothetical Grade");
                                addCell(percentRow, "");
                                addCell(scoreRow, `${percent}% ${letter}`, !0);
                                console.log("âœ… Weighted grade display updated in table");
                        } catch (error) {
                                console.error("âŒ Error adding cells to table:", error);
                        }
                } else {
                        console.warn("âš ï¸ Required table rows not found");
                }
        } catch (error) {
                console.error("âŒ Error in showWeightedGrade:", error);
        }
    }
    
    /**
    * Displays unweighted grade next to the original grade display
    * Adds hypothetical grade indicator without modifying original gradebook
    */
    function showGrade(percent, letter) {
        try {
                console.log("ðŸ“º Showing unweighted grade:", percent, letter);
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
                        console.log("âœ… Unweighted grade display updated");
                } else {
                        console.warn("âš ï¸ Could not find container for unweighted grade display");
                }
        } catch (error) {
                console.error("âŒ Error in showGrade:", error);
        }
    }
    
/**
 * ENHANCED: Adds a new hypothetical assignment row with permanent delete button
 * Creates visual representation with always-visible delete button
 */
function addRow(data) {
        try {
                console.log("➕ ADD ROW OPERATION - Starting for:", data);
                
                // Use smart color detection right before adding
                nextRowColor = getNextColorFromTable();
                console.log("🎨 ADD ROW OPERATION - Smart detected color:", nextRowColor);
                
                saveOriginalRows();
                const table = document.querySelector(".grades-grid.dataTable tbody");
                const baseRow = table?.querySelector("tr");
                if (!table || !baseRow) {
                        console.error("❌ ADD ROW OPERATION - Table or base row not found");
                        return;
                }
                const clone = baseRow.cloneNode(!0);
                clone.classList.add("hypothetical");
                clone.setAttribute("data-class-id", currentClassId);
                
                // Generate unique ID for this row
                const rowId = `fgs-hypo-row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                clone.setAttribute("data-fgs-row-id", rowId);
                
                const earned = data.earned;
                const total = data.total;
                const percent = total === 0 && earned > 0 ? 100 : Math.round((earned / total) * 100);
                const letter = getLetterGrade(percent);
                const tds = clone.querySelectorAll("td");
                if (tds.length >= 11) {
                        const assignmentName = data.name && data.name.trim() !== "" ? data.name : `Hypothetical ${hypotheticalCount++}`;
                        
                        // Create assignment name cell with delete button
                        const nameCell = tds[1];
                        
                        // Create clickable blue link for assignment name
                        const assignmentLink = document.createElement('a');
                        assignmentLink.href = '#';
                        assignmentLink.className = 'fgs-assignment-link';
                        assignmentLink.style.cssText = 'color: #2c5aa0; text-decoration: none; cursor: pointer; margin-right: 25px;';
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
                        
                        // CREATE HOVER-ACTIVATED DELETE BUTTON (exact copy from document 2)
                        const deleteButton = document.createElement("button");
                        deleteButton.textContent = "X";
                        deleteButton.title = "Delete this assignment";
                        deleteButton.setAttribute("data-row-id", rowId);
                        deleteButton.className = "fgs-hover-delete-btn";
                        deleteButton.style.cssText = `
                                background: #dc3545;
                                flex: justify-center;
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
                        
                        // Clear the cell and add both elements
                        nameCell.innerHTML = '';
                        nameCell.appendChild(assignmentLink);
                        nameCell.appendChild(deleteButton);
                        
                        // ADD ROW HOVER EFFECTS (copied from document 2 but REMOVED background changes)
                        clone.addEventListener('mouseenter', () => {
                                // REMOVED: background color and transform changes
                                // KEPT: Delete button show animation
                                deleteButton.style.opacity = '1';
                                deleteButton.style.visibility = 'visible';
                                deleteButton.style.transform = 'scale(1)';
                        });
                        
                        clone.addEventListener('mouseleave', () => {
                                // REMOVED: background color reset
                                // KEPT: Delete button hide animation
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
                
                console.log("🎨 ADD ROW OPERATION - Setting new row to color:", nextRowColor);
                clone.style.backgroundColor = nextRowColor;
                
                table.insertBefore(clone, table.firstChild);
                console.log("✅ ADD ROW OPERATION - Row added successfully with delete button");
                
                // Update nextRowColor for the next addition
                nextRowColor = getNextColorFromTable();
                console.log("🎨 ADD ROW OPERATION - Next color updated to:", nextRowColor);
        } catch (error) {
                console.error("❌ ADD ROW OPERATION - Error:", error);
        }
}

/**
 * ENHANCED: Deletes a specific assignment by row ID and flips colors of rows above
 * Removes from data structures, flips alternating colors, and recalculates grades
 */
function deleteSpecificAssignment(rowId) {
        try {
                console.log("🗑️ DELETE SPECIFIC - Starting for row ID:", rowId);
                
                // Find the row element
                const rowElement = document.querySelector(`[data-fgs-row-id="${rowId}"]`);
                if (!rowElement) {
                        console.error("❌ DELETE SPECIFIC - Row element not found");
                        return;
                }
                
                // Get assignment info to find in hypotheticals array
                const nameCell = rowElement.querySelector("td:nth-child(2)");
                const scoreCell = rowElement.querySelector("td:nth-child(3)");
                
                if (!nameCell || !scoreCell) {
                        console.error("❌ DELETE SPECIFIC - Could not extract assignment data");
                        return;
                }
                
                // Parse score to match with hypotheticals array
                const scoreText = scoreCell.textContent.trim();
                const scoreParts = scoreText.split(" / ");
                if (scoreParts.length !== 2) {
                        console.error("❌ DELETE SPECIFIC - Invalid score format");
                        return;
                }
                
                const earned = parseFloat(scoreParts[0]);
                const total = parseFloat(scoreParts[1]);
                const classKey = getCurrentClassKey();
                
                // FIXED: Better assignment matching - find by class, score, and recent addition
                // This will work regardless of what name the user gave the assignment
                const assignmentIndex = hypotheticals.findIndex(h => {
                        // Must match class and scores exactly
                        const matchesClass = h.classKey === classKey;
                        const matchesScore = h.earned === earned && h.total === total;
                        
                        if (!matchesClass || !matchesScore) {
                                return false;
                        }
                        
                        // For multiple assignments with same score, find the most recent one
                        // that hasn't been deleted yet (since we're deleting from the top)
                        return true;
                });
                
                if (assignmentIndex === -1) {
                        console.error("❌ DELETE SPECIFIC - Assignment not found in hypotheticals array");
                        console.log("🔍 DEBUG - Looking for:", { classKey, earned, total });
                        console.log("🔍 DEBUG - Available hypotheticals:", hypotheticals.filter(h => h.classKey === classKey));
                        return;
                }
                
                const deletedAssignment = hypotheticals[assignmentIndex];
                console.log("🗑️ DELETE SPECIFIC - Found assignment to delete:", deletedAssignment);
                
                // ENHANCED: Get all rows above the deleted row for color flipping
                const table = document.querySelector(".grades-grid.dataTable tbody");
                const allRows = Array.from(table.querySelectorAll("tr"));
                const deletedRowIndex = allRows.indexOf(rowElement);
                const rowsAbove = allRows.slice(0, deletedRowIndex);
                
                console.log("🎨 DELETE SPECIFIC - Found", rowsAbove.length, "rows above deleted row to flip colors");
                
                // Remove from hypotheticals array
                hypotheticals.splice(assignmentIndex, 1);
                
                // Add to redo history for potential restoration
                redoHistory.push({ 
                        assignment: { ...deletedAssignment }, 
                        classKey: classKey, 
                        nextRowColor: nextRowColor 
                });
                
                // Remove the row element with smooth animation
                rowElement.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                rowElement.style.transform = 'translateX(-100%)';
                rowElement.style.opacity = '0';
                
                setTimeout(() => {
                        rowElement.remove();
                        console.log("🗑️ DELETE SPECIFIC - Row removed from DOM");
                        
                        // ENHANCED: Flip colors of all rows above the deleted row
                        rowsAbove.forEach((row) => {
                                try {
                                        const currentColor = row.style.backgroundColor;
                                        let newColor;
                                        
                                        // Flip the color: white ↔ blue
                                        if (currentColor === "rgb(255, 255, 255)" || currentColor === "#FFFFFF" || currentColor === "#ffffff" || 
                                            currentColor === "rgb(245, 245, 245)" || currentColor === "#f5f5f5") {
                                                newColor = "#DDEEFF";
                                        } else if (currentColor === "rgb(221, 238, 255)" || currentColor === "#DDEEFF" || currentColor === "#ddeeff" ||
                                                 currentColor === "rgb(223, 239, 255)" || currentColor === "#dfefff") {
                                                newColor = "#FFFFFF";
                                        } else {
                                                // Default to white if color is unrecognized
                                                newColor = "#FFFFFF";
                                        }
                                        
                                        row.style.backgroundColor = newColor;
                                        console.log("🎨 DELETE SPECIFIC - Flipped row color from", currentColor, "to", newColor);
                                        
                                } catch (error) {
                                        console.error("❌ DELETE SPECIFIC - Error flipping color for row:", error);
                                }
                        });
                        
                        // Recalculate grades
                        const remainingHypotheticals = hypotheticals.filter(h => h.classKey === classKey);
                        if (remainingHypotheticals.length > 0) {
                                calculate();
                        } else {
                                console.log("🧹 DELETE SPECIFIC - No more hypotheticals, clearing displays");
                                clearDisplays();
                                if (mode === "weighted") {
                                        restoreOriginalCategoryData();
                                }
                        }
                        
                        // Update color detection
                        nextRowColor = getNextColorFromTable();
                        console.log("🎨 DELETE SPECIFIC - Updated next color to:", nextRowColor);
                        
                }, 300);
                
                console.log("✅ DELETE SPECIFIC - Operation completed successfully with color flipping");
                
        } catch (error) {
                console.error("❌ DELETE SPECIFIC - Error:", error);
        }
}
    
    /**
    * Undoes the last hypothetical assignment for the current class
    * Removes from data structures, updates display, and manages redo history
    */
    function undo() {
        try {
                console.log("â†¶ UNDO OPERATION - Starting...");
                
                const classKey = getCurrentClassKey();
                const classHypotheticals = hypotheticals.filter((h) => h.classKey === classKey);
                if (classHypotheticals.length === 0) {
                        console.log("â„¹ï¸ UNDO OPERATION - No hypotheticals to undo");
                        return;
                }
                
                const lastAssignment = classHypotheticals[classHypotheticals.length - 1];
                console.log("ðŸ”„ UNDO OPERATION - Removing assignment:", lastAssignment);
                
                // Save to redo history with current nextRowColor
                redoHistory.push({ assignment: { ...lastAssignment }, classKey: classKey, nextRowColor: nextRowColor });
                 
                const globalIndex = hypotheticals.findIndex((h) => h === lastAssignment);
                if (globalIndex !== -1) hypotheticals.splice(globalIndex, 1);
                
                const hypotheticalRows = document.querySelectorAll('.hypothetical[data-class-id="' + currentClassId + '"]');
                if (hypotheticalRows.length > 0) {
                        const removedRow = hypotheticalRows[0];
                        const removedRowColor = removedRow.style.backgroundColor;
                        const removedAssignment = removedRow.querySelector("td:nth-child(2)")?.textContent;
                        
                        console.log("ðŸŽ¨ UNDO OPERATION - Removing row:", removedAssignment, "with color:", removedRowColor);
                        removedRow.remove();
                        
                        // Use smart color detection instead of guessing
                        nextRowColor = getNextColorFromTable();
                        console.log("ðŸŽ¨ UNDO OPERATION - Smart detected next color:", nextRowColor);
                }
                
                if (hypotheticalCount > 1) hypotheticalCount--;
                
                const remaining = hypotheticals.filter((h) => h.classKey === classKey);
                if (remaining.length > 0) {
                        calculate();
                } else {
                        console.log("ðŸ§¹ UNDO OPERATION - No more hypotheticals, clearing displays");
                        clearDisplays();
                        if (mode === "weighted") {
                                restoreOriginalCategoryData();
                        }
                        nextRowColor = getNextColorFromTable();
                        console.log("ðŸŽ¨ UNDO OPERATION - Reset next color to:", nextRowColor);
                }
                console.log("âœ… UNDO OPERATION - Completed successfully");
        } catch (error) {
                console.error("âŒ UNDO OPERATION - Error:", error);
        }
    }
    
    /**
    * Redoes the last undone hypothetical assignment
    * Restores assignment from redo history and recalculates grades
    */
    function redo() {
        try {
                console.log("â†· REDO OPERATION - Starting...");
                
                const classKey = getCurrentClassKey();
                const classRedos = redoHistory.filter((r) => r.classKey === classKey);
                if (classRedos.length === 0) {
                        console.log("â„¹ï¸ REDO OPERATION - No redos available");
                        return;
                }
                
                const lastRedo = classRedos[classRedos.length - 1];
                console.log("ðŸ”„ REDO OPERATION - Restoring assignment:", lastRedo.assignment);
                
                redoHistory.splice(redoHistory.lastIndexOf(lastRedo), 1);
                
                hypotheticals.push(lastRedo.assignment);
                addRow(lastRedo.assignment);
                calculate();
                
                console.log("âœ… REDO OPERATION - Completed successfully");
        } catch (error) {
                console.error("âŒ REDO OPERATION - Error:", error);
        }
    }
    
    /**
    * Clears all hypothetical assignments for the current class
    * Resets all state variables and restores original gradebook appearance
    */
    function clearAll() {
        try {
                console.log("ðŸ§¹ CLEAR ALL OPERATION - Starting...");
                
                const classKey = getCurrentClassKey();
                const removedCount = hypotheticals.filter((h) => h.classKey === classKey).length;
                console.log("ðŸ§¹ CLEAR ALL OPERATION - Removing", removedCount, "hypotheticals");
                
                hypotheticals = hypotheticals.filter((h) => h.classKey !== classKey);
                redoHistory = redoHistory.filter((r) => r.classKey !== classKey);
                hypotheticalCount = 1;
                
                document.querySelectorAll(".hypothetical").forEach((e) => e.remove());
                clearDisplays();
                restoreOriginalRows();
                if (mode === "weighted") {
                        restoreOriginalCategoryData();
                }
                
                // Use smart color detection after clearing
                nextRowColor = getNextColorFromTable();
                console.log("ðŸŽ¨ CLEAR ALL OPERATION - Reset next color to:", nextRowColor);
                
                // Clean up assignment detail popup if it exists
                if (assignmentDetailPopup) {
                        assignmentDetailPopup.remove();
                        assignmentDetailPopup = null;
    }
                console.log("âœ… CLEAR ALL OPERATION - Completed successfully");
        } catch (error) {
                console.error("âŒ CLEAR ALL OPERATION - Error:", error);
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
                console.error("âŒ Error clearing displays:", error);
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
                                console.error("âŒ Error saving category data at index", i, error);
                        }
                }
        } catch (error) {
                console.error("âŒ Error in saveOriginalCategoryData:", error);
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
                                console.error("âŒ Error restoring category at index", i, error);
                        }
                }
        } catch (error) {
                console.error("âŒ Error in restoreOriginalCategoryData:", error);
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
                                originalRowsByClass[classKey] = [...tableRows].map((row) => row.cloneNode(!0));
                        }
                }
        } catch (error) {
                console.error("âŒ Error saving original rows:", error);
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
                        originalRows.forEach((row) => table.appendChild(row.cloneNode(!0)));
                }
        } catch (error) {
                console.error("âŒ Error restoring original rows:", error);
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

/**
 * Creates the assignment detail popup with Focus styling
 */
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
                    <div class="fgs-assignment-header">
                        <button class="fgs-assignment-back" id="fgs-assignment-back">â† Back to Assignment List</button>
                    </div>
                    <div class="fgs-assignment-body">
                        <h1 class="fgs-assignment-title" id="fgs-assignment-title">Assignment Name</h1>
                        <div class="fgs-assignment-details">
                            <div class="fgs-detail-row">
                                <div class="fgs-detail-group">
                                    <div class="fgs-detail-large" id="fgs-detail-points">20</div>
                                    <div class="fgs-detail-label">Questions</div>
                                    <div class="fgs-detail-value" id="fgs-detail-questions">N/A</div>
                                </div>
                                <div class="fgs-detail-group">
                                    <div class="fgs-detail-label">Category</div>
                                    <div class="fgs-detail-value" id="fgs-detail-category">Homework/CW</div>
                                </div>
                            </div>
                            <div class="fgs-detail-row">
                                <div class="fgs-detail-group">
                                    <div class="fgs-detail-label">Assigned Date</div>
                                    <div class="fgs-detail-value" id="fgs-detail-assigned">08/14/2025</div>
                                </div>
                                <div class="fgs-detail-group">
                                    <div class="fgs-detail-label">Due Date</div>
                                    <div class="fgs-detail-value" id="fgs-detail-due">08/19/2025</div>
                                </div>
                                <div class="fgs-detail-group">
                                    <div class="fgs-detail-label">Publish Date</div>
                                    <div class="fgs-detail-value" id="fgs-detail-publish">08/15/2025</div>
                                </div>
                            </div>
                            <div class="fgs-detail-row">
                                <div class="fgs-detail-group">
                                    <div class="fgs-detail-label">Marking Period</div>
                                    <div class="fgs-detail-value" id="fgs-detail-period"></div>
                                </div>
                            </div>
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
            backBtn.addEventListener("click", hideAssignmentDetails);
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
        console.error("âŒ Error creating assignment detail popup:", error);
    }
}

/**
 * Shows assignment details popup with data
 */
function showAssignmentDetails(data) {
    try {
        if (!assignmentDetailPopup) {
            createAssignmentDetailPopup();
        }
        
        // Calculate dates
        const now = new Date();
        const assignedDate = new Date(now);
        assignedDate.setDate(assignedDate.getDate() - 1); // Day before
        const dueDate = new Date(now); // Today
        const publishDate = new Date(assignedDate); // Same as assigned
        
        // Format dates like Focus (MM/DD/YYYY)
        const formatDate = (date) => {
            return date.toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit", 
                year: "numeric"
            });
        };
        
        // Populate data
        const title = data.name && data.name.trim() !== "" ? data.name : "Hypothetical Assignment";
        document.getElementById("fgs-assignment-title").textContent = title;
        document.getElementById("fgs-detail-points").textContent = `${data.earned}/${data.total}`;
        document.getElementById("fgs-detail-questions").textContent = "N/A";
        document.getElementById("fgs-detail-category").textContent = data.category || "N/A";
        document.getElementById("fgs-detail-assigned").textContent = formatDate(assignedDate);
        document.getElementById("fgs-detail-due").textContent = formatDate(dueDate);
        document.getElementById("fgs-detail-publish").textContent = formatDate(publishDate);
        document.getElementById("fgs-detail-period").textContent = "";
        
        // Show popup
        assignmentDetailPopup.style.display = "block";
        
    } catch (error) {
        console.error("âŒ Error showing assignment details:", error);
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
        console.error("âŒ Error hiding assignment details:", error);
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

/**
 * CSS for assignment detail popup (matches Focus exactly)
 */
function getAssignmentDetailCSS() {
    return `
        #fgs-assignment-detail-popup {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 25000;
            display: none;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        .fgs-assignment-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 0;
            box-sizing: border-box;
            overflow-y: auto;
        }
        
        .fgs-assignment-content {
            background: #ffffff;
            width: 100%;
            min-height: 100vh;
            box-shadow: none;
            overflow: visible;
            border: none;
            border-radius: 0;
        }
        
        .fgs-assignment-header {
            background: #2c5aa0;
            padding: 12px 20px;
            border-bottom: none;
        }
        
        .fgs-assignment-back {
            background: none;
            border: none;
            color: white;
            font-size: 16px;
            cursor: pointer;
            padding: 0;
            font-family: inherit;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .fgs-assignment-back:hover {
            text-decoration: underline;
        }
        
        .fgs-assignment-body {
            padding: 40px 60px;
            background: #ffffff;
            color: #333333;
        }
        
        .fgs-assignment-title {
            color: #2c5aa0;
            font-size: 28px;
            font-weight: 600;
            margin: 0 0 30px 0;
            line-height: 1.2;
        }
        
        .fgs-assignment-details {
            display: flex;
            flex-direction: column;
            gap: 25px;
        }
        
        .fgs-detail-row {
            display: flex;
            gap: 60px;
            align-items: flex-start;
            flex-wrap: wrap;
        }
        
        .fgs-detail-group {
            display: flex;
            flex-direction: column;
            min-width: 120px;
        }
        
        .fgs-detail-large {
            font-size: 24px;
            font-weight: 600;
            color: #333333;
            margin-bottom: 15px;
        }
        
        .fgs-detail-label {
            font-size: 14px;
            font-weight: 600;
            color: #666666;
            margin-bottom: 4px;
            text-transform: none;
        }
        
        .fgs-detail-value {
            font-size: 16px;
            color: #333333;
            font-weight: 400;
        }
        
        @media (max-width: 768px) {
            .fgs-assignment-body {
                padding: 20px;
            }
            
            .fgs-detail-row {
                flex-direction: column;
                gap: 20px;
            }
            
            .fgs-assignment-title {
                font-size: 24px;
            }
        }
    `;
}