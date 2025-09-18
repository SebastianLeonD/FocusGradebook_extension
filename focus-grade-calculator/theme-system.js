/**
 * THEME-SYSTEM.JS
 * Handles popup color themes accessed via settings gear icon
 * FIXED: Better GPA button color, smooth transitions, feedback box styling
 */

// Enhanced popup themes with better GPA button colors
const popupThemes = {
    default: {
        name: 'Default Blue',
        gradient: 'linear-gradient(to bottom, #0a2540, #145da0, #c6e6ff)',
        textColor: '#ffffff',
        buttonPrimary: '#2a7fdc',
        buttonSecondary: 'rgba(255, 255, 255, 0.9)',
        inputBg: 'rgba(255, 255, 255, 0.2)',
        gpaButtonColor: 'linear-gradient(to right, #1e3d59, #3b82c4, #5ba3e8)', // Better blue gradient
        isTransparent: false
    },
    emerald: {
        name: 'Emerald Green',
        gradient: 'linear-gradient(to bottom, #104d3c, #166f52, #1b835f)',
        textColor: '#ffffff',
        buttonPrimary: '#1de9b6',
        buttonSecondary: 'rgba(255, 255, 255, 0.25)',
        inputBg: 'rgba(255, 255, 255, 0.2)',
        gpaButtonColor: 'linear-gradient(to right, #28a745, #20c997, #17a2b8)',
        isTransparent: false
    },
    transparent: {
        name: 'Transparent Glass',
        gradient: 'rgba(255, 255, 255, 0.1)',
        backdrop: 'blur(20px)',
        textColor: '#000000',
        buttonPrimary: '#0066cc',
        buttonSecondary: 'rgba(0, 0, 0, 0.1)',
        inputBg: 'rgba(0, 0, 0, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        gpaButtonColor: 'linear-gradient(to right, #0066cc, #4285f4, #1976d2)',
        isTransparent: true
    },
    bright: {
        name: 'Bright White',
        gradient: 'linear-gradient(to bottom, #f8f9fa, #e9ecef, #ffffff)',
        textColor: '#212529',
        buttonPrimary: '#0066cc',
        buttonSecondary: 'rgba(0, 0, 0, 0.1)',
        inputBg: 'rgba(0, 0, 0, 0.05)',
        gpaButtonColor: 'linear-gradient(to right, #0066cc, #4285f4, #1976d2)',
        isTransparent: false
    }
};

/**
 * FIXED: Applies popup theme with smooth transitions and proper sizing
 */
function applyPopupTheme(themeName) {
    try {
        console.log('🎨 THEME SWITCH - Applying theme:', themeName);
        
        const popup = document.getElementById('focus-grade-simulator-popup');
        if (!popup) {
            console.error('❌ THEME SWITCH - Popup not found');
            return;
        }

        // Preserve current size class
        const currentSizeClass = popup.classList.contains('size-xlarge') ? 'size-xlarge' :
                                popup.classList.contains('size-large') ? 'size-large' :
                                popup.classList.contains('size-medium') ? 'size-medium' : 'size-small';

        // Remove existing style
        const existingStyle = document.getElementById('fgs-styles');
        if (existingStyle) {
            existingStyle.remove();
        }

        // Get theme configuration
        let theme = popupThemes[themeName] || popupThemes.default;

        // Generate CSS with theme
        const cssContent = generateThemedCSS(theme);

        // Apply new styles
        const newStyle = document.createElement('style');
        newStyle.id = 'fgs-styles';
        newStyle.textContent = cssContent;
        document.head.appendChild(newStyle);
        
        // Apply smooth transition back to default size
        setTimeout(() => {
            popup.classList.remove('size-small', 'size-medium', 'size-large', 'size-xlarge');
            popup.classList.add('size-small'); // Always default to small
            
            console.log('✅ THEME SWITCH - Applied theme:', theme.name, 'with default sizing');
        }, 50);
        
    } catch (error) {
        console.error('❌ THEME SWITCH - Error applying theme:', error);
    }
}

/**
 * FIXED: Enhanced sizing control with smooth transitions
 */
function applySizingForCurrentInterface() {
    try {
        const popup = document.getElementById('focus-grade-simulator-popup');
        if (!popup) return;
        
        // Always transition back to small size smoothly
        popup.style.transition = 'width 0.3s ease, height 0.3s ease';
        
        // Remove all size classes and apply small
        popup.classList.remove('size-small', 'size-medium', 'size-large', 'size-xlarge');
        popup.classList.add('size-small');
        
    } catch (error) {
        console.error('❌ Error applying sizing:', error);
    }
}

/**
 * FIXED: Generates themed CSS with better colors and feedback box
 */
function generateThemedCSS(theme) {
    const isLightTheme = theme.textColor === '#212529' || theme.textColor === '#000000';
    const placeholderColor = isLightTheme ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)';
    
    // Special handling for transparent mode
    const popupBackground = theme.isTransparent ? theme.gradient : theme.gradient;
    const popupBackdrop = theme.backdrop ? `backdrop-filter: ${theme.backdrop};` : 'backdrop-filter: blur(10px);';
    const popupBorder = theme.border || '1px solid rgba(255, 255, 255, 0.1)';
    
    return `
        #focus-grade-simulator-popup {
            position: fixed; 
            top: 20px; 
            right: 20px; 
            width: 280px;
            background: ${popupBackground};
            ${popupBackdrop}
            border-radius: 12px; 
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            z-index: 10000; 
            font-family: 'Segoe UI', sans-serif; 
            user-select: none;
            border: ${popupBorder};
            max-height: 85vh; 
            overflow-y: auto; 
            transition: width 0.3s ease, height 0.3s ease, transform 0.2s ease;
            transform-origin: top right;
        }
        
        /* FIXED SIZING - Always default to small with smooth transitions */
        #focus-grade-simulator-popup.size-small {
            width: 280px !important;
            min-height: auto;
        }
        
        #focus-grade-simulator-popup.size-medium {
            width: 280px !important;
            min-height: auto;
        }
        
        #focus-grade-simulator-popup.size-large {
            width: 280px !important;
            min-height: auto;
        }
        
        #focus-grade-simulator-popup.size-xlarge {
            width: 280px !important;
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
        
        .fgs-popup-header {
            background: ${theme.isTransparent ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'}; 
            padding: 8px 12px;
            border-radius: 12px 12px 0 0; 
            display: flex; 
            justify-content: space-between;
            align-items: center; 
            cursor: move; 
            border-bottom: 1px solid ${theme.isTransparent ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'};
            position: sticky; 
            top: 0; 
            z-index: 10001;
        }
        
        .fgs-title { 
            color: ${theme.textColor}; 
            font-weight: 600; 
            font-size: 14px; 
        }
        
        .fgs-controls { 
            display: flex; 
            gap: 4px; 
        }
        
        .fgs-help, .fgs-settings, .fgs-minimize, .fgs-close {
            width: 20px; 
            height: 20px; 
            border: none; 
            border-radius: 50%;
            background: ${theme.isTransparent ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)'}; 
            color: ${theme.textColor}; 
            cursor: pointer;
            display: flex; 
            align-items: center; 
            justify-content: center;
            font-size: 12px; 
            font-weight: bold; 
            transition: all 0.2s;
        }
        
        .fgs-help:hover { 
            background: rgba(52, 144, 220, 0.8); 
            color: white;
            transform: scale(1.1); 
        }
        
        .fgs-settings:hover { 
            background: rgba(158, 158, 158, 0.8); 
            color: white;
            transform: scale(1.1) rotate(90deg); 
            transition: all 0.3s ease;
        }
        
        .fgs-minimize:hover { 
            background: rgba(255, 193, 7, 0.8); 
            color: white;
        }
        
        .fgs-close:hover { 
            background: rgba(220, 53, 69, 0.8); 
            color: white;
        }
        
        .fgs-popup-content { 
            padding: 14px; 
            max-height: none; 
            overflow-y: visible; 
        }
        
        .fgs-popup-content.minimized { 
            display: none; 
        }
        
        /* Settings Dropdown */
        .fgs-settings-dropdown {
            background: ${theme.isTransparent ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
            border: 1px solid ${theme.isTransparent ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)'};
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
            border-bottom: 1px solid ${theme.isTransparent ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'};
            background: ${theme.isTransparent ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
            border-radius: 8px 8px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .fgs-settings-back {
            background: rgba(255, 255, 255, 0.95);
            color: #0a2540;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            font-weight: 600;
        }
        
        .fgs-settings-back:hover {
            background: rgba(255, 255, 255, 1);
            transform: translateY(-1px);
        }
        
        .fgs-settings-header h4 {
            margin: 0;
            color: ${theme.textColor};
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
            color: ${theme.textColor};
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
        
        .fgs-mode-selection { 
            display: flex; 
            flex-direction: column; 
            gap: 10px; 
        }
        
        .fgs-mode-header {
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            margin-bottom: 8px;
        }
        
        .fgs-mode-header h3 {
            color: ${theme.textColor}; 
            margin: 0; 
            font-size: 15px; 
            font-weight: 600;
        }
        
        .fgs-calc-header {
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            margin-bottom: 10px;
        }
        
        .fgs-mode-btn {
            padding: 10px; 
            background: linear-gradient(to right, #0e3a5f, #1d5c8f);
            color: white; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer;
            font-size: 13px; 
            transition: all 0.2s; 
            font-weight: 600;
            margin-bottom: 6px;
        }
        
        .fgs-mode-btn:hover {
            background: linear-gradient(to right, #15466d, #226da4);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
        }
        
        /* FIXED: Better GPA Calculator button color */
        .fgs-mode-btn-gpa {
            background: ${theme.gpaButtonColor} !important;
            border: 2px solid ${theme.isTransparent ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'};
            font-weight: 600;
            margin-bottom: 6px;
            color: white !important;
        }
        
        .fgs-mode-btn-gpa:hover {
            opacity: 0.85 !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(59, 130, 196, 0.4);
        }
        
        .fgs-calculator-form { 
            display: flex; 
            flex-direction: column; 
            gap: 8px; 
        }
        
        .fgs-back-btn {
            background: rgba(255, 255, 255, 0.95); 
            color: #0a2540; 
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 5px 8px; 
            border-radius: 4px; 
            font-size: 11px; 
            cursor: pointer;
            align-self: flex-start;
            font-weight: 600;
        }
        
        .fgs-back-btn:hover {
            background: rgba(255, 255, 255, 1);
            transform: translateY(-1px);
        }
        
        .fgs-input, .fgs-dropdown {
            padding: 7px; 
            border: none; 
            border-radius: 4px;
            background: ${theme.inputBg}; 
            color: ${theme.textColor}; 
            font-size: 12px;
        }
        
        .fgs-input::placeholder { 
            color: ${placeholderColor}; 
        }
        
        /* FIXED DROPDOWN STYLING */
        .fgs-dropdown {
            background: #000000 !important;
            color: #ffffff !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
        }
        
        .fgs-dropdown option {
            background: #000000 !important;
            color: #ffffff !important;
            padding: 6px !important;
        }
        
        .fgs-checkbox-container {
            display: flex; 
            align-items: center; 
            gap: 5px; 
            color: ${theme.textColor}; 
            font-size: 11px;
        }
        
        .fgs-btn {
            padding: 7px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer;
            font-size: 12px; 
            font-weight: 500; 
            transition: all 0.2s;
        }
        
        .fgs-btn-primary { 
            background: ${theme.buttonPrimary}; 
            color: white; 
        }
        
        .fgs-btn-primary:hover { 
            opacity: 0.8; 
            transform: translateY(-1px); 
        }
        
        .fgs-btn-secondary { 
            background: ${theme.buttonSecondary}; 
            color: #0a2540; 
            font-weight: 600;
        }
        
        .fgs-btn-secondary:hover { 
            opacity: 0.8; 
            transform: translateY(-1px); 
        }
        
        .fgs-undo-redo-container { 
            display: flex; 
            gap: 5px; 
            align-items: center; 
        }
        
        .fgs-btn-undo {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            font-size: 10px; 
            padding: 5px 8px; 
            flex: 1;
        }
        
        .fgs-btn-undo:hover {
            background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
            transform: translateY(-1px);
        }
        
        .fgs-btn-redo {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white; 
            font-size: 10px; 
            padding: 5px 8px; 
            flex: 1; 
            min-width: 45px;
        }
        
        .fgs-btn-redo:hover {
            background: linear-gradient(135deg, #e871f5 0%, #f44069 100%);
            transform: translateY(-1px);
        }
        
        .fgs-category-container { 
            display: none; 
        }
        
        /* GPA Calculator Styles */
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
            border-bottom: 1px solid ${theme.isTransparent ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'};
        }
        
        .fgs-gpa-back, .fgs-gpa-back-to-classes {
            background: rgba(255, 255, 255, 0.95);
            color: #0a2540;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 5px 8px;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            font-weight: 600;
        }
        
        .fgs-gpa-back:hover, .fgs-gpa-back-to-classes:hover {
            background: rgba(255, 255, 255, 1);
            transform: translateY(-1px);
        }
        
        .fgs-gpa-step-indicator {
            color: ${theme.textColor === '#000000' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)'};
            font-size: 11px;
            font-weight: 500;
        }
        
        .fgs-gpa-content h3 {
            color: ${theme.textColor};
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
            background: ${theme.isTransparent ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
            border-radius: 6px;
            border: 1px solid ${theme.isTransparent ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'};
            min-height: 16px;
        }
        
        .fgs-gpa-class-info {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-width: 0;
        }
        
        .fgs-gpa-class-name {
            color: ${theme.textColor};
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
            color: ${theme.isTransparent ? '#000000' : 'white'};
            padding: 1px 4px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
        }
        
        .fgs-gpa-class-type.ap {
            background: rgba(220, 53, 69, 0.8);
            color: white;
        }
        
        .fgs-gpa-class-type.honors {
            background: rgba(255, 193, 7, 0.8);
            color: black;
        }
        
        .fgs-gpa-class-type.regular {
            background: rgba(108, 117, 125, 0.8);
            color: white;
        }
        
        .fgs-gpa-grade-edit {
            background: rgba(255, 255, 255, 0.95);
            color: #0a2540;
            border: 1px solid rgba(255, 255, 255, 0.3);
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
            background: ${theme.isTransparent ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
            border-radius: 6px;
            border-left: 3px solid #28a745;
        }
        
        .fgs-gpa-result-label {
            color: ${theme.textColor};
            font-weight: 600;
            font-size: 12px;
        }
        
        .fgs-gpa-result-value {
            color: ${theme.textColor};
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
            background: ${theme.isTransparent ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
            border-radius: 4px;
            padding: 8px;
            margin-bottom: 12px;
        }
        
        .fgs-gpa-info p {
            color: ${theme.textColor === '#000000' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)'};
            margin: 2px 0;
            font-size: 11px;
            line-height: 1.3;
        }
        
        /* GPA Disclaimer and Instructions */
        .fgs-gpa-disclaimer {
            background: rgba(255, 193, 7, 0.1);
            border: 1px solid rgba(255, 193, 7, 0.3);
            border-radius: 6px;
            padding: 8px 10px;
            margin-bottom: 12px;
        }
        
        .fgs-gpa-disclaimer p {
            color: ${theme.textColor};
            margin: 0;
            font-size: 11px;
            line-height: 1.3;
            font-weight: 500;
        }
        
        .fgs-gpa-instruction {
            background: rgba(255, 107, 107, 0.1);
            border: 1px solid rgba(255, 107, 107, 0.3);
            border-radius: 6px;
            padding: 10px;
            margin-bottom: 12px;
        }
        
        .fgs-gpa-instruction p {
            color: ${theme.textColor};
            margin: 0;
            font-size: 12px;
            line-height: 1.4;
            font-weight: 500;
        }
        
        /* FEEDBACK BOX - Always visible at bottom */
        .fgs-feedback-box {
            background: ${theme.isTransparent ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)'};
            border: 1px solid ${theme.isTransparent ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'};
            border-radius: 8px;
            margin-top: 12px;
            overflow: hidden;
        }
        
        .fgs-feedback-header {
            padding: 8px 12px;
            background: ${theme.isTransparent ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
            border-bottom: 1px solid ${theme.isTransparent ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'};
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
        }
        
        .fgs-feedback-title {
            color: ${theme.textColor};
            font-size: 12px;
            font-weight: 600;
        }
        
        .fgs-feedback-toggle {
            background: none;
            border: none;
            color: ${theme.textColor};
            font-size: 14px;
            cursor: pointer;
            padding: 2px;
            border-radius: 3px;
            transition: all 0.2s;
        }
        
        .fgs-feedback-toggle:hover {
            background: ${theme.isTransparent ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'};
        }
        
        .fgs-feedback-content {
            padding: 10px 12px;
            display: block;
        }
        
        .fgs-feedback-content.collapsed {
            display: none;
        }
        
        .fgs-feedback-textarea {
            width: 100%;
            min-height: 50px;
            background: ${theme.isTransparent ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)'};
            border: 1px solid ${theme.isTransparent ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'};
            border-radius: 4px;
            padding: 6px 8px;
            color: ${theme.textColor};
            font-family: inherit;
            font-size: 11px;
            line-height: 1.3;
            margin-bottom: 8px;
            resize: vertical;
            box-sizing: border-box;
            transition: all 0.2s;
        }
        
        .fgs-feedback-textarea::placeholder {
            color: ${theme.textColor === '#000000' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)'};
        }
        
        .fgs-feedback-textarea:focus {
            outline: none;
            border-color: ${theme.buttonPrimary};
            box-shadow: 0 0 0 2px ${theme.buttonPrimary}33;
        }
        
        .fgs-feedback-actions {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .fgs-feedback-send {
            background: ${theme.buttonPrimary};
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .fgs-feedback-send:hover:not(:disabled) {
            opacity: 0.8;
            transform: translateY(-1px);
        }
        
        .fgs-feedback-send:disabled {
            background: rgba(108, 117, 125, 0.6);
            cursor: not-allowed;
            transform: none;
        }
        
        .fgs-feedback-status {
            font-size: 10px;
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
    `;
}