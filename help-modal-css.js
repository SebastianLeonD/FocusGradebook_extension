/**
 * HELP MODAL CSS STYLES
 * Contains all styling for the comprehensive help guide modal
 * Includes responsive design, overlay effects, and mobile-friendly layouts
 * FIXED: Added styles for new personal contact section
 */

function getHelpModalCSS() {
    return `
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
                
                /* CONTACT SECTION STYLES */
                .fgs-help-contact {
                    background: rgba(40, 167, 69, 0.1);
                    border: 1px solid rgba(40, 167, 69, 0.3);
                    border-radius: 8px;
                    padding: 15px;
                    margin: 15px 0;
                }
                
                .fgs-contact-email {
                    text-align: center;
                    margin-bottom: 10px;
                }
                
                .fgs-email-link {
                    color: #87ceeb;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 16px;
                    border: 2px solid rgba(135, 206, 235, 0.3);
                    padding: 8px 16px;
                    border-radius: 6px;
                    display: inline-block;
                    margin-top: 8px;
                    transition: all 0.2s;
                }
                
                .fgs-email-link:hover {
                    background: rgba(135, 206, 235, 0.1);
                    border-color: rgba(135, 206, 235, 0.6);
                    transform: translateY(-1px);
                    text-decoration: underline;
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
                    
                    .fgs-email-link {
                        font-size: 14px;
                        padding: 6px 12px;
                    }
                }
            `;
}