/**
 * CONTENT-GPA-CALCULATOR.JS  
 * PRODUCTION VERSION: Removed console logs and debug statements
 * Better spacing and visual hierarchy
 */

// ===========================================
// HTML ESCAPE UTILITY
// ===========================================
function escapeHTML(str) {
	if (typeof str !== 'string') return '';
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

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
    currentStep: 1,
    selectedSemester: 'semester2' // 'semester1', 'semester2', or 'fullYear'
};

// ===========================================
// FORGIVENESS SIMULATOR STATE
// ===========================================
let forgivenessData = {
	allClasses: [],
	eligibleClasses: [],
	selectedActions: [], // { classId, oldGrade, oldCredits, oldType, newGrade, newCredits, newType, isCore }
	results: null
};

// Grades eligible for forgiveness (D+, D, F)
const FORGIVENESS_ELIGIBLE_GRADES = new Set(['D+', 'D', 'F']);

// Grades students can retake to (C or higher)
const FORGIVENESS_NEW_GRADE_OPTIONS = ['A', 'B+', 'B', 'C+', 'C'];

// BCPS allows a maximum of 3 credit forgiveness uses in high school
const MAX_FORGIVENESS_USES = 3;

// Base quality points for weighted/core GPA (plus grades retain their value)
const WEIGHTED_BASE_POINTS = {
    'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5, 'C': 2.0,
    'D+': 1.5, 'D': 1.0, 'F': 0.0
};

// Default credits based on semester mode
const DEFAULT_CREDITS = {
    semester1: 0.5,
    semester2: 0.5,
    fullYear: 1.0
};

// Available credit options for user selection
const CREDIT_OPTIONS = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0];

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

/**
 * Grade numeric scale for averaging two quarter grades into an exam suggestion.
 * Maps letter grades to a numeric value; the average is mapped back to a letter.
 */
const GRADE_NUMERIC_SCALE = {
	'A': 4.0, 'B+': 3.3, 'B': 3.0, 'C+': 2.3, 'C': 2.0,
	'D+': 1.3, 'D': 1.0, 'F': 0
};

const NUMERIC_TO_GRADE_CUTOFFS = [
	{ min: 3.7, letter: 'A' },
	{ min: 3.15, letter: 'B+' },
	{ min: 2.7, letter: 'B' },
	{ min: 2.15, letter: 'C+' },
	{ min: 1.7, letter: 'C' },
	{ min: 1.15, letter: 'D+' },
	{ min: 0.7, letter: 'D' },
	{ min: -Infinity, letter: 'F' }
];

/**
 * Averages two quarter letter grades to suggest an exam grade.
 * e.g. A + A = A, A + B = B+, B + C = C+
 * @param {string} q1 - First quarter letter grade
 * @param {string} q2 - Second quarter letter grade
 * @returns {string} Suggested exam letter grade, or '' if either input is missing
 */
function averageQuarterGrades(q1, q2) {
	if (!q1 || !q2) return '';
	const v1 = GRADE_NUMERIC_SCALE[q1];
	const v2 = GRADE_NUMERIC_SCALE[q2];
	if (v1 === undefined || v2 === undefined) return '';
	const avg = (v1 + v2) / 2;
	for (const cutoff of NUMERIC_TO_GRADE_CUTOFFS) {
		if (avg >= cutoff.min) return cutoff.letter;
	}
	return 'F';
}

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

/**
 * Analyzes semester grades using BCPS formula
 * @param {Object} grades - Grade letters for the semester
 * @param {string} semesterType - 'semester1', 'semester2', or 'fullYear'
 * @returns {Object|null} Analysis result or null if missing grades
 */
function bcpsSemesterAnalysis(grades, semesterType = 'semester1') {
    // Determine which quarters and exam to use based on semester type
    let quarterA, quarterB, exam;

    if (semesterType === 'semester2') {
        quarterA = grades.q3;
        quarterB = grades.q4;
        exam = grades.s2Exam || grades.exam;
    } else if (semesterType === 'fullYear') {
        // Full year mode - will be handled separately
        return bcpsFullYearAnalysis(grades);
    } else {
        // Default to semester 1
        quarterA = grades.q1;
        quarterB = grades.q2;
        exam = grades.s1Exam || grades.exam;
    }

    const q1Letter = normalizeBCPSLetter(quarterA);
    const q2Letter = normalizeBCPSLetter(quarterB);
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
        exam: examIsExempt ? 'EX' : examLetter,
        semesterType: semesterType
    };
}

/**
 * Analyzes full year grades by calculating both semesters
 * Handles partial data gracefully with warnings
 * @param {Object} grades - Grade letters for all quarters and exams
 * @returns {Object|null} Combined analysis result or null if no data
 */
function bcpsFullYearAnalysis(grades) {
    // Calculate Semester 1
    const sem1Analysis = bcpsSemesterAnalysis({
        q1: grades.q1,
        q2: grades.q2,
        s1Exam: grades.s1Exam,
        exam: grades.s1Exam
    }, 'semester1');

    // Calculate Semester 2
    const sem2Analysis = bcpsSemesterAnalysis({
        q3: grades.q3,
        q4: grades.q4,
        s2Exam: grades.s2Exam,
        exam: grades.s2Exam
    }, 'semester2');

    // If neither semester has complete grades, return null
    if (!sem1Analysis && !sem2Analysis) {
        return null;
    }

    // Calculate combined results
    let totalPoints = 0;
    let totalSemesters = 0;
    let passesBothSemesters = true;
    let warnings = [];

    if (sem1Analysis) {
        totalPoints += sem1Analysis.totalPoints;
        totalSemesters++;
        if (!sem1Analysis.passesTwoOfThree) passesBothSemesters = false;
    } else {
        warnings.push('S1 grades missing');
    }

    if (sem2Analysis) {
        totalPoints += sem2Analysis.totalPoints;
        totalSemesters++;
        if (!sem2Analysis.passesTwoOfThree) passesBothSemesters = false;
    } else {
        warnings.push('S2 grades missing');
    }

    // Average the points across semesters
    const averagePoints = totalSemesters > 0 ? totalPoints / totalSemesters : 0;

    let yearLetter = 'F';
    for (const cutoff of BCPS_SEMESTER_CUTOFFS) {
        if (averagePoints >= cutoff.min) {
            yearLetter = cutoff.letter;
            break;
        }
    }

    // Only fail if we have both semesters and one fails
    // If we only have one semester, use that semester's pass status
    let yearLetterAdjusted;
    if (totalSemesters === 2) {
        yearLetterAdjusted = passesBothSemesters ? yearLetter : 'F';
    } else {
        // Single semester - use that semester's result
        yearLetterAdjusted = yearLetter;
    }

    return {
        semesterLetter: yearLetterAdjusted,
        totalPoints: averagePoints,
        passesTwoOfThree: passesBothSemesters,
        semester1: sem1Analysis,
        semester2: sem2Analysis,
        semestersCalculated: totalSemesters,
        isPartialYear: totalSemesters < 2,
        warnings: warnings,
        q1: grades.q1 || '',
        q2: grades.q2 || '',
        q3: grades.q3 || '',
        q4: grades.q4 || '',
        s1Exam: grades.s1Exam || '',
        s2Exam: grades.s2Exam || '',
        exam: grades.s1Exam || grades.s2Exam || '',
        semesterType: 'fullYear'
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
                setTimeout(() => extractBaselineGPAStats(true), 200);
                return;
            }
        }
        
        const getCellValue = (selector) => {
            const cell = document.querySelector(selector);
            if (!cell) {
                return null;
            }
            const text = cell.textContent.trim();
            return text;
        };
        
        const cumulativeGPAText = getCellValue(selectors.cumulativeGPAText);
        const weightedGPAText = getCellValue(selectors.weightedGPAText);
        const creditsEarnedText = getCellValue(selectors.creditsEarnedText);
        const creditsAttemptedText = getCellValue(selectors.creditsAttemptedText);
        const qualityPointsText = getCellValue(selectors.qualityPointsText);
        const asOfText = getCellValue(selectors.asOfText);
        
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

        if (cumulativeGPA === null && weightedGPA === null && totalCreditsAttempted === null && qualityPoints === null && coreGPA === null) {
            gpaCalculatorData.baselineStats = null;
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
        
        baselineExtractAttempts = 0;
        
    } catch (error) {
        gpaCalculatorData.baselineStats = null;
        /* silent */
    }
}

let coreCreditsExtractAttempts = 0;
const MAX_CORE_CREDITS_ATTEMPTS = 8;

