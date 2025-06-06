(function(){'use strict';let hypotheticals=[];let hypotheticalCount=1;let originalRowsByClass={};let mode="unweighted";let currentClassId=null;let redoHistory=[];let floatingPopup=null;let helpModal=null;let isDragging=!1;let dragOffset={x:0,y:0};let nextRowColor="#f5f5f5";let originalCategoryData={};let isInitialized=!1;console.log('🚀 Focus Extension - Starting with help system');if(typeof chrome!=='undefined'&&chrome.runtime&&chrome.runtime.onMessage){chrome.runtime.onMessage.addListener(function(request,sender,sendResponse){console.log('📨 Message received:',request);try{if(request.type==="openFloatingCalculator"){handleExtensionClick();sendResponse({success:!0})}}catch(error){console.error('❌ Error handling message:',error);sendResponse({error:error.message})}
return!0});console.log('✅ Chrome message listener registered')}else{console.warn('⚠️ Chrome runtime not available')}
window.focusExtensionDebug={createPopup:function(){console.log('🧪 Manual popup creation triggered');createFloatingPopup()},togglePopup:function(){console.log('🧪 Manual popup toggle triggered');handleExtensionClick()}};function handleExtensionClick(){try{console.log('🖱️ Extension click handler called');if(floatingPopup){console.log('📋 Popup exists, current display:',floatingPopup.style.display);if(floatingPopup.style.display==='none'){console.log('👁️ Showing existing popup');floatingPopup.style.display='block'}else{console.log('🙈 Hiding existing popup');floatingPopup.style.display='none'}}else{console.log('🆕 Creating new popup');createFloatingPopup()}}catch(error){console.error('❌ Error in handleExtensionClick:',error)}}
function createHelpModal(){console.log('❓ Creating help modal...');try{if(helpModal){helpModal.remove()}
helpModal=document.createElement('div');helpModal.id='focus-help-modal';helpModal.innerHTML=`
                <div class="fgs-help-overlay" id="fgs-help-overlay">
                    <div class="fgs-help-content">
                        <div class="fgs-help-header">
                            <h2>📚 Grade Calculator Help Guide</h2>
                            <button class="fgs-help-close" id="fgs-help-close">×</button>
                        </div>
                        <div class="fgs-help-body">
                            <div class="fgs-help-section">
                                <h3>🤔 Is My Class Weighted or Unweighted?</h3>
                                <div class="fgs-help-info">
                                    <p><strong>Weighted:</strong> Your class has different categories (like Tests, Quizzes, Homework) that count for different percentages of your final grade.</p>
                                    <p><strong>Unweighted:</strong> All assignments are worth the same - just points earned divided by total points possible.</p>
                                    <div class="fgs-help-tip">
                                        💡 <strong>Quick Check:</strong> Look at your gradebook. If you see categories with percentages (like "Tests: 40%", "Homework: 20%"), choose <strong>Weighted</strong>. If it's just a list of assignments with points, choose <strong>Unweighted</strong>.
                                    </div>
                                </div>
                            </div>
  
                            <div class="fgs-help-section">
                                <h3>🔧 How to Use the Calculator</h3>
                                <div class="fgs-help-steps">
                                    <div class="fgs-help-step">
                                        <span class="fgs-step-number">1</span>
                                        <p>Choose <strong>Weighted</strong> or <strong>Unweighted</strong> based on your class type</p>
                                    </div>
                                    <div class="fgs-help-step">
                                        <span class="fgs-step-number">2</span>
                                        <p>Enter the points you earned and points possible for a hypothetical assignment</p>
                                    </div>
                                    <div class="fgs-help-step">
                                        <span class="fgs-step-number">3</span>
                                        <p>Select the category (for weighted classes only)</p>
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
                                    <h4>📝 Fixing Missing/Zero Assignments (NG, Z, 0)</h4>
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
                        </div>
                    </div>
                </div>
            `;const helpStyle=document.createElement('style');helpStyle.id='fgs-help-styles';helpStyle.textContent=`
                #focus-help-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 20000;
                    font-family: 'Segoe UI', sans-serif;
                }
                
                .fgs-help-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    box-sizing: border-box;
                }
                
                .fgs-help-content {
                    background: linear-gradient(to bottom, #0a2540, #145da0, #000000);
                    border-radius: 16px;
                    max-width: 800px;
                    max-height: 90vh;
                    width: 100%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .fgs-help-header {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: sticky;
                    top: 0;
                    z-index: 20001;
                }
                
                .fgs-help-header h2 {
                    color: white;
                    margin: 0;
                    font-size: 24px;
                    font-weight: 600;
                }
                
                .fgs-help-close {
                    background: rgba(220, 53, 69, 0.8);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    font-size: 24px;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                
                .fgs-help-close:hover {
                    background: rgba(220, 53, 69, 1);
                    transform: scale(1.1);
                }
                
                .fgs-help-body {
                    padding: 20px;
                    max-height: calc(90vh - 120px);
                    overflow-y: auto;
                    color: white;
                }
                
                .fgs-help-section {
                    margin-bottom: 30px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .fgs-help-section h3 {
                    color: #87ceeb;
                    margin: 0 0 15px 0;
                    font-size: 20px;
                    font-weight: 600;
                    border-bottom: 2px solid rgba(135, 206, 235, 0.3);
                    padding-bottom: 8px;
                }
                
                .fgs-help-section h4 {
                    color: #ffd700;
                    margin: 15px 0 10px 0;
                    font-size: 16px;
                    font-weight: 600;
                }
                
                .fgs-help-info p {
                    margin: 10px 0;
                    line-height: 1.6;
                    font-size: 15px;
                }
                
                .fgs-help-tip {
                    background: rgba(255, 193, 7, 0.15);
                    border: 1px solid rgba(255, 193, 7, 0.3);
                    border-radius: 8px;
                    padding: 15px;
                    margin: 15px 0;
                    font-size: 14px;
                    line-height: 1.5;
                }
                
                .fgs-help-steps {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                
                .fgs-help-step {
                    display: flex;
                    align-items: flex-start;
                    gap: 15px;
                    padding: 15px;
                    background: rgba(255, 255, 255, 0.08);
                    border-radius: 8px;
                    border-left: 4px solid #87ceeb;
                }
                
                .fgs-step-number {
                    background: #87ceeb;
                    color: #0a2540;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 16px;
                    flex-shrink: 0;
                }
                
                .fgs-help-step p {
                    margin: 0;
                    line-height: 1.5;
                    font-size: 15px;
                }
                
                .fgs-help-case {
                    margin: 20px 0;
                    padding: 15px;
                    background: rgba(255, 255, 255, 0.08);
                    border-radius: 8px;
                    border-left: 4px solid #ffd700;
                }
                
                .fgs-help-example {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 6px;
                    padding: 12px;
                    margin: 10px 0;
                    font-family: 'Courier New', monospace;
                    font-size: 14px;
                }
                
                .fgs-help-example code {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-weight: bold;
                    color: #87ceeb;
                }
                
                .fgs-example-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin: 15px 0;
                }
                
                .fgs-example-item {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                    font-size: 14px;
                    line-height: 1.4;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .fgs-help-controls p {
                    margin: 8px 0;
                    padding: 8px 12px;
                    background: rgba(255, 255, 255, 0.08);
                    border-radius: 6px;
                    font-size: 14px;
                    line-height: 1.4;
                }
                
                @media (max-width: 600px) {
                    .fgs-help-content {
                        margin: 10px;
                        max-height: 95vh;
                    }
                    
                    .fgs-help-header {
                        padding: 15px;
                    }
                    
                    .fgs-help-header h2 {
                        font-size: 20px;
                    }
                    
                    .fgs-help-body {
                        padding: 15px;
                    }
                    
                    .fgs-help-section {
                        padding: 15px;
                    }
                    
                    .fgs-example-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .fgs-help-step {
                        flex-direction: column;
                        text-align: center;
                    }
                }
            `;const existingHelpStyle=document.getElementById('fgs-help-styles');if(existingHelpStyle){existingHelpStyle.remove()}
document.head.appendChild(helpStyle);document.body.appendChild(helpModal);setupHelpEvents();console.log('✅ Help modal created successfully')}catch(error){console.error('❌ Error creating help modal:',error)}}
function setupHelpEvents(){try{const closeBtn=document.getElementById('fgs-help-close');const overlay=document.getElementById('fgs-help-overlay');if(closeBtn){closeBtn.addEventListener('click',(e)=>{e.preventDefault();e.stopPropagation();closeHelpModal()})}
if(overlay){overlay.addEventListener('click',(e)=>{if(e.target===overlay){closeHelpModal()}})}
document.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&helpModal&&helpModal.style.display!=='none'){closeHelpModal()}})}catch(error){console.error('❌ Error setting up help events:',error)}}
function closeHelpModal(){try{if(helpModal){helpModal.style.display='none'}}catch(error){console.error('❌ Error closing help modal:',error)}}
function showHelp(){try{if(!helpModal){createHelpModal()}
helpModal.style.display='block'}catch(error){console.error('❌ Error showing help:',error)}}
function createFloatingPopup(){console.log('🏗️ Creating floating popup...');try{if(floatingPopup){floatingPopup.remove()}
floatingPopup=document.createElement('div');floatingPopup.id='focus-grade-simulator-popup';const screenWidth=window.innerWidth;const popupWidth=Math.min(280,screenWidth-40);floatingPopup.innerHTML=` <div class="fgs-popup-header" id="fgs-drag-header"><span class="fgs-title">Grade Calculator</span><div class="fgs-controls"><button class="fgs-help" id="fgs-help" title="Help & Guide">?</button><button class="fgs-minimize" id="fgs-minimize">−</button><button class="fgs-close" id="fgs-close">×</button></div></div><div class="fgs-popup-content" id="fgs-content"><div class="fgs-mode-selection" id="fgs-mode-selection"><div class="fgs-mode-header"><h3>Choose Your Class Type</h3><button class="fgs-help-inline" id="fgs-help-mode" title="Help choosing mode">?</button></div><button class="fgs-mode-btn" id="fgs-mode-unweighted">Unweighted Calculator</button><button class="fgs-mode-btn" id="fgs-mode-weighted">Weighted Calculator</button></div><div class="fgs-calculator-form" id="fgs-calculator-form" style="display: none;"><div class="fgs-calc-header"><button class="fgs-back-btn" id="fgs-back">← Back</button><button class="fgs-help-inline" id="fgs-help-calc" title="Help using calculator">?</button></div><input type="number" id="fgs-earned" placeholder="Points Earned" class="fgs-input" /><input type="number" id="fgs-total" placeholder="Points Possible" class="fgs-input" /><input type="text" id="fgs-category-input" placeholder="Category (optional)" class="fgs-input" /><div class="fgs-category-container" id="fgs-category-container" style="display: none;"><select id="fgs-category-dropdown" class="fgs-dropdown"><option value="" disabled selected>Select Category</option></select></div><div class="fgs-checkbox-container"><input type="checkbox" id="fgs-keep-values" checked><label for="fgs-keep-values">Keep values after adding</label></div><button class="fgs-btn fgs-btn-primary" id="fgs-add">Add Assignment</button><button class="fgs-btn fgs-btn-secondary" id="fgs-reset">Reset All</button><div class="fgs-undo-redo-container"><button class="fgs-btn fgs-btn-undo" id="fgs-undo">↶ Undo</button><button class="fgs-btn fgs-btn-redo" id="fgs-redo">↷ Redo</button></div></div></div>`;const style=document.createElement('style');style.id='fgs-styles';style.textContent=`
                #focus-grade-simulator-popup {
                    position: fixed; top: 20px; right: 20px; width: ${popupWidth}px;
                    background: linear-gradient(to bottom, #0a2540, #145da0, #c6e6ff);
                    border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    z-index: 10000; font-family: 'Segoe UI', sans-serif; user-select: none;
                    backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1);
                    max-height: 90vh; overflow-y: auto;
                }
                .fgs-popup-header {
                    background: rgba(255, 255, 255, 0.1); padding: 8px 12px;
                    border-radius: 12px 12px 0 0; display: flex; justify-content: space-between;
                    align-items: center; cursor: move; border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    position: sticky; top: 0; z-index: 10001;
                }
                .fgs-title { color: white; font-weight: 600; font-size: 14px; }
                .fgs-controls { display: flex; gap: 4px; }
                .fgs-help, .fgs-minimize, .fgs-close {
                    width: 20px; height: 20px; border: none; border-radius: 50%;
                    background: rgba(255, 255, 255, 0.2); color: white; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 12px; font-weight: bold; transition: all 0.2s;
                }
                .fgs-help:hover { background: rgba(52, 144, 220, 0.8); transform: scale(1.1); }
                .fgs-minimize:hover { background: rgba(255, 193, 7, 0.8); }
                .fgs-close:hover { background: rgba(220, 53, 69, 0.8); }
                .fgs-popup-content { padding: 16px; max-height: 400px; overflow-y: auto; }
                .fgs-popup-content.minimized { display: none; }
                
                .fgs-mode-selection { display: flex; flex-direction: column; gap: 8px; }
                .fgs-mode-header {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 8px;
                }
                .fgs-mode-header h3 {
                    color: white; margin: 0; font-size: 16px; font-weight: 600;
                }
                .fgs-help-inline {
                    width: 18px; height: 18px; border: none; border-radius: 50%;
                    background: rgba(52, 144, 220, 0.8); color: white; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 11px; font-weight: bold; flex-shrink: 0;
                }
                .fgs-help-inline:hover { 
                    background: rgba(52, 144, 220, 1); transform: scale(1.1); 
                }
                
                .fgs-calc-header {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 12px;
                }
                
                .fgs-mode-btn {
                    padding: 10px; background: linear-gradient(to right, #0e3a5f, #1d5c8f);
                    color: white; border: none; border-radius: 8px; cursor: pointer;
                    font-size: 14px; transition: all 0.2s;
                }
                .fgs-mode-btn:hover {
                    background: linear-gradient(to right, #15466d, #226da4);
                    transform: translateY(-1px);
                }
                .fgs-calculator-form { display: flex; flex-direction: column; gap: 8px; }
                .fgs-back-btn {
                    background: rgba(255, 255, 255, 0.9); color: #0a2540; border: none;
                    padding: 6px 10px; border-radius: 6px; font-size: 12px; cursor: pointer;
                    align-self: flex-start;
                }
                .fgs-input, .fgs-dropdown {
                    padding: 8px; border: none; border-radius: 6px;
                    background: rgba(255, 255, 255, 0.2); color: white; font-size: 14px;
                }
                .fgs-input::placeholder { color: rgba(255, 255, 255, 0.7); }
                .fgs-checkbox-container {
                    display: flex; align-items: center; gap: 6px; color: white; font-size: 12px;
                }
                .fgs-btn {
                    padding: 8px; border: none; border-radius: 6px; cursor: pointer;
                    font-size: 13px; font-weight: 500; transition: all 0.2s;
                }
                .fgs-btn-primary { background: #2a7fdc; color: white; }
                .fgs-btn-primary:hover { background: #1b68b8; transform: translateY(-1px); }
                .fgs-btn-secondary { background: rgba(255, 255, 255, 0.9); color: #0a2540; }
                .fgs-btn-secondary:hover { background: rgba(255, 255, 255, 1); transform: translateY(-1px); }
                .fgs-undo-redo-container { display: flex; gap: 6px; align-items: center; }
                .fgs-btn-undo {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white; font-size: 11px; padding: 6px 10px; flex: 1;
                }
                .fgs-btn-undo:hover {
                    background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
                    transform: translateY(-1px);
                }
                .fgs-btn-redo {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white; font-size: 11px; padding: 6px 10px; flex: 1; min-width: 50px;
                }
                .fgs-btn-redo:hover {
                    background: linear-gradient(135deg, #e871f5 0%, #f44069 100%);
                    transform: translateY(-1px);
                }
                .fgs-category-container { display: none; }
                
                @media (max-width: 400px) {
                    #focus-grade-simulator-popup {
                        width: calc(100vw - 20px) !important;
                        right: 10px;
                    }
                }
            `;const existingStyle=document.getElementById('fgs-styles');if(existingStyle){existingStyle.remove()}
document.head.appendChild(style);document.body.appendChild(floatingPopup);console.log('✅ Popup created successfully');setupEvents();setupDrag()}catch(error){console.error('❌ Error creating popup:',error)}}
function setupEvents(){console.log('🔧 Setting up event listeners...');try{function safeAddListener(id,event,handler,description){const element=document.getElementById(id);if(element){element.addEventListener(event,function(e){try{e.preventDefault();e.stopPropagation();handler(e)}catch(error){console.error(`❌ Error in ${description}:`,error)}});console.log(`✅ ${description} listener added`)}else{console.warn(`⚠️ Element ${id} not found for ${description}`)}}
safeAddListener('fgs-close','click',()=>{if(floatingPopup)floatingPopup.style.display='none'},'Close button');safeAddListener('fgs-minimize','click',()=>{const content=document.getElementById('fgs-content');if(content)content.classList.toggle('minimized');},'Minimize button');safeAddListener('fgs-help','click',showHelp,'Main help button');safeAddListener('fgs-help-mode','click',showHelp,'Mode selection help button');safeAddListener('fgs-help-calc','click',showHelp,'Calculator help button');safeAddListener('fgs-mode-unweighted','click',()=>launchCalculator('unweighted'),'Unweighted mode button');safeAddListener('fgs-mode-weighted','click',()=>launchCalculator('weighted'),'Weighted mode button');safeAddListener('fgs-back','click',showModeSelection,'Back button');safeAddListener('fgs-add','click',handleAdd,'Add button');safeAddListener('fgs-reset','click',clearAll,'Reset button');safeAddListener('fgs-undo','click',undo,'Undo button');safeAddListener('fgs-redo','click',redo,'Redo button')}catch(error){console.error('❌ Error setting up events:',error)}}
function showModeSelection(){try{const modeSelection=document.getElementById('fgs-mode-selection');const calculatorForm=document.getElementById('fgs-calculator-form');if(modeSelection)modeSelection.style.display='flex';if(calculatorForm)calculatorForm.style.display='none'}catch(error){console.error('❌ Error showing mode selection:',error)}}
function setupDrag(){try{const header=document.getElementById('fgs-drag-header');if(!header)return;let startX,startY,initialLeft,initialTop;header.addEventListener('mousedown',function(e){try{isDragging=!0;const rect=floatingPopup.getBoundingClientRect();startX=e.clientX;startY=e.clientY;initialLeft=rect.left;initialTop=rect.top;document.addEventListener('mousemove',handleDrag);document.addEventListener('mouseup',stopDrag);e.preventDefault()}catch(error){console.error('❌ Error starting drag:',error)}});function handleDrag(e){if(!isDragging||!floatingPopup)return;try{const deltaX=e.clientX-startX;const deltaY=e.clientY-startY;const newLeft=Math.max(0,Math.min(window.innerWidth-floatingPopup.offsetWidth,initialLeft+deltaX));const newTop=Math.max(0,Math.min(window.innerHeight-floatingPopup.offsetHeight,initialTop+deltaY));floatingPopup.style.left=newLeft+'px';floatingPopup.style.top=newTop+'px';floatingPopup.style.right='auto'}catch(error){console.error('❌ Error during drag:',error)}}
function stopDrag(){isDragging=!1;document.removeEventListener('mousemove',handleDrag);document.removeEventListener('mouseup',stopDrag)}}catch(error){console.error('❌ Error setting up drag:',error)}}
function launchCalculator(calculatorMode){try{console.log('🚀 Launching calculator mode:',calculatorMode);mode=calculatorMode;const modeSelection=document.getElementById('fgs-mode-selection');const calculatorForm=document.getElementById('fgs-calculator-form');if(modeSelection)modeSelection.style.display='none';if(calculatorForm)calculatorForm.style.display='flex';const categoryInput=document.getElementById('fgs-category-input');const categoryContainer=document.getElementById('fgs-category-container');if(calculatorMode==='weighted'){if(categoryInput)categoryInput.style.display='none';if(categoryContainer)categoryContainer.style.display='block';populateCategories();saveOriginalCategoryData()}else{if(categoryInput)categoryInput.style.display='block';if(categoryContainer)categoryContainer.style.display='none'}}catch(error){console.error('❌ Error launching calculator:',error)}}
function populateCategories(){try{const dropdown=document.getElementById('fgs-category-dropdown');if(!dropdown)return;const categories=extractCategories();console.log('📋 Found categories:',categories);while(dropdown.options.length>1){dropdown.remove(1)}
categories.forEach(category=>{try{const option=document.createElement('option');option.value=category;option.textContent=category;dropdown.appendChild(option)}catch(error){console.error('❌ Error adding category option:',error)}})}catch(error){console.error('❌ Error populating categories:',error)}}
function handleAdd(){try{const earnedInput=document.getElementById('fgs-earned');const totalInput=document.getElementById('fgs-total');const categoryDropdown=document.getElementById('fgs-category-dropdown');const categoryInput=document.getElementById('fgs-category-input');if(!earnedInput||!totalInput)return;const earned=earnedInput.value;const total=totalInput.value;const isWeighted=mode==='weighted';let category='';if(isWeighted&&categoryDropdown){category=categoryDropdown.value}else if(!isWeighted&&categoryInput){category=categoryInput.value.trim()}
if(!earned||!total||(isWeighted&&!category)){alert('Please fill out all required fields.');return}
const data={earned:parseFloat(earned),total:parseFloat(total),category:category,classKey:getCurrentClassKey()};redoHistory=redoHistory.filter(r=>r.classKey!==getCurrentClassKey());hypotheticals.push(data);addRow(data);calculate();const keepValues=document.getElementById('fgs-keep-values');if(keepValues&&!keepValues.checked){earnedInput.value='';totalInput.value=''}}catch(error){console.error('❌ Error handling add:',error)}}
function calculate(){try{console.log('🧮 Starting calculation, mode:',mode);if(mode==='weighted'){calculateWeighted()}else{calculateUnweighted()}}catch(error){console.error('❌ Error in calculate:',error)}}
function calculateWeighted(){try{console.log('⚖️ Starting weighted calculation...');const table=document.querySelector('.student-gb-grades-weighted-grades');if(!table)return;const categoryMap={};const rows=table.querySelectorAll('tr');const percentRow=rows[1]?.querySelectorAll('td');const labelRow=rows[0]?.querySelectorAll('td');if(!percentRow||!labelRow)return;for(let i=1;i<percentRow.length-1;i++){try{const label=labelRow[i]?.innerText?.trim();const weight=parseFloat(percentRow[i]?.innerText?.replace('%','').trim());if(label&&!isNaN(weight)){categoryMap[label.toLowerCase()]={weight,earned:0,total:0,hasHypotheticals:!1}}}catch(error){console.error('❌ Error processing category at index',i,error)}}
const assignmentRows=[...document.querySelectorAll('.grades-grid.dataTable tbody tr')];assignmentRows.forEach(row=>{try{if(row.classList.contains('hypothetical')&&row.getAttribute('data-class-id')!==currentClassId)return;const tds=row.querySelectorAll('td');if(tds.length<11)return;const category=tds[9]?.innerText?.trim().toLowerCase();const raw=(tds[2]?.innerText||"").split("/").map(s=>s.trim());if(!isValid(raw[0],raw[1]))return;const earned=(raw[0].toUpperCase()==='Z')?0:parseFloat(raw[0]);const total=parseFloat(raw[1]);if(!isNaN(earned)&&categoryMap[category]){if(!isNaN(total)&&total!==0){categoryMap[category].earned+=earned;categoryMap[category].total+=total}else if(total===0&&earned>0){categoryMap[category].earned+=earned}
if(row.classList.contains('hypothetical')){categoryMap[category].hasHypotheticals=!0}}}catch(error){console.error('❌ Error processing assignment row:',error)}});let final=0,usedWeightSum=0;for(const cat in categoryMap){try{const{earned,total,weight}=categoryMap[cat];if(total>0||earned>0){const avg=total>0?earned/total:(earned>0?1:0);final+=avg*(weight/100);usedWeightSum+=weight}}catch(error){console.error('❌ Error calculating category:',cat,error)}}
const finalPercent=usedWeightSum>0?Math.round((final/(usedWeightSum/100))*100):100;console.log('🎯 Final weighted grade:',finalPercent);updateCategoryCells(categoryMap);showWeightedGrade(finalPercent,getLetterGrade(finalPercent))}catch(error){console.error('❌ Error in calculateWeighted:',error)}}
function updateCategoryCells(categoryMap){try{console.log('🔄 Updating category cells...');const table=document.querySelector('.student-gb-grades-weighted-grades');if(!table)return;const rows=table.querySelectorAll('tr');const labelRow=rows[0]?.querySelectorAll('td');const scoreRow=rows[2]?.querySelectorAll('td');if(!labelRow||!scoreRow)return;const classKey=getCurrentClassKey();const originalData=originalCategoryData[classKey];for(let i=1;i<labelRow.length-1;i++){try{const label=labelRow[i]?.innerText?.trim();const categoryData=categoryMap[label?.toLowerCase()];if(label&&categoryData&&scoreRow[i]&&categoryData.hasHypotheticals){const{earned,total}=categoryData;const percent=total>0?Math.round((earned/total)*100):(earned>0?100:0);const letter=getLetterGrade(percent);const cell=scoreRow[i];const originalCellData=originalData?.[label.toLowerCase()];if(originalCellData){cell.style.height=originalCellData.originalHeight||'auto';cell.style.maxHeight=originalCellData.originalMaxHeight!=='none'?originalCellData.originalMaxHeight:originalCellData.originalHeight;cell.style.lineHeight=originalCellData.originalLineHeight||'normal';cell.style.fontSize=originalCellData.originalFontSize||'inherit'}
cell.style.padding='0';cell.style.margin='0';cell.style.whiteSpace='nowrap';cell.style.overflow='visible';cell.style.verticalAlign='top';cell.style.boxSizing='border-box';cell.innerHTML=`${earned}/${total} ${percent}% ${letter}`}}catch(error){console.error('❌ Error updating cell at index',i,error)}}}catch(error){console.error('❌ Error in updateCategoryCells:',error)}}
function calculateUnweighted(){try{console.log('📊 Starting unweighted calculation...');const rows=[...document.querySelectorAll('.grades-grid.dataTable tbody tr')];let totalEarned=0,totalPossible=0;rows.forEach(row=>{try{if(row.classList.contains('hypothetical')&&row.getAttribute('data-class-id')!==currentClassId)return;const tds=row.querySelectorAll('td');if(tds.length<11)return;const raw=(tds[2]?.innerText||"").split("/").map(s=>s.trim());if(!isValid(raw[0],raw[1]))return;const earned=(raw[0].toUpperCase()==='Z')?0:parseFloat(raw[0]);const total=parseFloat(raw[1]);if(!isNaN(earned)){if(!isNaN(total)&&total>0){totalEarned+=earned;totalPossible+=total}else if(total===0&&earned>0){totalEarned+=earned}}}catch(error){console.error('❌ Error processing unweighted row:',error)}});const finalPercent=totalPossible?Math.round((totalEarned/totalPossible)*100):100;console.log('🎯 Unweighted final grade:',finalPercent);showGrade(finalPercent,getLetterGrade(finalPercent))}catch(error){console.error('❌ Error in calculateUnweighted:',error)}}
function showWeightedGrade(percent,letter){try{console.log('📺 Showing weighted grade:',percent,letter);const table=document.querySelector('.student-gb-grades-weighted-grades');if(!table){console.warn('❌ Weighted grades table not found');return}
document.querySelectorAll('.injected-hypo-weighted').forEach(e=>{if(e.getAttribute('data-class-id')===currentClassId)e.remove();});const rows=table.querySelectorAll('tr');let headerRow,percentRow,scoreRow;for(const row of rows){try{const text=row.innerText.trim().toLowerCase();if(text.includes("percent of grade"))percentRow=row;else if(text.includes("score"))scoreRow=row;else if(!headerRow)headerRow=row}catch(error){console.error('❌ Error processing table row:',error)}}
if(headerRow&&percentRow&&scoreRow){try{const addCell=(row,content,isScore=!1)=>{const cell=document.createElement("td");cell.className=isScore?"student-gb-grades-weighted-grades-score-cell injected-hypo-weighted":"student-gb-grades-weighted-grades-cell injected-hypo-weighted";cell.innerText=content;cell.style.cssText="background: #2f4f6f; color: white; font-weight: bold; text-align: left; font-size: "+(isScore?"13px":"12px")+"; width: auto; max-width: none;";cell.setAttribute('data-class-id',currentClassId);row.appendChild(cell)};addCell(headerRow,"Hypothetical Grade");addCell(percentRow,"");addCell(scoreRow,`${percent}% ${letter}`,!0);console.log('✅ Weighted grade display updated in table')}catch(error){console.error('❌ Error adding cells to table:',error)}}else{console.warn('⚠️ Required table rows not found')}}catch(error){console.error('❌ Error in showWeightedGrade:',error)}}
function showGrade(percent,letter){try{console.log('📺 Showing unweighted grade:',percent,letter);document.getElementById('hypothetical-grade')?.remove();document.querySelectorAll(".injected-hypo-grade").forEach(e=>e.remove());const container=document.querySelector(".gradebook-grid-title")||document.querySelector(".student-gb-grade-summary")||document.querySelector(".gradebook-grid-title-container");if(container){const span=document.createElement("span");span.id="hypothetical-grade";span.className="injected-hypo-grade";span.style.cssText="color: red; font-weight: bold; margin-left: 10px;";span.innerText=`(Hypothetical: ${percent}% ${letter})`;span.setAttribute('data-class-id',currentClassId);container.appendChild(span);console.log('✅ Unweighted grade display updated')}else{console.warn('⚠️ Could not find container for unweighted grade display')}}catch(error){console.error('❌ Error in showGrade:',error)}}
function addRow(data){try{console.log('➕ Adding row to table:',data);saveOriginalRows();const table=document.querySelector('.grades-grid.dataTable tbody');const baseRow=table?.querySelector('tr');if(!table||!baseRow){console.error('❌ Table or base row not found');return}
const clone=baseRow.cloneNode(!0);clone.classList.add('hypothetical');clone.setAttribute('data-class-id',currentClassId);const earned=data.earned;const total=data.total;const percent=(total===0&&earned>0)?100:Math.round((earned/total)*100);const letter=getLetterGrade(percent);const tds=clone.querySelectorAll('td');if(tds.length>=11){tds[1].textContent=`Hypothetical ${hypotheticalCount++}`;tds[9].textContent=data.category||"";tds[2].textContent=`${earned} / ${total}`;tds[3].textContent=`${percent}%`;tds[4].textContent=letter;tds[5].textContent="";tds[8].textContent=getDateTime()}
clone.style.backgroundColor=nextRowColor;nextRowColor=nextRowColor==="#f5f5f5"?"#dfefff":"#f5f5f5";table.insertBefore(clone,table.firstChild);console.log('✅ Row added successfully')}catch(error){console.error('❌ Error adding row:',error)}}
function undo(){try{console.log('↶ Starting undo...');const classKey=getCurrentClassKey();const classHypotheticals=hypotheticals.filter(h=>h.classKey===classKey);if(classHypotheticals.length===0){console.log('ℹ️ No hypotheticals to undo');return}
const lastAssignment=classHypotheticals[classHypotheticals.length-1];redoHistory.push({assignment:{...lastAssignment},classKey:classKey,nextRowColor:nextRowColor});if(redoHistory.length>10)redoHistory.shift();const globalIndex=hypotheticals.findIndex(h=>h===lastAssignment);if(globalIndex!==-1)hypotheticals.splice(globalIndex,1);const hypotheticalRows=document.querySelectorAll('.hypothetical[data-class-id="'+currentClassId+'"]');if(hypotheticalRows.length>0){const removedRow=hypotheticalRows[0];const removedRowColor=removedRow.style.backgroundColor;console.log('🎨 Removed row color:',removedRowColor);removedRow.remove();if(removedRowColor==="rgb(245, 245, 245)"||removedRowColor==="#f5f5f5"){nextRowColor="#dfefff"}else{nextRowColor="#f5f5f5"}
console.log('🎨 Next row color after undo:',nextRowColor)}
if(hypotheticalCount>1)hypotheticalCount--;const remaining=hypotheticals.filter(h=>h.classKey===classKey);if(remaining.length>0){calculate()}else{clearDisplays();if(mode==='weighted'){restoreOriginalCategoryData()}
nextRowColor=getInitialColor();console.log('🎨 Reset to initial color:',nextRowColor)}
console.log('✅ Undo completed')}catch(error){console.error('❌ Error in undo:',error)}}
function redo(){try{console.log('↷ Starting redo...');const classKey=getCurrentClassKey();const classRedos=redoHistory.filter(r=>r.classKey===classKey);if(classRedos.length===0){console.log('ℹ️ No redos available');return}
const lastRedo=classRedos[classRedos.length-1];redoHistory.splice(redoHistory.lastIndexOf(lastRedo),1);if(lastRedo.nextRowColor){nextRowColor=lastRedo.nextRowColor;console.log('🎨 Restored next row color for redo:',nextRowColor)}
hypotheticals.push(lastRedo.assignment);addRow(lastRedo.assignment);calculate();console.log('✅ Redo completed')}catch(error){console.error('❌ Error in redo:',error)}}
function clearAll(){try{console.log('🧹 Clearing all hypotheticals...');const classKey=getCurrentClassKey();hypotheticals=hypotheticals.filter(h=>h.classKey!==classKey);redoHistory=redoHistory.filter(r=>r.classKey!==classKey);hypotheticalCount=1;nextRowColor=getInitialColor();document.querySelectorAll('.hypothetical').forEach(e=>e.remove());clearDisplays();restoreOriginalRows();if(mode==='weighted'){restoreOriginalCategoryData()}
console.log('✅ Clear all completed')}catch(error){console.error('❌ Error in clearAll:',error)}}
function clearDisplays(){try{document.getElementById('hypothetical-grade')?.remove();document.querySelectorAll(".injected-hypo-grade").forEach(e=>e.remove());document.querySelectorAll(".injected-hypo-weighted").forEach(e=>e.remove())}catch(error){console.error('❌ Error clearing displays:',error)}}
function saveOriginalCategoryData(){try{const classKey=getCurrentClassKey();if(originalCategoryData[classKey])return;const table=document.querySelector('.student-gb-grades-weighted-grades');if(!table)return;const rows=table.querySelectorAll('tr');const labelRow=rows[0]?.querySelectorAll('td');const scoreRow=rows[2]?.querySelectorAll('td');if(!labelRow||!scoreRow)return;originalCategoryData[classKey]={};for(let i=1;i<labelRow.length-1;i++){try{const label=labelRow[i]?.innerText?.trim();const scoreCell=scoreRow[i];if(label&&scoreCell){const computedStyle=window.getComputedStyle(scoreCell);originalCategoryData[classKey][label.toLowerCase()]={originalHTML:scoreCell.innerHTML,originalText:scoreCell.innerText,originalHeight:computedStyle.height,originalMaxHeight:computedStyle.maxHeight,originalMinHeight:computedStyle.minHeight,originalLineHeight:computedStyle.lineHeight,originalFontSize:computedStyle.fontSize}}}catch(error){console.error('❌ Error saving category data at index',i,error)}}}catch(error){console.error('❌ Error in saveOriginalCategoryData:',error)}}
function restoreOriginalCategoryData(){try{const classKey=getCurrentClassKey();const originalData=originalCategoryData[classKey];if(!originalData)return;const table=document.querySelector('.student-gb-grades-weighted-grades');if(!table)return;const rows=table.querySelectorAll('tr');const labelRow=rows[0]?.querySelectorAll('td');const scoreRow=rows[2]?.querySelectorAll('td');if(!labelRow||!scoreRow)return;for(let i=1;i<labelRow.length-1;i++){try{const label=labelRow[i]?.innerText?.trim();const scoreCell=scoreRow[i];if(label&&scoreCell&&originalData[label.toLowerCase()]){const cellData=originalData[label.toLowerCase()];scoreCell.innerHTML=cellData.originalHTML;['height','maxHeight','minHeight','padding','margin','whiteSpace','overflow','verticalAlign','boxSizing','lineHeight','fontSize'].forEach(prop=>{scoreCell.style[prop]=''})}}catch(error){console.error('❌ Error restoring category at index',i,error)}}}catch(error){console.error('❌ Error in restoreOriginalCategoryData:',error)}}
function extractCategories(){try{let elements=document.querySelectorAll('.student-gb-grades-weighted-grades-header td[data-assignment-type-id]');if(elements.length===0){elements=document.querySelectorAll('.student-gb-grades-weighted-grades-header td:not(:first-child):not(:last-child)')}
const categories=[];elements.forEach(el=>{try{const text=el.textContent.trim();if(text&&text!=="Weighted Grade")categories.push(text);}catch(error){console.error('❌ Error extracting category:',error)}});return categories.length>0?categories:["Tests","Labs & Projects","Quizzes","Classwork & Homework"]}catch(error){console.error('❌ Error in extractCategories:',error);return["Tests","Labs & Projects","Quizzes","Classwork & Homework"]}}
function getCurrentClassKey(){try{const classLabel=document.querySelector(".gb-title")?.innerText;if(classLabel?.trim())return classLabel.trim().toLowerCase();const select=document.querySelector("select.student-gb-grades-course");const selectedOption=select?.options[select.selectedIndex];if(selectedOption)return selectedOption.textContent.trim().toLowerCase();const urlParams=new URLSearchParams(window.location.search);const courseId=urlParams.get('course_period_id');return courseId?`course_${courseId}`:`unknown_class_${Date.now()}`}catch(error){console.error('❌ Error getting class key:',error);return `fallback_class_${Date.now()}`}}
function getLetterGrade(percent){if(percent>=90)return"A";if(percent>=80)return"B";if(percent>=70)return"C";if(percent>=60)return"D";return"F"}
function isValid(earned,total){return earned?.trim().toLowerCase()!=='ng'&&total?.trim().toLowerCase()!=='ng'}
function getDateTime(){try{const now=new Date();now.setMinutes(now.getMinutes()-Math.floor(Math.random()*60));return now.toLocaleDateString('en-US',{weekday:'short',day:'2-digit',month:'short',year:'numeric'})+' '+now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:!0}).toLowerCase()}catch(error){console.error('❌ Error getting date time:',error);return'Recent'}}
function getInitialColor(){try{const rows=[...document.querySelectorAll('.grades-grid.dataTable tbody tr')];const lastReal=rows.find(r=>!r.classList.contains('hypothetical'));const lastColor=lastReal?.style.backgroundColor?.trim().toLowerCase();return(lastColor==="rgb(245, 245, 245)")?"#dfefff":"#f5f5f5"}catch(error){console.error('❌ Error getting initial color:',error);return"#f5f5f5"}}
function saveOriginalRows(){try{const classKey=getCurrentClassKey();if(!originalRowsByClass[classKey]){const tableRows=document.querySelectorAll('.grades-grid.dataTable tbody tr');if(tableRows.length>0){originalRowsByClass[classKey]=[...tableRows].map(row=>row.cloneNode(!0))}}}catch(error){console.error('❌ Error saving original rows:',error)}}
function restoreOriginalRows(){try{const table=document.querySelector('.grades-grid.dataTable tbody');const classKey=getCurrentClassKey();const originalRows=originalRowsByClass[classKey];if(table&&originalRows){table.innerHTML="";originalRows.forEach(row=>table.appendChild(row.cloneNode(!0)))}}catch(error){console.error('❌ Error restoring original rows:',error)}}
function ensureCurrentClass(){try{const select=document.querySelector("select.student-gb-grades-course");currentClassId=select?select.value:getCurrentClassKey();saveOriginalRows();nextRowColor=getInitialColor()}catch(error){console.error('❌ Error ensuring current class:',error);currentClassId=getCurrentClassKey()}}
function initialize(){if(isInitialized)return;try{console.log('🌟 Initializing Focus Extension with help system...');ensureCurrentClass();const select=document.querySelector("select.student-gb-grades-course");if(select){select.addEventListener("change",()=>{try{if(select.value!==currentClassId){currentClassId=select.value;setTimeout(()=>{clearAll();ensureCurrentClass()},1000)}}catch(error){console.error('❌ Error handling class change:',error)}})}
isInitialized=!0;console.log('✅ Focus Extension with help system initialized successfully')}catch(error){console.error('❌ Error in initialization:',error)}}
if(document.readyState==="complete"||document.readyState==="interactive"){setTimeout(initialize,1000)}
window.addEventListener('load',()=>{setTimeout(initialize,1500)});document.addEventListener('DOMContentLoaded',()=>{setTimeout(initialize,500)});setTimeout(initialize,3000)})()