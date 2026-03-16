/**
 * CONTENT-UTILITIES.JS
 * Pure utility functions for Focus Grade Calculator Extension
 * PRODUCTION VERSION: Removed console logs
 * 
 * RESPONSIBILITIES:
 * - Global state variables (shared across all files)
 * - Grade conversion utilities (percentage to letter grade)
 * - Data validation helpers
 * - Class identification and key generation
 * - Category extraction from gradebook
 * - Date/time formatting
 * - Color calculation for alternating table rows
 * - Data parsing and validation helpers
 * - Automatic weighted/unweighted class detection
 */

// ===========================================
// GLOBAL STATE VARIABLES - SHARED ACROSS ALL FILES
// ===========================================
// Core application state - accessible to all content script files
let hypotheticals = [];
let hypotheticalCount = 1;
let originalRowsByClass = {};
let mode = "unweighted";
let currentClassId = null;
let redoHistory = [];
let actionHistory = [];     // Unified chronological history: { type: 'hypothetical'|'scoreEdit', classKey, timestamp }
let actionRedoHistory = []; // Unified redo history
let floatingPopup = null;
let helpModal = null;
let isDragging = false;
let nextRowColor = "#FFFFFF";
let originalCategoryData = {};
let isInitialized = false;

// Class monitoring globals
let classChangeObserver = null;
let lastDetectedClassValue = null;
let classChangeTimeoutId = null;
let classChangePollingId = null;

// Dynamic column detection — maps column names to CSS selectors or header indices
let columnIndexMap = null;

/**
 * AUTO-DETECTION: Determines if current class is weighted or unweighted
 * Looks for the weighted grades container in the DOM
 * @returns {string} "weighted" or "unweighted"
 */
function detectClassType() {
    try {
        const weightedContainer = document.querySelector(".student-gb-grades-weighted-grades-container");
        const weightedTable = document.querySelector(".student-gb-grades-weighted-grades");
        
        if (weightedContainer && weightedTable) {
            return "weighted";
        }
        return "unweighted";
    } catch (error) {
        return "unweighted"; // Default fallback
    }
}

/**
 * AUTO-DETECTION: Sets up monitoring for class changes
 * Watches the class dropdown select element for changes
 */
function setupClassChangeMonitoring() {
    try {
        const classSelect = document.querySelector("select.student-gb-grades-course");
        if (!classSelect) return;

        // Store initial value
        lastDetectedClassValue = classSelect.value;

        // Remove existing listener if any
        if (classChangeObserver) {
            classChangeObserver.disconnect();
        }

        // Stop existing polling if any
        if (classChangePollingId) {
            clearInterval(classChangePollingId);
            classChangePollingId = null;
        }

        // Create mutation observer to watch for changes
        classChangeObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                    handleClassChange();
                }
            });
        });

        // Also add direct change listener
        classSelect.addEventListener('change', handleClassChange);

        // Observe the select element
        classChangeObserver.observe(classSelect, {
            attributes: true,
            attributeFilter: ['value']
        });

        // Poll for programmatic class changes that don't fire events
        classChangePollingId = setInterval(() => {
            try {
                const sel = document.querySelector("select.student-gb-grades-course");
                if (!sel) return;
                if (sel.value !== lastDetectedClassValue) {
                    handleClassChange();
                }
            } catch (_) { /* silent */ }
        }, 1500);

    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * AUTO-DETECTION: Handles class changes
 * Clears hypotheticals, re-detects class type, resets popup
 */
