/**
 * HELP MODAL HTML TEMPLATE
 * Contains the complete HTML structure for the comprehensive help guide modal
 * FIXED: Added personal contact section at bottom for direct bug communication
 */

function getHelpModalHTML() {

    return `
                <div class="fgs-help-overlay" id="fgs-help-overlay">
                    <div class="fgs-help-content">
                        <div class="fgs-help-header">
                            <h2>📚 Grade Calculator Help Guide</h2>
                            <button class="fgs-help-close" id="fgs-help-close" aria-label="Close help modal">×</button>
                        </div>
                        <div class="fgs-help-body">
                            <div class="fgs-help-section">
                                <h3>🎓 GPA Calculator Requirements</h3>
                                <div class="fgs-help-info">
                                    <p><strong>Essential Data Setup:</strong> Make sure Focus is showing the current school year and the quarter/semester grades you need.</p>
                                    <div class="fgs-help-tip">
                                        ⚠️ <strong>Critical:</strong> Turn ON Q1, Q2, Q3, Q4, year, course name, and semester grade columns in Focus. The calculator can only pull what is visible in the table.
                                    </div>
                                    <p><strong>What the calculator looks for:</strong></p>
                                    <p>• <strong>Current academic year grades</strong> (auto-detects 2025-2026)</p>
                                    <p>• <strong>Quarter letters</strong> for the current term</p>
                                    <p>• <strong>Course names and types</strong> (AP, AICE, IB, Honors, Regular, etc.)</p>
                                    <p>• <strong>Letter grades with percentages</strong> (e.g., “85% B”)</p>
                                </div>
                            </div>
                            
                            <div class="fgs-help-section">
                                <h3>✏️ Using the Grade Calculator</h3>
                                <div class="fgs-help-info">
                                    <p><strong>Accuracy:</strong> The grade calculator mirrors the Focus math and is usually within 1–2 percentage points of the official grade.</p>
                                </div>
                                <div class="fgs-help-steps">
                                    <div class="fgs-help-step">
                                        <span class="fgs-step-number">1</span>
                                        <p>Click <strong>Start Calculator</strong>. The extension auto-detects whether the class is weighted or regular.</p>
                                    </div>
                                    <div class="fgs-help-step">
                                        <span class="fgs-step-number">2</span>
                                        <p>Click any existing Focus score to edit it inline. The original value is saved so you can undo or reset later.</p>
                                    </div>
                                    <div class="fgs-help-step">
                                        <span class="fgs-step-number">3</span>
                                        <p>Enter points earned and possible for hypotheticals. For NG/Z/0 placeholders, set points possible to <code>0</code> so only the numerator is added.</p>
                                    </div>
                                    <div class="fgs-help-step">
                                        <span class="fgs-step-number">4</span>
                                        <p>Use <strong>Add Assignment</strong> to see the new grade instantly. Undo/redo lets you compare scenarios.</p>
                                    </div>
                                </div>
                            </div>
  
                            <div class="fgs-help-section">
                                <h3>🎯 GPA Calculator Workflow</h3>
                                <div class="fgs-help-steps">
                                    <div class="fgs-help-step">
                                        <span class="fgs-step-number">1</span>
                                        <p>Open <strong>GPA Calculator</strong> and confirm Q1, Q2, and Exam letters for each course. Missing fields highlight red until filled.</p>
                                    </div>
                                    <div class="fgs-help-step">
                                        <span class="fgs-step-number">2</span>
                                        <p>Need to override a course type? Click the <strong>＋</strong> badge and choose AP/AICE/IB/Honors/etc. Manual choices recalc GPA immediately.</p>
                                    </div>
                                    <div class="fgs-help-step">
                                        <span class="fgs-step-number">3</span>
                                        <p>Hit <em>Calculate GPA →</em>. The summary shows <strong>Cumulative</strong> and <strong>Weighted</strong> GPA before → after with credit totals and color-coded deltas.</p>
                                    </div>
                                </div>
                                <div class="fgs-help-tip">
                                    💡 <strong>Tutorial on demand:</strong> Tap <em>Having problems?</em> to launch the embedded video that walks through selecting “View Grades Summary” and running the GPA tool.</p>
                                </div>
                            </div>
  
                            <div class="fgs-help-section">
                                <h3>🛠️ Special Cases & Tips</h3>
                                <div class="fgs-help-case">
                                    <h4>📝 Exam Exemptions</h4>
                                    <p>Select <strong>Exempt</strong> in the Exam dropdown when a midterm/final is waived. The calculator redistributes the weight between the two quarter grades.</p>
                                </div>
  
                                <div class="fgs-help-case">
                                    <h4>🏷️ Manual Course Types</h4>
                                    <p>Auto-detection handles most classes, but manual overrides stay highlighted so you know which classes are custom.</p>
                                </div>
  
                                <div class="fgs-help-case">
                                    <h4>📌 Missing Grades & Z rows</h4>
                                    <p>Focus uses <strong>Z/0</strong> placeholders for missing work. When you edit those rows, the extension only adds to the numerator so you don’t double-count the denominator.</p>
                                </div>
                            </div>
  
                            <div class="fgs-help-section">
                                <h3>🙋 Need More Help?</h3>
                                <div class="fgs-help-contact">
                                    <div class="fgs-contact-email">
                                        <strong>📧 Direct Email:</strong> 
                                        <a href="mailto:focusgrades.feedback@gmail.com?subject=Focus Grade Calculator - Help&body=Hi! I'm having an issue with the Focus Grade Calculator.%0A%0AWhat happened:%0A%0AWhat I expected:%0A%0AThanks!" class="fgs-email-link" target="_blank" rel="noopener noreferrer">
                                            focusgrades.feedback@gmail.com
                                        </a>
                                    </div>
                                    <p style="margin-top: 12px;"><strong>Please include:</strong> a screenshot, your district/school, the Focus page, and steps to reproduce.</p>
                                    <div class="fgs-help-tip" style="margin-top: 12px;">
                                        💬 Current release: <strong>v1.6.2</strong>. I usually reply in the evenings—thanks for helping improve the extension!
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
}