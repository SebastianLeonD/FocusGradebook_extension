/**
 * CONTENT-GPA-CALCULATOR.JS  
 * PRODUCTION VERSION: Removed console logs and debug statements
 */

// ===========================================
// GPA CALCULATOR STATE VARIABLES
// ===========================================
let gpaCalculatorData = {
    classes: [],
    selectedClasses: [],
    currentGPAs: {
        unweighted: 0,
        weighted: 0,
        core: 0
    },
    projectedGPAs: {
        unweighted: 0,
        weighted: 0,
        core: 0
    },
    currentStep: 1
};

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Detects course type (AP, Honors, Regular, etc.) from course name
 */
function detectCourseType(courseName) {
    const name = courseName.toUpperCase();
    
    if (name.includes('AP ') || name.includes('ADVANCED PLACEMENT')) {
        return 'AP';
    }
    if (name.includes('AICE')) {
        return 'AICE';
    }
    if (name.includes('IB ') || name.includes('INTERNATIONAL BACCALAUREATE')) {
        return 'IB';
    }
    if (name.includes('HONORS') || name.includes('HONOR') || 
        name.includes(' HON ') || name.includes(' H ') ||
        name.startsWith('HON ') || name.startsWith('H ') ||
        name.endsWith(' HON') || name.endsWith(' H')) {
        return 'Honors';
    }
    if (name.includes('PRE-AP') || name.includes('PREAP')) {
        return 'PreAP';
    }
    if (name.includes('PRE-AICE') || name.includes('PREAICE')) {
        return 'PreAICE';
    }
    if (name.includes('PRE-IB') || name.includes('PREIB')) {
        return 'PreIB';
    }
    if (name.includes('DUAL ENROLLMENT') || name.includes('DE ')) {
        return 'DualEnrollment';
    }
    
    return 'Regular';
}

/**
 * Determines if a course is a core subject
 */
function isCoreSubject(courseName) {
    const name = courseName.toUpperCase();
    
    // Math subjects
    if (name.includes('MATH') || name.includes('ALGEBRA') || name.includes('GEOMETRY') || 
        name.includes('CALCULUS') || name.includes('STATISTICS') || name.includes('TRIGONOMETRY')) {
        return true;
    }
    
    // Science subjects
    if (name.includes('SCIENCE') || name.includes('BIOLOGY') || name.includes('CHEMISTRY') || 
        name.includes('PHYSICS') || name.includes('ANATOMY') || name.includes('ENVIRONMENTAL')) {
        return true;
    }
    
    // English subjects
    if (name.includes('ENGLISH') || name.includes('LITERATURE') || name.includes('WRITING') || 
        name.includes('LANGUAGE ARTS')) {
        return true;
    }
    
    // Social Studies subjects
    if (name.includes('HISTORY') || name.includes('GOVERNMENT') || name.includes('ECONOMICS') || 
        name.includes('SOCIAL STUDIES') || name.includes('GEOGRAPHY') || name.includes('PSYCHOLOGY')) {
        return true;
    }
    
    return false;
}

/**
 * Gets display label for course type
 */
function getTypeLabel(type) {
    const labels = {
        'AP': 'AP',
        'AICE': 'AICE', 
        'IB': 'IB',
        'Honors': 'Hon',
        'PreAP': 'Pre-AP',
        'PreAICE': 'Pre-AICE',
        'PreIB': 'Pre-IB',
        'DualEnrollment': 'DE',
        'Regular': 'Reg'
    };
    return labels[type] || 'Reg';
}

/**
 * Converts letter grade to approximate percentage for calculations
 */
function letterToPercentage(letter) {
    const letterMap = {
        'A': 95, 'B+': 88, 'B': 85, 'C+': 78, 'C': 75,
        'D+': 68, 'D': 65, 'F': 50
    };
    return letterMap[letter] || 75;
}

/**
 * Gets current academic year for filtering classes
 */
function getCurrentAcademicYear() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-11
    
    if (month >= 7) { // August or later = new school year
        return `${currentYear}-${currentYear + 1}`;
    } else {
        return `${currentYear - 1}-${currentYear}`;
    }
}

// ===========================================
// MAIN GPA CALCULATOR FUNCTIONS
// ===========================================

/**
 * Launches GPA calculator with URL validation
 */
