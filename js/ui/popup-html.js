/**
 * POPUP HTML TEMPLATE
 * Contains the complete HTML structure for the floating grade calculator popup
 * This function returns the HTML string that gets injected into createFloatingPopup()
 * FIXED: Feedback box starts collapsed by default in HTML
 */

function getPopupHTML() {
    return `
        <div class="fgs-popup-header" id="fgs-drag-header">
            <span class="fgs-title">Grade Calc</span>
            <div class="fgs-controls">
                <button class="fgs-tutorial" id="fgs-tutorial" title="Tutorial">▶ Tutorial</button>
                <button class="fgs-new-features-btn" id="fgs-new-features-btn" title="New Features">✨ New</button>
                <button class="fgs-help" id="fgs-help" title="Help & Guide">?</button>
                <button class="fgs-settings" id="fgs-settings" title="Settings">⚙️</button>
                <button class="fgs-minimize" id="fgs-minimize">−</button>
                <button class="fgs-close" id="fgs-close">×</button>
            </div>
        </div>
        <div class="fgs-popup-content" id="fgs-content">
            
            <!-- SETTINGS DROPDOWN (Hidden by default) -->
            <div class="fgs-settings-dropdown" id="fgs-settings-dropdown" style="display: none;">
                <div class="fgs-settings-header">
                    <button class="fgs-settings-back" id="fgs-settings-back">← Back</button>
                    <h4>⚙️ Settings</h4>
                </div>
                <div class="fgs-settings-content">
                    <div class="fgs-setting-row">
                        <label>Popup Theme:</label>
                        <select class="fgs-theme-dropdown" id="fgs-popup-theme-select">
                            <option value="default">Default Blue</option>
                            <option value="transparent">Transparent Glass</option>
                            <option value="emerald">Emerald Green</option>
                            <option value="bright">Bright White</option>
                            <option value="sunset">Sunset Orange</option>
                            <option value="ocean">Ocean Teal</option>
                            <option value="purple">Purple Haze</option>
                            <option value="dark">Dark Mode</option>
                            <option value="forest">Forest Green</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- MAIN SELECTION SCREEN - Grade Calculator + GPA Calculator -->
            <div class="fgs-mode-selection" id="fgs-mode-selection" style="display: flex;">
                <div class="fgs-mode-header">
                    <h3>Grade Calculator</h3>
                </div>
                <button class="fgs-mode-btn" id="fgs-mode-grade">📊 Calculate grades</button>
                <button class="fgs-mode-btn fgs-mode-btn-gpa" id="fgs-mode-gpa">🎓 GPA Calculator</button>
            </div>
            
            <!-- AUTO-DETECTED GRADE CALCULATOR FORM -->
            <div class="fgs-calculator-form" id="fgs-calculator-form" style="display: none;">
                <div class="fgs-calc-header">
                    <button class="fgs-back-btn" id="fgs-back">← Back</button>
                </div>
                
                <input type="text" id="fgs-name" placeholder="Assignment Name (optional)" class="fgs-input" />
                <input type="number" id="fgs-earned" placeholder="Points Earned" class="fgs-input" />
                <input type="number" id="fgs-total" placeholder="Points Possible" class="fgs-input" />
                
                <!-- Category input for unweighted classes (hidden by auto-detection) -->
                <input type="text" id="fgs-category-input" placeholder="Category (optional - for reference only)" class="fgs-input" style="display: none;" />                
                <!-- Category dropdown for weighted classes (shown by auto-detection) -->
                <div class="fgs-category-container" id="fgs-category-container" style="display: none;">
                    <select id="fgs-category-dropdown" class="fgs-dropdown">
                        <option value="" disabled selected>Select Category</option>
                    </select>
                </div>
                
                <div class="fgs-checkbox-container">
                    <input type="checkbox" id="fgs-keep-values" checked>
                    <label for="fgs-keep-values">Keep values after adding</label>
                </div>
                
                <button class="fgs-btn fgs-btn-primary" id="fgs-add">Add Assignment</button>
                <button class="fgs-btn fgs-btn-secondary" id="fgs-reset">Reset All</button>
                
                <div class="fgs-undo-redo-container">
                    <button class="fgs-btn fgs-btn-undo" id="fgs-undo">↶ Undo</button>
                    <button class="fgs-btn fgs-btn-redo" id="fgs-redo">↷ Redo</button>
                </div>
            </div>
            
            <!-- GPA CALCULATOR WIZARD -->
            <div class="fgs-gpa-calculator" id="fgs-gpa-calculator" style="display: none;">
                
                <!-- GPA Step 1: Class Selection -->
                <div class="fgs-gpa-step" id="fgs-gpa-step-1">
                    <div class="fgs-gpa-header">
                        <button class="fgs-gpa-back" id="fgs-gpa-back">← Back</button>
                        <span class="fgs-gpa-step-indicator">[Step 1 of 2]</span>
                    </div>
                    <div class="fgs-gpa-content">
                        <h3>BCPS Semester GPA Calculator</h3>
                        <p class="fgs-gpa-subheading">Focus grades are auto-filled when available. Confirm or adjust Q1, Q2, and Semester Exam letters for each course.</p>

                        <div class="fgs-gpa-instruction" id="fgs-gpa-no-classes" style="display: none;">
                            <p>⚠️ <strong>No classes found.</strong> Make sure you're on the <strong>Grades</strong> tab in Focus for this feature to work properly.</p>
                        </div>

                        <div class="fgs-gpa-class-list" id="fgs-gpa-class-list">
                            <!-- Classes will be dynamically populated here -->
                        </div>
                        <div class="fgs-gpa-actions">
                            <select class="fgs-gpa-add-dropdown" id="fgs-gpa-add-class" style="display: none;">
                                <option value="">+ Add Class</option>
                            </select>
                            <button class="fgs-gpa-help" id="fgs-gpa-help">Need Help?</button>
                            <button class="fgs-gpa-help-video" id="fgs-gpa-help-video">Having problems?</button>
                        </div>
                        <div class="fgs-gpa-navigation">
                            <button class="fgs-gpa-create-manual" id="fgs-gpa-create-manual">+ Manual</button>
                            <button class="fgs-btn fgs-btn-primary" id="fgs-gpa-calculate">Calculate GPA →</button>
                        </div>
                    </div>
                </div>

                <!-- GPA Step 2: Results Display -->
                <div class="fgs-gpa-step" id="fgs-gpa-step-2" style="display: none;">
                    <div class="fgs-gpa-header">
                        <button class="fgs-gpa-back-to-classes" id="fgs-gpa-back-to-classes">← Back to Classes</button>
                        <span class="fgs-gpa-step-indicator">[Step 2 of 2]</span>
                    </div>
                    <div class="fgs-gpa-content">
                        <h3>Your BCPS GPA Snapshot</h3>
                        <p class="fgs-gpa-summary" id="fgs-gpa-summary"></p>
                        <div class="fgs-gpa-results" id="fgs-gpa-results">
                            <!-- Results will be dynamically populated here -->
                        </div>

                        <div class="fgs-gpa-disclaimer">
                            <p>📘 Uses BCPS Policy 6000.1: 37.5% Q1, 37.5% Q2, 25% Semester Exam with the 2-of-3 passing rule.</p>
                        </div>

                        <div class="fgs-gpa-info">
                            <p>BCPS weighting: Q1 37.5% • Q2 37.5% • Exam 25%</p>
                            <p id="fgs-gpa-class-count">• 0 classes calculated</p>
                            <p>• Honors +1 • AP/AICE/IB/DE +2 (C or higher)</p>
                        </div>
                        <div class="fgs-gpa-navigation">
                            <button class="fgs-gpa-help-results" id="fgs-gpa-help-results">Need Help?</button>
                        </div>
                    </div>
                </div>

                <!-- Manual Class Creation Modal -->
                <div class="fgs-gpa-manual-modal" id="fgs-gpa-manual-modal" style="display: none;">
                    <div class="fgs-gpa-manual-header">
                        <h4>Create Manual Class</h4>
                        <button class="fgs-gpa-manual-close" id="fgs-gpa-manual-close">×</button>
                    </div>
                    <div class="fgs-gpa-manual-content">
                        <input type="text" id="fgs-manual-class-name" class="fgs-manual-input" placeholder="Class Name (e.g., Dual Enrollment Math)" />

                        <label class="fgs-manual-label">Course Type:</label>
                        <select id="fgs-manual-class-type" class="fgs-manual-select">
                            <option value="Regular">Regular</option>
                            <option value="Honors">Honors</option>
                            <option value="AP">AP</option>
                            <option value="AICE">AICE</option>
                            <option value="IB">IB</option>
                            <option value="DualEnrollment" selected>Dual Enrollment</option>
                            <option value="PreAP">Pre-AP</option>
                            <option value="PreAICE">Pre-AICE</option>
                            <option value="PreIB">Pre-IB</option>
                            <option value="Gifted">Gifted</option>
                        </select>

                        <div class="fgs-manual-grades">
                            <div class="fgs-manual-grade-box">
                                <label class="fgs-manual-label">Q1 Grade:</label>
                                <select id="fgs-manual-q1" class="fgs-manual-grade-select">
                                    <option value="">--</option>
                                    <option value="A">A</option>
                                    <option value="B+">B+</option>
                                    <option value="B">B</option>
                                    <option value="C+">C+</option>
                                    <option value="C">C</option>
                                    <option value="D+">D+</option>
                                    <option value="D">D</option>
                                    <option value="F">F</option>
                                </select>
                            </div>

                            <div class="fgs-manual-grade-box">
                                <label class="fgs-manual-label">Q2 Grade:</label>
                                <select id="fgs-manual-q2" class="fgs-manual-grade-select">
                                    <option value="">--</option>
                                    <option value="A">A</option>
                                    <option value="B+">B+</option>
                                    <option value="B">B</option>
                                    <option value="C+">C+</option>
                                    <option value="C">C</option>
                                    <option value="D+">D+</option>
                                    <option value="D">D</option>
                                    <option value="F">F</option>
                                </select>
                            </div>

                            <div class="fgs-manual-grade-box">
                                <label class="fgs-manual-label">Exam Grade:</label>
                                <select id="fgs-manual-exam" class="fgs-manual-grade-select">
                                    <option value="">--</option>
                                    <option value="A">A</option>
                                    <option value="B+">B+</option>
                                    <option value="B">B</option>
                                    <option value="C+">C+</option>
                                    <option value="C">C</option>
                                    <option value="D+">D+</option>
                                    <option value="D">D</option>
                                    <option value="F">F</option>
                                    <option value="EX">Exempt</option>
                                </select>
                            </div>
                        </div>

                        <button class="fgs-btn fgs-btn-primary" id="fgs-manual-add-btn">Add Class</button>
                        <button class="fgs-btn fgs-btn-secondary" id="fgs-manual-cancel-btn">Cancel</button>
                    </div>
                </div>

            </div>

            <!-- FEEDBACK BOX - Always visible at bottom - FIXED: Starts collapsed -->
            <div class="fgs-feedback-box" id="fgs-feedback-box">
                <div class="fgs-feedback-header">
                    <span class="fgs-feedback-title">💬 Leave Feedback</span>
                    <button class="fgs-feedback-toggle" id="fgs-feedback-toggle">+</button>
                </div>
                <div class="fgs-feedback-content collapsed" id="fgs-feedback-content">
                    <textarea id="fgs-feedback-text" class="fgs-feedback-textarea" placeholder="Found a bug? Have a suggestion? Type your message here..." rows="2"></textarea>
                    <div class="fgs-feedback-actions">
                        <button id="fgs-send-feedback" class="fgs-feedback-send" disabled>📧 Send</button>
                        <span id="fgs-feedback-status" class="fgs-feedback-status"></span>
                    </div>
                </div>
            </div>
        </div>
    `;
}
