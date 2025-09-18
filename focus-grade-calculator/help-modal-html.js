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
                            <button class="fgs-help-close" id="fgs-help-close">×</button>
                        </div>
                        <div class="fgs-help-body">
                            <div class="fgs-help-section">
                                <h3>🎓 GPA Calculator Requirements</h3>
                                <div class="fgs-help-info">
                                    <p><strong>Essential Data Setup:</strong> For accurate GPA calculations, make sure you have the following enabled in Focus:</p>
                                    <div class="fgs-help-tip">
                                        ⚠️ <strong>Critical:</strong> Toggle ON your current school year and quarter grades (Q1, Q2, Q3, Q4) plus semester grades in Focus settings. The calculator needs access to your grade data to work properly.
                                    </div>
                                    <p><strong>What the calculator looks for:</strong></p>
                                    <p>• <strong>Current academic year grades</strong> (automatically detects 2024-2025)</p>
                                    <p>• <strong>Quarter 1-4 grades</strong> depending on current period</p>
                                    <p>• <strong>Course names and types</strong> (AP, Honors, Regular, etc.)</p>
                                    <p>• <strong>Letter grades with percentages</strong> (like "85% B")</p>
                                </div>
                            </div>
                            
                            <div class="fgs-help-section">
                                <h3>🔧 How to Use the Grade Calculator</h3>
                                <div class="fgs-help-info">
                                    <p><strong>Accuracy:</strong> Grade calculations are approximately 90% accurate estimates. Results provide close approximations but may vary slightly from official calculations.</p>
                                </div>
                                <div class="fgs-help-steps">
                                    <div class="fgs-help-step">
                                        <span class="fgs-step-number">1</span>
                                        <p>Click <strong>"Start Calculator"</strong> - it automatically detects your class type</p>
                                    </div>
                                    <div class="fgs-help-step">
                                        <span class="fgs-step-number">2</span>
                                        <p>Enter the points you earned and points possible for a hypothetical assignment</p>
                                    </div>
                                    <div class="fgs-help-step">
                                        <span class="fgs-step-number">3</span>
                                        <p>Select the category (automatically shows if your class is weighted)</p>
                                    </div>
                                    <div class="fgs-help-step">
                                        <span class="fgs-step-number">4</span>
                                        <p>Click "Add Assignment" to see your new grade!</p>
                                    </div>
                                </div>
                            </div>
  
                            <div class="fgs-help-section">
                                <h3>🎯 Special Cases & Tips</h3>
                                
                                <div class="fgs-help-case">
                                    <h4>🔍 Fixing Missing/Zero Assignments (NG, Z, 0)</h4>
                                    <p>If you have assignments showing as <strong>NG</strong>, <strong>Z</strong>, or <strong>0 out of 100</strong>:</p>
                                    <div class="fgs-help-example">
                                        <p><strong>Example:</strong> You have a 0/100 on a test, but you actually got 85 points</p>
                                        <p><strong>Enter:</strong> Points Earned: <code>85</code>, Points Possible: <code>0</code></p>
                                        <p><strong>Why 0?</strong> This adds the missing 85 points without adding extra total points</p>
                                    </div>
                                </div>
  
                                <div class="fgs-help-case">
                                    <h4>📈 "What If" Scenarios</h4>
                                    <p>Want to see what your grade would be if you did better on an assignment?</p>
                                    <div class="fgs-help-example">
                                        <p><strong>Example:</strong> You got 3/5 on a quiz, but want to see your grade if you got 5/5</p>
                                        <p><strong>Enter:</strong> Points Earned: <code>2</code>, Points Possible: <code>0</code></p>
                                        <p><strong>Why?</strong> This adds the 2 missing points (5-3=2) without changing the total</p>
                                    </div>
                                </div>
  
                                <div class="fgs-help-case">
                                    <h4>➕ Adding New Assignments</h4>
                                    <p>To add a completely new assignment:</p>
                                    <div class="fgs-help-example">
                                        <p><strong>Enter:</strong> Points Earned: <code>90</code>, Points Possible: <code>100</code></p>
                                        <p>This adds a new 90/100 assignment to your grade calculation</p>
                                    </div>
                                </div>
                            </div>
  
                            <div class="fgs-help-section">
                                <h3>⚡ Quick Examples</h3>
                                <div class="fgs-help-examples">
                                    <div class="fgs-example-grid">
                                        <div class="fgs-example-item">
                                            <strong>Fix a 0/50 to 40/50:</strong><br>
                                            Enter: 40 / 0
                                        </div>
                                        <div class="fgs-example-item">
                                            <strong>Improve 60/100 to 85/100:</strong><br>
                                            Enter: 25 / 0
                                        </div>
                                        <div class="fgs-example-item">
                                            <strong>Add new 95/100 test:</strong><br>
                                            Enter: 95 / 100
                                        </div>
                                        <div class="fgs-example-item">
                                            <strong>Fix missing homework:</strong><br>
                                            Enter: 20 / 0 (if worth 20 pts)
                                        </div>
                                    </div>
                                </div>
                            </div>
  
                            <div class="fgs-help-section">
                                <h3>🎮 Controls</h3>
                                <div class="fgs-help-controls">
                                    <p><strong>↶ Undo:</strong> Remove the last assignment you added</p>
                                    <p><strong>↷ Redo:</strong> Bring back an assignment you undid</p>
                                    <p><strong>Reset All:</strong> Clear all hypothetical assignments</p>
                                    <p><strong>Keep values:</strong> Keep your entered numbers after adding (useful for similar assignments)</p>
                                </div>
                            </div>

                            <!-- NEW PERSONAL CONTACT SECTION -->
                            <div class="fgs-help-section">
                                <h3>📧 Need Personal Help?</h3>
                                <div class="fgs-help-info">
                                    <p><strong>Found a bug or need direct assistance?</strong> While the feedback box above sends anonymous reports, you can reach me personally for faster, more detailed help:</p>
                                    
                                    <div class="fgs-help-contact">
                                        <div class="fgs-contact-email">
                                            <strong>📧 Direct Email:</strong> 
                                            <a href="mailto:focusgrades.feedback@gmail.com?subject=Focus Grade Calculator - Bug Report&body=Hi! I'm having an issue with the Focus Grade Calculator extension.%0A%0ADescribe your issue here:%0A%0ABrowser: %0AExtension Version: 1.6.0%0AFocus URL: %0A%0AThank you!" class="fgs-email-link" target="_blank">
                                                focusgrades.feedback@gmail.com
                                            </a>
                                        </div>
                                        
                                        <div class="fgs-help-tip" style="margin-top: 12px;">
                                            💡 <strong>Why email me directly?</strong><br>
                                            • Get personalized solutions to your specific problem<br>
                                            • I can respond with detailed troubleshooting steps<br>
                                            • Help improve the extension for everyone<br>
                                            • Faster resolution for complex issues
                                        </div>
                                        
                                        <p style="margin-top: 12px;"><strong>What to include in your email:</strong></p>
                                        <p>• Screenshot of the issue (if visual)</p>
                                        <p>• Your Focus school/district (if comfortable sharing)</p>
                                        <p>• Steps to reproduce the problem</p>
                                        <p>• What you expected vs. what happened</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
}