function handleClassChange() {
    try {
        const classSelect = document.querySelector("select.student-gb-grades-course");
        if (!classSelect) return;
        
        const newClassValue = classSelect.value;
        
        // Only proceed if class actually changed
        if (newClassValue === lastDetectedClassValue) {
            return;
        }
        
        lastDetectedClassValue = newClassValue;
        
        // Cancel any pending class change timeout from a previous rapid switch
        if (classChangeTimeoutId) {
            clearTimeout(classChangeTimeoutId);
            classChangeTimeoutId = null;
        }

        // Clear all hypotheticals and reset state
        hypotheticals = [];
        redoHistory = [];
        hypotheticalCount = 1;
        originalRowsByClass = {};
        originalCategoryData = {};
        actionHistory = [];
        actionRedoHistory = [];
        editedScores = {};
        originalScoreSnapshots = {};
        scoreEditHistory = [];
        scoreRedoHistory = [];
        fgsRowIdCounter = 0;

        // Remove hypothetical displays and modified score markers
        clearDisplays();
        document.querySelectorAll(".hypothetical").forEach((e) => e.remove());
        document.querySelectorAll("[data-score-modified]").forEach((e) => e.removeAttribute("data-score-modified"));
        document.querySelectorAll("[data-fgs-edit-bound]").forEach((e) => e.removeAttribute("data-fgs-edit-bound"));

        // Update current class ID
        currentClassId = newClassValue;

        // Re-detect class type (with cancellation support)
        classChangeTimeoutId = setTimeout(() => {
            classChangeTimeoutId = null;
            mode = detectClassType();
            buildColumnIndexMap();

            // Reset popup to mode selection if it exists
            if (floatingPopup && floatingPopup.style.display !== "none") {
                if (typeof window.showModeSelection === 'function') {
                    window.showModeSelection();
                }
            }

            // Update color detection
            nextRowColor = getNextColorFromTable();

        }, 1000); // Give time for Focus to load new class data
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Converts numerical percentage to letter grade
 * Uses standard A-F grading scale
 * @param {number} percent - Grade percentage (0-100)
 * @returns {string} Letter grade (A, B, C, D, or F)
 */
function getLetterGrade(percent) {
        if (percent >= 90) return "A";
        if (percent >= 80) return "B";
        if (percent >= 70) return "C";
        if (percent >= 60) return "D";
        return "F";
}

/**
 * Validates assignment score data to ensure it's usable for calculations
 * Filters out "NG" (No Grade) entries and other invalid data
 * @param {string} earned - Points earned value from gradebook
 * @param {string} total - Points possible value from gradebook  
 * @returns {boolean} True if data is valid for calculation
 */
function isValid(earned, total) {
        return earned?.trim().toLowerCase() !== "ng" && total?.trim().toLowerCase() !== "ng";
}

/**
 * Generates a unique identifier for the current class/course
 * Used to maintain separate hypothetical assignment sets per class
 * @returns {string} Unique class key for state management
 */
function getCurrentClassKey() {
        try {
                const classLabel = document.querySelector(".gb-title")?.innerText;
                if (classLabel?.trim()) return classLabel.trim().toLowerCase();
                const select = document.querySelector("select.student-gb-grades-course");
                const selectedOption = select?.options[select.selectedIndex];
                if (selectedOption) return selectedOption.textContent.trim().toLowerCase();
                const urlParams = new URLSearchParams(window.location.search);
                const courseId = urlParams.get("course_period_id");
                return courseId ? `course_${courseId}` : `unknown_class_${Date.now()}`;
        } catch (error) {
                return `fallback_class_${Date.now()}`;
        }
}

/**
 * SMART COLOR DETECTION - Looks at actual table to determine next color
 * No more guessing! This function examines the current top row and returns the opposite color
 * @returns {string} Next color to use for new hypothetical rows
 */
function getNextColorFromTable() {
        try {
                const firstRow = document.querySelector(".grades-grid.dataTable tbody tr");
                if (!firstRow) {
                        return "#FFFFFF";
                }
                
                const currentColor = firstRow.style.backgroundColor;
                
                // Check for white colors (Focus uses #FFFFFF for white rows)
                if (currentColor === "rgb(255, 255, 255)" || currentColor === "#FFFFFF" || currentColor === "#ffffff" || 
                    currentColor === "rgb(245, 245, 245)" || currentColor === "#f5f5f5") {
                        return "#DDEEFF";
                } 
                // Check for blue colors (Focus uses #DDEEFF for blue rows)  
                else if (currentColor === "rgb(221, 238, 255)" || currentColor === "#DDEEFF" || currentColor === "#ddeeff" ||
                         currentColor === "rgb(223, 239, 255)" || currentColor === "#dfefff") {
                        return "#FFFFFF";
                } else {
                        return "#FFFFFF";
                }
        } catch (error) {
                return "#FFFFFF";
        }
}

/**
 * Extracts available grading categories from the weighted gradebook
 * Parses category headers to populate dropdown options
 * @returns {Array<string>} Array of category names found in gradebook
 */
function extractCategories() {
        try {
                // Method 1: Look for elements with data-assignment-type-id
                let elements = document.querySelectorAll(".student-gb-grades-weighted-grades-header td[data-assignment-type-id]");
                
                // Method 2: Fallback to all header cells except first and last
                if (elements.length === 0) {
                        elements = document.querySelectorAll(".student-gb-grades-weighted-grades-header td:not(:first-child):not(:last-child)");
                }
                
                const categories = [];
                elements.forEach((el, index) => {
                        try {
                                const text = el.textContent.trim();
                                if (text && text !== "Weighted Grade") {
                                        categories.push(text);
                                }
                        } catch (error) {
                                // Continue processing other categories
                        }
                });
                
                // Fallback categories if none found
                if (categories.length === 0) {
                        const fallbackCategories = ["Tests", "Labs & Projects", "Quizzes", "Classwork & Homework"];
                        return fallbackCategories;
                }
                
                return categories;
        } catch (error) {
                return ["Tests", "Labs & Projects", "Quizzes", "Classwork & Homework"];
        }
}

/**
 * Generates formatted date and time string for hypothetical assignments
 * Creates realistic-looking timestamps that are slightly randomized
 * @returns {string} Formatted date and time string
 */
function getDateTime() {
        try {
                const now = new Date();
                now.setMinutes(now.getMinutes() - Math.floor(Math.random() * 60));
                return now.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }) + " " + now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
        } catch (error) {
                return "Recent";
        }
}

