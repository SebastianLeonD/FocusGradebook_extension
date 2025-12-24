/**
 * CONTENT-GPA-CALCULATOR.JS  
 * PRODUCTION VERSION: Removed console logs and debug statements
 * IMPROVED UI VERSION: Better spacing and visual hierarchy
 */

// ===========================================
// GPA CALCULATOR STATE VARIABLES
// ===========================================
function createEmptyProjectedGPAs() {
    return {
        unweighted: null,
        weighted: null,
        core: null,
        cumulativeProjected: null,
        cumulativeDelta: null,
        weightedProjected: null,
        weightedDelta: null,
        addedCredits: 0,
        addedUnweightedQualityPoints: 0,
        addedWeightedQualityPoints: 0,
        baseline: null,
        includedCount: 0,
        skippedCount: 0,
        classResults: [],
        missingClasses: [],
        warnings: []
    };
}

let gpaCalculatorData = {
    classes: [],
    selectedClasses: [],
    baselineStats: null,
    projectedGPAs: createEmptyProjectedGPAs(),
    currentStep: 1
};

const BCPS_GRADE_OPTIONS = ['', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
const BCPS_EXAM_SPECIAL_OPTIONS = ['EX']; // Exam exemptions (EX)
const BCPS_PASSING_GRADES = new Set(['A', 'B+', 'B', 'C+', 'C', 'D+', 'D']);
const BCPS_WEIGHT_ELIGIBLE_GRADES = new Set(['A', 'B+', 'B', 'C+', 'C']);
const COURSE_TYPE_OPTIONS = [
    { value: 'auto', label: 'Auto Detect' },
    { value: 'AP', label: 'AP' },
    { value: 'AICE', label: 'AICE' },
    { value: 'IB', label: 'IB' },
    { value: 'DualEnrollment', label: 'Dual Enrollment' },
    { value: 'Honors', label: 'Honors' },
    { value: 'PreAP', label: 'Pre-AP' },
    { value: 'PreAICE', label: 'Pre-AICE' },
    { value: 'PreIB', label: 'Pre-IB' },
    { value: 'Gifted', label: 'Gifted' },
    { value: 'Regular', label: 'Regular' }
];
const GPA_SELECT_MISSING_CLASS = 'fgs-gpa-select-missing';

const BCPS_QUARTER_POINTS = {
    'A': 12.0, 'B+': 9.3, 'B': 9.0, 'C+': 6.3, 'C': 6.0,
    'D+': 3.3, 'D': 3.0, 'F': 0
};

const BCPS_EXAM_POINTS = {
    'A': 8.0, 'B+': 6.2, 'B': 6.0, 'C+': 4.2, 'C': 4.0,
    'D+': 2.2, 'D': 2.0, 'F': 0
};

const BCPS_SEMESTER_CUTOFFS = [
    { min: 28.0, letter: 'A' },
    { min: 24.5, letter: 'B+' },
    { min: 20.0, letter: 'B' },
    { min: 16.5, letter: 'C+' },
    { min: 12.0, letter: 'C' },
    { min: 8.5,  letter: 'D+' },
    { min: 5.0,  letter: 'D' },
    { min: -Infinity, letter: 'F' }
];

const HONORS_KEYWORDS = new Set(['HONORS', 'HONOR', 'HON', 'HNR', 'HNRS', 'HONS']);

function markGradeSelectState(classId, field, isMissing) {
    if (typeof document === 'undefined') return;
    const select = document.querySelector(`.fgs-gpa-grade-select[data-class-id="${classId}"][data-field="${field}"]`);
    if (!select) return;
    select.classList.toggle(GPA_SELECT_MISSING_CLASS, !!isMissing);
    if (isMissing) {
        select.setAttribute('aria-invalid', 'true');
    } else {
        select.removeAttribute('aria-invalid');
    }
}

function isFocusStudentGradesURL() {
    if (typeof window === 'undefined') return false;
    try {
        return /modname=Grades\/StudentRCGrades\.php/i.test(window.location.href);
    } catch (error) {
        return false;
    }
}

function normalizeBCPSLetter(letter) {
    if (!letter) return '';
    const normalized = letter.trim().toUpperCase();
    if (normalized.startsWith('EX')) return 'EX';
    if (BCPS_GRADE_OPTIONS.includes(normalized)) return normalized;
    if (normalized.startsWith('A')) return 'A';
    if (normalized.startsWith('B')) return normalized.includes('+') ? 'B+' : 'B';
    if (normalized.startsWith('C')) return normalized.includes('+') ? 'C+' : 'C';
    if (normalized.startsWith('D')) return normalized.includes('+') ? 'D+' : 'D';
    return 'F';
}

function bcpsSemesterAnalysis({ q1, q2, exam }) {
    const q1Letter = normalizeBCPSLetter(q1);
    const q2Letter = normalizeBCPSLetter(q2);
    const examLetterRaw = normalizeBCPSLetter(exam);
    const examIsExempt = examLetterRaw === 'EX';
    const examLetter = examIsExempt ? '' : examLetterRaw;
    
    if (!q1Letter || !q2Letter || (!examLetter && !examIsExempt)) {
        return null;
    }
    
    let totalPoints;
    let passesTwoOfThree;
    
    if (examIsExempt) {
        const q1Points = BCPS_QUARTER_POINTS[q1Letter] || 0;
        const q2Points = BCPS_QUARTER_POINTS[q2Letter] || 0;
        const combinedQuarterPoints = q1Points + q2Points;
        // Scale combined quarter points to the standard 32-point semester scale (37.5 + 37.5 -> 25 redistributed)
        totalPoints = combinedQuarterPoints * (32 / 24);
        passesTwoOfThree = BCPS_PASSING_GRADES.has(q1Letter) && BCPS_PASSING_GRADES.has(q2Letter);
    } else {
        totalPoints =
            (BCPS_QUARTER_POINTS[q1Letter] || 0) +
            (BCPS_QUARTER_POINTS[q2Letter] || 0) +
            (BCPS_EXAM_POINTS[examLetter] || 0);
        const passQ1 = BCPS_PASSING_GRADES.has(q1Letter);
        const passQ2 = BCPS_PASSING_GRADES.has(q2Letter);
        const passExam = BCPS_PASSING_GRADES.has(examLetter);
        passesTwoOfThree = (passQ1 && passQ2) || (passQ1 && passExam) || (passQ2 && passExam);
    }
    
    let semesterLetter = 'F';
    for (const cutoff of BCPS_SEMESTER_CUTOFFS) {
        if (totalPoints >= cutoff.min) {
            semesterLetter = cutoff.letter;
            break;
        }
    }
    
    const semesterLetterAdjusted = passesTwoOfThree ? semesterLetter : 'F';
    
    return {
        semesterLetter: semesterLetterAdjusted,
        totalPoints,
        passesTwoOfThree,
        q1: q1Letter,
        q2: q2Letter,
        exam: examIsExempt ? 'EX' : examLetter
    };
}

function parseNumberFromText(text) {
    if (!text) return null;
    const cleaned = text.replace(/[^0-9.\-]/g, '');
    if (!cleaned) return null;
    const value = parseFloat(cleaned);
    return Number.isNaN(value) ? null : value;
}

let baselineExtractAttempts = 0;
const MAX_BASELINE_ATTEMPTS = 8;

function extractBaselineGPAStats(forceRetry = true) {
    try {
        if (typeof document === 'undefined') {
            return;
        }
        if (!isFocusStudentGradesURL()) {
            return;
        }
        console.log('[FGS GPA] Extracting baseline GPA stats...');
        const selectors = {
            cumulativeGPAText: '.gpa_stats_table td[data-test="cumulative-gpa-cell-value"]',
            weightedGPAText: '.gpa_stats_table td[data-test="cumulative-weighted-gpa-cell-value"]',
            creditsEarnedText: '.gpa_stats_table td[data-test="total-credits-earned-cell-value"]',
            creditsAttemptedText: '.gpa_stats_table td[data-test="total-credits-attempted-cell-value"]',
            qualityPointsText: '.gpa_stats_table td[data-test="quality-points-cell-value"]',
            asOfText: '.gpa_stats_table td[data-test="as-of-cell-value"]'
        };
        
        const missingSelectors = Object.entries(selectors)
            .filter(([_, selector]) => !document.querySelector(selector))
            .map(([key, selector]) => ({ key, selector }));
        
        if (missingSelectors.length > 0) {
            if (baselineExtractAttempts < MAX_BASELINE_ATTEMPTS && forceRetry) {
                baselineExtractAttempts += 1;
                console.warn('[FGS GPA] Baseline selectors missing, retrying... attempt', baselineExtractAttempts, missingSelectors);
                setTimeout(() => extractBaselineGPAStats(true), 200);
                return;
            }
            console.warn('[FGS GPA] Baseline selectors still missing after retries:', missingSelectors);
        }
        
        const getCellValue = (selector) => {
            const cell = document.querySelector(selector);
            if (!cell) {
                console.warn('[FGS GPA] Missing selector', selector);
                return null;
            }
            const text = cell.textContent.trim();
            console.log('[FGS GPA] selector', selector, text);
            return text;
        };
        
        const cumulativeGPAText = getCellValue('.gpa_stats_table td[data-test="cumulative-gpa-cell-value"]');
        const weightedGPAText = getCellValue('.gpa_stats_table td[data-test="cumulative-weighted-gpa-cell-value"]');
        const creditsEarnedText = getCellValue('.gpa_stats_table td[data-test="total-credits-earned-cell-value"]');
        const creditsAttemptedText = getCellValue('.gpa_stats_table td[data-test="total-credits-attempted-cell-value"]');
        const qualityPointsText = getCellValue('.gpa_stats_table td[data-test="quality-points-cell-value"]');
        const asOfText = getCellValue('.gpa_stats_table td[data-test="as-of-cell-value"]');
        
        const cumulativeGPA = parseNumberFromText(cumulativeGPAText);
        const weightedGPA = parseNumberFromText(weightedGPAText);
        const totalCreditsEarned = parseNumberFromText(creditsEarnedText);
        const totalCreditsAttempted = parseNumberFromText(creditsAttemptedText);
        const qualityPointsRaw = parseNumberFromText(qualityPointsText);
        const qualityPoints = qualityPointsRaw ??
            (cumulativeGPA !== null && totalCreditsAttempted !== null ? cumulativeGPA * totalCreditsAttempted : null);
        const asOf = asOfText || null;
        
        const coreField = Array.from(document.querySelectorAll('.student-grades-field')).find((field) => {
            const title = field.querySelector('.title');
            return title && title.textContent.trim().toLowerCase().includes('core gpa');
        });
        const coreValueText = coreField ? coreField.querySelector('.value')?.textContent : null;
        const coreGPA = coreValueText ? parseNumberFromText(coreValueText) : null;
        console.log('[FGS GPA] core GPA raw value:', coreValueText);
        
        if (cumulativeGPA === null && weightedGPA === null && totalCreditsAttempted === null && qualityPoints === null && coreGPA === null) {
            gpaCalculatorData.baselineStats = null;
            console.warn('[FGS GPA] Baseline GPA stats not detected.');
            return;
        }
        
        gpaCalculatorData.baselineStats = {
            cumulativeGPA,
            weightedGPA,
            totalCreditsEarned,
            totalCreditsAttempted,
            qualityPoints,
            coreGPA,
            asOf
        };
        
        console.log('[FGS GPA] Baseline stats stored:', gpaCalculatorData.baselineStats);
        window.__FGS_BASELINE = gpaCalculatorData.baselineStats;
        baselineExtractAttempts = 0;
        
    } catch (error) {
        gpaCalculatorData.baselineStats = null;
        console.error('[FGS GPA] Error extracting baseline stats:', error);
    }
}

// Kick off an initial baseline scrape shortly after the content script loads
if (typeof document !== 'undefined' && isFocusStudentGradesURL()) {
    setTimeout(() => extractBaselineGPAStats(true), 150);
}

// ===========================================
// COURSE TYPE DETECTION
// ===========================================

function detectCourseType(courseName) {
    if (!courseName || typeof courseName !== 'string') {
        return 'Regular';
    }

    const name = courseName.toUpperCase();
    const tokens = name
        .replace(/[^A-Z0-9]+/g, ' ')
        .split(/\s+/)
        .filter(Boolean);

    // AP Courses
    if (name.includes('AP ') || name.includes('ADVANCED PLACEMENT')) {
        return 'AP';
    }
    
    // AICE Courses
    if (name.includes('AICE ')) {
        return 'AICE';
    }
    
    // IB Courses
    if (name.includes('IB ') || name.includes('INTERNATIONAL BACCALAUREATE')) {
        return 'IB';
    }
    
    // Dual Enrollment
    if (name.includes('DUAL ENROLLMENT') || name.includes(' DE ') || name.includes('(DE)')) {
        return 'DualEnrollment';
    }
    
    // Pre-AP/Pre-AICE/Pre-IB
    if (name.includes('PRE-AP') || name.includes('PRE AP')) {
        return 'PreAP';
    }
    if (name.includes('PRE-AICE') || name.includes('PRE AICE')) {
        return 'PreAICE';
    }
    if (name.includes('PRE-IB') || name.includes('PRE IB')) {
        return 'PreIB';
    }
    
    // Honors
    if (tokens.some(token => HONORS_KEYWORDS.has(token))) {
        return 'Honors';
    }
    
    // Gifted
    if (name.includes('GIFTED')) {
        return 'Gifted';
    }
    
    return 'Regular';
}

function isCoreSubject(courseName) {
    const name = courseName.toUpperCase();
    
    // English
    if (name.includes('ENGLISH') || name.includes('LANGUAGE ARTS') || name.includes('ELA ') || 
        name.includes('READING') || name.includes('LITERATURE')) {
        return true;
    }
    
    // Math
    if (name.includes('MATH') || name.includes('ALGEBRA') || name.includes('GEOMETRY') || 
        name.includes('CALCULUS') || name.includes('STATISTICS') || name.includes('TRIGONOMETRY')) {
        return true;
    }
    
    // Science
    if (name.includes('SCIENCE') || name.includes('BIOLOGY') || name.includes('CHEMISTRY') || 
        name.includes('PHYSICS') || name.includes('ENVIRONMENTAL') || name.includes('ANATOMY')) {
        return true;
    }
    
    // Social Studies
    if (name.includes('HISTORY') || name.includes('GOVERNMENT') || name.includes('ECONOMICS') || 
        name.includes('GEOGRAPHY') || name.includes('CIVICS') || name.includes('PSYCHOLOGY') ||
        name.includes('SOCIAL STUDIES') || name.includes('WORLD') || name.includes('AMERICAN')) {
        return true;
    }
    
    // Foreign Language
    if (name.includes('SPANISH') || name.includes('FRENCH') || name.includes('GERMAN') || 
        name.includes('CHINESE') || name.includes('JAPANESE') || name.includes('LATIN') ||
        name.includes('ITALIAN') || name.includes('PORTUGUESE') || name.includes('ARABIC') ||
        name.includes('HEBREW') || name.includes('RUSSIAN') || name.includes('KOREAN') ||
        name.includes('LANGUAGE') && !name.includes('ENGLISH')) {
        return true;
    }
    
    return false;
}

function isEOCCourse(courseName) {
    const name = courseName.toUpperCase();
    const eocKeywords = [
        'ALGEBRA 1',
        'ALGEBRA I',
        'GEOMETRY',
        'BIOLOGY',
        'BIOLOGY 1',
        'US HISTORY',
        'UNITED STATES HISTORY',
        'CIVICS'
    ];
    return eocKeywords.some(keyword => name.includes(keyword));
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
        'Gifted': 'Gifted',
        'Regular': 'Reg'
    };
    return labels[type] || 'Reg';
}