function extractBaselineCoreCredits() {
    try {
        if (!gpaCalculatorData.baselineStats) return;
        if (gpaCalculatorData.baselineStats.baseCoreCredits !== undefined) return;

        const currentYear = getCurrentAcademicYear();
        const rows = document.querySelectorAll('.student-grade');

        if (rows.length === 0) {
            if (coreCreditsExtractAttempts < MAX_CORE_CREDITS_ATTEMPTS) {
                coreCreditsExtractAttempts += 1;
                setTimeout(() => extractBaselineCoreCredits(), 300);
            }
            return;
        }

        let coreCredits = 0;
        let coreQualityPoints = 0;

        rows.forEach((row) => {
            try {
                const yearCell = row.querySelector('[data-field="syear_display"]');
                const courseCell = row.querySelector('[data-field="course_name"]');
                if (!yearCell || !courseCell) return;

                const year = yearCell.textContent.trim();
                const courseName = courseCell.textContent.trim();
                if (!courseName) return;

                // Skip current year — those are what the user is projecting
                if (year === currentYear) return;

                if (!isCoreSubject(courseName)) return;

                // Check Credits column — if 0, not a high school credit class
                const creditsCell = row.querySelector('[data-field="credit_hours"]') || row.querySelector('[data-field="credits"]');
                const rowCredits = creditsCell ? parseFloat(creditsCell.textContent.trim()) : -1;
                if (rowCredits === 0) return;

                const courseType = detectCourseType(courseName);

                // Read semester grade cells
                const s1Cell = row.querySelector('[data-field="mp_s1"] a') || row.querySelector('[data-field="mp_s1"]')
                    || row.querySelector('[data-field="mp_sem1"] a') || row.querySelector('[data-field="mp_sem1"]');
                const s2Cell = row.querySelector('[data-field="mp_s2"] a') || row.querySelector('[data-field="mp_s2"]')
                    || row.querySelector('[data-field="mp_sem2"] a') || row.querySelector('[data-field="mp_sem2"]');

                const s1Raw = s1Cell ? s1Cell.textContent.trim() : '';
                const s2Raw = s2Cell ? s2Cell.textContent.trim() : '';

                let hasS1 = s1Raw && s1Raw !== 'NG' && s1Raw !== '--';
                let hasS2 = s2Raw && s2Raw !== 'NG' && s2Raw !== '--';

                // Determine per-semester credits from Credits column
                let perSemesterCredits;
                if (rowCredits > 0) {
                    if (hasS1 && hasS2) {
                        // Year-long class: split total credits between semesters
                        perSemesterCredits = rowCredits / 2;
                    } else {
                        // Single semester visible: if ≤ 0.5 total, likely a semester-only class
                        perSemesterCredits = rowCredits <= 0.5 ? rowCredits : rowCredits / 2;
                    }
                } else {
                    // Credits column unavailable — default
                    perSemesterCredits = 0.5;
                }

                // S1: count credit and compute quality points
                if (hasS1) {
                    const letter = normalizeBCPSLetter(s1Raw);
                    if (letter && letter !== 'EX') {
                        coreCredits += perSemesterCredits;
                        coreQualityPoints += getCorePoints(letter, courseType) * perSemesterCredits;
                    }
                }

                // S2: count credit and compute quality points
                if (hasS2) {
                    const letter = normalizeBCPSLetter(s2Raw);
                    if (letter && letter !== 'EX') {
                        coreCredits += perSemesterCredits;
                        coreQualityPoints += getCorePoints(letter, courseType) * perSemesterCredits;
                    }
                }

                // Fallback: if no S1/S2 grades but class has credits and a FY grade, use FY
                if (!hasS1 && !hasS2 && rowCredits > 0) {
                    const fyCell = row.querySelector('[data-field="mp_fy"] a') || row.querySelector('[data-field="mp_fy"]')
                        || row.querySelector('[data-field="mp_year"] a') || row.querySelector('[data-field="mp_year"]');
                    const fyRaw = fyCell ? fyCell.textContent.trim() : '';
                    if (fyRaw && fyRaw !== 'NG' && fyRaw !== '--' && fyRaw !== 'P' && fyRaw !== 'F*') {
                        const letter = normalizeBCPSLetter(fyRaw);
                        if (letter && letter !== 'EX') {
                            coreCredits += rowCredits;
                            coreQualityPoints += getCorePoints(letter, courseType) * rowCredits;
                        }
                    }
                }
            } catch (_) { /* skip row */ }
        });

        gpaCalculatorData.baselineStats.baseCoreCredits = coreCredits > 0 ? coreCredits : null;
        gpaCalculatorData.baselineStats.baseCoreQualityPoints = coreCredits > 0 ? coreQualityPoints : null;
        // Compute baseline Core GPA from actual data (more accurate than Focus display)
        if (coreCredits > 0) {
            gpaCalculatorData.baselineStats.computedCoreGPA = roundGPA(coreQualityPoints / coreCredits);
        }
        coreCreditsExtractAttempts = 0;

    } catch (error) {
        /* silent */
    }
}