function launchGPACalculator() {
    try {
        // Check if user is on the correct page
        if (!isOnGradesPage()) {
            showGradesPageWarning();
            return;
        }
        
        // Hide other interfaces
        const modeSelection = document.getElementById('fgs-mode-selection');
        const calculatorForm = document.getElementById('fgs-calculator-form');
        const gpaCalculator = document.getElementById('fgs-gpa-calculator');
        const settingsDropdown = document.getElementById('fgs-settings-dropdown');
        
        if (modeSelection) modeSelection.style.display = 'none';
        if (calculatorForm) calculatorForm.style.display = 'none';
        if (gpaCalculator) gpaCalculator.style.display = 'flex';
        if (settingsDropdown) settingsDropdown.style.display = 'none';
        
        // Extract class data from Focus
        extractClassData();
        
        // Auto-select appropriate classes
        autoSelectClasses();
        
        // Show step 1 (class selection)
        showGPAStep(1);
        
        // Apply adaptive sizing for GPA calculator
        if (typeof adjustPopupSize === 'function') {
            adjustPopupSize();
        } else {
            // Fallback - apply medium size
            const popup = document.getElementById('focus-grade-simulator-popup');
            if (popup) {
                popup.classList.remove('size-small', 'size-medium', 'size-large', 'size-xlarge');
                popup.classList.add('size-medium');
            }
        }
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Checks if user is on the grades page by URL
 */
function isOnGradesPage() {
    try {
        const currentUrl = window.location.href;
        const hasStudentRCGrades = currentUrl.includes('StudentRCGrades.php');
        const hasGradesInPath = currentUrl.includes('Grades/StudentRCGrades') || currentUrl.includes('modname=Grades');
        
        return hasStudentRCGrades || hasGradesInPath;
    } catch (error) {
        return false;
    }
}

/**
 * Shows warning when not on grades page
 */
function showGradesPageWarning() {
    try {
        // Show mode selection but with warning
        const modeSelection = document.getElementById('fgs-mode-selection');
        const calculatorForm = document.getElementById('fgs-calculator-form');
        const gpaCalculator = document.getElementById('fgs-gpa-calculator');
        const settingsDropdown = document.getElementById('fgs-settings-dropdown');
        
        if (modeSelection) modeSelection.style.display = 'flex';
        if (calculatorForm) calculatorForm.style.display = 'none';
        if (gpaCalculator) gpaCalculator.style.display = 'none';
        if (settingsDropdown) settingsDropdown.style.display = 'none';
        
        // Show alert to user
        alert('⚠️ GPA Calculator requires the Grades page.\n\nPlease navigate to the "Grades" tab in Focus to use this feature.');
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Extracts class data from the Focus gradebook table
 */
function extractClassData() {
    try {
        const currentYear = getCurrentAcademicYear();
        const rows = document.querySelectorAll('.student-grade');
        
        gpaCalculatorData.classes = [];
        
        rows.forEach((row, index) => {
            try {
                const yearCell = row.querySelector('[data-field="syear_display"]');
                const courseCell = row.querySelector('[data-field="course_name"]');
                const q1Cell = row.querySelector('[data-field="mp_q1"] a');
                
                if (!yearCell || !courseCell) return;
                
                const year = yearCell.textContent.trim();
                const courseName = courseCell.textContent.trim();
                
                // Only include current year classes
                if (year !== currentYear) return;
                
                // Skip study halls and non-credit courses
                if (courseName.includes('NC STUDY HALL') || courseName.includes('STUDY HALL')) {
                    return;
                }
                
                // Extract grade information
                const gradeInfo = extractGradeInfo(q1Cell);
                if (!gradeInfo.hasGrade) {
                    return;
                }
                
                const courseType = detectCourseType(courseName);
                const isCore = isCoreSubject(courseName);
                
                const classData = {
                    id: `class_${index}`,
                    name: courseName,
                    type: courseType,
                    isCore: isCore,
                    grade: gradeInfo.grade,
                    percentage: gradeInfo.percentage,
                    letterGrade: gradeInfo.letterGrade,
                    originalGrade: gradeInfo.letterGrade, // For reset functionality
                    credits: 1.0 // Default to 1 credit, could be enhanced later
                };
                
                gpaCalculatorData.classes.push(classData);
                
            } catch (error) {
                // Continue processing other rows
            }
        });
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Extracts grade information from Focus grade cell
 */
function extractGradeInfo(gradeCell) {
    try {
        if (!gradeCell) {
            return { hasGrade: false };
        }
        
        const gradeText = gradeCell.textContent.trim();
        
        // Handle "NG" (No Grade) cases
        if (gradeText === 'NG' || gradeText === '') {
            return { hasGrade: false };
        }
        
        // Parse percentage + letter format (e.g., "77% C+")
        const percentMatch = gradeText.match(/(\d+(?:\.\d+)?)%\s*([A-F][+-]?)/);
        if (percentMatch) {
            return {
                hasGrade: true,
                grade: gradeText,
                percentage: parseFloat(percentMatch[1]),
                letterGrade: percentMatch[2]
            };
        }
        
        // Parse letter-only format (e.g., "A", "B+", "C")
        const letterMatch = gradeText.match(/^([A-F][+-]?)$/);
        if (letterMatch) {
            return {
                hasGrade: true,
                grade: gradeText,
                percentage: letterToPercentage(letterMatch[1]),
                letterGrade: letterMatch[1]
            };
        }
        
        return { hasGrade: false };
        
    } catch (error) {
        return { hasGrade: false };
    }
}

/**
 * Auto-selects appropriate classes (first 7 credit courses)
 */
function autoSelectClasses() {
    try {
        // Select first 7 classes (standard course load)
        gpaCalculatorData.selectedClasses = gpaCalculatorData.classes.slice(0, 7);
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Shows specific GPA calculator step with responsive sizing
 */
function showGPAStep(stepNumber) {
    try {
        // Hide all steps
        const step1 = document.getElementById('fgs-gpa-step-1');
        const step2 = document.getElementById('fgs-gpa-step-2');
        
        if (step1) step1.style.display = 'none';
        if (step2) step2.style.display = 'none';
        
        // Show target step and adjust popup size
        if (stepNumber === 1) {
            if (step1) step1.style.display = 'flex';
            renderClassList();
            setPopupSizeForInterface('gpa-calculator');
            // Fine-tune size based on actual content
            setTimeout(() => adjustPopupSize(), 100);
        } else if (stepNumber === 2) {
            if (step2) step2.style.display = 'flex';
            calculateGPAs();
            renderResults();
            setPopupSizeForInterface('gpa-results');
        }
        
        gpaCalculatorData.currentStep = stepNumber;
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Renders the class list with "no classes" instruction
 */
function renderClassList() {
    try {
        const container = document.getElementById('fgs-gpa-class-list');
        const noClassesInstruction = document.getElementById('fgs-gpa-no-classes');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        // Show instruction if no classes found
        if (gpaCalculatorData.selectedClasses.length === 0) {
            if (noClassesInstruction) {
                noClassesInstruction.style.display = 'block';
            }
        } else {
            if (noClassesInstruction) {
                noClassesInstruction.style.display = 'none';
            }
        }
        
        gpaCalculatorData.selectedClasses.forEach((classData, index) => {
            const classItem = document.createElement('div');
            classItem.className = 'fgs-gpa-class-item';
            classItem.innerHTML = `
                <div class="fgs-gpa-class-info">
                    <div class="fgs-gpa-class-name" title="${classData.name}">${classData.name}</div>
                    <div class="fgs-gpa-class-details">
                        <span class="fgs-gpa-class-type ${classData.type.toLowerCase()}">${getTypeLabel(classData.type)}</span>
                    </div>
                </div>
                <button class="fgs-gpa-grade-edit" data-class-id="${classData.id}">${classData.grade}</button>
                <button class="fgs-gpa-class-remove" data-class-id="${classData.id}">×</button>
            `;
            container.appendChild(classItem);
        });
        
        // Setup event listeners
        setupClassListEvents();
        
        // Update add class dropdown
        updateAddClassDropdown();
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Sets up event listeners for class list interactions
 */
function setupClassListEvents() {
    try {
        // Grade edit buttons
        document.querySelectorAll('.fgs-gpa-grade-edit').forEach(button => {
            button.addEventListener('click', (e) => {
                const classId = e.target.getAttribute('data-class-id');
                editGrade(classId);
            });
        });
        
        // Remove buttons
        document.querySelectorAll('.fgs-gpa-class-remove').forEach(button => {
            button.addEventListener('click', (e) => {
                const classId = e.target.getAttribute('data-class-id');
                removeClass(classId);
            });
        });
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Updates the add class dropdown with available classes
 */
function updateAddClassDropdown() {
    try {
        const dropdown = document.getElementById('fgs-gpa-add-class');
        if (!dropdown) return;
        
        // Clear existing options except first
        while (dropdown.options.length > 1) {
            dropdown.remove(1);
        }
        
        // Add unselected classes
        const selectedIds = gpaCalculatorData.selectedClasses.map(c => c.id);
        const availableClasses = gpaCalculatorData.classes.filter(c => !selectedIds.includes(c.id));
        
        if (availableClasses.length > 0) {
            dropdown.style.display = 'block';
            availableClasses.forEach(classData => {
                const option = document.createElement('option');
                option.value = classData.id;
                option.textContent = `${classData.name} (${classData.grade})`;
                dropdown.appendChild(option);
            });
            
            // Add event listener for selection
            dropdown.addEventListener('change', (e) => {
                if (e.target.value) {
                    addClass(e.target.value);
                    e.target.value = ''; // Reset dropdown
                }
            });
        } else {
            dropdown.style.display = 'none';
        }
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Handles editing a grade for "what if" scenarios
 */
function editGrade(classId) {
    try {
        const classData = gpaCalculatorData.selectedClasses.find(c => c.id === classId);
        if (!classData) return;
        
        const newGrade = prompt(`Edit grade for ${classData.name}:\n\nEnter letter grade (A, B+, B, C+, C, D+, D, F):`, classData.letterGrade);
        
        if (newGrade && /^[A-F][+-]?$/.test(newGrade.toUpperCase())) {
            classData.letterGrade = newGrade.toUpperCase();
            classData.percentage = letterToPercentage(classData.letterGrade);
            classData.grade = `${classData.percentage}% ${classData.letterGrade}`;
            
            renderClassList();
        }
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Removes a class from the selected list
 */
function removeClass(classId) {
    try {
        gpaCalculatorData.selectedClasses = gpaCalculatorData.selectedClasses.filter(c => c.id !== classId);
        renderClassList();
        adjustPopupSize();
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Adds a class to the selected list
 */
function addClass(classId) {
    try {
        const classData = gpaCalculatorData.classes.find(c => c.id === classId);
        if (classData && !gpaCalculatorData.selectedClasses.find(c => c.id === classId)) {
            gpaCalculatorData.selectedClasses.push(classData);
            renderClassList();
            adjustPopupSize();
        }
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Calculates all three GPA types
 */
function calculateGPAs() {
    try {
        // Get current GPAs from Focus
        gpaCalculatorData.currentGPAs = getCurrentGPAsFromFocus();
        
        // Calculate projected GPAs
        gpaCalculatorData.projectedGPAs = {
            unweighted: calculateUnweightedGPA(),
            weighted: calculateWeightedGPA(),
            core: calculateCoreGPA()
        };
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Gets current GPAs from Focus display
 */
function getCurrentGPAsFromFocus() {
    try {
        let unweighted = 0;
        let weighted = 0;
        let core = 0;
        
        // Method 1: Look for specific GPA labels in the summary boxes (most reliable)
        const summaryBoxes = document.querySelectorAll('.panel, .box, .summary, [class*="gpa"], [class*="summary"]');
        
        summaryBoxes.forEach(box => {
            const text = box.textContent.toUpperCase();
            
            // Look for "Cumulative GPA" followed by a number
            if (text.includes('CUMULATIVE GPA') && !text.includes('WEIGHTED')) {
                const gpaMatch = text.match(/CUMULATIVE GPA[:\s]*(\d+\.\d+)/i);
                if (gpaMatch) {
                    unweighted = parseFloat(gpaMatch[1]);
                }
            }
        });
        
        // Method 2: Look in table structure with specific row labels
        const tables = document.querySelectorAll('table, .table, .grid');
        tables.forEach(table => {
            const rows = table.querySelectorAll('tr, .row');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td, th, .cell');
                if (cells.length >= 2) {
                    const labelCell = cells[0];
                    const valueCell = cells[1];
                    
                    const label = labelCell.textContent.toUpperCase().trim();
                    const value = valueCell.textContent.trim();
                    
                    // Check for exact label matches
                    if (label === 'CUMULATIVE GPA' || label === 'UNWEIGHTED GPA') {
                        const gpaValue = parseFloat(value);
                        if (gpaValue > 0 && gpaValue <= 4.5) {
                            unweighted = gpaValue;
                        }
                    }
                    
                    if (label === 'CUMULATIVE WEIGHTED GPA' || label === 'WEIGHTED GPA') {
                        const gpaValue = parseFloat(value);
                        if (gpaValue > 0 && gpaValue <= 6.0) {
                            weighted = gpaValue;
                        }
                    }
                }
            });
        });
        
        // Core GPA extraction
        const coreGPAElements = document.querySelectorAll('.student-grades-field');
        coreGPAElements.forEach(element => {
            const titleDiv = element.querySelector('.title');
            const valueDiv = element.querySelector('.value');
            
            if (titleDiv && valueDiv && titleDiv.textContent.trim().toUpperCase() === 'CORE GPA') {
                const coreValue = parseFloat(valueDiv.textContent.trim());
                if (coreValue > 0 && coreValue <= 6.0) {
                    core = coreValue;
                }
            }
        });
        
        // Fallback: If no specific core GPA found, estimate from weighted
        if (core === 0) {
            core = weighted || unweighted;
        }
        
        // Final validation
        if (unweighted === 0 && weighted === 0) {
            return {
                unweighted: -1,
                weighted: -1, 
                core: -1,
                error: 'Could not find GPA values on this page. Make sure you are on a grades page that displays your cumulative GPA.'
            };
        }
        
        return {
            unweighted: unweighted || 0,
            weighted: weighted || 0,
            core: core || 0
        };
        
    } catch (error) {
        return { 
            unweighted: -1, 
            weighted: -1, 
            core: -1,
            error: error.message 
        };
    }
}

/**
 * Calculates unweighted GPA by adding to existing GPA
 */
function calculateUnweightedGPA() {
    try {
        let totalPoints = 0;
        let totalCredits = 0;
        
        gpaCalculatorData.selectedClasses.forEach(classData => {
            const gradePoints = getUnweightedPoints(classData.letterGrade);
            totalPoints += gradePoints * classData.credits;
            totalCredits += classData.credits;
        });
        
        const newSemesterGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;
        
        const existingGPA = gpaCalculatorData.currentGPAs.unweighted;
        const existingCredits = 20; // Estimate existing credits
        const newTotalCredits = existingCredits + totalCredits;
        
        const combinedGPA = ((existingGPA * existingCredits) + (newSemesterGPA * totalCredits)) / newTotalCredits;
        
        return Math.round(combinedGPA * 10000) / 10000;
        
    } catch (error) {
        return gpaCalculatorData.currentGPAs.unweighted;
    }
}

/**
 * Calculates weighted GPA by adding to existing GPA
 */
function calculateWeightedGPA() {
    try {
        let totalPoints = 0;
        let totalCredits = 0;
        
        gpaCalculatorData.selectedClasses.forEach(classData => {
            const gradePoints = getWeightedPoints(classData.letterGrade, classData.type);
            totalPoints += gradePoints * classData.credits;
            totalCredits += classData.credits;
        });
        
        const newSemesterGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;
        
        const existingGPA = gpaCalculatorData.currentGPAs.weighted;
        const existingCredits = 20; // Estimate existing credits
        const newTotalCredits = existingCredits + totalCredits;
        
        const combinedGPA = ((existingGPA * existingCredits) + (newSemesterGPA * totalCredits)) / newTotalCredits;
        
        return Math.round(combinedGPA * 10000) / 10000;
        
    } catch (error) {
        return gpaCalculatorData.currentGPAs.weighted;
    }
}

/**
 * Calculates core GPA by adding to existing GPA
 */
function calculateCoreGPA() {
    try {
        const coreClasses = gpaCalculatorData.selectedClasses.filter(c => c.isCore);
        
        if (coreClasses.length === 0) {
            return gpaCalculatorData.currentGPAs.core;
        }
        
        let totalPoints = 0;
        let totalCredits = 0;
        
        coreClasses.forEach(classData => {
            const gradePoints = getWeightedPoints(classData.letterGrade, classData.type);
            totalPoints += gradePoints * classData.credits;
            totalCredits += classData.credits;
        });
        
        const newSemesterGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;
        
        const existingGPA = gpaCalculatorData.currentGPAs.core;
        const existingCredits = 12; // Estimate existing core credits
        const newTotalCredits = existingCredits + totalCredits;
        
        const combinedGPA = ((existingGPA * existingCredits) + (newSemesterGPA * totalCredits)) / newTotalCredits;
        
        return Math.round(combinedGPA * 10000) / 10000;
        
    } catch (error) {
        return gpaCalculatorData.currentGPAs.core;
    }
}

/**
 * Gets unweighted grade points for a letter grade
 */
function getUnweightedPoints(letterGrade) {
    const points = {
        'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5, 'C': 2.0,
        'D+': 1.5, 'D': 1.0, 'F': 0.0
    };
    return points[letterGrade] || 0.0;
}

/**
 * Gets weighted grade points for a letter grade and course type
 */
function getWeightedPoints(letterGrade, courseType) {
    const basePoints = getUnweightedPoints(letterGrade);
    
    const bonusPoints = {
        'Regular': 0.0,
        'Honors': 1.0,
        'PreAP': 1.0,
        'PreAICE': 1.0, 
        'PreIB': 1.0,
        'AP': 2.0,
        'AICE': 2.0,
        'IB': 2.0,
        'DualEnrollment': 2.0
    };
    
    return basePoints + (bonusPoints[courseType] || 0.0);
}

/**
 * Renders results with accuracy disclaimer
 */
function renderResults() {
    try {
        const container = document.getElementById('fgs-gpa-results');
        if (!container) return;
        
        const current = gpaCalculatorData.currentGPAs;
        const projected = gpaCalculatorData.projectedGPAs;
        
        // Check if we have an error extracting GPAs
        if (current.error || current.unweighted === -1) {
            container.innerHTML = `
                <div class="fgs-gpa-error">
                    <h4 style="color: #ff6b6b; margin: 0 0 8px 0;">⚠️ GPA Not Found</h4>
                    <p style="color: white; font-size: 11px; margin: 0; line-height: 1.4;">
                        Could not locate your current GPA on this page. 
                        Try accessing this from your main grades page or report card.
                    </p>
                    <p style="color: rgba(255,255,255,0.8); font-size: 10px; margin: 8px 0 0 0;">
                        Error: ${current.error || 'GPA values not detected'}
                    </p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="fgs-gpa-result-item">
                <span class="fgs-gpa-result-label">Unweighted:</span>
                <span class="fgs-gpa-result-value">
                    ${current.unweighted.toFixed(3)} → ${projected.unweighted.toFixed(3)}
                    <span class="fgs-gpa-result-change ${projected.unweighted >= current.unweighted ? '' : 'negative'}">
                        (${projected.unweighted >= current.unweighted ? '+' : ''}${(projected.unweighted - current.unweighted).toFixed(3)})
                    </span>
                </span>
            </div>
            <div class="fgs-gpa-result-item">
                <span class="fgs-gpa-result-label">Weighted:</span>
                <span class="fgs-gpa-result-value">
                    ${current.weighted.toFixed(3)} → ${projected.weighted.toFixed(3)}
                    <span class="fgs-gpa-result-change ${projected.weighted >= current.weighted ? '' : 'negative'}">
                        (${projected.weighted >= current.weighted ? '+' : ''}${(projected.weighted - current.weighted).toFixed(3)})
                    </span>
                </span>
            </div>
            <div class="fgs-gpa-result-item">
                <span class="fgs-gpa-result-label">Core GPA:</span>
                <span class="fgs-gpa-result-value">
                    ${current.core.toFixed(3)} → ${projected.core.toFixed(3)}
                    <span class="fgs-gpa-result-change ${projected.core >= current.core ? '' : 'negative'}">
                        (${projected.core >= current.core ? '+' : ''}${(projected.core - current.core).toFixed(3)})
                    </span>
                </span>
            </div>
        `;
        
        // Update class count
        const classCountElement = document.getElementById('fgs-gpa-class-count');
        if (classCountElement) {
            classCountElement.textContent = `• ${gpaCalculatorData.selectedClasses.length} classes calculated`;
        }
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Adjusts popup size to accommodate content with smooth transitions
 */
function adjustPopupSize() {
    try {
        const popup = document.getElementById('focus-grade-simulator-popup');
        if (!popup) return;
        
        // Remove existing size classes
        popup.classList.remove('size-small', 'size-medium', 'size-large', 'size-xlarge');
        
        // Determine content complexity
        const selectedClasses = gpaCalculatorData.selectedClasses.length;
        const longestClassName = gpaCalculatorData.selectedClasses.reduce((longest, current) => {
            return current.name.length > longest.length ? current.name : longest;
        }, '').length;
        
        // Get screen dimensions
        const screenWidth = window.innerWidth;
        const isMobile = screenWidth <= 480;
        const isTablet = screenWidth <= 768;
        
        // Determine appropriate size
        let sizeClass = 'size-small'; // Default
        
        if (isMobile) {
            sizeClass = 'size-medium';
        } else if (isTablet) {
            if (longestClassName > 25 || selectedClasses > 6) {
                sizeClass = 'size-large';
            } else {
                sizeClass = 'size-medium';
            }
        } else {
            if (longestClassName > 35 || selectedClasses > 8) {
                sizeClass = 'size-xlarge';
            } else if (longestClassName > 25 || selectedClasses > 6) {
                sizeClass = 'size-large';
            } else if (longestClassName > 15 || selectedClasses > 4) {
                sizeClass = 'size-medium';
            } else {
                sizeClass = 'size-small';
            }
        }
        
        // Apply size class with transition
        popup.classList.add(sizeClass);
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Sets popup size for specific interface (with transitions)
 */
function setPopupSizeForInterface(interfaceType) {
    try {
        const popup = document.getElementById('focus-grade-simulator-popup');
        if (!popup) return;
        
        // Remove existing size classes
        popup.classList.remove('size-small', 'size-medium', 'size-large', 'size-xlarge');
        
        const screenWidth = window.innerWidth;
        const isMobile = screenWidth <= 480;
        const isTablet = screenWidth <= 768;
        
        let sizeClass = 'size-small';
        
        switch (interfaceType) {
            case 'mode-selection':
                sizeClass = isMobile ? 'size-medium' : 'size-small';
                break;
            case 'grade-calculator':
                sizeClass = isMobile ? 'size-medium' : (isTablet ? 'size-medium' : 'size-small');
                break;
            case 'gpa-calculator':
                if (isMobile) {
                    sizeClass = 'size-medium';
                } else if (isTablet) {
                    sizeClass = 'size-large';
                } else {
                    sizeClass = 'size-medium';
                }
                break;
            case 'gpa-results':
                sizeClass = isMobile ? 'size-medium' : (isTablet ? 'size-large' : 'size-medium');
                break;
            case 'settings':
                sizeClass = isMobile ? 'size-medium' : 'size-small';
                break;
        }
        
        // Apply with transition
        popup.classList.add(sizeClass);
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Returns to mode selection from GPA calculator
 */
function returnToModeSelectionFromGPA() {
    try {
        const modeSelection = document.getElementById('fgs-mode-selection');
        const gpaCalculator = document.getElementById('fgs-gpa-calculator');
        
        if (modeSelection) modeSelection.style.display = 'flex';
        if (gpaCalculator) gpaCalculator.style.display = 'none';
        
        // Reset popup size
        const popup = document.getElementById('focus-grade-simulator-popup');
        if (popup) popup.style.width = '320px';
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Sets up GPA calculator event listeners
 */
function setupGPACalculatorEvents() {
    try {
        // GPA Calculator launch button
        const gpaButton = document.getElementById('fgs-mode-gpa');
        if (gpaButton) {
            gpaButton.addEventListener('click', launchGPACalculator);
        }
        
        // Back buttons
        const backButton = document.getElementById('fgs-gpa-back');
        if (backButton) {
            backButton.addEventListener('click', returnToModeSelectionFromGPA);
        }
        
        const backToClassesButton = document.getElementById('fgs-gpa-back-to-classes');
        if (backToClassesButton) {
            backToClassesButton.addEventListener('click', () => showGPAStep(1));
        }
        
        // Calculate button
        const calculateButton = document.getElementById('fgs-gpa-calculate');
        if (calculateButton) {
            calculateButton.addEventListener('click', () => showGPAStep(2));
        }
        
        // Help buttons
        const helpButton = document.getElementById('fgs-gpa-help');
        if (helpButton) {
            helpButton.addEventListener('click', () => {
                if (typeof showHelp === 'function') {
                    showHelp();
                } else if (typeof window.showHelp === 'function') {
                    window.showHelp();
                }
            });
        }
        
        const helpResultsButton = document.getElementById('fgs-gpa-help-results');
        if (helpResultsButton) {
            helpResultsButton.addEventListener('click', () => {
                if (typeof showHelp === 'function') {
                    showHelp();
                } else if (typeof window.showHelp === 'function') {
                    window.showHelp();
                }
            });
        }
        
    } catch (error) {
        // Silent error handling for production
    }
}

// Make functions globally accessible
window.launchGPACalculator = launchGPACalculator;
window.setupGPACalculatorEvents = setupGPACalculatorEvents;