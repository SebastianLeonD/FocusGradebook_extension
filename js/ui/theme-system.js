/**
 * THEME-SYSTEM.JS
 * Handles popup color themes accessed via settings gear icon
 * Better GPA button color, smooth transitions, feedback box styling
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
    },
    sunset: {
        name: 'Sunset Orange',
        gradient: 'linear-gradient(to bottom, #ff6b35, #f7931e, #ffcb77)',
        textColor: '#ffffff',
        buttonPrimary: '#ff6b35',
        buttonSecondary: 'rgba(255, 255, 255, 0.25)',
        inputBg: 'rgba(255, 255, 255, 0.2)',
        gpaButtonColor: 'linear-gradient(to right, #ff6b35, #ff8c42, #ffa35c)',
        isTransparent: false
    },
    ocean: {
        name: 'Ocean Teal',
        gradient: 'linear-gradient(to bottom, #006d77, #118a9a, #83c5be)',
        textColor: '#ffffff',
        buttonPrimary: '#06d6a0',
        buttonSecondary: 'rgba(255, 255, 255, 0.25)',
        inputBg: 'rgba(255, 255, 255, 0.2)',
        gpaButtonColor: 'linear-gradient(to right, #006d77, #06d6a0, #5bc0be)',
        isTransparent: false
    },
    purple: {
        name: 'Purple Haze',
        gradient: 'linear-gradient(to bottom, #4a148c, #6a1b9a, #8e24aa)',
        textColor: '#ffffff',
        buttonPrimary: '#ba68c8',
        buttonSecondary: 'rgba(255, 255, 255, 0.25)',
        inputBg: 'rgba(255, 255, 255, 0.2)',
        gpaButtonColor: 'linear-gradient(to right, #7b1fa2, #9c27b0, #ba68c8)',
        isTransparent: false
    },
    dark: {
        name: 'Dark Mode',
        gradient: 'linear-gradient(to bottom, #1a1a1a, #2d2d2d, #1f1f1f)',
        textColor: '#e0e0e0',
        buttonPrimary: '#bb86fc',
        buttonSecondary: 'rgba(255, 255, 255, 0.1)',
        inputBg: 'rgba(255, 255, 255, 0.05)',
        gpaButtonColor: 'linear-gradient(to right, #bb86fc, #cf6679, #03dac6)',
        isTransparent: false
    },
    forest: {
        name: 'Forest Green',
        gradient: 'linear-gradient(to bottom, #1b4332, #2d6a4f, #40916c)',
        textColor: '#ffffff',
        buttonPrimary: '#52b788',
        buttonSecondary: 'rgba(255, 255, 255, 0.25)',
        inputBg: 'rgba(255, 255, 255, 0.2)',
        gpaButtonColor: 'linear-gradient(to right, #2d6a4f, #52b788, #74c69d)',
        isTransparent: false
    }
};

/**
 * Applies popup theme with smooth transitions and proper sizing
 */
function applyPopupTheme(themeName) {
    try {
        const popup = document.getElementById('focus-grade-simulator-popup');
        if (!popup) {
            return;
        }

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
            try {
                if (typeof applySizingForCurrentInterface === 'function') {
                    applySizingForCurrentInterface();
                }
            } catch (innerError) {
                // Sizing fallback - non-critical
            }
        }, 50);
        
    } catch (error) {
        console.error('THEME SWITCH - Error applying theme:', error);
    }
}

/**
 * Enhanced sizing control with smooth transitions
 */
function applySizingForCurrentInterface() {
    try {
        if (typeof setPopupSizeForInterface === 'function' && typeof determineActiveInterface === 'function') {
            setPopupSizeForInterface(determineActiveInterface());
        }
    } catch (error) {
        console.error('Error applying sizing:', error);
    }
}

/**
 * Generates themed CSS with better colors and feedback box
 */
