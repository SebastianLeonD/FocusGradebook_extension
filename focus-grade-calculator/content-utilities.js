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
let floatingPopup = null;
let helpModal = null;
let isDragging = !1;
let dragOffset = { x: 0, y: 0 };
let nextRowColor = "#FFFFFF";
let originalCategoryData = {};
let isInitialized = !1;

// Theme system globals
let defaultWebsiteColor = null; // Stores user's default website color
let hasAutoApplied = false; // Prevents multiple auto-applications

// Class monitoring globals
let classChangeObserver = null;
let lastDetectedClassValue = null;

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
        } else {
            return "unweighted";
        }
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
        
        // Clear all hypotheticals and reset state
        hypotheticals = [];
        redoHistory = [];
        hypotheticalCount = 1;
        originalRowsByClass = {};
        originalCategoryData = {};
        
        // Remove hypothetical displays
        clearDisplays();
        document.querySelectorAll(".hypothetical").forEach((e) => e.remove());
        
        // Update current class ID
        currentClassId = newClassValue;
        
        // Re-detect class type
        setTimeout(() => {
            mode = detectClassType();
            
            // Reset popup to mode selection if it exists
            if (floatingPopup && floatingPopup.style.display !== "none") {
                // Use the global showModeSelection function
                if (typeof window.showModeSelection === 'function') {
                    window.showModeSelection();
                } else {
                    const modeSelection = document.getElementById("fgs-mode-selection");
                    const calculatorForm = document.getElementById("fgs-calculator-form");
                    const gpaCalculator = document.getElementById("fgs-gpa-calculator");
                    
                    if (modeSelection) modeSelection.style.display = "flex";
                    if (calculatorForm) calculatorForm.style.display = "none";
                    if (gpaCalculator) gpaCalculator.style.display = "none";
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
                return now.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }) + " " + now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: !0 }).toLowerCase();
        } catch (error) {
                return "Recent";
        }
}