// Kick off an initial baseline scrape shortly after the content script loads
if (typeof document !== 'undefined' && isFocusStudentGradesURL()) {
    setTimeout(() => extractBaselineGPAStats(true), 150);
    setTimeout(() => extractBaselineCoreCredits(), 500);
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

    // English / Language Arts (ENG catches "ENG HON 1", "AICE ENG GEN PAPER")
    if (name.includes('ENGLISH') || name.includes('ENG ') || name.includes('LANGUAGE ARTS') ||
        name.includes('ELA ') || name.includes('READING') || name.includes('READ ') ||
        name.includes('LITERATURE') || name.includes('LANG ARTS')) {
        return true;
    }

    // Math
    if (name.includes('MATH') || name.includes('ALGEBRA') || name.includes('GEOMETRY') ||
        name.includes('CALCULUS') || name.includes('STATISTICS') || name.includes('TRIGONOMETRY') ||
        name.includes('PRE-CALC') || name.includes('PRECALC')) {
        return true;
    }

    // Science — guard against "COMPUTER SCIENCE" / "COMP SCI" / "CPTR SCI"
    if ((name.includes('SCIENCE') && !name.includes('COMPUTER') && !name.includes('COMP ') && !name.includes('CPTR')) ||
        name.includes('BIOLOGY') || name.includes('CHEMISTRY') || name.includes('PHYSICS') ||
        name.includes('ENVIRONMENTAL') || name.includes('ENV SCI') || name.includes('ANATOMY') ||
        name.includes('EARTH SCI') || name.includes('MARINE SCI') || name.includes('MARINE BIO')) {
        return true;
    }

    // Social Studies (ECON catches "AMER ECON EXP", GOV catches "GOV" / "GOVT" / "GOVERNMENT")
    // Avoid bare "WORLD" — false-matches "WORLD OF TECHNOLOGY" etc.
    if (name.includes('HISTORY') || name.includes('GOV') || name.includes('ECON') ||
        name.includes('GEOGRAPHY') || name.includes('CIVICS') || name.includes('PSYCH') ||
        name.includes('SOCIAL STUDIES') || name.includes('WORLD CULT') || name.includes('WORLD AFF') ||
        name.includes('AMERICAN') || name.includes('AMER ') || name.includes('SOCIOLOGY')) {
        return true;
    }

    // World Languages
    if (name.includes('SPANISH') || name.includes('FRENCH') || name.includes('GERMAN') ||
        name.includes('CHINESE') || name.includes('MANDARIN') || name.includes('JAPANESE') ||
        name.includes('LATIN') || name.includes('ITALIAN') || name.includes('PORTUGUESE') ||
        name.includes('ARABIC') || name.includes('HEBREW') || name.includes('RUSSIAN') ||
        name.includes('KOREAN') || name.includes('HAITIAN') || name.includes('SIGN LANG') ||
        (name.includes('LANGUAGE') && !name.includes('LANGUAGE ARTS'))) {
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
 * Extracts class data from the Focus gradebook table
 * Updated for Semester 2: Now extracts Q1, Q2, Q3, Q4, S1 Exam, and S2 Exam
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

                // Quarter 1 extraction
                const q1Cell = row.querySelector('[data-field="mp_q1"] a') || row.querySelector('[data-field="mp_q1"]');
                // Quarter 2 extraction
                const q2Cell = row.querySelector('[data-field="mp_q2"] a') || row.querySelector('[data-field="mp_q2"]');
                // Quarter 3 extraction (Semester 2)
                const q3Cell = row.querySelector('[data-field="mp_q3"] a') || row.querySelector('[data-field="mp_q3"]');
                // Quarter 4 extraction (Semester 2)
                const q4Cell = row.querySelector('[data-field="mp_q4"] a') || row.querySelector('[data-field="mp_q4"]');

                // S1 Exam extraction (Semester 1)
                const s1ExamCell = row.querySelector('[data-field="mp_s1_exam"] a, [data-field="mp_exam"] a, [data-field="mp_exam1"] a, [data-field="mp_exm"] a, [data-field="mp_ex"] a')
                    || row.querySelector('[data-field="mp_s1_exam"], [data-field="mp_exam"], [data-field="mp_exam1"], [data-field="mp_exm"], [data-field="mp_ex"]')
                    || row.querySelector('[title*="S1 Exam"], [title*="Exam Grade"]')
                    || Array.from(row.querySelectorAll('td')).find(cell => {
                        const title = cell.getAttribute('title') || '';
                        const text = cell.textContent.trim();
                        return (title.includes('S1 Exam') || title.includes('Exam Grade')) && text && text !== 'NG' && text !== '--';
                    });

                // S2 Exam extraction (Semester 2)
                const s2ExamCell = row.querySelector('[data-field="mp_s2_exam"] a')
                    || row.querySelector('[data-field="mp_s2_exam"]')
                    || row.querySelector('[title*="S2 Exam"]')
                    || Array.from(row.querySelectorAll('td')).find(cell => {
                        const title = cell.getAttribute('title') || '';
                        const text = cell.textContent.trim();
                        return title.includes('S2 Exam') && text && text !== 'NG' && text !== '--';
                    });

                const q1Letter = extractLetterFromGradeCell(q1Cell);
                const q2Letter = extractLetterFromGradeCell(q2Cell);
                const q3Letter = extractLetterFromGradeCell(q3Cell);
                const q4Letter = extractLetterFromGradeCell(q4Cell);
                const s1ExamLetter = extractLetterFromGradeCell(s1ExamCell);
                const s2ExamLetter = extractLetterFromGradeCell(s2ExamCell);

                // Check if there are any grades at all
                if (!q1Letter && !q2Letter && !q3Letter && !q4Letter && !s1ExamLetter && !s2ExamLetter) {
                    return;
                }

                const courseType = detectCourseType(courseName);
                const isCore = isCoreSubject(courseName);
                const isEOC = isEOCCourse(courseName);

                // Display the most recent available grade
                const displayGrade = q3Cell?.textContent.trim() || q4Cell?.textContent.trim() ||
                                     q1Cell?.textContent.trim() || q2Cell?.textContent.trim() ||
                                     s1ExamCell?.textContent.trim() || s2ExamCell?.textContent.trim() || '—';

                // Determine if this class has grades in only one semester (semester-only class)
                const hasS1Grades = !!(q1Letter || q2Letter || s1ExamLetter);
                const hasS2Grades = !!(q3Letter || q4Letter || s2ExamLetter);
                const isSemesterOnlyClass = (hasS1Grades && !hasS2Grades) || (!hasS1Grades && hasS2Grades);

                // Read Credits column for actual credit value
                const creditsCell = row.querySelector('[data-field="credit_hours"]') || row.querySelector('[data-field="credits"]');
                const rowCredits = creditsCell ? parseFloat(creditsCell.textContent.trim()) : NaN;

                // Determine default credits: prefer Credits column, fall back to semester mode default
                const selectedSemester = gpaCalculatorData.selectedSemester || 'semester2';
                let defaultCredits;
                if (rowCredits > 0) {
                    if (selectedSemester === 'fullYear') {
                        defaultCredits = isSemesterOnlyClass ? rowCredits / 2 : rowCredits;
                    } else {
                        // Semester mode: each semester is half the total course credits
                        defaultCredits = rowCredits / 2;
                    }
                } else {
                    // Credits column unavailable or 0 — fall back to mode default
                    defaultCredits = DEFAULT_CREDITS[selectedSemester] || 0.5;
                    if (selectedSemester === 'fullYear' && isSemesterOnlyClass) {
                        defaultCredits = 0.5;
                    }
                }

                const classData = {
                    id: 'class_' + index,
                    name: courseName,
                    baseType: courseType,
                    type: courseType,
                    manualType: null,
                    typeEditorOpen: false,
                    isCore,
                    credits: defaultCredits,
                    userCredits: null, // User-overridden credits (null means use default)
                    isEOC,
                    grade: displayGrade,
                    hasS1Grades: hasS1Grades,
                    hasS2Grades: hasS2Grades,
                    isSemesterOnlyClass: isSemesterOnlyClass,
                    quarters: {
                        q1: q1Letter,
                        q2: q2Letter,
                        q3: q3Letter,
                        q4: q4Letter,
                        s1Exam: s1ExamLetter,
                        s2Exam: s2ExamLetter,
                        // Legacy compatibility - 'exam' will be set based on selected semester
                        exam: s1ExamLetter || s2ExamLetter
                    },
                    sourceTexts: {
                        q1: q1Cell?.textContent.trim() || '',
                        q2: q2Cell?.textContent.trim() || '',
                        q3: q3Cell?.textContent.trim() || '',
                        q4: q4Cell?.textContent.trim() || '',
                        s1Exam: s1ExamCell?.textContent.trim() || '',
                        s2Exam: s2ExamCell?.textContent.trim() || '',
                        exam: s1ExamCell?.textContent.trim() || s2ExamCell?.textContent.trim() || ''
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
 * Extracts ALL class data from the Focus gradebook (all years, not just current).
 * Used by the forgiveness simulator to find D/F courses from prior semesters.
 * Computes semester grades for each semester and filters to eligible classes.
 */
function extractAllClassData() {
	try {
		const rows = document.querySelectorAll('.student-grade');
		forgivenessData.allClasses = [];
		forgivenessData.eligibleClasses = [];

		rows.forEach((row, index) => {
			try {
				const yearCell = row.querySelector('[data-field="syear_display"]');
				const courseCell = row.querySelector('[data-field="course_name"]');
				if (!yearCell || !courseCell) return;

				const year = yearCell.textContent.trim();
				const courseName = courseCell.textContent.trim();
				if (!courseName) return;
				if (courseName.toUpperCase().includes('STUDY HALL')) return;

				// Quarter cells
				const q1Cell = row.querySelector('[data-field="mp_q1"] a') || row.querySelector('[data-field="mp_q1"]');
				const q2Cell = row.querySelector('[data-field="mp_q2"] a') || row.querySelector('[data-field="mp_q2"]');
				const q3Cell = row.querySelector('[data-field="mp_q3"] a') || row.querySelector('[data-field="mp_q3"]');
				const q4Cell = row.querySelector('[data-field="mp_q4"] a') || row.querySelector('[data-field="mp_q4"]');

				// Exam cells
				const s1ExamCell = row.querySelector('[data-field="mp_s1_exam"] a, [data-field="mp_exam"] a, [data-field="mp_exam1"] a, [data-field="mp_exm"] a, [data-field="mp_ex"] a')
					|| row.querySelector('[data-field="mp_s1_exam"], [data-field="mp_exam"], [data-field="mp_exam1"], [data-field="mp_exm"], [data-field="mp_ex"]')
					|| row.querySelector('[title*="S1 Exam"], [title*="Exam Grade"]')
					|| Array.from(row.querySelectorAll('td')).find(cell => {
						const title = cell.getAttribute('title') || '';
						const text = cell.textContent.trim();
						return (title.includes('S1 Exam') || title.includes('Exam Grade')) && text && text !== 'NG' && text !== '--';
					});

				const s2ExamCell = row.querySelector('[data-field="mp_s2_exam"] a')
					|| row.querySelector('[data-field="mp_s2_exam"]')
					|| row.querySelector('[title*="S2 Exam"]')
					|| Array.from(row.querySelectorAll('td')).find(cell => {
						const title = cell.getAttribute('title') || '';
						const text = cell.textContent.trim();
						return title.includes('S2 Exam') && text && text !== 'NG' && text !== '--';
					});

				// Semester grade cells (S1/S2 final grade columns — Focus shows these for prior years)
				const s1GradeCell = row.querySelector('[data-field="mp_s1"] a') || row.querySelector('[data-field="mp_s1"]')
					|| row.querySelector('[data-field="mp_sem1"] a') || row.querySelector('[data-field="mp_sem1"]');
				const s2GradeCell = row.querySelector('[data-field="mp_s2"] a') || row.querySelector('[data-field="mp_s2"]')
					|| row.querySelector('[data-field="mp_sem2"] a') || row.querySelector('[data-field="mp_sem2"]');

				const q1Letter = extractLetterFromGradeCell(q1Cell);
				const q2Letter = extractLetterFromGradeCell(q2Cell);
				const q3Letter = extractLetterFromGradeCell(q3Cell);
				const q4Letter = extractLetterFromGradeCell(q4Cell);
				const s1ExamLetter = extractLetterFromGradeCell(s1ExamCell);
				const s2ExamLetter = extractLetterFromGradeCell(s2ExamCell);
				const s1DirectGrade = extractLetterFromGradeCell(s1GradeCell);
				const s2DirectGrade = extractLetterFromGradeCell(s2GradeCell);

				// Skip rows with absolutely no grade data at all
				if (!q1Letter && !q2Letter && !q3Letter && !q4Letter &&
					!s1ExamLetter && !s2ExamLetter && !s1DirectGrade && !s2DirectGrade) {
					return;
				}

				const courseType = detectCourseType(courseName);
				const isCore = isCoreSubject(courseName);
				const quarters = { q1: q1Letter, q2: q2Letter, q3: q3Letter, q4: q4Letter, s1Exam: s1ExamLetter, s2Exam: s2ExamLetter };

				// Read Credits column for actual credit value
				const creditsCell = row.querySelector('[data-field="credit_hours"]') || row.querySelector('[data-field="credits"]');
				const rowCredits = creditsCell ? parseFloat(creditsCell.textContent.trim()) : -1;

				// Try computing semester grades from quarters first
				const sem1Analysis = bcpsSemesterAnalysis(quarters, 'semester1');
				const sem2Analysis = bcpsSemesterAnalysis(quarters, 'semester2');

				// Build entries for each semester that has data
				const semesters = [];

				// Semester 1: computed from quarters, OR fallback to S1 column grade
				if (sem1Analysis) {
					semesters.push({
						semesterType: 'S1',
						semesterGrade: sem1Analysis.semesterLetter,
						gradeSource: 'computed'
					});
				} else if (s1DirectGrade) {
					semesters.push({
						semesterType: 'S1',
						semesterGrade: s1DirectGrade,
						gradeSource: 'column'
					});
				}

				// Semester 2: computed from quarters, OR fallback to S2 column grade
				if (sem2Analysis) {
					semesters.push({
						semesterType: 'S2',
						semesterGrade: sem2Analysis.semesterLetter,
						gradeSource: 'computed'
					});
				} else if (s2DirectGrade) {
					semesters.push({
						semesterType: 'S2',
						semesterGrade: s2DirectGrade,
						gradeSource: 'column'
					});
				}

				// Determine per-semester credits from Credits column
				let perSemCredits;
				if (rowCredits > 0) {
					if (semesters.length >= 2) {
						perSemCredits = rowCredits / 2;
					} else {
						perSemCredits = rowCredits <= 0.5 ? rowCredits : rowCredits / 2;
					}
				} else {
					perSemCredits = 0.5;
				}

				semesters.forEach((sem) => {
					const classEntry = {
						id: 'forgive_' + index + '_' + sem.semesterType,
						name: courseName,
						year: year,
						type: courseType,
						isCore: isCore,
						credits: perSemCredits,
						semesterType: sem.semesterType,
						semesterGrade: sem.semesterGrade,
						gradeSource: sem.gradeSource,
						quarters: quarters
					};

					forgivenessData.allClasses.push(classEntry);

					// Filter to eligible D/F classes
					if (FORGIVENESS_ELIGIBLE_GRADES.has(sem.semesterGrade)) {
						forgivenessData.eligibleClasses.push(classEntry);
					}
				});

			} catch (error) {
				// Continue processing other rows
			}
		});

	} catch (error) {
		// Silent error handling
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
 * Shows the GPA mode selection sub-menu (Calculate GPA or Credit Forgiveness)
 */
function showGPAModeSelect() {
	try {
		const modeSelect = document.getElementById('fgs-gpa-mode-select');
		const step1 = document.getElementById('fgs-gpa-step-1');
		const step2 = document.getElementById('fgs-gpa-step-2');
		const forgivenessPanel = document.getElementById('fgs-forgiveness-panel');

		if (step1) step1.style.display = 'none';
		if (step2) step2.style.display = 'none';
		if (forgivenessPanel) forgivenessPanel.style.display = 'none';
		if (modeSelect) modeSelect.style.display = 'flex';

		setPopupSizeForInterface('mode-selection');
	} catch (error) {
		// Silent error handling
	}
}

/**
 * Shows specific GPA calculator step with responsive sizing
 * Updated for multi-semester support
 */
function showGPAStep(stepNumber) {
    try {
        // Hide all steps (including mode select and forgiveness panel)
        const modeSelect = document.getElementById('fgs-gpa-mode-select');
        const step1 = document.getElementById('fgs-gpa-step-1');
        const step2 = document.getElementById('fgs-gpa-step-2');
        const forgivenessPanel = document.getElementById('fgs-forgiveness-panel');

        if (modeSelect) modeSelect.style.display = 'none';
        if (step1) step1.style.display = 'none';
        if (step2) step2.style.display = 'none';
        if (forgivenessPanel) forgivenessPanel.style.display = 'none';

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
            // Ensure baseline core credits are extracted before calculating
            if (gpaCalculatorData.baselineStats && gpaCalculatorData.baselineStats.coreGPA !== null && gpaCalculatorData.baselineStats.baseCoreCredits === undefined) {
                extractBaselineCoreCredits();
            }
            calculateGPAs();
            renderResults();
            setPopupSizeForInterface('gpa-results');

            // Update disclaimer text based on selected semester
            const selectedSemester = gpaCalculatorData.selectedSemester || 'semester2';
            const disclaimerText = document.getElementById('fgs-gpa-disclaimer-text');
            if (disclaimerText) {
                if (selectedSemester === 'semester2') {
                    disclaimerText.textContent = '📘 Uses BCPS Policy 6000.1: 37.5% Q3, 37.5% Q4, 25% Semester Exam with the 2-of-3 passing rule.';
                } else if (selectedSemester === 'fullYear') {
                    disclaimerText.textContent = '📘 Uses BCPS Policy 6000.1 for both semesters. Full year averages both semester grades.';
                } else {
                    disclaimerText.textContent = '📘 Uses BCPS Policy 6000.1: 37.5% Q1, 37.5% Q2, 25% Semester Exam with the 2-of-3 passing rule.';
                }
            }
        }

        gpaCalculatorData.currentStep = stepNumber;

    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Gets the fields to display based on selected semester
 */
function getGradeFieldsForSemester(semester) {
    switch (semester) {
        case 'semester2':
            return [
                { field: 'q3', label: 'Q3', sourceField: 'q3' },
                { field: 'q4', label: 'Q4', sourceField: 'q4' },
                { field: 's2Exam', label: 'Exam', sourceField: 's2Exam' }
            ];
        case 'fullYear':
            return [
                { field: 'q1', label: 'Q1', sourceField: 'q1' },
                { field: 'q2', label: 'Q2', sourceField: 'q2' },
                { field: 's1Exam', label: 'S1 Ex', sourceField: 's1Exam' },
                { field: 'q3', label: 'Q3', sourceField: 'q3' },
                { field: 'q4', label: 'Q4', sourceField: 'q4' },
                { field: 's2Exam', label: 'S2 Ex', sourceField: 's2Exam' }
            ];
        case 'semester1':
        default:
            return [
                { field: 'q1', label: 'Q1', sourceField: 'q1' },
                { field: 'q2', label: 'Q2', sourceField: 'q2' },
                { field: 's1Exam', label: 'Exam', sourceField: 's1Exam' }
            ];
    }
}

/**
 * Renders the class list with better UI - improved spacing and visual hierarchy
 * Updated for multi-semester support
 */
function renderClassList() {
    try {
        const container = document.getElementById('fgs-gpa-class-list');
        const noClassesInstruction = document.getElementById('fgs-gpa-no-classes');

        if (!container) return;

        // Clear container safely
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        const hasClasses = gpaCalculatorData.selectedClasses.length > 0;
        if (noClassesInstruction) {
            noClassesInstruction.style.display = hasClasses ? 'none' : 'block';
        }

        const selectedSemester = gpaCalculatorData.selectedSemester || 'semester2';
        const gradeFields = getGradeFieldsForSemester(selectedSemester);

        gpaCalculatorData.selectedClasses.forEach((classData) => {
            const classItem = document.createElement('div');
            classItem.className = 'fgs-gpa-class-item';

            const typeLabel = getTypeLabel(classData.type);
            const coreManualClass = classData.manualCore !== null && classData.manualCore !== undefined ? ' manual' : '';
            const coreBadge = classData.isCore ? '<span class="fgs-gpa-core-tag' + coreManualClass + '" data-class-id="' + classData.id + '" title="Click to toggle core status">Core</span>' : '';
            const eocBadge = classData.isEOC ? '<span class="fgs-gpa-eoc-tag" title="State End-of-Course weighting">EOC</span>' : '';

            // Build grade selectors based on selected semester
            const gradeSelectors = gradeFields.map(({ field, label, sourceField }) => {
                const isExamField = field.includes('Exam') || field === 'exam';
                const optionPool = isExamField
                    ? [...BCPS_GRADE_OPTIONS, ...BCPS_EXAM_SPECIAL_OPTIONS]
                    : BCPS_GRADE_OPTIONS;
                const options = optionPool.map(option => {
                    const display = option === '' ? '--' : (option === 'EX' ? 'Exempt' : option);
                    return '<option value="' + option + '">' + display + '</option>';
                }).join('');
                const hintText = classData.sourceTexts?.[sourceField];
                const hintDisplay = hintText && hintText.length ? hintText : '--';

                return '<div class="fgs-gpa-grade-box">' +
                    '<label class="fgs-gpa-grade-label">' + label + '</label>' +
                    '<select class="fgs-gpa-grade-select" data-class-id="' + classData.id + '" data-field="' + field + '">' +
                    options +
                    '</select>' +
                    '<span class="fgs-gpa-grade-hint">' + escapeHTML(hintDisplay) + '</span>' +
                    '</div>';
            }).join('');
            
            // Better organized class card structure with credits selector
            const typeOptions = COURSE_TYPE_OPTIONS.map(opt => '<option value="' + opt.value + '" ' + (opt.value === (classData.manualType || 'auto') ? 'selected' : '') + '>' + opt.label + '</option>').join('');

            // Build credit options
            const effectiveCredits = classData.userCredits !== null ? classData.userCredits : classData.credits;
            const creditOptions = CREDIT_OPTIONS.map(credit => {
                const selected = credit === effectiveCredits ? 'selected' : '';
                return '<option value="' + credit + '" ' + selected + '>' + credit + '</option>';
            }).join('');

            // Warning for missing grades in full year mode
            let gradeWarning = '';
            if (selectedSemester === 'fullYear') {
                if (classData.hasS1Grades && !classData.hasS2Grades) {
                    gradeWarning = '<div class="fgs-gpa-class-warning">⚠️ S2 grades missing - using S1 only</div>';
                } else if (!classData.hasS1Grades && classData.hasS2Grades) {
                    gradeWarning = '<div class="fgs-gpa-class-warning">⚠️ S1 grades missing - using S2 only</div>';
                }
            }

            // Add full-year-mode class for compact styling when showing 6 columns
            const gradeRowClass = selectedSemester === 'fullYear' ? 'fgs-gpa-grade-row full-year-mode' : 'fgs-gpa-grade-row';

            classItem.innerHTML = '<div class="fgs-gpa-class-card">' +
                '<div class="fgs-gpa-class-header">' +
                    '<div class="fgs-gpa-class-title">' +
                        '<div class="fgs-gpa-class-name" title="' + escapeHTML(classData.name) + '">' + escapeHTML(classData.name) + '</div>' +
                        '<div class="fgs-gpa-class-badges">' +
                            '<span class="fgs-gpa-class-type ' + classData.type.toLowerCase() + (classData.manualType ? ' manual' : '') + '">' + typeLabel + '</span>' +
                            coreBadge +
                            eocBadge +
                            '<button class="fgs-gpa-edit-type" data-class-id="' + classData.id + '" title="Set course type">＋</button>' +
                        '</div>' +
                        '<div class="fgs-gpa-type-editor" data-class-id="' + classData.id + '" style="display: ' + (classData.typeEditorOpen ? 'flex' : 'none') + ';">' +
                            '<select class="fgs-gpa-type-select" data-class-id="' + classData.id + '">' + typeOptions + '</select>' +
                            '<label class="fgs-gpa-core-toggle"><input type="checkbox" class="fgs-gpa-core-checkbox" data-class-id="' + classData.id + '"' + (classData.isCore ? ' checked' : '') + '> Core</label>' +
                        '</div>' +
                    '</div>' +
                    '<button class="fgs-gpa-class-remove" data-class-id="' + classData.id + '" title="Remove class">×</button>' +
                '</div>' +
                gradeWarning +
                '<div class="' + gradeRowClass + '">' +
                    gradeSelectors +
                '</div>' +
                '<div class="fgs-gpa-credits-row">' +
                    '<span class="fgs-gpa-credits-label">Credits:</span>' +
                    '<select class="fgs-gpa-credits-select" data-class-id="' + classData.id + '">' + creditOptions + '</select>' +
                '</div>' +
                '<div class="fgs-gpa-semester-result" data-preview-for="' + classData.id + '">' +
                    '<span class="fgs-gpa-semester-label">Semester Grade:</span>' +
                    '<span class="fgs-gpa-semester-value">--</span>' +
                '</div>' +
            '</div>';
            
            container.appendChild(classItem);
            
            // Update event listeners to work with new structure and semester-based fields
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

                    // Auto-fill exam grade as average of both quarters when both are set
                    const autoFillExam = (qA, qB, examField) => {
                        if (!classData.quarters[qA] || !classData.quarters[qB]) return;
                        const examSelect = classItem.querySelector('.fgs-gpa-grade-select[data-field="' + examField + '"]');
                        if (!examSelect) return;
                        // Only auto-fill if exam is still empty
                        if (classData.quarters[examField]) return;
                        const suggested = averageQuarterGrades(classData.quarters[qA], classData.quarters[qB]);
                        if (suggested) {
                            classData.quarters[examField] = suggested;
                            examSelect.value = suggested;
                            markGradeSelectState(classData.id, examField, false);
                        }
                    };

                    if (selectedSemester === 'semester1' || selectedSemester === 'fullYear') {
                        autoFillExam('q1', 'q2', 's1Exam');
                    }
                    if (selectedSemester === 'semester2' || selectedSemester === 'fullYear') {
                        autoFillExam('q3', 'q4', 's2Exam');
                    }

                    updateClassSemesterPreview(classData, classItem, selectedSemester);
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
            
            // Core badge toggle (click to remove)
            const coreBadgeEl = classItem.querySelector('.fgs-gpa-core-tag');
            if (coreBadgeEl) {
                coreBadgeEl.addEventListener('click', () => {
                    classData.isCore = false;
                    classData.manualCore = false;
                    renderClassList();
                    if (gpaCalculatorData.currentStep === 2) {
                        calculateGPAs();
                        renderResults();
                    }
                });
            }

            // Core checkbox in type editor (toggle on/off)
            const coreCheckbox = classItem.querySelector('.fgs-gpa-core-checkbox');
            if (coreCheckbox) {
                coreCheckbox.addEventListener('change', (e) => {
                    classData.isCore = e.target.checked;
                    classData.manualCore = e.target.checked;
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

            // Credits selector event listener
            const creditsSelect = classItem.querySelector('.fgs-gpa-credits-select');
            if (creditsSelect) {
                creditsSelect.addEventListener('change', (e) => {
                    const newCredits = parseFloat(e.target.value);
                    classData.userCredits = newCredits;
                    classData.credits = newCredits;
                    // If on results step, recalculate
                    if (gpaCalculatorData.currentStep === 2) {
                        calculateGPAs();
                        renderResults();
                    }
                });
            }

            updateClassSemesterPreview(classData, classItem, selectedSemester);
        });

        updateAddClassDropdown();
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Updates the semester preview with better formatting
 * Updated for multi-semester support
 */
function updateClassSemesterPreview(classData, classElement, semesterType) {
    try {
        const previewSpan = classElement.querySelector('.fgs-gpa-semester-value');
        if (!previewSpan) return;

        const selectedSemester = semesterType || gpaCalculatorData.selectedSemester || 'semester2';
        const analysis = bcpsSemesterAnalysis(classData.quarters, selectedSemester);

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

        // Update normalized values back to classData
        if (selectedSemester === 'semester2') {
            classData.quarters.q3 = analysis.q1;
            classData.quarters.q4 = analysis.q2;
            classData.quarters.s2Exam = analysis.exam;
        } else if (selectedSemester === 'fullYear') {
            // Full year - update all fields
            if (analysis.semester1) {
                classData.quarters.q1 = analysis.semester1.q1;
                classData.quarters.q2 = analysis.semester1.q2;
                classData.quarters.s1Exam = analysis.semester1.exam;
            }
            if (analysis.semester2) {
                classData.quarters.q3 = analysis.semester2.q1;
                classData.quarters.q4 = analysis.semester2.q2;
                classData.quarters.s2Exam = analysis.semester2.exam;
            }
        } else {
            classData.quarters.q1 = analysis.q1;
            classData.quarters.q2 = analysis.q2;
            classData.quarters.s1Exam = analysis.exam;
        }

        // Update selects with normalized values
        const gradeFields = getGradeFieldsForSemester(selectedSemester);
        gradeFields.forEach(({ field }) => {
            const select = classElement.querySelector('.fgs-gpa-grade-select[data-field="' + field + '"]');
            if (select && select.value !== classData.quarters[field]) {
                select.value = classData.quarters[field] || '';
            }
        });

        classData.semester = {
            letter: analysis.semesterLetter,
            totalPoints: analysis.totalPoints,
            passesTwoOfThree: analysis.passesTwoOfThree
        };

        const labelPrefix = selectedSemester === 'fullYear' ? 'Year Grade:' : 'Semester Grade:';
        const previewLabel = classElement.querySelector('.fgs-gpa-semester-label');
        if (previewLabel) {
            previewLabel.textContent = labelPrefix;
        }

        previewSpan.textContent = analysis.semesterLetter + ' (' + analysis.totalPoints.toFixed(1) + ' pts)' + (analysis.passesTwoOfThree ? '' : ' - Fails 2/3');
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
 * Updated for multi-semester support
 */
function calculateGPAs() {
    try {
        const selectedSemester = gpaCalculatorData.selectedSemester || 'semester2';
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

            const analysis = bcpsSemesterAnalysis(classData.quarters, selectedSemester);
            
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
            
            const credits = classData.userCredits ?? classData.credits ?? 0.5;
            const basePoints = getUnweightedPoints(analysis.semesterLetter);
            const weightedPoints = getWeightedPoints(analysis.semesterLetter, classData.type);
            
            totalCredits += credits;
            totalUnweightedPoints += basePoints * credits;
            totalWeightedPoints += weightedPoints * credits;
            
            if (classData.isCore) {
                coreCredits += credits;
                const corePoints = getCorePoints(analysis.semesterLetter, classData.type);
                totalCorePoints += corePoints * credits;
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
                isCore: classData.isCore,
                credits: credits,
                hasS1Grades: classData.hasS1Grades,
                hasS2Grades: classData.hasS2Grades
            });
        });
        
        if (missingClasses.length > 0) {
            warnings.push(`Missing quarter/exam grades for ${missingClasses.length} class${missingClasses.length === 1 ? '' : 'es'}: ${missingClasses.join(', ')}.`);
        }
        
        if (eocClasses.length > 0) {
            warnings.push(`EOC weighting (15/15/10/15/15/30) applies to: ${eocClasses.join(', ')}. This tool currently uses the standard 37.5/37.5/25 formula—verify these grades manually.`);
        }

        const baseline = gpaCalculatorData.baselineStats;
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

        // Core GPA cumulative projection — use computed QP when available (more accurate)
        let coreProjected = null;
        let coreDelta = null;
        if (baseline && coreCredits > 0) {
            const baseCoreCredits = baseline.baseCoreCredits ?? null;
            const baseCoreQP = baseline.baseCoreQualityPoints ?? null;
            const displayCoreGPA = baseline.coreGPA ?? baseline.computedCoreGPA ?? null;
            if (baseCoreCredits !== null && baseCoreQP !== null) {
                // Use actual computed quality points (no rounding loss)
                const combinedCoreCredits = baseCoreCredits + coreCredits;
                if (combinedCoreCredits > 0) {
                    const projectedCoreValue = (baseCoreQP + totalCorePoints) / combinedCoreCredits;
                    coreProjected = roundGPA(projectedCoreValue);
                    if (displayCoreGPA !== null) {
                        coreDelta = projectedCoreValue - displayCoreGPA;
                    }
                }
            } else if (baseCoreCredits !== null && displayCoreGPA !== null) {
                // Fallback: reconstruct QP from GPA × credits (less accurate)
                const reconstructedQP = displayCoreGPA * baseCoreCredits;
                const combinedCoreCredits = baseCoreCredits + coreCredits;
                if (combinedCoreCredits > 0) {
                    const projectedCoreValue = (reconstructedQP + totalCorePoints) / combinedCoreCredits;
                    coreProjected = roundGPA(projectedCoreValue);
                    coreDelta = projectedCoreValue - displayCoreGPA;
                }
            }
        }

        gpaCalculatorData.projectedGPAs = {
            unweighted: totalCredits > 0 ? roundGPA(totalUnweightedPoints / totalCredits) : null,
            weighted: totalCredits > 0 ? roundGPA(totalWeightedPoints / totalCredits) : null,
            core: coreCredits > 0 ? roundGPA(totalCorePoints / coreCredits) : null,
            coreProjected,
            coreDelta,
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
    } catch (error) {
        /* silent */
        // Silent error handling for production
    }
}

/**
 * Gets unweighted quality points for a letter grade
 * Focus/BCPS flattens plus grades: B+ = 3.0 (not 3.5), C+ = 2.0, D+ = 1.0
 */
function getUnweightedPoints(letter) {
    const points = {
        'A': 4.0, 'B+': 3.0, 'B': 3.0, 'C+': 2.0, 'C': 2.0,
        'D+': 1.0, 'D': 1.0, 'F': 0.0
    };
    return points[letter] || 0;
}

/**
 * Gets weighted quality points for a letter grade and course type
 * Weighted scale keeps the plus values (B+ = 3.5, C+ = 2.5, D+ = 1.5)
 * then adds course-type bonus on top
 */
function getWeightedPoints(letter, courseType) {
    const basePoints = WEIGHTED_BASE_POINTS[letter] || 0;

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
 * Gets core quality points for a letter grade and course type
 * Core GPA uses SMALLER bonuses than weighted: +0.5 Honors, +1.0 AP/IB
 */
function getCorePoints(letter, courseType) {
    const basePoints = WEIGHTED_BASE_POINTS[letter] || 0;

    if (!BCPS_WEIGHT_ELIGIBLE_GRADES.has(letter)) {
        return basePoints;
    }

    switch (courseType) {
        case 'AP':
        case 'AICE':
        case 'IB':
        case 'DualEnrollment':
            return basePoints + 1.0;
        case 'Honors':
        case 'Hon':
        case 'hon':
        case 'PreAP':
        case 'PreAICE':
        case 'PreIB':
        case 'Gifted':
            return basePoints + 0.5;
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
        const selectedSemester = gpaCalculatorData.selectedSemester || 'semester2';
        const gradeFields = getGradeFieldsForSemester(selectedSemester);
        const fieldNames = gradeFields.map(f => f.field);
        const missing = [];
        const warnings = [];

        gpaCalculatorData.selectedClasses.forEach((classData) => {
            if (!classData || !classData.quarters) return;

            // For full year mode, allow partial data but track it
            if (selectedSemester === 'fullYear') {
                const hasS1 = classData.quarters.q1 && classData.quarters.q2;
                const hasS2 = classData.quarters.q3 && classData.quarters.q4;

                // If no complete semester data at all, mark as missing
                if (!hasS1 && !hasS2) {
                    missing.push({ className: classData.name, classId: classData.id, field: 'fullYear' });
                }
                // Track partial data as warning
                else if (!hasS1 || !hasS2) {
                    warnings.push(classData.name + ' has only ' + (hasS1 ? 'S1' : 'S2') + ' grades');
                }
            } else {
                // Single semester - require all fields
                fieldNames.forEach((field) => {
                    const value = classData.quarters[field];
                    const isMissing = !value;
                    markGradeSelectState(classData.id, field, isMissing);
                    if (isMissing) {
                        missing.push({ className: classData.name, classId: classData.id, field });
                    }
                });
            }
        });

        if (missing.length > 0) {
            if (showAlert) {
                const missingClasses = [...new Set(missing.map(item => item.className))];
                let gradeLabels;
                if (selectedSemester === 'semester2') {
                    gradeLabels = 'Q3, Q4, and Exam';
                } else if (selectedSemester === 'fullYear') {
                    gradeLabels = 'at least one complete semester of';
                } else {
                    gradeLabels = 'Q1, Q2, and Exam';
                }
                showToast('Please enter ' + gradeLabels + ' grades for: ' + missingClasses.join(', ') + '.', 'warning');
            }

            const firstMissing = missing[0];
            if (firstMissing && typeof document !== 'undefined' && firstMissing.field !== 'fullYear') {
                const select = document.querySelector('.fgs-gpa-grade-select[data-class-id="' + firstMissing.classId + '"][data-field="' + firstMissing.field + '"]');
                if (select && typeof select.focus === 'function') {
                    select.focus();
                }
            }
            return false;
        }

        // Partial year data warnings are non-blocking - the UI already shows warnings per class

        return true;
    } catch (error) {
        return false;
    }
}

if (typeof window !== 'undefined') {
    window.validateGPAGradeInputs = validateGPAGradeInputs;
}

// ===========================================
// FORGIVENESS SIMULATOR FUNCTIONS
// ===========================================

/**
 * Calculates the GPA impact of forgiveness actions.
 * Unweighted (State) GPA: old D/F grade is REMOVED, new grade REPLACES it.
 * Weighted (District) GPA: old grade STAYS, new grade is ADDED on top.
 */
function calculateForgiveness() {
	try {
		const baseline = gpaCalculatorData.baselineStats;
		if (!baseline) {
			forgivenessData.results = null;
			return;
		}

		const actions = forgivenessData.selectedActions;
		if (actions.length === 0) {
			forgivenessData.results = null;
			return;
		}

		const baseCredits = baseline.totalCreditsAttempted ?? baseline.totalCreditsEarned ?? null;
		const baseQP = baseline.qualityPoints ??
			(baseline.cumulativeGPA !== null && baseCredits !== null ? baseline.cumulativeGPA * baseCredits : null);

		if (baseCredits === null || baseQP === null) {
			forgivenessData.results = null;
			return;
		}

		// --- Unweighted (State) GPA: remove old, add new ---
		let newUnweightedQP = baseQP;
		let newUnweightedCredits = baseCredits;

		actions.forEach((action) => {
			newUnweightedQP -= getUnweightedPoints(action.oldGrade) * action.oldCredits;
			newUnweightedQP += getUnweightedPoints(action.newGrade) * action.newCredits;
			newUnweightedCredits = newUnweightedCredits - action.oldCredits + action.newCredits;
		});

		const projectedUnweighted = newUnweightedCredits > 0 ? roundGPA(newUnweightedQP / newUnweightedCredits) : null;
		const unweightedDelta = (projectedUnweighted !== null && baseline.cumulativeGPA !== null)
			? projectedUnweighted - baseline.cumulativeGPA : null;

		// --- Weighted (District) GPA: old stays, new added on top ---
		const baseWeightedQP = (baseline.weightedGPA !== null && baseCredits !== null)
			? baseline.weightedGPA * baseCredits : null;

		let projectedWeighted = null;
		let weightedDelta = null;

		if (baseWeightedQP !== null) {
			let newWeightedQP = baseWeightedQP;
			let newWeightedCredits = baseCredits;

			actions.forEach((action) => {
				newWeightedQP += getWeightedPoints(action.newGrade, action.newType) * action.newCredits;
				newWeightedCredits += action.newCredits;
			});

			projectedWeighted = newWeightedCredits > 0 ? roundGPA(newWeightedQP / newWeightedCredits) : null;
			weightedDelta = (projectedWeighted !== null && baseline.weightedGPA !== null)
				? projectedWeighted - baseline.weightedGPA : null;
		}

		const hasCoreClasses = actions.some((a) => a.isCore);

		// --- Core GPA: remove old core QP, add new core QP ---
		let projectedCore = null;
		let coreDelta = null;
		const coreActions = actions.filter((a) => a.isCore);

		if (coreActions.length > 0) {
			const baseCoreCredits = baseline.baseCoreCredits ?? null;
			const baseCoreQP = baseline.baseCoreQualityPoints ?? null;
			const displayCoreGPA = baseline.coreGPA ?? baseline.computedCoreGPA ?? null;

			if (baseCoreCredits !== null && displayCoreGPA !== null) {
				const startQP = baseCoreQP !== null ? baseCoreQP : displayCoreGPA * baseCoreCredits;
				let newCoreQP = startQP;
				let newCoreCredits = baseCoreCredits;

				coreActions.forEach((action) => {
					newCoreQP -= getCorePoints(action.oldGrade, action.oldType) * action.oldCredits;
					newCoreQP += getCorePoints(action.newGrade, action.newType) * action.newCredits;
					newCoreCredits = newCoreCredits - action.oldCredits + action.newCredits;
				});

				if (newCoreCredits > 0) {
					projectedCore = roundGPA(newCoreQP / newCoreCredits);
					coreDelta = projectedCore - displayCoreGPA;
				}
			}
		}

		forgivenessData.results = {
			unweighted: {
				baseline: baseline.cumulativeGPA,
				projected: projectedUnweighted,
				delta: unweightedDelta,
				baseCredits: baseCredits,
				newCredits: newUnweightedCredits
			},
			weighted: {
				baseline: baseline.weightedGPA,
				projected: projectedWeighted,
				delta: weightedDelta,
				baseCredits: baseCredits,
				newCredits: baseCredits + actions.reduce((sum, a) => sum + a.newCredits, 0)
			},
			core: hasCoreClasses ? {
				baseline: baseline.coreGPA ?? baseline.computedCoreGPA ?? null,
				projected: projectedCore,
				delta: coreDelta
			} : null,
			hasCoreClasses: hasCoreClasses,
			actionCount: actions.length
		};

	} catch (error) {
		forgivenessData.results = null;
	}
}

/**
 * Renders the forgiveness panel: eligible class cards + live results.
 * Called when forgiveness panel is shown and when selections change.
 * Note: Uses innerHTML for templating consistently with renderClassList() and renderResults()
 * in the same file. All data is sourced from DOM-scraped grades (no user-submitted content).
 */
function renderForgivenessPanel() {
	try {
		const listContainer = document.getElementById('fgs-forgiveness-class-list');
		const resultsContainer = document.getElementById('fgs-forgiveness-results');
		const noEligible = document.getElementById('fgs-forgiveness-no-eligible');

		if (!listContainer) return;

		// Clear the list
		while (listContainer.firstChild) {
			listContainer.removeChild(listContainer.firstChild);
		}

		if (forgivenessData.eligibleClasses.length === 0) {
			if (noEligible) noEligible.style.display = 'block';
			if (resultsContainer) resultsContainer.textContent = '';
			return;
		}

		// Show "no eligible" hint if only manual classes exist (no detected D/F courses)
		const hasExtractedEligible = forgivenessData.eligibleClasses.some((c) => !c.isManual);
		if (noEligible) noEligible.style.display = hasExtractedEligible ? 'none' : 'block';

		forgivenessData.eligibleClasses.forEach((classEntry) => {
			const isSelected = forgivenessData.selectedActions.some((a) => a.classId === classEntry.id);
			const action = forgivenessData.selectedActions.find((a) => a.classId === classEntry.id);

			const card = document.createElement('div');
			card.className = 'fgs-forgiveness-class-card' + (isSelected ? ' fgs-forgiveness-selected' : '');
			if (classEntry.isManual) card.className += ' fgs-forgiveness-manual-card';
			card.setAttribute('data-class-id', classEntry.id);

			// Build header
			const headerDiv = document.createElement('div');
			headerDiv.className = 'fgs-forgiveness-card-header';

			const infoDiv = document.createElement('div');
			infoDiv.className = 'fgs-forgiveness-card-info';

			// Manual classes get an editable name input; extracted classes get static text
			let nameDiv;
			if (classEntry.isManual) {
				nameDiv = document.createElement('input');
				nameDiv.type = 'text';
				nameDiv.className = 'fgs-forgiveness-class-name fgs-forgiveness-manual-name';
				nameDiv.value = classEntry.name;
				nameDiv.placeholder = 'Course name';
				nameDiv.addEventListener('input', (e) => {
					classEntry.name = e.target.value;
				});
				// Prevent card toggle when clicking input
				nameDiv.addEventListener('click', (e) => { e.stopPropagation(); });
			} else {
				nameDiv = document.createElement('div');
				nameDiv.className = 'fgs-forgiveness-class-name';
				nameDiv.title = classEntry.name;
				nameDiv.textContent = classEntry.name;
			}

			const metaDiv = document.createElement('div');
			metaDiv.className = 'fgs-forgiveness-card-meta';

			const yearSpan = document.createElement('span');
			yearSpan.className = 'fgs-forgiveness-year';
			yearSpan.textContent = classEntry.isManual ? 'Manual' : classEntry.year;

			const semSpan = document.createElement('span');
			semSpan.className = 'fgs-forgiveness-semester-type';
			semSpan.textContent = classEntry.semesterType;

			const typeSpan = document.createElement('span');
			typeSpan.className = 'fgs-gpa-class-type ' + classEntry.type.toLowerCase();
			typeSpan.textContent = getTypeLabel(classEntry.type);

			metaDiv.appendChild(yearSpan);
			metaDiv.appendChild(semSpan);
			metaDiv.appendChild(typeSpan);

			if (classEntry.isCore) {
				const coreBadge = document.createElement('span');
				coreBadge.className = 'fgs-gpa-core-tag';
				coreBadge.textContent = 'Core';
				metaDiv.appendChild(coreBadge);
			}

			infoDiv.appendChild(nameDiv);
			infoDiv.appendChild(metaDiv);

			const gradeBadge = document.createElement('span');
			gradeBadge.className = 'fgs-forgiveness-grade-badge';
			gradeBadge.textContent = classEntry.semesterGrade;

			headerDiv.appendChild(infoDiv);
			headerDiv.appendChild(gradeBadge);
			card.appendChild(headerDiv);

			// Build edit row if selected
			if (isSelected) {
				const editRow = document.createElement('div');
				editRow.className = 'fgs-forgiveness-edit-row';

				// Old grade override field (lets user correct the detected grade)
				const oldGradeField = document.createElement('div');
				oldGradeField.className = 'fgs-forgiveness-edit-field';
				const oldGradeLabel = document.createElement('label');
				oldGradeLabel.textContent = 'Old Grade:';
				const oldGradeSelect = document.createElement('select');
				oldGradeSelect.className = 'fgs-forgiveness-old-grade';
				oldGradeSelect.setAttribute('data-class-id', classEntry.id);
				['D+', 'D', 'F'].forEach((g) => {
					const opt = document.createElement('option');
					opt.value = g;
					opt.textContent = g;
					if (action && action.oldGrade === g) opt.selected = true;
					oldGradeSelect.appendChild(opt);
				});
				oldGradeField.appendChild(oldGradeLabel);
				oldGradeField.appendChild(oldGradeSelect);

				// New grade field
				const gradeField = document.createElement('div');
				gradeField.className = 'fgs-forgiveness-edit-field';
				const gradeLabel = document.createElement('label');
				gradeLabel.textContent = 'New Grade:';
				const gradeSelect = document.createElement('select');
				gradeSelect.className = 'fgs-forgiveness-new-grade';
				gradeSelect.setAttribute('data-class-id', classEntry.id);
				FORGIVENESS_NEW_GRADE_OPTIONS.forEach((g) => {
					const opt = document.createElement('option');
					opt.value = g;
					opt.textContent = g;
					if (action && action.newGrade === g) opt.selected = true;
					gradeSelect.appendChild(opt);
				});
				gradeField.appendChild(gradeLabel);
				gradeField.appendChild(gradeSelect);

				// Credits field
				const creditsField = document.createElement('div');
				creditsField.className = 'fgs-forgiveness-edit-field';
				const creditsLabel = document.createElement('label');
				creditsLabel.textContent = 'Credits:';
				const creditsSelect = document.createElement('select');
				creditsSelect.className = 'fgs-forgiveness-credits';
				creditsSelect.setAttribute('data-class-id', classEntry.id);
				CREDIT_OPTIONS.forEach((c) => {
					const opt = document.createElement('option');
					opt.value = c;
					opt.textContent = c;
					if (action && action.newCredits === c) opt.selected = true;
					creditsSelect.appendChild(opt);
				});
				creditsField.appendChild(creditsLabel);
				creditsField.appendChild(creditsSelect);

				// Type field
				const typeField = document.createElement('div');
				typeField.className = 'fgs-forgiveness-edit-field';
				const typeLabel = document.createElement('label');
				typeLabel.textContent = 'Type:';
				const typeSelect = document.createElement('select');
				typeSelect.className = 'fgs-forgiveness-type';
				typeSelect.setAttribute('data-class-id', classEntry.id);
				COURSE_TYPE_OPTIONS.forEach((optDef) => {
					const opt = document.createElement('option');
					opt.value = optDef.value;
					opt.textContent = optDef.label;
					if (action && action.newType === optDef.value) opt.selected = true;
					typeSelect.appendChild(opt);
				});
				typeField.appendChild(typeLabel);
				typeField.appendChild(typeSelect);

				editRow.appendChild(oldGradeField);
				editRow.appendChild(gradeField);
				editRow.appendChild(creditsField);
				editRow.appendChild(typeField);
				card.appendChild(editRow);

				// Wire dropdown events
				oldGradeSelect.addEventListener('change', (e) => {
					if (action) {
						action.oldGrade = e.target.value;
						// Also update the badge text
						gradeBadge.textContent = e.target.value;
					}
					calculateForgiveness();
					renderForgivenessResults();
				});
				gradeSelect.addEventListener('change', (e) => {
					if (action) action.newGrade = e.target.value;
					calculateForgiveness();
					renderForgivenessResults();
				});
				creditsSelect.addEventListener('change', (e) => {
					if (action) action.newCredits = parseFloat(e.target.value);
					calculateForgiveness();
					renderForgivenessResults();
				});
				typeSelect.addEventListener('change', (e) => {
					const val = e.target.value;
					if (action) {
						action.newType = (val === 'auto') ? classEntry.type : val;
						// For manual classes, also update old type since user defines everything
						if (classEntry.isManual) {
							action.oldType = action.newType;
							classEntry.type = action.newType;
						}
					}
					calculateForgiveness();
					renderForgivenessResults();
				});
			}

			// Manual classes get a remove button
			if (classEntry.isManual) {
				const removeBtn = document.createElement('button');
				removeBtn.className = 'fgs-forgiveness-remove-manual';
				removeBtn.textContent = '\u00d7';
				removeBtn.title = 'Remove this class';
				removeBtn.addEventListener('click', (e) => {
					e.stopPropagation();
					removeManualForgivenessClass(classEntry.id);
				});
				headerDiv.appendChild(removeBtn);
			}

			listContainer.appendChild(card);

			// Wire card header click to toggle selection
			headerDiv.addEventListener('click', () => {
				toggleForgivenessSelection(classEntry);
			});
		});

		renderForgivenessResults();
	} catch (error) {
		// Silent error handling
	}
}

/**
 * Toggles selection of a class for forgiveness.
 */
function toggleForgivenessSelection(classEntry) {
	const idx = forgivenessData.selectedActions.findIndex((a) => a.classId === classEntry.id);
	if (idx >= 0) {
		forgivenessData.selectedActions.splice(idx, 1);
	} else {
		if (forgivenessData.selectedActions.length >= MAX_FORGIVENESS_USES) {
			if (typeof showToast === 'function') {
				showToast('BCPS allows a maximum of ' + MAX_FORGIVENESS_USES + ' credit forgiveness uses.', 'warning', 4000);
			}
			return;
		}
		forgivenessData.selectedActions.push({
			classId: classEntry.id,
			oldGrade: classEntry.semesterGrade,
			oldCredits: classEntry.credits,
			oldType: classEntry.type,
			newGrade: 'C',
			newCredits: classEntry.credits,
			newType: classEntry.type,
			isCore: classEntry.isCore
		});
	}
	calculateForgiveness();
	renderForgivenessPanel();
}

/**
 * Renders the live forgiveness results using existing buildGPASummaryRow.
 * Note: Uses innerHTML for result rendering consistently with renderResults() in the same file.
 * All values are computed internally from grade point calculations (no user-submitted HTML).
 */
function renderForgivenessResults() {
	try {
		const container = document.getElementById('fgs-forgiveness-results');
		if (!container) return;

		const results = forgivenessData.results;

		if (!results) {
			container.textContent = '';
			const emptyMsg = document.createElement('div');
			emptyMsg.className = 'fgs-forgiveness-empty-results';
			emptyMsg.textContent = 'Select a class above to simulate grade forgiveness.';
			container.appendChild(emptyMsg);
			return;
		}

		// Clear container
		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}

		const summaryRowsDiv = document.createElement('div');
		summaryRowsDiv.className = 'fgs-gpa-summary-rows';

		// Unweighted row
		if (results.unweighted.baseline !== null || results.unweighted.projected !== null) {
			const ruleLabel = document.createElement('div');
			ruleLabel.className = 'fgs-forgiveness-rule-label';
			ruleLabel.textContent = 'Unweighted (State) \u2014 old grade removed';
			summaryRowsDiv.appendChild(ruleLabel);

			const creditsDetail = formatCredits(results.unweighted.baseCredits) + ' \u2192 ' + formatCredits(results.unweighted.newCredits) + ' credits';
			const rowDiv = document.createElement('div');
			// buildGPASummaryRow returns an HTML string - this is safe as all values are computed internally
			rowDiv.innerHTML = buildGPASummaryRow('Cumulative GPA', results.unweighted.baseline, results.unweighted.projected, results.unweighted.delta, creditsDetail);
			while (rowDiv.firstChild) {
				summaryRowsDiv.appendChild(rowDiv.firstChild);
			}
		}

		// Weighted row
		if (results.weighted.baseline !== null || results.weighted.projected !== null) {
			const ruleLabel = document.createElement('div');
			ruleLabel.className = 'fgs-forgiveness-rule-label';
			ruleLabel.textContent = 'Weighted (District) \u2014 old grade kept + new added';
			summaryRowsDiv.appendChild(ruleLabel);

			const creditsDetail = formatCredits(results.weighted.baseCredits) + ' \u2192 ' + formatCredits(results.weighted.newCredits) + ' credits';
			const rowDiv = document.createElement('div');
			rowDiv.innerHTML = buildGPASummaryRow('Weighted GPA', results.weighted.baseline, results.weighted.projected, results.weighted.delta, creditsDetail);
			while (rowDiv.firstChild) {
				summaryRowsDiv.appendChild(rowDiv.firstChild);
			}
		}

		container.appendChild(summaryRowsDiv);

		// Per-class breakdown
		if (forgivenessData.selectedActions.length > 0) {
			const breakdownDiv = document.createElement('div');
			breakdownDiv.className = 'fgs-forgiveness-breakdown';

			forgivenessData.selectedActions.forEach((action) => {
				const cls = forgivenessData.eligibleClasses.find((c) => c.id === action.classId);
				const name = cls ? cls.name : 'Unknown';
				const oldPts = getUnweightedPoints(action.oldGrade);
				const newPts = getUnweightedPoints(action.newGrade);

				const item = document.createElement('div');
				item.className = 'fgs-forgiveness-breakdown-item';

				const nameSpan = document.createElement('span');
				nameSpan.className = 'fgs-forgiveness-breakdown-name';
				nameSpan.textContent = name;

				const gradeSpan = document.createElement('span');
				gradeSpan.className = 'fgs-forgiveness-breakdown-grades';
				gradeSpan.textContent = action.oldGrade + ' \u2192 ' + action.newGrade + ' (' + oldPts.toFixed(1) + ' \u2192 ' + newPts.toFixed(1) + ' pts)';

				item.appendChild(nameSpan);
				item.appendChild(gradeSpan);
				breakdownDiv.appendChild(item);
			});

			container.appendChild(breakdownDiv);
		}

		// Core GPA row
		if (results.core && (results.core.baseline !== null || results.core.projected !== null)) {
			const ruleLabel = document.createElement('div');
			ruleLabel.className = 'fgs-forgiveness-rule-label';
			ruleLabel.textContent = 'Core GPA \u2014 old grade removed, new added';
			summaryRowsDiv.appendChild(ruleLabel);

			const rowDiv = document.createElement('div');
			rowDiv.innerHTML = buildGPASummaryRow('Core GPA', results.core.baseline, results.core.projected, results.core.delta, '');
			while (rowDiv.firstChild) {
				summaryRowsDiv.appendChild(rowDiv.firstChild);
			}
			const coreDisclaimer = document.createElement('div');
			coreDisclaimer.className = 'fgs-gpa-core-estimate-note';
			coreDisclaimer.textContent = 'Core GPA is a rough estimate. Focus does not identify core classes.';
			summaryRowsDiv.appendChild(coreDisclaimer);
		} else if (results.hasCoreClasses) {
			const coreNote = document.createElement('div');
			coreNote.className = 'fgs-forgiveness-core-note';
			coreNote.textContent = 'Core GPA will also be affected. Show all course history years for exact numbers.';
			container.appendChild(coreNote);
		}

	} catch (error) {
		// Silent error handling
	}
}

/**
 * Shows the forgiveness panel (hides GPA step 1/2)
 */
function showForgivenessPanel() {
	try {
		const modeSelect = document.getElementById('fgs-gpa-mode-select');
		const step1 = document.getElementById('fgs-gpa-step-1');
		const step2 = document.getElementById('fgs-gpa-step-2');
		const forgivenessPanel = document.getElementById('fgs-forgiveness-panel');

		if (modeSelect) modeSelect.style.display = 'none';
		if (step1) step1.style.display = 'none';
		if (step2) step2.style.display = 'none';
		if (forgivenessPanel) forgivenessPanel.style.display = 'flex';

		// Extract all classes if not done yet
		if (forgivenessData.allClasses.length === 0) {
			extractAllClassData();
		}

		// Make sure baseline stats are available
		if (!gpaCalculatorData.baselineStats) {
			extractBaselineGPAStats(false);
		}

		renderForgivenessPanel();
		setPopupSizeForInterface('gpa-calculator');
		setTimeout(() => {
			if (typeof adjustPopupSize === 'function') adjustPopupSize();
		}, 100);
	} catch (error) {
		// Silent error handling
	}
}


/**
 * Adds a manually-created class to the forgiveness simulator.
 * Creates a new entry in eligibleClasses with editable name, grade, credits, and type.
 */
let manualForgivenessCounter = 0;
function addManualForgivenessClass() {
	try {
		if (forgivenessData.selectedActions.length >= MAX_FORGIVENESS_USES) {
			if (typeof showToast === 'function') {
				showToast('BCPS allows a maximum of ' + MAX_FORGIVENESS_USES + ' credit forgiveness uses.', 'warning', 4000);
			}
			return;
		}
		manualForgivenessCounter++;
		const manualId = 'manual_' + manualForgivenessCounter;

		const classEntry = {
			id: manualId,
			name: 'Manual Class ' + manualForgivenessCounter,
			year: '',
			type: 'Regular',
			isCore: false,
			credits: 0.5,
			semesterType: 'S1',
			semesterGrade: 'F',
			gradeSource: 'manual',
			quarters: {},
			isManual: true
		};

		forgivenessData.eligibleClasses.push(classEntry);

		// Auto-select the manual class
		forgivenessData.selectedActions.push({
			classId: manualId,
			oldGrade: 'F',
			oldCredits: 0.5,
			oldType: 'Regular',
			newGrade: 'C',
			newCredits: 0.5,
			newType: 'Regular',
			isCore: false
		});

		calculateForgiveness();
		renderForgivenessPanel();
	} catch (error) {
		// Silent error handling
	}
}

/**
 * Removes a manually-added class from the forgiveness simulator.
 */
function removeManualForgivenessClass(classId) {
	try {
		forgivenessData.eligibleClasses = forgivenessData.eligibleClasses.filter((c) => c.id !== classId);
		forgivenessData.selectedActions = forgivenessData.selectedActions.filter((a) => a.classId !== classId);
		calculateForgiveness();
		renderForgivenessPanel();
	} catch (error) {
		// Silent error handling
	}
}

/**
 * Shows the Core GPA accuracy help popup
 */
function showCoreGPAHelp() {
	const existing = document.getElementById('fgs-core-gpa-help-overlay');
	if (existing) { existing.remove(); return; }

	const overlay = document.createElement('div');
	overlay.id = 'fgs-core-gpa-help-overlay';
	overlay.className = 'fgs-core-gpa-help-overlay';

	const popup = document.createElement('div');
	popup.className = 'fgs-core-gpa-help-popup';

	const closeBtn = document.createElement('span');
	closeBtn.className = 'fgs-core-gpa-help-close';
	closeBtn.textContent = '\u00D7';
	closeBtn.addEventListener('click', () => overlay.remove());

	const title = document.createElement('h4');
	title.textContent = 'How to Get the Most Accurate Core GPA';

	const steps = document.createElement('ol');
	steps.className = 'fgs-core-gpa-help-steps';
	const stepTexts = [
		'Go to your <strong>Grades</strong> page in Focus.',
		'Scroll down to your <strong>course history</strong> section.',
		'Make sure <strong>all years</strong> are visible \u2014 from freshman year all the way to your current year. Click "Show All Years" if available.',
		'Set the <strong>page size</strong> to the maximum so all classes are on one page (not paginated).',
		'Verify that <strong>semester grades (S1, S2)</strong> are showing for each year. Enable "Show Exams" if needed.',
		'Make sure no classes are filtered out \u2014 click "Clear All Filters" if filters are on.',
		'Then open the GPA Calculator \u2014 it will automatically scan your past core classes and calculate your baseline.'
	];
	stepTexts.forEach(text => {
		const li = document.createElement('li');
		li.innerHTML = text;
		steps.appendChild(li);
	});

	const disclaimer = document.createElement('div');
	disclaimer.className = 'fgs-core-gpa-help-formula';
	disclaimer.innerHTML = '<strong>Important:</strong> Focus does not identify which classes are core. This tool uses its best guess based on course names. Core GPA is a <strong>rough estimate</strong>, not an exact value.';

	const note = document.createElement('p');
	note.className = 'fgs-core-gpa-help-note';
	note.textContent = 'The calculator scans your course history automatically. It does not matter what grade you are in \u2014 it detects all past years and core subjects on its own. Classes from other gradebook systems (e.g., Pinnacle) may only show a final year grade, which is used as a fallback.';

	popup.appendChild(closeBtn);
	popup.appendChild(title);
	popup.appendChild(steps);
	popup.appendChild(disclaimer);
	popup.appendChild(note);
	overlay.appendChild(popup);

	overlay.addEventListener('click', (e) => {
		if (e.target === overlay) overlay.remove();
	});

	document.body.appendChild(overlay);
}

/**
 * Renders the GPA results
 */
function renderResults() {
    try {
        const container = document.getElementById('fgs-gpa-results');
        if (!container) return;
        
        const projected = gpaCalculatorData.projectedGPAs;
        const baseline = projected.baseline;
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
        const coreBase = baseline?.coreGPA ?? baseline?.computedCoreGPA ?? null;
        const coreNew = projected.coreProjected ?? projected.core ?? null;
        const coreNewDelta = projected.coreDelta ?? null;
        if (coreBase !== null || coreNew !== null) {
            summaryRows.push(buildGPASummaryRow('Core GPA', coreBase, coreNew, coreNewDelta, ''));
            summaryRows.push('<div class="fgs-gpa-core-estimate-note">Core GPA is a rough estimate. Focus does not identify core classes.</div>');
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
            const labelText = baseline?.asOf ? `Baseline GPAs as of ${baseline.asOf}` : (baseline ? 'Baseline GPAs from Focus' : '');

            while (headerInfo.firstChild) headerInfo.removeChild(headerInfo.firstChild);

            const labelSpan = document.createElement('span');
            labelSpan.textContent = labelText;
            headerInfo.appendChild(labelSpan);
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

        // Clear any size classes that use !important and would override inline styles
        popup.classList.remove('size-small', 'size-medium', 'size-large', 'size-xlarge');

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