function generateThemedCSS(theme) {
    const isLightTheme = theme.textColor === '#212529' || theme.textColor === '#000000';
    const placeholderColor = isLightTheme ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)';
    const cardBackground = isLightTheme ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.3)';
    const cardBorder = isLightTheme ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.2)';
    const cardHoverBackground = isLightTheme ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 0.4)';
    const cardHoverBorder = isLightTheme ? 'rgba(0, 102, 204, 0.35)' : 'rgba(52, 144, 220, 0.5)';
    const cardShadow = isLightTheme ? '0 2px 8px rgba(10, 37, 64, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.3)';
    const gradeSelectBackground = isLightTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.5)';
    const gradeSelectColor = isLightTheme ? '#0a2540' : '#ffffff';
    const gradeSelectBorder = isLightTheme ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.3)';
    const gradeSelectHoverBorder = isLightTheme ? 'rgba(0, 102, 204, 0.45)' : 'rgba(52, 144, 220, 0.6)';
    const gradeHintColor = isLightTheme ? 'rgba(0, 0, 0, 0.55)' : 'rgba(255, 255, 255, 0.5)';
    const semesterResultBackground = isLightTheme
        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(232, 244, 255, 0.8))'
        : 'linear-gradient(135deg, rgba(10, 37, 64, 0.7), rgba(10, 37, 64, 0.5))';
    const semesterBorder = isLightTheme ? '1px solid rgba(0, 102, 204, 0.2)' : '1px solid rgba(52, 144, 220, 0.3)';
    const semesterLabelColor = isLightTheme ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.7)';
    const noClassesBackground = isLightTheme ? 'rgba(0, 102, 204, 0.08)' : 'rgba(52, 144, 220, 0.12)';
    const noClassesBorder = isLightTheme ? '1px dashed rgba(0, 102, 204, 0.25)' : '1px dashed rgba(52, 144, 220, 0.4)';
    const noClassesHeadingColor = isLightTheme ? '#0a2540' : '#87ceeb';
    const noClassesTextColor = isLightTheme ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.7)';
    const addDropdownBackground = isLightTheme ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.4)';
    const addDropdownBorder = isLightTheme ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.3)';
    const addDropdownColor = isLightTheme ? '#0a2540' : '#ffffff';
    // Special handling for transparent mode
    const popupBackground = theme.gradient;
    const popupBackdrop = theme.backdrop ? `backdrop-filter: ${theme.backdrop};` : 'backdrop-filter: blur(10px);';
    const popupBorder = theme.border || '1px solid rgba(255, 255, 255, 0.1)';
    
    return `
        #focus-grade-simulator-popup {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 450px;
            background: ${popupBackground};
            ${popupBackdrop}
            color: ${theme.textColor};
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            font-family: 'Segoe UI', sans-serif;
            user-select: none;
            border: ${popupBorder};
            max-height: 90vh;
            overflow-y: auto;
            transition: width 0.3s ease, height 0.3s ease, transform 0.2s ease;
            transform-origin: top right;
        }

        /* Sizing - Always default to small with smooth transitions */
        #focus-grade-simulator-popup.size-small {
            width: 520px !important;
            min-height: auto;
        }

        #focus-grade-simulator-popup.size-medium {
            width: 550px !important;
            min-height: auto;
        }

        #focus-grade-simulator-popup.size-large {
            width: 650px !important;
            min-height: auto;
        }

        #focus-grade-simulator-popup.size-xlarge {
            width: 800px !important;
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
            padding: 8px 10px;
            border-radius: 12px 12px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: move;
            border-bottom: 1px solid ${theme.isTransparent ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'};
            position: sticky;
            top: 0;
            z-index: 10001;
            gap: 8px;
        }

        .fgs-title {
            color: ${theme.textColor};
            font-weight: 600;
            font-size: 13px;
            flex-shrink: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .fgs-controls {
            display: flex;
            gap: 3px;
            align-items: center;
            flex-shrink: 0;
        }

        .fgs-tutorial {
            border: none;
            border-radius: 8px;
            background: ${theme.isTransparent ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)'};
            color: ${theme.textColor};
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 3px;
            font-size: 10px;
            padding: 0 8px;
            height: 26px;
            white-space: nowrap;
            transition: background 0.2s ease, transform 0.2s ease;
        }

        .fgs-tutorial:hover {
            background: rgba(52, 144, 220, 0.8);
            color: #ffffff;
            transform: translateY(-1px);
        }

        .fgs-new-features-btn {
            border: none;
            border-radius: 8px;
            background: ${theme.isTransparent ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)'};
            color: ${theme.textColor};
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 2px;
            font-size: 10px;
            padding: 0 8px;
            height: 26px;
            white-space: nowrap;
            transition: background 0.2s ease, transform 0.2s ease;
        }

        .fgs-new-features-btn:hover {
            background: rgba(255, 193, 7, 0.8);
            color: #ffffff;
            transform: translateY(-1px);
        }

        .fgs-help, .fgs-settings, .fgs-minimize, .fgs-close {
            width: 26px;
            height: 26px;
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
            transition: background 0.2s ease, transform 0.2s ease;
            flex-shrink: 0;
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
            background: ${isLightTheme ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.95)'};
            color: #0a2540;
            border: 1px solid ${isLightTheme ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.3)'};
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            font-weight: 600;
        }

        .fgs-settings-back:hover {
            background: ${isLightTheme ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 1)'};
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
            background: ${gradeSelectBackground};
            color: ${gradeSelectColor};
            border: 1px solid ${gradeSelectBorder};
            padding: 4px 6px;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            background-image: url("data:image/svg+xml;charset=US-ASCII,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><path fill='${isLightTheme ? '%230a2540' : '%23ffffff'}' d='M2 0L0 2h4zm0 5L0 3h4z'/></svg>");
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
            background: ${theme.buttonPrimary};
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
            font-weight: 600;
            margin-bottom: 6px;
        }

        .fgs-mode-btn:hover {
            opacity: 0.85;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        /* Better GPA Calculator button color */
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
            background: ${isLightTheme ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.95)'};
            color: #0a2540;
            border: 1px solid ${isLightTheme ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.3)'};
            padding: 5px 8px;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            align-self: flex-start;
            font-weight: 600;
        }

        .fgs-back-btn:hover {
            background: ${isLightTheme ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 1)'};
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
        
        /* Dropdown styling */
        .fgs-dropdown {
            background: ${gradeSelectBackground};
            color: ${gradeSelectColor};
            border: 1px solid ${gradeSelectBorder};
        }

        .fgs-dropdown option {
            background: ${isLightTheme ? '#ffffff' : '#000000'};
            color: ${isLightTheme ? '#0a2540' : '#ffffff'};
            padding: 6px;
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
            color: ${isLightTheme ? '#0a2540' : '#ffffff'};
            font-weight: 600;
        }

        .fgs-btn-secondary:hover {
            opacity: 0.8;
            transform: translateY(-1px);
        }

        /* Reset All button - white washed */
        #fgs-reset {
            background: ${isLightTheme ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.15)'};
            color: ${isLightTheme ? '#0a2540' : '#ffffff'};
        }
        #fgs-reset:hover {
            background: ${isLightTheme ? 'rgba(0, 0, 0, 0.14)' : 'rgba(255, 255, 255, 0.25)'};
            opacity: 1;
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
            background: ${isLightTheme ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.95)'};
            color: #0a2540;
            border: 1px solid ${isLightTheme ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.3)'};
            padding: 5px 8px;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            font-weight: 600;
        }

        .fgs-gpa-back:hover, .fgs-gpa-back-to-classes:hover {
            background: ${isLightTheme ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 1)'};
            transform: translateY(-1px);
        }
        
        .fgs-gpa-step-indicator {
            color: ${isLightTheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)'};
            font-size: 11px;
            font-weight: 500;
        }
        
        .fgs-gpa-content h3 {
            color: ${theme.textColor};
            margin: 0 0 12px 0;
            font-size: 16px;
            text-align: center;
        }

        .fgs-gpa-subheading {
            color: ${isLightTheme ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'};
            font-size: 12px;
            line-height: 1.4;
            text-align: center;
            margin-bottom: 12px;
        }

        /* Semester Selector Dropdown */
        .fgs-gpa-semester-selector {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-bottom: 12px;
            padding: 8px 12px;
            background: ${isLightTheme ? 'rgba(0, 102, 204, 0.08)' : 'rgba(52, 144, 220, 0.15)'};
            border: 1px solid ${isLightTheme ? 'rgba(0, 102, 204, 0.2)' : 'rgba(52, 144, 220, 0.3)'};
            border-radius: 6px;
        }

        .fgs-gpa-semester-selector label {
            color: ${theme.textColor};
            font-size: 12px;
            font-weight: 600;
        }

        .fgs-gpa-semester-dropdown {
            background: ${gradeSelectBackground};
            color: ${gradeSelectColor};
            border: 1px solid ${gradeSelectBorder};
            border-radius: 4px;
            padding: 6px 10px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            min-width: 160px;
        }

        .fgs-gpa-semester-dropdown:hover {
            border-color: ${gradeSelectHoverBorder};
        }

        .fgs-gpa-semester-dropdown:focus {
            outline: none;
            border-color: ${theme.buttonPrimary};
            box-shadow: 0 0 0 2px ${theme.buttonPrimary}33;
        }

        /* Semester-specific manual modal fields */
        .fgs-manual-sem1-fields,
        .fgs-manual-sem2-fields {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        /* Credits selector row */
        .fgs-gpa-credits-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            padding: 6px 10px;
            background: ${isLightTheme ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.05)'};
            border-radius: 4px;
        }

        .fgs-gpa-credits-label {
            color: ${theme.textColor};
            font-size: 11px;
            font-weight: 500;
        }

        .fgs-gpa-credits-select {
            background: ${gradeSelectBackground};
            color: ${gradeSelectColor};
            border: 1px solid ${gradeSelectBorder};
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            min-width: 60px;
        }

        .fgs-gpa-credits-select:hover {
            border-color: ${gradeSelectHoverBorder};
        }

        .fgs-gpa-credits-select:focus {
            outline: none;
            border-color: ${theme.buttonPrimary};
            box-shadow: 0 0 0 2px ${theme.buttonPrimary}33;
        }

        /* Class warning message */
        .fgs-gpa-class-warning {
            background: rgba(255, 193, 7, 0.15);
            border: 1px solid rgba(255, 193, 7, 0.3);
            border-radius: 4px;
            padding: 6px 10px;
            margin-bottom: 8px;
            font-size: 10px;
            color: ${isLightTheme ? '#856404' : '#ffc107'};
            font-weight: 500;
        }

        /* Full year warning banner */
        .fgs-gpa-full-year-warning {
            background: rgba(255, 193, 7, 0.12);
            border: 1px solid rgba(255, 193, 7, 0.35);
            border-radius: 6px;
            padding: 10px 12px;
            margin-bottom: 12px;
        }

        .fgs-gpa-full-year-warning p {
            color: ${isLightTheme ? '#856404' : '#ffc107'};
            font-size: 11px;
            line-height: 1.4;
            margin: 0;
        }

        .fgs-gpa-full-year-warning p strong {
            color: ${isLightTheme ? '#6c5ce7' : '#ffc107'};
        }

        /* Double-count warning */
        .fgs-gpa-double-count-warning {
            background: rgba(220, 53, 69, 0.12);
            border: 1px solid rgba(220, 53, 69, 0.35);
            border-radius: 6px;
            padding: 10px 12px;
            margin-bottom: 12px;
        }

        .fgs-gpa-double-count-warning p {
            color: ${isLightTheme ? '#721c24' : '#f8d7da'};
            font-size: 11px;
            line-height: 1.4;
            margin: 0;
        }

        /* S1 in S2 warning (calculating S1 when already in S2) */
        .fgs-gpa-s1-in-s2-warning {
            background: rgba(255, 152, 0, 0.12);
            border: 1px solid rgba(255, 152, 0, 0.4);
            border-radius: 6px;
            padding: 10px 12px;
            margin-bottom: 12px;
        }

        .fgs-gpa-s1-in-s2-warning p {
            color: ${isLightTheme ? '#e65100' : '#ffcc80'};
            font-size: 11px;
            line-height: 1.4;
            margin: 0;
        }
        
        .fgs-gpa-class-list {
            display: flex;
            flex-direction: column;
            gap: 0;
            max-height: 440px;
            overflow-y: auto;
            padding-right: 5px;
            margin-bottom: 12px;
        }
        
        .fgs-gpa-class-list::-webkit-scrollbar {
            width: 6px;
        }
        
        .fgs-gpa-class-list::-webkit-scrollbar-track {
            background: ${isLightTheme ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)'};
            border-radius: 3px;
        }
        
        .fgs-gpa-class-list::-webkit-scrollbar-thumb {
            background: ${isLightTheme ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.2)'};
            border-radius: 3px;
        }
        
        .fgs-gpa-class-list::-webkit-scrollbar-thumb:hover {
            background: ${isLightTheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)'};
        }
        
        .fgs-gpa-class-item {
            margin-bottom: 16px;
            width: 100%;
        }
        
        .fgs-gpa-class-card {
            background: ${cardBackground};
            border: ${cardBorder};
            border-radius: 8px;
            padding: 12px;
            width: 100%;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 130px;
            transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        
        .fgs-gpa-class-card:hover {
            background: ${cardHoverBackground};
            border-color: ${cardHoverBorder};
            box-shadow: ${cardShadow};
        }
        
        .fgs-gpa-class-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
            width: 100%;
            gap: 10px;
        }
        
        .fgs-gpa-class-title {
            flex: 1;
            min-width: 0;
        }
        
        .fgs-gpa-class-name {
            color: ${theme.textColor};
            font-weight: 600;
            font-size: 13px;
            line-height: 1.3;
            margin-bottom: 6px;
            word-wrap: break-word;
        }
        
        .fgs-gpa-class-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 4px;
        }
        
        .fgs-gpa-class-type {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            background: rgba(0, 0, 0, 0.35);
            color: white;
        }
        
        .fgs-gpa-class-type.ap,
        .fgs-gpa-class-type.aice,
        .fgs-gpa-class-type.ib,
        .fgs-gpa-class-type.dualenrollment {
            background: rgba(220, 53, 69, 0.9);
            color: white;
        }
        
        .fgs-gpa-class-type.honors,
        .fgs-gpa-class-type.hon,
        .fgs-gpa-class-type.preap,
        .fgs-gpa-class-type.preaice,
        .fgs-gpa-class-type.preib {
            background: rgba(255, 193, 7, 0.9);
            color: #1b2735;
        }
        
        .fgs-gpa-class-type.regular,
        .fgs-gpa-class-type.reg {
            background: rgba(108, 117, 125, 0.9);
            color: white;
        }
        
        .fgs-gpa-class-type.manual {
            border: 1px solid #ffc107;
        }
        
        .fgs-gpa-edit-type {
            background: rgba(0, 0, 0, 0.35);
            color: white;
            border: none;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            font-size: 12px;
            line-height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .fgs-gpa-edit-type:hover {
            background: rgba(52, 144, 220, 0.8);
            transform: scale(1.1);
        }
        
        .fgs-gpa-type-editor {
            margin-top: 6px;
            display: none;
            align-items: center;
            gap: 6px;
        }
        
        .fgs-gpa-type-select {
            background: ${gradeSelectBackground};
            color: ${gradeSelectColor};
            border: 1px solid ${gradeSelectBorder};
            border-radius: 4px;
            padding: 4px 6px;
            font-size: 11px;
        }
        
        .fgs-gpa-core-tag {
            display: inline-block;
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: 600;
        }
        
        .fgs-gpa-eoc-tag {
            display: inline-block;
            background: rgba(52, 144, 220, 0.9);
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: 600;
        }
        
        .fgs-gpa-class-remove {
            background: rgba(220, 53, 69, 0.8);
            color: white;
            border: none;
            border-radius: 50%;
            width: 22px;
            height: 22px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-left: 8px;
        }
        
        .fgs-gpa-class-remove:hover {
            background: rgba(220, 53, 69, 1);
            transform: scale(1.1);
        }
        
        .fgs-gpa-grade-row {
            display: flex;
            gap: 8px;
            margin-bottom: 10px;
            width: 100%;
        }

        .fgs-gpa-grade-row.full-year-mode {
            gap: 4px;
            margin-bottom: 8px;
        }
        
        .fgs-gpa-grade-box {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
        }

        /* Compact grade boxes for full year mode (6 columns) */
        .fgs-gpa-grade-row.full-year-mode .fgs-gpa-grade-box {
            gap: 1px;
        }

        .fgs-gpa-grade-label {
            color: ${theme.textColor};
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }

        .fgs-gpa-grade-row.full-year-mode .fgs-gpa-grade-label {
            font-size: 9px;
            letter-spacing: 0;
        }

        .fgs-gpa-grade-select {
            background: ${gradeSelectBackground} !important;
            color: ${gradeSelectColor} !important;
            border: 1px solid ${gradeSelectBorder};
            border-radius: 4px;
            padding: 5px 4px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            width: 100%;
            box-sizing: border-box;
        }

        .fgs-gpa-grade-select option {
            background: ${isLightTheme ? '#ffffff' : '#1a1a2e'};
            color: ${isLightTheme ? '#0a2540' : '#ffffff'};
        }

        .fgs-gpa-grade-row.full-year-mode .fgs-gpa-grade-select {
            padding: 4px 2px;
            font-size: 11px;
        }
        
        .fgs-gpa-grade-select:hover {
            border-color: ${gradeSelectHoverBorder};
        }
        
        .fgs-gpa-grade-select:focus {
            outline: none;
            border-color: ${theme.buttonPrimary};
            box-shadow: 0 0 0 2px ${theme.buttonPrimary}33;
        }
        
        .fgs-gpa-grade-select.fgs-gpa-select-missing {
            border-color: #dc3545 !important;
            box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.25);
        }
        
        .fgs-gpa-grade-hint {
            color: ${gradeHintColor};
            font-size: 9px;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .fgs-gpa-grade-row.full-year-mode .fgs-gpa-grade-hint {
            font-size: 8px;
            display: none; /* Hide hints in full year mode to save space */
        }
        
        .fgs-gpa-semester-result {
            background: ${semesterResultBackground};
            border: ${semesterBorder};
            border-radius: 4px;
            padding: 8px 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
        }
        
        .fgs-gpa-semester-label {
            color: ${semesterLabelColor};
            font-size: 10px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        
        .fgs-gpa-semester-value {
            font-weight: 600;
            font-size: 11px;
            color: ${theme.textColor};
        }
        
        .fgs-gpa-semester-pass {
            color: #28a745 !important;
        }
        
        .fgs-gpa-semester-fail {
            color: #dc3545 !important;
        }
        
        .fgs-gpa-no-classes,
        #fgs-gpa-no-classes {
            background: ${noClassesBackground};
            border: ${noClassesBorder};
            border-radius: 6px;
            padding: 16px;
            text-align: center;
            margin-bottom: 12px;
        }
        
        .fgs-gpa-no-classes h4,
        #fgs-gpa-no-classes h4 {
            color: ${noClassesHeadingColor};
            font-size: 13px;
            margin-bottom: 6px;
        }
        
        .fgs-gpa-no-classes p,
        #fgs-gpa-no-classes p {
            color: ${noClassesTextColor};
            font-size: 11px;
            line-height: 1.3;
            margin: 0;
        }
        
        .fgs-gpa-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            gap: 8px;
        }
        
        .fgs-gpa-add-dropdown,
        #fgs-gpa-add-class {
            background: ${addDropdownBackground};
            color: ${addDropdownColor};
            border: 1px solid ${addDropdownBorder};
            padding: 6px 10px;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            flex: 1;
        }
        
        @media (max-width: 480px) {
            .fgs-gpa-grade-row {
                gap: 5px;
            }
            
            .fgs-gpa-grade-select {
                padding: 4px 3px;
                font-size: 11px;
            }
            
            .fgs-gpa-class-name {
                font-size: 11px;
            }
            
            .fgs-gpa-grade-label {
                font-size: 9px;
            }
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
        
        .fgs-gpa-result-item.baseline {
            border-left-color: ${theme.isTransparent ? 'rgba(0, 0, 0, 0.35)' : 'rgba(108, 117, 125, 0.8)'};
        }
        
        .fgs-gpa-result-item.projected {
            border-left-color: #17a2b8;
        }
        
        .fgs-gpa-result-item.projected-up {
            border-left-color: #28a745;
        }
        
        .fgs-gpa-result-item.projected-down {
            border-left-color: #dc3545;
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
        
        .fgs-gpa-result-note {
            color: ${isLightTheme ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.75)'};
            font-size: 10px;
            margin: 4px 0 8px 0;
            text-align: right;
        }

        .fgs-gpa-summary {
            color: ${isLightTheme ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.7)'};
            font-size: 11px;
            margin-bottom: 8px;
        }
        
        .fgs-gpa-delta-summary {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
            background: ${theme.isTransparent ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)'};
            border-radius: 6px;
            padding: 8px 10px;
            font-size: 11px;
            color: ${theme.textColor};
        }
        
        .fgs-gpa-delta-summary .summary-values-row {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .fgs-gpa-delta-summary .summary-label {
            font-weight: 600;
            font-size: 11px;
        }
        
        .fgs-gpa-delta-summary .summary-values {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
        }
        
        .fgs-gpa-delta-summary .summary-old {
            opacity: 0.75;
        }
        
        .fgs-gpa-delta-summary .summary-arrow {
            font-size: 12px;
            opacity: 0.6;
        }
        
        .fgs-gpa-delta-summary .summary-new {
            font-weight: 700;
            color: ${theme.textColor};
        }
        
        .fgs-gpa-delta-summary .summary-delta {
            margin-left: auto;
            font-size: 16px;
            font-weight: 600;
        }
        
        .fgs-gpa-delta-summary .summary-delta:empty {
            display: none;
        }
        
        .fgs-gpa-delta-summary .credits-detail {
            font-size: 10px;
            opacity: 0.7;
        }
        
        .fgs-gpa-delta-summary.up .summary-new,
        .fgs-gpa-delta-summary.up .summary-delta {
            color: #28a745;
        }
        
        .fgs-gpa-delta-summary.down .summary-new,
        .fgs-gpa-delta-summary.down .summary-delta {
            color: #dc3545;
        }
        
        .fgs-gpa-delta-summary.up {
            border-left: 3px solid #28a745;
        }
        
        .fgs-gpa-delta-summary.down {
            border-left: 3px solid #dc3545;
        }
        
        .fgs-gpa-delta-summary.neutral {
            border-left: 3px solid ${theme.isTransparent ? 'rgba(0, 0, 0, 0.3)' : 'rgba(108, 117, 125, 0.6)'};
        }
        
        .fgs-gpa-summary-rows {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 12px;
        }
        
        .fgs-gpa-info {
            background: ${theme.isTransparent ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
            border-radius: 4px;
            padding: 8px;
            margin-bottom: 12px;
        }
        
        .fgs-gpa-info p {
            color: ${isLightTheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)'};
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
            max-height: 150px;
            box-sizing: border-box;
            transition: all 0.2s;
        }
        
        .fgs-feedback-textarea::placeholder {
            color: ${isLightTheme ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)'};
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

        /* NEW FEATURES MODAL - Full-screen modal popup */
        .fgs-new-features-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.75);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            padding: 24px;
        }

        .fgs-new-features-modal {
            width: 900px;
            max-width: 95vw;
            max-height: 85vh;
            background: linear-gradient(135deg, #0a2540 0%, #1a3a5c 50%, #0a2540 100%);
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .fgs-new-features-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 20px;
            background: rgba(0, 0, 0, 0.3);
            color: white;
            font-size: 15px;
            font-weight: 600;
            letter-spacing: 0.5px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .fgs-new-features-close {
            background: rgba(0, 0, 0, 0.55);
            color: white;
            border: none;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 20px;
            transition: all 0.2s;
        }

        .fgs-new-features-close:hover {
            background: rgba(220, 53, 69, 0.85);
            transform: scale(1.1);
        }

        .fgs-new-features-modal-body {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
        }

        /* Scrollbar styling for modal */
        .fgs-new-features-modal-body::-webkit-scrollbar {
            width: 8px;
        }

        .fgs-new-features-modal-body::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
        }

        .fgs-new-features-modal-body::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
        }

        .fgs-new-features-modal-body::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        /* Grid Layout - Main at top (100%), two features below (50% each) */
        .fgs-features-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
        }

        /* Feature Cards */
        .fgs-feature-card {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 8px;
            padding: 20px;
            transition: all 0.3s;
            display: flex;
            flex-direction: column;
        }

        .fgs-feature-card:hover {
            background: rgba(255, 255, 255, 0.12);
            border-color: rgba(255, 193, 7, 0.6);
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        /* Main Feature - Full width at top (4 columns = 100%) */
        .fgs-feature-main {
            grid-column: span 4;
        }

        /* Secondary Feature - Half width (2 columns = 50%) */
        .fgs-feature-secondary {
            grid-column: span 2;
        }

        /* Responsive - stack on smaller screens */
        @media (max-width: 768px) {
            .fgs-features-grid {
                grid-template-columns: 1fr;
            }

            .fgs-feature-main,
            .fgs-feature-secondary {
                grid-column: span 1;
            }
        }

        .fgs-feature-badge-container {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 8px;
        }

        .fgs-feature-badge {
            font-size: 9px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .fgs-badge-new {
            background: #28a745;
            color: white;
        }

        .fgs-badge-fixed {
            background: #dc3545;
            color: white;
        }

        .fgs-feature-icon {
            font-size: 42px;
            text-align: center;
            margin-bottom: 12px;
        }

        .fgs-feature-title {
            color: white;
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 12px 0;
            text-align: center;
        }

        .fgs-feature-description {
            color: rgba(255, 255, 255, 0.85);
            font-size: 13px;
            line-height: 1.5;
            margin: 0 0 16px 0;
            text-align: center;
            flex: 1;
        }

        /* Feature Tags */
        .fgs-feature-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
            margin-top: 12px;
        }

        .fgs-feature-tag {
            background: rgba(255, 255, 255, 0.15);
            color: white;
            font-size: 10px;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 14px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }



        .fgs-gpa-help-video {
            background: rgba(52, 144, 220, 0.9);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 6px 12px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .fgs-gpa-help-video:hover {
            background: rgba(52, 144, 220, 1);
            transform: translateY(-1px);
        }

        .fgs-gpa-create-manual {
            background: rgba(40, 167, 69, 0.9);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 6px 12px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 600;
        }

        .fgs-gpa-create-manual:hover {
            background: rgba(40, 167, 69, 1);
            transform: translateY(-1px);
        }

        /* Manual Class Creation Modal */
        .fgs-gpa-manual-modal {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: ${theme.isTransparent ? 'rgba(255, 255, 255, 0.98)' : 'rgba(10, 37, 64, 0.98)'};
            border-radius: 12px;
            z-index: 10002;
            display: flex;
            flex-direction: column;
            animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }

        .fgs-gpa-manual-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px;
            border-bottom: 1px solid ${theme.isTransparent ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'};
            background: ${theme.isTransparent ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)'};
        }

        .fgs-gpa-manual-header h4 {
            color: ${theme.textColor};
            margin: 0;
            font-size: 14px;
            font-weight: 600;
        }

        .fgs-gpa-manual-close {
            background: rgba(220, 53, 69, 0.8);
            color: white;
            border: none;
            border-radius: 50%;
            width: 26px;
            height: 26px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 18px;
            font-weight: bold;
            transition: all 0.2s;
        }

        .fgs-gpa-manual-close:hover {
            background: rgba(220, 53, 69, 1);
            transform: scale(1.1);
        }

        .fgs-gpa-manual-content {
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            overflow-y: auto;
        }

        .fgs-manual-input, .fgs-manual-select, .fgs-manual-grade-select {
            padding: 8px 10px;
            border: 1px solid ${theme.isTransparent ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'};
            border-radius: 4px;
            background: ${theme.isTransparent ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.2)'};
            color: ${theme.textColor};
            font-size: 12px;
        }

        .fgs-manual-input::placeholder {
            color: ${isLightTheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)'};
        }

        .fgs-manual-input:focus, .fgs-manual-select:focus, .fgs-manual-grade-select:focus {
            outline: none;
            border-color: ${theme.buttonPrimary};
            box-shadow: 0 0 0 2px ${theme.buttonPrimary}33;
        }

        .fgs-manual-label {
            color: ${theme.textColor};
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 2px;
        }

        .fgs-manual-grades {
            display: flex;
            gap: 10px;
            margin-top: 4px;
        }

        .fgs-manual-grade-box {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .fgs-tutorial-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.65);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            padding: 24px;
        }

        .fgs-tutorial-popup {
            width: 800px;
            max-width: 95vw;
            background: rgba(10, 37, 64, 0.95);
            border-radius: 12px;
            box-shadow: 0 20px 45px rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .fgs-tutorial-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 14px;
            background: rgba(0, 0, 0, 0.3);
            color: white;
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.5px;
        }

        .fgs-tutorial-close {
            background: rgba(0, 0, 0, 0.55);
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 16px;
        }

        .fgs-tutorial-close:hover {
            background: rgba(220, 53, 69, 0.85);
        }

        .fgs-tutorial-body {
            padding: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .fgs-tutorial-video {
            width: 100%;
            height: auto;
            max-height: 60vh;
            border-radius: 8px;
            background: #000;
            object-fit: contain;
        }

        /* Focus-visible states for keyboard navigation */
        #focus-grade-simulator-popup button:focus-visible,
        #focus-grade-simulator-popup select:focus-visible,
        #focus-grade-simulator-popup input:focus-visible,
        #focus-grade-simulator-popup textarea:focus-visible {
            outline: 2px solid ${theme.buttonPrimary};
            outline-offset: 2px;
        }


        /* Safety max-width for popup on smaller viewports */
        #focus-grade-simulator-popup {
            max-width: calc(100vw - 20px);
        }

        /* Respect reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
            #focus-grade-simulator-popup,
            #focus-grade-simulator-popup *,
            #focus-grade-simulator-popup *::before,
            #focus-grade-simulator-popup *::after {
                transition-duration: 0.01ms !important;
                animation-duration: 0.01ms !important;
            }
        }
    `
}
