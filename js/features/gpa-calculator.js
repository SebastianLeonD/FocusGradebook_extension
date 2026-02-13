/**
 * CONTENT-GPA-CALCULATOR.JS  
 * PRODUCTION VERSION: Removed console logs and debug statements
 * Better spacing and visual hierarchy
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
    currentStep: 1,
    selectedSemester: 'semester2' // 'semester1', 'semester2', or 'fullYear'
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

                // Default credits based on current semester mode
                const selectedSemester = gpaCalculatorData.selectedSemester || 'semester2';
                let defaultCredits = DEFAULT_CREDITS[selectedSemester] || 0.5;

                // For full year, if class only has one semester of grades, default to 0.5
                if (selectedSemester === 'fullYear' && isSemesterOnlyClass) {
                    defaultCredits = 0.5;
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
 * Updated for multi-semester support
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
            const coreBadge = classData.isCore ? '<span class="fgs-gpa-core-tag">Core</span>' : '';
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
                    '<span class="fgs-gpa-grade-hint">' + hintDisplay + '</span>' +
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
                        '<div class="fgs-gpa-class-name" title="' + classData.name + '">' + classData.name + '</div>' +
                        '<div class="fgs-gpa-class-badges">' +
                            '<span class="fgs-gpa-class-type ' + classData.type.toLowerCase() + (classData.manualType ? ' manual' : '') + '">' + typeLabel + '</span>' +
                            coreBadge +
                            eocBadge +
                            '<button class="fgs-gpa-edit-type" data-class-id="' + classData.id + '" title="Set course type">＋</button>' +
                        '</div>' +
                        '<div class="fgs-gpa-type-editor" data-class-id="' + classData.id + '" style="display: ' + (classData.typeEditorOpen ? 'flex' : 'none') + ';">' +
                            '<select class="fgs-gpa-type-select" data-class-id="' + classData.id + '">' + typeOptions + '</select>' +
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
    } catch (error) {
        console.error('[FGS GPA] calculateGPAs error:', error);
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
    // Weighted base uses the plus scale (separate from unweighted)
    const weightedBase = {
        'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5, 'C': 2.0,
        'D+': 1.5, 'D': 1.0, 'F': 0.0
    };
    const basePoints = weightedBase[letter] || 0;

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