// ===========================================
// DYNAMIC COLUMN DETECTION
// ===========================================

/**
 * CSS-class and data-field selectors for Focus SIS table columns.
 * These are position-independent and work regardless of which columns are enabled.
 */
const COLUMN_SELECTORS = {
        assignment: { child: '.assignment-name-link' },
        points:     { cls: 'td.points-cell' },
        percent:    { cls: 'td.student-percent' },
        grade:      { cls: 'td.student-letter' },
        category:   { attr: 'td[data-field="category_title"]', altAttr: 'td[data-field="assignment_type_title"]' },
        comment:    { attr: 'td[data-field="comment"]' },
        resources:  { attr: 'td[data-field="resources"]' },
        lastModified: { child: '[data-field="updated_at"]' }
};

/**
 * Header text → column name mapping for fallback index-based detection.
 * Keys are lowercased header text values from Focus <th> elements.
 */
const HEADER_TO_COLUMN = {
        'assignment':    'assignment',
        'points':        'points',
        '%':             'percent',
        'percent':       'percent',
        'grade':         'grade',
        'letter grade':  'grade',
        'category':      'category',
        'comment':       'comment',
        'comments':      'comment',
        'resources':     'resources',
        'last modified': 'lastModified',
        'assigned':      'assigned',
        'due':           'due',
        'last upload date': 'lastUpload',
        'submit files':  'submitFiles'
};

/**
 * Scans <th> headers once and builds a name → column-index map.
 * Called at startup and on class change so the map stays current.
 */
function buildColumnIndexMap() {
        try {
                columnIndexMap = {};
                const headers = document.querySelectorAll('.grades-grid.dataTable thead th');
                headers.forEach((th, index) => {
                        const text = th.textContent.trim().toLowerCase();
                        const colName = HEADER_TO_COLUMN[text];
                        if (colName && columnIndexMap[colName] === undefined) {
                                columnIndexMap[colName] = index;
                        }
                });
        } catch (error) {
                columnIndexMap = {};
        }
}

/**
 * Returns the <td> for a given column name in a row, or null if the column is absent.
 *
 * Resolution order:
 *   1. CSS class selector  (e.g. td.points-cell)
 *   2. data-field attribute (e.g. td[data-field="category_title"])
 *   3. Child element match  (e.g. .assignment-name-link → parent td)
 *   4. Header-index fallback from columnIndexMap
 *   5. null — caller MUST guard with `if (cell)`
 *
 * @param {HTMLElement} row - A <tr> element
 * @param {string} columnName - One of: assignment, points, percent, grade, category, comment, resources, lastModified
 * @returns {HTMLElement|null}
 */
function getCell(row, columnName) {
        try {
                if (!row || !columnName) return null;
                const spec = COLUMN_SELECTORS[columnName];

                // 1. CSS class selector
                if (spec?.cls) {
                        const cell = row.querySelector(spec.cls);
                        if (cell) return cell;
                }

                // 2. data-field attribute selector
                if (spec?.attr) {
                        const cell = row.querySelector(spec.attr);
                        if (cell) return cell;
                }

                // 2b. Alternate data-field attribute selector
                if (spec?.altAttr) {
                        const cell = row.querySelector(spec.altAttr);
                        if (cell) return cell;
                }

                // 3. Child element → parent <td>
                if (spec?.child) {
                        const child = row.querySelector(spec.child);
                        if (child) {
                                const td = child.closest('td');
                                if (td && td.closest('tr') === row) return td;
                        }
                }

                // 4. Header-index fallback
                if (columnIndexMap && columnIndexMap[columnName] !== undefined) {
                        const tds = row.querySelectorAll('td');
                        const idx = columnIndexMap[columnName];
                        if (idx < tds.length) return tds[idx];
                }

                return null;
        } catch (error) {
                return null;
        }
}