/**
 * Extracts normalized BCPS letter grade from a gradebook cell
 */
function extractLetterFromGradeCell(cell) {
    if (!cell) return '';
    const text = cell.textContent.trim().toUpperCase();
    if (!text || text === 'NG' || text === '--') return '';
    if (text === 'EX' || text.includes('EXEMPT')) return 'EX';
    const match = text.match(/([A-F](?:\+)?)(?!.*[A-F])/);
    if (!match) return '';
    return normalizeBCPSLetter(match[1]);
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
        gpaCalculatorData.projectedGPAs = createEmptyProjectedGPAs();
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
        if (settingsDropdown) settingsDropdown.style.display = 'none';
        
        if (!gpaCalculator) {
            alert('GPA Calculator interface not found. Please refresh and try again.');
            return;
        }
        
        gpaCalculator.style.display = 'block';
        
        // Extract and process classes
        extractBaselineGPAStats(true);
        extractClassData();
        autoSelectClasses();
        
        // Show step 1
        showGPAStep(1);
        
    } catch (error) {
        alert('Error launching GPA Calculator. Please refresh the page and try again.');
    }
}

/**
 * Checks if on a Focus grades page
 */
function isOnGradesPage() {
    try {
        const url = window.location.href.toLowerCase();
        const hasGradesKeyword = url.includes('grades') || url.includes('grade');
        const notGradebookDetail = !url.includes('assignment');
        const hasGradeRows = document.querySelectorAll('.student-grade').length > 0;
        const isTarget = isFocusStudentGradesURL();
        
        return isTarget || ((hasGradesKeyword && notGradebookDetail) || hasGradeRows);
    } catch (error) {
        return false;
    }
}

