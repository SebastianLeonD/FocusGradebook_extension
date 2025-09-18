/**
 * POPUP CSS STYLES
 * Contains all styling for the floating grade calculator popup interface
 * This function returns the CSS string that gets injected into createFloatingPopup()
 * UPDATED: Better spacing, larger popup, smaller text for better fit
 */

function getPopupCSS(popupWidth) {
    return `
                #focus-grade-simulator-popup {
                    position: fixed; top: 20px; right: 20px; width: 280px;
                    background: linear-gradient(to bottom, #0a2540, #145da0, #c6e6ff);
                    border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    z-index: 10000; font-family: 'Segoe UI', sans-serif; user-select: none;
                    backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1);
                    max-height: 85vh; overflow-y: auto; 
                    transition: width 0.4s ease, height 0.4s ease, transform 0.3s ease;
                    transform-origin: top right;
                }
                
                /* Responsive popup sizing based on content */
                #focus-grade-simulator-popup.size-small {
                    width: 280px;
                    min-height: auto;
                }
                
                #focus-grade-simulator-popup.size-medium {
                    width: 320px;
                    min-height: auto;
                }
                
                #focus-grade-simulator-popup.size-large {
                    width: 380px;
                    min-height: auto;
                }
                
                #focus-grade-simulator-popup.size-xlarge {
                    width: 420px;
                    min-height: auto;
                }
                
                /* Mobile responsive */
                @media (max-width: 480px) {
                    #focus-grade-simulator-popup {
                        width: calc(100vw - 20px) !important;
                        right: 10px;
                        left: 10px;
                        max-width: 400px;
                    }
                }
                
                @media (max-width: 768px) {
                    #focus-grade-simulator-popup.size-large,
                    #focus-grade-simulator-popup.size-xlarge {
                        width: calc(100vw - 40px) !important;
                        max-width: 380px;
                    }
                }
                
                .fgs-popup-header {
                    background: rgba(255, 255, 255, 0.1); padding: 8px 12px;
                    border-radius: 12px 12px 0 0; display: flex; justify-content: space-between;
                    align-items: center; cursor: move; border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    position: sticky; top: 0; z-index: 10001;
                }
                .fgs-title { color: white; font-weight: 600; font-size: 14px; }
                .fgs-controls { display: flex; gap: 4px; }
                .fgs-help, .fgs-settings, .fgs-minimize, .fgs-close {
                    width: 20px; height: 20px; border: none; border-radius: 50%;
                    background: rgba(255, 255, 255, 0.2); color: white; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 12px; font-weight: bold; transition: all 0.2s;
                }
                .fgs-help:hover { background: rgba(52, 144, 220, 0.8); transform: scale(1.1); }
                .fgs-settings:hover { 
                    background: rgba(158, 158, 158, 0.8); 
                    transform: scale(1.1) rotate(90deg); 
                    transition: all 0.3s ease;
                }
                .fgs-minimize:hover { background: rgba(255, 193, 7, 0.8); }
                .fgs-close:hover { background: rgba(220, 53, 69, 0.8); }
                .fgs-popup-content { padding: 14px; max-height: none; overflow-y: visible; }
                .fgs-popup-content.minimized { display: none; }
                
                /* Settings Dropdown Styles */
                .fgs-settings-dropdown {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    margin-bottom: 14px;
                    animation: slideDown 0.3s ease;
                }
                
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .fgs-settings-header {
                    padding: 10px 14px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px 8px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .fgs-settings-back {
                    background: rgba(255, 255, 255, 0.9);
                    color: #0a2540;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    cursor: pointer;
                    font-weight: 500;
                }
                
                .fgs-settings-back:hover {
                    background: rgba(255, 255, 255, 1);
                    transform: translateY(-1px);
                }
                
                .fgs-settings-header h4 {
                    margin: 0;
                    color: white;
                    font-size: 13px;
                    font-weight: 600;
                }
                
                .fgs-settings-content {
                    padding: 12px;
                }
                
                .fgs-setting-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                
                .fgs-setting-row:last-child {
                    margin-bottom: 0;
                }
                
                .fgs-setting-row label {
                    color: white;
                    font-size: 12px;
                    font-weight: 500;
                }
                
                .fgs-theme-dropdown {
                    background: #000000 !important;
                    color: #ffffff !important;
                    border: 1px solid rgba(255, 255, 255, 0.3) !important;
                    padding: 4px 6px;
                    border-radius: 4px;
                    font-size: 11px;
                    cursor: pointer;
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    appearance: none;
                    background-image: url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23ffffff' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>");
                    background-repeat: no-repeat;
                    background-position: right 6px center;
                    background-size: 8px;
                    padding-right: 24px;
                }
                
                .fgs-theme-dropdown option {
                    background: #000000 !important;
                    color: #ffffff !important;
                    padding: 4px !important;
                }
                
                .fgs-theme-dropdown option:hover {
                    background: #0066cc !important;
                    color: #ffffff !important;
                }
                
                .fgs-mode-selection { display: flex; flex-direction: column; gap: 10px; }
                .fgs-mode-header {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 8px;
                }
                .fgs-mode-header h3 {
                    color: white; margin: 0; font-size: 15px; font-weight: 600;
                }
                .fgs-help-inline {
                    width: 16px; height: 16px; border: none; border-radius: 50%;
                    background: rgba(52, 144, 220, 0.8); color: white; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 10px; font-weight: bold; flex-shrink: 0;
                }
                .fgs-help-inline:hover { 
                    background: rgba(52, 144, 220, 1); transform: scale(1.1); 
                }
                
                .fgs-calc-header {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 10px;
                }
                
                .fgs-mode-btn {
                    padding: 10px; background: linear-gradient(to right, #0e3a5f, #1d5c8f);
                    color: white; border: none; border-radius: 8px; cursor: pointer;
                    font-size: 13px; transition: all 0.2s; font-weight: 600;
                    margin-bottom: 6px;
                }
                .fgs-mode-btn:hover {
                    background: linear-gradient(to right, #15466d, #226da4);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
                }
                
                /* GPA Calculator button styling */
                .fgs-mode-btn-gpa {
                    background: linear-gradient(to right, #28a745, #20c997, #17a2b8) !important;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    font-weight: 600;
                    margin-bottom: 0;
                }
                .fgs-mode-btn-gpa:hover {
                    background: linear-gradient(to right, #218838, #1ba085, #138496) !important;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
                }
                
                /* GPA Calculator Wizard Styles */
                .fgs-gpa-calculator {
                    display: flex;
                    flex-direction: column;
                }
                
                .fgs-gpa-step {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .fgs-gpa-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-bottom: 6px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .fgs-gpa-back, .fgs-gpa-back-to-classes {
                    background: rgba(255, 255, 255, 0.9);
                    color: #0a2540;
                    border: none;
                    padding: 5px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    cursor: pointer;
                    font-weight: 500;
                }
                
                .fgs-gpa-back:hover, .fgs-gpa-back-to-classes:hover {
                    background: rgba(255, 255, 255, 1);
                    transform: translateY(-1px);
                }
                
                .fgs-gpa-step-indicator {
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 11px;
                    font-weight: 500;
                }
                
                .fgs-gpa-content h3 {
                    color: white;
                    margin: 0 0 12px 0;
                    font-size: 16px;
                    text-align: center;
                }
                
                .fgs-gpa-class-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    max-height: 280px;
                    overflow-y: auto;
                    margin-bottom: 12px;
                }
                
                .fgs-gpa-class-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    min-height: 16px;
                }
                
                .fgs-gpa-class-info {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                    min-width: 0;
                }
                
                .fgs-gpa-class-name {
                    color: white;
                    font-weight: 600;
                    font-size: 12px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    line-height: 1.2;
                }
                
                .fgs-gpa-class-details {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 2px;
                }
                
                .fgs-gpa-class-type {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    padding: 1px 4px;
                    border-radius: 3px;
                    font-size: 9px;
                    font-weight: bold;
                }
                
                .fgs-gpa-class-type.ap {
                    background: rgba(220, 53, 69, 0.8);
                }
                
                .fgs-gpa-class-type.honors {
                    background: rgba(255, 193, 7, 0.8);
                }
                
                .fgs-gpa-class-type.regular {
                    background: rgba(108, 117, 125, 0.8);
                }
                
                .fgs-gpa-grade-edit {
                    background: rgba(255, 255, 255, 0.9);
                    color: #0a2540;
                    border: none;
                    padding: 3px 6px;
                    border-radius: 3px;
                    font-size: 10px;
                    cursor: pointer;
                    font-weight: bold;
                    min-width: 50px;
                    margin-left: 6px;
                }
                
                .fgs-gpa-grade-edit:hover {
                    background: rgba(255, 255, 255, 1);
                    transform: scale(1.05);
                }
                
                .fgs-gpa-class-remove {
                    background: rgba(220, 53, 69, 0.8);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: bold;
                    margin-left: 6px;
                }
                
                .fgs-gpa-class-remove:hover {
                    background: rgba(220, 53, 69, 1);
                    transform: scale(1.1);
                }
                
                .fgs-gpa-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }
                
                .fgs-gpa-add-dropdown {
                    background: #000000 !important;
                    color: #ffffff !important;
                    border: 1px solid rgba(255, 255, 255, 0.3) !important;
                    padding: 6px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    cursor: pointer;
                }
                
                .fgs-gpa-help, .fgs-gpa-help-results {
                    background: rgba(52, 144, 220, 0.8);
                    color: white;
                    border: none;
                    padding: 6px 10px;
                    border-radius: 4px;
                    font-size: 11px;
                    cursor: pointer;
                    font-weight: 500;
                }
                
                .fgs-gpa-help:hover, .fgs-gpa-help-results:hover {
                    background: rgba(52, 144, 220, 1);
                    transform: translateY(-1px);
                }
                
                .fgs-gpa-navigation {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                }
                
                /* GPA Results Styles */
                .fgs-gpa-results {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 12px;
                }
                
                .fgs-gpa-result-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 10px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    border-left: 3px solid #28a745;
                }
                
                .fgs-gpa-result-label {
                    color: white;
                    font-weight: 600;
                    font-size: 12px;
                }
                
                .fgs-gpa-result-value {
                    color: white;
                    font-weight: bold;
                    font-size: 11px;
                    text-align: right;
                }
                
                .fgs-gpa-result-change {
                    color: #28a745;
                    font-size: 10px;
                    margin-left: 4px;
                }
                
                .fgs-gpa-result-change.negative {
                    color: #dc3545;
                }
                
                .fgs-gpa-info {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                    padding: 8px;
                    margin-bottom: 12px;
                }
                
                .fgs-gpa-info p {
                    color: rgba(255, 255, 255, 0.8);
                    margin: 2px 0;
                    font-size: 11px;
                    line-height: 1.3;
                }
                
                /* GPA Error Styles */
                .fgs-gpa-error {
                    background: rgba(255, 107, 107, 0.1);
                    border: 1px solid rgba(255, 107, 107, 0.3);
                    border-radius: 6px;
                    padding: 12px;
                    margin-bottom: 12px;
                }
                
                /* GPA Help Modal Styles */
                .fgs-gpa-help-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 25000;
                    display: none;
                }
                
                .fgs-gpa-help-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    box-sizing: border-box;
                }
                
                .fgs-gpa-help-content {
                    background: linear-gradient(to bottom, #0a2540, #145da0, #c6e6ff);
                    border-radius: 12px;
                    max-width: 500px;
                    max-height: 80vh;
                    width: 100%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .fgs-gpa-help-header {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 16px 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .fgs-gpa-help-header h3 {
                    color: white;
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                }
                
                .fgs-gpa-help-close {
                    background: rgba(220, 53, 69, 0.8);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 6px 10px;
                    font-size: 12px;
                    font-weight: bold;
                    cursor: pointer;
                }
                
                .fgs-gpa-help-close:hover {
                    background: rgba(220, 53, 69, 1);
                }
                
                .fgs-gpa-help-body {
                    padding: 20px;
                    max-height: 60vh;
                    overflow-y: auto;
                }
                
                .fgs-gpa-help-section p {
                    color: white;
                    margin: 12px 0;
                    line-height: 1.5;
                    font-size: 14px;
                }
                
                .fgs-gpa-help-section h4 {
                    color: #87ceeb;
                    margin: 16px 0 8px 0;
                    font-size: 16px;
                    font-weight: 600;
                }
                
                /* Responsive adjustments */
                @media (max-width: 400px) {
                    #focus-grade-simulator-popup {
                        width: calc(100vw - 20px) !important;
                        right: 10px;
                    }
                    
                    .fgs-gpa-class-item {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 6px;
                    }
                    
                    .fgs-gpa-class-details {
                        width: 100%;
                        justify-content: space-between;
                    }
                }
                
                .fgs-calculator-form { display: flex; flex-direction: column; gap: 8px; }
                .fgs-back-btn {
                    background: rgba(255, 255, 255, 0.9); color: #0a2540; border: none;
                    padding: 5px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;
                    align-self: flex-start;
                }
                .fgs-input, .fgs-dropdown {
                    padding: 7px; border: none; border-radius: 4px;
                    background: rgba(255, 255, 255, 0.2); color: white; font-size: 12px;
                }
                .fgs-input::placeholder { color: rgba(255, 255, 255, 0.7); }
                
                /* FIXED DROPDOWN STYLING - Ensures visibility on all computers */
                .fgs-dropdown {
                    background: #000000 !important; /* Black background */
                    color: #ffffff !important; /* White text */
                    border: 1px solid rgba(255, 255, 255, 0.3) !important;
                }
                
                .fgs-dropdown option {
                    background: #000000 !important; /* Black background for options */
                    color: #ffffff !important; /* White text for options */
                    padding: 6px !important;
                    border: none !important;
                }
                
                .fgs-dropdown option:hover {
                    background: #0066cc !important; /* Blue background on hover */
                    color: #ffffff !important; /* Keep white text on hover */
                }
                
                .fgs-dropdown option:checked,
                .fgs-dropdown option:focus,
                .fgs-dropdown option:active {
                    background: #0066cc !important; /* Blue when selected */
                    color: #ffffff !important; /* White text when selected */
                }
                
                /* Additional dropdown fixes for cross-browser compatibility */
                select.fgs-dropdown {
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    appearance: none;
                    background-image: url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='%23ffffff' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>");
                    background-repeat: no-repeat;
                    background-position: right 6px center;
                    background-size: 10px;
                    padding-right: 26px;
                }
                
                .fgs-checkbox-container {
                    display: flex; align-items: center; gap: 5px; color: white; font-size: 11px;
                }
                .fgs-btn {
                    padding: 7px; border: none; border-radius: 4px; cursor: pointer;
                    font-size: 12px; font-weight: 500; transition: all 0.2s;
                }
                .fgs-btn-primary { background: #2a7fdc; color: white; }
                .fgs-btn-primary:hover { background: #1b68b8; transform: translateY(-1px); }
                .fgs-btn-secondary { background: rgba(255, 255, 255, 0.9); color: #0a2540; }
                .fgs-btn-secondary:hover { background: rgba(255, 255, 255, 1); transform: translateY(-1px); }
                .fgs-undo-redo-container { display: flex; gap: 5px; align-items: center; }
                .fgs-btn-undo {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white; font-size: 10px; padding: 5px 8px; flex: 1;
                }
                .fgs-btn-undo:hover {
                    background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
                    transform: translateY(-1px);
                }
                .fgs-btn-redo {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white; font-size: 10px; padding: 5px 8px; flex: 1; min-width: 45px;
                }
                .fgs-btn-redo:hover {
                    background: linear-gradient(135deg, #e871f5 0%, #f44069 100%);
                    transform: translateY(-1px);
                }
                .fgs-category-container { display: none; }
                .fgs-help-controls p {
                    margin: 8px 0;
                    padding: 8px 12px;
                    background: rgba(255, 255, 255, 0.08);
                    border-radius: 6px;
                    font-size: 14px;
                    line-height: 1.4;
                }
                
                /* Feedback Section Styles */
                .fgs-feedback-container {
                    background: rgba(255, 255, 255, 0.08);
                    border-radius: 8px;
                    padding: 15px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .fgs-feedback-textarea {
                    width: 100%;
                    min-height: 80px;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 6px;
                    padding: 10px;
                    color: white;
                    font-family: inherit;
                    font-size: 13px;
                    line-height: 1.4;
                    margin: 10px 0;
                    resize: vertical;
                    box-sizing: border-box;
                }
                
                .fgs-feedback-textarea::placeholder {
                    color: rgba(255, 255, 255, 0.6);
                }
                
                .fgs-feedback-textarea:focus {
                    outline: none;
                    border-color: #87ceeb;
                    box-shadow: 0 0 0 2px rgba(135, 206, 235, 0.2);
                }
                
                .fgs-feedback-actions {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 10px;
                }
                
                .fgs-feedback-send {
                    background: linear-gradient(135deg, #28a745, #20c997);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .fgs-feedback-send:hover {
                    background: linear-gradient(135deg, #218838, #1ba085);
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
                }
                
                .fgs-feedback-send:disabled {
                    background: rgba(108, 117, 125, 0.6);
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }
                
                .fgs-feedback-status {
                    font-size: 12px;
                    font-weight: 500;
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                
                .fgs-feedback-status.success {
                    color: #28a745;
                    opacity: 1;
                }
                
                .fgs-feedback-status.error {
                    color: #dc3545;
                    opacity: 1;
                }
                
                .fgs-feedback-status.sending {
                    color: #ffc107;
                    opacity: 1;
                }
                
                .fgs-feedback-info {
                    margin-top: 8px;
                }
                
                .fgs-feedback-info p {
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.7);
                    margin: 0;
                    text-align: center;
                    line-height: 1.3;
                }
                
                @media (max-width: 600px) {
                    .fgs-feedback-actions {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 10px;
                    }
                    
                    .fgs-feedback-send {
                        justify-content: center;
                    }
                    
                    .fgs-feedback-status {
                        text-align: center;
                    }
                }
            `;
}
    