/**
 * Shows warning when not on grades page
 */
function showGradesPageWarning() {
    try {
        const popup = document.getElementById('focus-grade-simulator-popup');
        if (!popup) return;
        
        popup.innerHTML = `
            <div class="fgs-header">
                <h3>Grade Calculator</h3>
                <button class="fgs-close" id="fgs-close">×</button>
            </div>
            <div class="fgs-warning">
                <h4>⚠️ Wrong Page</h4>
                <p style="color: white; margin: 10px 0;">To use the GPA Calculator, please navigate to your main grades page in Focus first.</p>
                <p style="color: rgba(255, 255, 255, 0.7); font-size: 11px; margin: 10px 0;">Look for "Grades" in the menu or go to your overall grades view.</p>
                <button id="fgs-back-from-warning" class="fgs-mode-btn" style="width: 100%; margin-top: 10px;">← Back</button>
            </div>
        `;
        
        document.getElementById('fgs-back-from-warning').addEventListener('click', () => {
            location.reload();
        });
        
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
                if (!yearCell || !courseCell) return;
                
                const year = yearCell.textContent.trim();
                const courseName = courseCell.textContent.trim();
                if (year !== currentYear) return;
                if (courseName.toUpperCase().includes('STUDY HALL')) return;
                
                const q1Cell = row.querySelector('[data-field="mp_q1"] a') || row.querySelector('[data-field="mp_q1"]');
                const q2Cell = row.querySelector('[data-field="mp_q2"] a') || row.querySelector('[data-field="mp_q2"]');
                // Try multiple selectors for exam cell (mp_exam, mp_exam1, S1 Exam, etc.)
                const examCell = row.querySelector('[data-field="mp_exam"] a, [data-field="mp_exam1"] a, [data-field="mp_exm"] a, [data-field="mp_ex"] a, [data-field="mp_s1_exam"] a')
                    || row.querySelector('[data-field="mp_exam"], [data-field="mp_exam1"], [data-field="mp_exm"], [data-field="mp_ex"], [data-field="mp_s1_exam"]')
                    || row.querySelector('[title*="S1 Exam"], [title*="Exam Grade"]')
                    || Array.from(row.querySelectorAll('td')).find(cell => {
                        const title = cell.getAttribute('title') || '';
                        const text = cell.textContent.trim();
                        return (title.includes('S1 Exam') || title.includes('Exam Grade')) && text && text !== 'NG' && text !== '--';
                    });
                const q1Letter = extractLetterFromGradeCell(q1Cell);
                const q2Letter = extractLetterFromGradeCell(q2Cell);
                const examLetter = extractLetterFromGradeCell(examCell);
                
                if (!q1Letter && !q2Letter && !examLetter) {
                    return;
                }
                
                const courseType = detectCourseType(courseName);
                const isCore = isCoreSubject(courseName);
                const isEOC = isEOCCourse(courseName);
                const displayGrade = q1Cell?.textContent.trim() || q2Cell?.textContent.trim() || examCell?.textContent.trim() || '—';
                
                const classData = {
                    id: `class_${index}`,
                    name: courseName,
                    baseType: courseType,
                    type: courseType,
                    manualType: null,
                    typeEditorOpen: false,
                    isCore,
                    credits: 1.0,
                    isEOC,
                    grade: displayGrade,
                    quarters: {
                        q1: q1Letter,
                        q2: q2Letter,
                        exam: examLetter
                    },
                    sourceTexts: {
                        q1: q1Cell?.textContent.trim() || '',
                        q2: q2Cell?.textContent.trim() || '',
                        exam: examCell?.textContent.trim() || ''
                    },
                    semester: {
                        letter: '',
                        totalPoints: 0,
                        passesTwoOfThree: false
                    }
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
            gpaCalculatorData.projectedGPAs = createEmptyProjectedGPAs();
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
 * IMPROVED: Renders the class list with better UI - improved spacing and visual hierarchy
 */
function renderClassList() {
    try {
        const container = document.getElementById('fgs-gpa-class-list');
        const noClassesInstruction = document.getElementById('fgs-gpa-no-classes');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        const hasClasses = gpaCalculatorData.selectedClasses.length > 0;
        if (noClassesInstruction) {
            noClassesInstruction.style.display = hasClasses ? 'none' : 'block';
        }
        
        gpaCalculatorData.selectedClasses.forEach((classData) => {
            const classItem = document.createElement('div');
            classItem.className = 'fgs-gpa-class-item';
            
            const typeLabel = getTypeLabel(classData.type);
            const coreBadge = classData.isCore ? `<span class="fgs-gpa-core-tag">Core</span>` : '';
            const eocBadge = classData.isEOC ? `<span class="fgs-gpa-eoc-tag" title="State End-of-Course weighting">EOC</span>` : '';
            
            // IMPROVED: Better structured grade selectors with cleaner labels
            const gradeSelectors = ['q1', 'q2', 'exam'].map((field) => {
                const labelMap = { q1: 'Q1', q2: 'Q2', exam: 'Exam' };
                const optionPool = field === 'exam'
                    ? [...BCPS_GRADE_OPTIONS, ...BCPS_EXAM_SPECIAL_OPTIONS]
                    : BCPS_GRADE_OPTIONS;
                const options = optionPool.map(option => {
                    const display = option === '' ? '--' : (option === 'EX' ? 'Exempt' : option);
                    return `<option value="${option}">${display}</option>`;
                }).join('');
                const hintText = classData.sourceTexts?.[field];
                const hintDisplay = hintText && hintText.length ? hintText : '--';
                
                return `
                    <div class="fgs-gpa-grade-box">
                        <label class="fgs-gpa-grade-label">${labelMap[field]}</label>
                        <select class="fgs-gpa-grade-select" data-class-id="${classData.id}" data-field="${field}">
                            ${options}
                        </select>
                        <span class="fgs-gpa-grade-hint">${hintDisplay}</span>
                    </div>
                `;
            }).join('');
            
            // IMPROVED: Better organized class card structure
            const typeOptions = COURSE_TYPE_OPTIONS.map(opt => `<option value="${opt.value}" ${opt.value === (classData.manualType || 'auto') ? 'selected' : ''}>${opt.label}</option>`).join('');
            classItem.innerHTML = `
                <div class="fgs-gpa-class-card">
                    <div class="fgs-gpa-class-header">
                        <div class="fgs-gpa-class-title">
                            <div class="fgs-gpa-class-name" title="${classData.name}">${classData.name}</div>
                            <div class="fgs-gpa-class-badges">
                                <span class="fgs-gpa-class-type ${classData.type.toLowerCase()}${classData.manualType ? ' manual' : ''}">${typeLabel}</span>
                                ${coreBadge}
                                ${eocBadge}
                                <button class="fgs-gpa-edit-type" data-class-id="${classData.id}" title="Set course type">＋</button>
                            </div>
                            <div class="fgs-gpa-type-editor" data-class-id="${classData.id}" style="display: ${classData.typeEditorOpen ? 'flex' : 'none'};">
                                <select class="fgs-gpa-type-select" data-class-id="${classData.id}">${typeOptions}</select>
                            </div>
                        </div>
                        <button class="fgs-gpa-class-remove" data-class-id="${classData.id}" title="Remove class">×</button>
                    </div>
                    <div class="fgs-gpa-grade-row">
                        ${gradeSelectors}
                    </div>
                    <div class="fgs-gpa-semester-result" data-preview-for="${classData.id}">
                        <span class="fgs-gpa-semester-label">Semester Grade:</span>
                        <span class="fgs-gpa-semester-value">--</span>
                    </div>
                </div>
            `;
            
            container.appendChild(classItem);
            
            // Update event listeners to work with new structure
            classItem.querySelectorAll('.fgs-gpa-grade-select').forEach(select => {
                const field = select.getAttribute('data-field');
                const storedValue = classData.quarters[field] || '';
                select.value = storedValue;
                markGradeSelectState(classData.id, field, !storedValue);
                
                select.addEventListener('change', (e) => {
                    const rawValue = e.target.value;
                    classData.quarters[field] = rawValue ? normalizeBCPSLetter(rawValue) : '';
                    if (classData.quarters[field] !== rawValue) {
                        e.target.value = classData.quarters[field];
                    }
                    markGradeSelectState(classData.id, field, !classData.quarters[field]);
                    updateClassSemesterPreview(classData, classItem);
                });
            });
            
            const typeToggle = classItem.querySelector('.fgs-gpa-edit-type');
            const typeEditor = classItem.querySelector('.fgs-gpa-type-editor');
            const typeSelect = classItem.querySelector('.fgs-gpa-type-select');
            if (typeEditor) {
                typeEditor.style.display = classData.typeEditorOpen ? 'flex' : 'none';
            }
            if (typeToggle) {
                typeToggle.addEventListener('click', () => {
                    classData.typeEditorOpen = !classData.typeEditorOpen;
                    renderClassList();
                });
            }
            if (typeSelect) {
                typeSelect.value = classData.manualType || 'auto';
                typeSelect.addEventListener('change', (e) => {
                    applyManualCourseType(classData, e.target.value);
                    classData.typeEditorOpen = false;
                    renderClassList();
                    if (gpaCalculatorData.currentStep === 2) {
                        calculateGPAs();
                        renderResults();
                    }
                });
            }
            
            const removeButton = classItem.querySelector('.fgs-gpa-class-remove');
            if (removeButton) {
                removeButton.addEventListener('click', () => removeClass(classData.id));
            }
            
            updateClassSemesterPreview(classData, classItem);
        });
        
        updateAddClassDropdown();
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * IMPROVED: Updates the semester preview with better formatting
 */
function updateClassSemesterPreview(classData, classElement) {
    try {
        const previewSpan = classElement.querySelector('.fgs-gpa-semester-value');
        if (!previewSpan) return;
        
        const quarters = {
            q1: classData.quarters.q1,
            q2: classData.quarters.q2,
            exam: classData.quarters.exam
        };
        const analysis = bcpsSemesterAnalysis(quarters);
        
        if (!analysis) {
            previewSpan.textContent = 'Enter all grades';
            previewSpan.classList.remove('fgs-gpa-semester-pass', 'fgs-gpa-semester-fail');
            classData.semester = {
                letter: '',
                totalPoints: 0,
                passesTwoOfThree: false
            };
            return;
        }
        
        classData.quarters.q1 = analysis.q1;
        classData.quarters.q2 = analysis.q2;
        classData.quarters.exam = analysis.exam;
        
        // Update selects with normalized values
        ['q1', 'q2', 'exam'].forEach((field) => {
            const select = classElement.querySelector(`.fgs-gpa-grade-select[data-field="${field}"]`);
            if (select && select.value !== classData.quarters[field]) {
                select.value = classData.quarters[field];
            }
        });
        
        classData.semester = {
            letter: analysis.semesterLetter,
            totalPoints: analysis.totalPoints,
            passesTwoOfThree: analysis.passesTwoOfThree
        };
        
        previewSpan.textContent = `${analysis.semesterLetter} (${analysis.totalPoints.toFixed(1)} pts)${analysis.passesTwoOfThree ? '' : ' - Fails 2/3'}`;
        previewSpan.classList.remove('fgs-gpa-semester-pass', 'fgs-gpa-semester-fail');
        
        if (analysis.passesTwoOfThree && analysis.semesterLetter !== 'F') {
            previewSpan.classList.add('fgs-gpa-semester-pass');
        } else {
            previewSpan.classList.add('fgs-gpa-semester-fail');
        }
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Updates the add class dropdown
 */
function updateAddClassDropdown() {
    try {
        const dropdown = document.getElementById('fgs-gpa-add-class');
        if (!dropdown) return;
        
        dropdown.innerHTML = '<option value="">+ Add another class...</option>';
        dropdown.onchange = (event) => {
            const selectedId = event.target.value;
            if (selectedId) {
                addClass(selectedId);
                event.target.value = '';
            }
        };
        
        const selectedIds = new Set(gpaCalculatorData.selectedClasses.map(c => c.id));
        const availableClasses = gpaCalculatorData.classes.filter(c => !selectedIds.has(c.id));
        
        availableClasses.forEach(classData => {
            const option = document.createElement('option');
            option.value = classData.id;
            option.textContent = classData.name;
            dropdown.appendChild(option);
        });
        
        dropdown.style.display = availableClasses.length > 0 ? 'block' : 'none';
        
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
        console.log('[FGS GPA] calculateGPAs start. Selected classes:', gpaCalculatorData.selectedClasses.length);
        const classResults = [];
        const missingClasses = [];
        const warnings = [];
        const eocClasses = [];
        
        let totalCredits = 0;
        let totalUnweightedPoints = 0;
        let totalWeightedPoints = 0;
        let coreCredits = 0;
        let totalCorePoints = 0;
        
        gpaCalculatorData.selectedClasses.forEach((classData) => {
            if (classData.isEOC) {
                eocClasses.push(classData.name);
            }
            
            const analysis = bcpsSemesterAnalysis(classData.quarters);
            
            if (!analysis) {
                classData.semester = {
                    letter: '',
                    totalPoints: 0,
                    passesTwoOfThree: false
                };
                missingClasses.push(classData.name);
                return;
            }
            
            classData.semester = {
                letter: analysis.semesterLetter,
                totalPoints: analysis.totalPoints,
                passesTwoOfThree: analysis.passesTwoOfThree
            };
            
            const credits = classData.credits || 1;
            const basePoints = getUnweightedPoints(analysis.semesterLetter);
            const weightedPoints = getWeightedPoints(analysis.semesterLetter, classData.type);
            
            totalCredits += credits;
            totalUnweightedPoints += basePoints * credits;
            totalWeightedPoints += weightedPoints * credits;
            
            if (classData.isCore) {
                coreCredits += credits;
                totalCorePoints += weightedPoints * credits;
            }
            
            classResults.push({
                id: classData.id,
                name: classData.name,
                semesterLetter: analysis.semesterLetter,
                totalPoints: analysis.totalPoints,
                passesTwoOfThree: analysis.passesTwoOfThree,
                quarters: {
                    q1: analysis.q1,
                    q2: analysis.q2,
                    exam: analysis.exam
                },
                type: classData.type,
                isCore: classData.isCore
            });
        });
        
        if (missingClasses.length > 0) {
            warnings.push(`Missing quarter/exam grades for ${missingClasses.length} class${missingClasses.length === 1 ? '' : 'es'}: ${missingClasses.join(', ')}.`);
        }
        
        if (eocClasses.length > 0) {
            warnings.push(`EOC weighting (15/15/10/15/15/30) applies to: ${eocClasses.join(', ')}. This tool currently uses the standard 37.5/37.5/25 formula—verify these grades manually.`);
        }

        const baseline = gpaCalculatorData.baselineStats;
        console.log('[FGS GPA] Baseline stats available?', baseline);
        let cumulativeProjected = null;
        let cumulativeDelta = null;
        let weightedProjected = null;
        let weightedDelta = null;
        const addedCredits = totalCredits;
        const addedUnweightedQualityPoints = totalUnweightedPoints;
        const addedWeightedQualityPoints = totalWeightedPoints;
        
        if (baseline && addedCredits > 0) {
            const baseCredits = baseline.totalCreditsAttempted ?? baseline.totalCreditsEarned ?? null;
            const baseQuality = baseline.qualityPoints ??
                (baseline.cumulativeGPA !== null && baseCredits !== null ? baseline.cumulativeGPA * baseCredits : null);
            console.log('[FGS GPA] Baseline credits/quality', baseCredits, baseQuality);
            if (baseCredits !== null && baseQuality !== null) {
                const combinedCredits = baseCredits + addedCredits;
                if (combinedCredits > 0) {
                    const projectedValue = (baseQuality + addedUnweightedQualityPoints) / combinedCredits;
                    cumulativeProjected = roundGPA(projectedValue);
                    if (baseline.cumulativeGPA !== null) {
                        cumulativeDelta = projectedValue - baseline.cumulativeGPA;
                    }
                }
            }
            
            const baseWeightedQuality = baseline.weightedGPA !== null && baseCredits !== null
                ? baseline.weightedGPA * baseCredits
                : null;
            if (baseWeightedQuality !== null) {
                const combinedCredits = baseCredits + addedCredits;
                if (combinedCredits > 0) {
                    const projectedWeightedValue = (baseWeightedQuality + addedWeightedQualityPoints) / combinedCredits;
                    weightedProjected = roundGPA(projectedWeightedValue);
                    if (baseline.weightedGPA !== null) {
                        weightedDelta = projectedWeightedValue - baseline.weightedGPA;
                    }
                }
            }
        }
        
        gpaCalculatorData.projectedGPAs = {
            unweighted: totalCredits > 0 ? roundGPA(totalUnweightedPoints / totalCredits) : null,
            weighted: totalCredits > 0 ? roundGPA(totalWeightedPoints / totalCredits) : null,
            core: coreCredits > 0 ? roundGPA(totalCorePoints / coreCredits) : null,
            cumulativeProjected,
            cumulativeDelta,
            weightedProjected,
            weightedDelta,
            addedCredits,
            addedUnweightedQualityPoints,
            addedWeightedQualityPoints,
            baseline: baseline || null,
            includedCount: classResults.length,
            skippedCount: missingClasses.length,
            classResults,
            missingClasses,
            warnings
        };
        console.log('[FGS GPA] Projected GPA summary:', gpaCalculatorData.projectedGPAs);
        
    } catch (error) {
        console.error('[FGS GPA] calculateGPAs error:', error);
        // Silent error handling for production
    }
}

/**
 * Gets unweighted quality points for a letter grade
 */
function getUnweightedPoints(letter) {
    const points = {
        'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5, 'C': 2.0,
        'D+': 1.5, 'D': 1.0, 'F': 0.0
    };
    return points[letter] || 0;
}

/**
 * Gets weighted quality points for a letter grade and course type
 */
function getWeightedPoints(letter, courseType) {
    const basePoints = getUnweightedPoints(letter);
    
    // Only add weight for C or higher
    if (!BCPS_WEIGHT_ELIGIBLE_GRADES.has(letter)) {
        return basePoints;
    }
    
    switch (courseType) {
        case 'AP':
        case 'AICE':
        case 'IB':
        case 'DualEnrollment':
            return basePoints + 2.0;
        case 'Honors':
        case 'Hon':
        case 'hon':
        case 'PreAP':
        case 'PreAICE':
        case 'PreIB':
        case 'Gifted':
            return basePoints + 1.0;
        default:
            return basePoints;
    }
}

/**
 * Rounds GPA to 3 decimal places
 */
function roundGPA(value) {
    return Math.round(value * 1000) / 1000;
}

/**
 * Formats GPA value for display
 */
function formatGPAValue(value) {
    if (value === null || value === undefined) return '--';
    return value.toFixed(3);
}

function formatGPADelta(delta) {
    if (delta === null || delta === undefined) return '';
    const rounded = Math.round(delta * 1000) / 1000;
    const isZero = Math.abs(rounded) < 0.0005;
    const prefix = rounded >= 0 ? '+' : '-';
    const magnitude = isZero ? '0.000' : Math.abs(rounded).toFixed(3);
    return `(${prefix}${magnitude})`;
}

function getProjectedResultClass(delta) {
    if (delta === null || delta === undefined) return 'projected';
    if (delta > 0.0005) return 'projected projected-up';
    if (delta < -0.0005) return 'projected projected-down';
    return 'projected';
}

function getDeltaSummaryClass(delta) {
    if (delta === null || delta === undefined) return 'fgs-gpa-delta-summary neutral';
    if (delta > 0.0005) return 'fgs-gpa-delta-summary up';
    if (delta < -0.0005) return 'fgs-gpa-delta-summary down';
    return 'fgs-gpa-delta-summary neutral';
}

function formatCredits(value) {
    if (value === null || value === undefined) return '';
    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}


function applyManualCourseType(classData, selection) {
    if (!classData) return;
    if (!selection || selection === 'auto') {
        classData.manualType = null;
        classData.type = classData.baseType;
    } else {
        classData.manualType = selection;
        classData.type = selection;
    }
}

function buildGPASummaryRow(label, baseValue, projectedValue, delta, creditsDetail) {
    const trendClass = getDeltaSummaryClass(delta);
    const deltaText = formatGPADelta(delta);
    const creditsSegment = creditsDetail ? `<span class="credits-detail">${creditsDetail}</span>` : '';
    return `
        <div class="${trendClass}">
            <div class="summary-values-row">
                <span class="summary-label">${label}</span>
                <div class="summary-values">
                    <span class="summary-old">${formatGPAValue(baseValue)}</span>
                    <span class="summary-arrow">→</span>
                    <span class="summary-new">${formatGPAValue(projectedValue)}</span>
                </div>
                <span class="summary-delta">${deltaText}</span>
            </div>
            ${creditsSegment}
        </div>
    `;
}

function validateGPAGradeInputs(showAlert = true) {
    try {
        if (!gpaCalculatorData || !Array.isArray(gpaCalculatorData.selectedClasses)) return false;
        const missing = [];
        gpaCalculatorData.selectedClasses.forEach((classData) => {
            if (!classData || !classData.quarters) return;
            ['q1', 'q2', 'exam'].forEach((field) => {
                const value = classData.quarters[field];
                const isMissing = !value;
                markGradeSelectState(classData.id, field, isMissing);
                if (isMissing) {
                    missing.push({ className: classData.name, classId: classData.id, field });
                }
            });
        });
        
        if (missing.length > 0) {
            if (showAlert) {
                const missingClasses = [...new Set(missing.map(item => item.className))];
                alert(`Please enter Q1, Q2, and Exam grades for: ${missingClasses.join(', ')}.`);
            }
            
            const firstMissing = missing[0];
            if (firstMissing && typeof document !== 'undefined') {
                const select = document.querySelector(`.fgs-gpa-grade-select[data-class-id="${firstMissing.classId}"][data-field="${firstMissing.field}"]`);
                if (select && typeof select.focus === 'function') {
                    select.focus();
                }
            }
            return false;
        }
        return true;
    } catch (error) {
        return false;
    }
}

if (typeof window !== 'undefined') {
    window.validateGPAGradeInputs = validateGPAGradeInputs;
}

/**
 * Renders the GPA results
 */
function renderResults() {
    try {
        console.log('[FGS GPA] renderResults invoked.');
        const container = document.getElementById('fgs-gpa-results');
        if (!container) return;
        
        const projected = gpaCalculatorData.projectedGPAs;
        console.log('[FGS GPA] renderResults projected data:', projected);
        const warningBlock = '';
        const baseline = projected.baseline;
        console.log('[FGS GPA] renderResults baseline:', baseline);
        const addedCreditsNote = projected.addedCredits > 0
            ? `<div class="fgs-gpa-result-note">Adds ${projected.addedCredits} credit${projected.addedCredits !== 1 ? 's' : ''} (${projected.addedUnweightedQualityPoints.toFixed(2)} quality pts).</div>`
            : '';
        const baseCredits = baseline ? (baseline.totalCreditsAttempted ?? baseline.totalCreditsEarned ?? null) : null;
        const combinedCredits = (baseCredits !== null) ? baseCredits + projected.addedCredits : null;
        const creditsDetail = (baseCredits !== null && combinedCredits !== null)
            ? `${formatCredits(baseCredits)} → ${formatCredits(combinedCredits)} credits`
            : '';
        
        const cumulativeBase = baseline?.cumulativeGPA ?? null;
        const cumulativeNew = projected.cumulativeProjected ?? projected.unweighted ?? null;
        const cumulativeDelta = (cumulativeBase !== null && cumulativeNew !== null) ? cumulativeNew - cumulativeBase : null;
        
        const weightedBase = baseline?.weightedGPA ?? null;
        const weightedNew = projected.weightedProjected ?? projected.weighted ?? null;
        const weightedDelta = (weightedBase !== null && weightedNew !== null) ? weightedNew - weightedBase : null;
        
        const summaryRows = [];
        if (cumulativeBase !== null || cumulativeNew !== null) {
            summaryRows.push(buildGPASummaryRow('Cumulative GPA', cumulativeBase, cumulativeNew, cumulativeDelta, creditsDetail));
        }
        if (weightedBase !== null || weightedNew !== null) {
            summaryRows.push(buildGPASummaryRow('Weighted GPA', weightedBase, weightedNew, weightedDelta, ''));
        }
        const summaryHTML = summaryRows.length ? `<div class="fgs-gpa-summary-rows">${summaryRows.join('')}</div>` : '';

        if (!projected || projected.includedCount === 0) {
            container.innerHTML = `
                <div class="fgs-gpa-error">
                    <h4>⚠️ Enter Quarter Grades</h4>
                    <p>To run the BCPS semester calculator, enter Q1, Q2, and Exam letter grades for each class.</p>
                    </div>
            `;
        } else {
            container.innerHTML = `
                ${summaryHTML}
                ${addedCreditsNote}
            `;
        }
        
        const headerInfo = document.getElementById('fgs-gpa-summary');
        if (headerInfo) {
            if (baseline) {
                headerInfo.textContent = baseline.asOf ? `Baseline GPAs as of ${baseline.asOf}` : 'Baseline GPAs from Focus';
            } else {
                headerInfo.textContent = '';
            }
        }
        
        const infoContainer = document.querySelector('.fgs-gpa-info');
        if (infoContainer) {
            const includedCount = projected ? projected.includedCount : 0;
            const skippedCount = projected ? projected.skippedCount : 0;
            infoContainer.textContent = `Calculating ${includedCount} class${includedCount !== 1 ? 'es' : ''} • ${skippedCount} skipped`;
        }
        
    } catch (error) {
        // Silent error handling for production
    }
}

// Helper functions for popup sizing (these should already exist in your codebase)
function setPopupSizeForInterface(interfaceType) {
    try {
        const popup = document.getElementById('focus-grade-simulator-popup');
        if (!popup) return;
        
        const sizePresets = {
            'mode-selection': { width: '295px', maxHeight: '500px' },
            'grade-calculator': { width: '330px', maxHeight: '500px' },
            'gpa-calculator': { width: '330px', maxHeight: '500px' },
            'gpa-results': { width: '330px', maxHeight: '500px' }
        };
        const preset = sizePresets[interfaceType] || sizePresets['mode-selection'];
        
        popup.style.transition = 'width 0.3s ease, height 0.3s ease';
        popup.style.width = preset.width;
        popup.style.maxHeight = preset.maxHeight;
        popup.style.height = '';
        popup.dataset.fgsActiveInterface = interfaceType;
    } catch (error) {
        // Silent error handling
    }
}

function adjustPopupSize() {
    try {
        const popup = document.getElementById('focus-grade-simulator-popup');
        if (!popup) return;
        popup.style.height = '';
        setPopupSizeForInterface(determineActiveInterface());
    } catch (error) {
        // Silent error handling
    }
}

function determineActiveInterface() {
    try {
        const modeSelection = document.getElementById('fgs-mode-selection');
        const calculatorForm = document.getElementById('fgs-calculator-form');
        const gpaCalculator = document.getElementById('fgs-gpa-calculator');
        
        if (gpaCalculator && gpaCalculator.style.display !== 'none') {
            return gpaCalculatorData && gpaCalculatorData.currentStep === 2 ? 'gpa-results' : 'gpa-calculator';
        }
        if (calculatorForm && calculatorForm.style.display !== 'none') {
            return 'grade-calculator';
        }
        return 'mode-selection';
    } catch (error) {
        return 'mode-selection';
    }
}
