/**
 * CONTENT-MAIN.JS
 * PRODUCTION VERSION: Removed console logs and debug utilities
 */

(function () {
        "use strict";

        // ===========================================
        // CHROME EXTENSION SETUP
        // ===========================================
        if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
                chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
                        try {
                                if (request.type === "openFloatingCalculator") {
                                        handleExtensionClick();
                                        sendResponse({ success: !0 });
                                }
                        } catch (error) {
                                sendResponse({ error: error.message });
                        }
                        return !0;
                });
        }

        // ===========================================
        // GLOBAL FUNCTION DEFINITIONS
        // ===========================================
        
        /**
         * Shows mode selection with proper sizing
         */
        window.showModeSelection = function() {
                try {
                        const modeSelection = document.getElementById("fgs-mode-selection");
                        const calculatorForm = document.getElementById("fgs-calculator-form");
                        const gpaCalculator = document.getElementById("fgs-gpa-calculator");
                        const settingsDropdown = document.getElementById("fgs-settings-dropdown");
                        
                        if (modeSelection) modeSelection.style.display = "flex";
                        if (calculatorForm) calculatorForm.style.display = "none";
                        if (gpaCalculator) gpaCalculator.style.display = "none";
                        if (settingsDropdown) settingsDropdown.style.display = "none";
                        
                        applySizingForCurrentInterface();
                } catch (error) {
                        // Silent error handling for production
                }
        };

        /**
         * Launches grade calculator with URL validation
         */
        window.launchGradeCalculator = function() {
                try {
                        // Check if user is on the correct page for grade calculator
                        if (!isOnGradeCalculatorPage()) {
                                showGradeCalculatorPageWarning();
                                return;
                        }
                        
                        // Auto-detect class type
                        mode = detectClassType();
                        
                        const modeSelection = document.getElementById("fgs-mode-selection");
                        const calculatorForm = document.getElementById("fgs-calculator-form");
                        const gpaCalculator = document.getElementById("fgs-gpa-calculator");
                        const settingsDropdown = document.getElementById("fgs-settings-dropdown");
                        
                        if (modeSelection) modeSelection.style.display = "none";
                        if (calculatorForm) calculatorForm.style.display = "flex";
                        if (gpaCalculator) gpaCalculator.style.display = "none";
                        if (settingsDropdown) settingsDropdown.style.display = "none";
                        
                        applySizingForCurrentInterface();
                        
                        // Configure interface based on auto-detected type
                        setTimeout(() => {
                                const categoryInput = document.getElementById("fgs-category-input");
                                const categoryContainer = document.getElementById("fgs-category-container");
                                
                                if (mode === "weighted") {
                                        if (categoryInput) categoryInput.style.display = "none";
                                        if (categoryContainer) {
                                                categoryContainer.style.display = "block";
                                                populateCategories();
                                        }
                                        saveOriginalCategoryData();
                                } else {
                                        if (categoryInput) categoryInput.style.display = "none";
                                        if (categoryContainer) categoryContainer.style.display = "none";
                                }
                        }, 100);
                        
                } catch (error) {
                        // Silent error handling for production
                }
        };

        /**
         * Checks if user is on correct page for grade calculator
         */
        function isOnGradeCalculatorPage() {
                try {
                        const currentUrl = window.location.href;
                        const hasGradesInUrl = currentUrl.includes('Grades') || currentUrl.includes('grades');
                        const hasModulesInUrl = currentUrl.includes('Modules.php');
                        
                        return hasGradesInUrl && hasModulesInUrl;
                } catch (error) {
                        return true; // Default to allowing if error
                }
        }

        /**
         * Shows warning when not on correct page for grade calculator
         */
        function showGradeCalculatorPageWarning() {
                try {
                        // Show mode selection but with warning
                        const modeSelection = document.getElementById('fgs-mode-selection');
                        const calculatorForm = document.getElementById('fgs-calculator-form');
                        const gpaCalculator = document.getElementById('fgs-gpa-calculator');
                        const settingsDropdown = document.getElementById('fgs-settings-dropdown');
                        
                        if (modeSelection) modeSelection.style.display = 'flex';
                        if (calculatorForm) calculatorForm.style.display = 'none';
                        if (gpaCalculator) gpaCalculator.style.display = 'none';
                        if (settingsDropdown) settingsDropdown.style.display = 'none';
                        
                        // Show alert to user
                        alert('⚠️ Grade Calculator works best on individual class pages.\n\nPlease navigate to a specific class in Focus to use this feature.');
                        
                } catch (error) {
                        // Silent error handling for production
                }
        }

        /**
         * Shows help modal
         */
        window.showHelp = function() {
                try {
                        if (!helpModal) {
                                createHelpModal();
                        }
                        if (helpModal) {
                                helpModal.style.display = "block";
                        }
                } catch (error) {
                        // Silent error handling for production
                }
        };

        // Add GPA Calculator function from the GPA calculator file
        window.launchGPACalculator = function() {
                try {
                        // Check if user is on the correct page
                        const currentUrl = window.location.href;
                        const hasStudentRCGrades = currentUrl.includes('StudentRCGrades.php');
                        const hasGradesInPath = currentUrl.includes('Grades/StudentRCGrades') || currentUrl.includes('modname=Grades');
                        
                        if (!(hasStudentRCGrades || hasGradesInPath)) {
                                alert('⚠️ GPA Calculator requires the Grades page.\n\nPlease navigate to the "Grades" tab in Focus to use this feature.');
                                return;
                        }
                        
                        // Hide other interfaces and show GPA calculator
                        const modeSelection = document.getElementById('fgs-mode-selection');
                        const calculatorForm = document.getElementById('fgs-calculator-form');
                        const gpaCalculator = document.getElementById('fgs-gpa-calculator');
                        const settingsDropdown = document.getElementById('fgs-settings-dropdown');
                        
                        if (modeSelection) modeSelection.style.display = 'none';
                        if (calculatorForm) calculatorForm.style.display = 'none';
                        if (gpaCalculator) gpaCalculator.style.display = 'flex';
                        if (settingsDropdown) settingsDropdown.style.display = 'none';
                        
                        // Call the full GPA calculator logic if available
                        if (typeof extractClassData === 'function') {
                                extractClassData();
                        }
                        if (typeof autoSelectClasses === 'function') {
                                autoSelectClasses();
                        }
                        if (typeof showGPAStep === 'function') {
                                showGPAStep(1);
                        }
                        
                } catch (error) {
                        // Silent error handling for production
                }
        };

        // ===========================================
        // MAIN POPUP MANAGEMENT
        // ===========================================
        
        /**
         * Handles extension icon clicks - toggles popup visibility or creates new popup
         */
        function handleExtensionClick() {
                try {
                        if (floatingPopup) {
                                if (floatingPopup.style.display === "none") {
                                        floatingPopup.style.display = "block";
                                        applySizingForCurrentInterface();
                                } else {
                                        floatingPopup.style.display = "none";
                                }
                        } else {
                                createFloatingPopup();
                        }
                } catch (error) {
                        // Silent error handling for production
                }
        }

        /**
         * Creates popup with feedback system integration
         */
        function createFloatingPopup() {
                try {
                        if (floatingPopup) {
                                floatingPopup.remove();
                        }
                        floatingPopup = document.createElement("div");
                        floatingPopup.id = "focus-grade-simulator-popup";
                        
                        // Inject HTML template
                        floatingPopup.innerHTML = getPopupHTML();
                        
                        // Create and inject CSS styles with default theme
                        const style = document.createElement("style");
                        style.id = "fgs-styles";
                        style.textContent = generateThemedCSS(popupThemes.default);
                        
                        const existingStyle = document.getElementById("fgs-styles");
                        if (existingStyle) {
                                existingStyle.remove();
                        }
                        document.head.appendChild(style);
                        document.body.appendChild(floatingPopup);
                        
                        // Setup events after a small delay
                        setTimeout(() => {
                                setupEvents();
                                setupGPACalculatorEvents();
                                setupDrag();
                                setupFeedbackSystem();
                                window.showModeSelection();
                        }, 50);
                } catch (error) {
                        // Silent error handling for production
                }
        }

        // ===========================================
        // SETTINGS DROPDOWN MANAGEMENT
        // ===========================================
        
        /**
         * Settings dropdown with proper sizing
         */
        function toggleSettingsDropdown() {
                try {
                        const settingsDropdown = document.getElementById("fgs-settings-dropdown");
                        const modeSelection = document.getElementById("fgs-mode-selection");
                        const calculatorForm = document.getElementById("fgs-calculator-form");
                        const gpaCalculator = document.getElementById("fgs-gpa-calculator");
                        
                        if (!settingsDropdown) return;
                        
                        const isCurrentlyVisible = settingsDropdown.style.display === "block";
                        
                        if (isCurrentlyVisible) {
                                // Hide settings, show previous screen
                                settingsDropdown.style.display = "none";
                                
                                if (calculatorForm && calculatorForm.style.display === "flex") {
                                        calculatorForm.style.display = "flex";
                                } else if (gpaCalculator && gpaCalculator.style.display === "flex") {
                                        gpaCalculator.style.display = "flex";
                                } else {
                                        if (modeSelection) modeSelection.style.display = "flex";
                                }
                                
                                applySizingForCurrentInterface();
                        } else {
                                // Show settings
                                settingsDropdown.style.display = "block";
                                if (modeSelection) modeSelection.style.display = "none";
                                if (calculatorForm) calculatorForm.style.display = "none";
                                if (gpaCalculator) gpaCalculator.style.display = "none";
                                
                                applySizingForCurrentInterface();
                        }
                        
                } catch (error) {
                        // Silent error handling for production
                }
        }

        /**
         * Settings theme change with proper sizing
         */
        function handleSettingsThemeChange(e) {
                try {
                        const selectedTheme = e.target.value;
                        applyPopupTheme(selectedTheme);
                        
                        // Always ensure small size after theme change
                        setTimeout(() => {
                                applySizingForCurrentInterface();
                        }, 100);
                } catch (error) {
                        // Silent error handling for production
                }
        }

        // ===========================================
        // HELP MODAL MANAGEMENT
        // ===========================================
        
        /**
         * Creates the comprehensive help guide modal
         */
        function createHelpModal() {
                try {
                        if (helpModal) {
                                helpModal.remove();
                        }
                        helpModal = document.createElement("div");
                        helpModal.id = "focus-help-modal";
                        
                        helpModal.innerHTML = getHelpModalHTML();
                        
                        const helpStyle = document.createElement("style");
                        helpStyle.id = "fgs-help-styles";
                        helpStyle.textContent = getHelpModalCSS();
                        
                        const existingHelpStyle = document.getElementById("fgs-help-styles");
                        if (existingHelpStyle) {
                                existingHelpStyle.remove();
                        }
                        document.head.appendChild(helpStyle);
                        document.body.appendChild(helpModal);
                        setupHelpEvents();
                } catch (error) {
                        // Silent error handling for production
                }
        }

        /**
         * Sets up event listeners for help modal interactions
         */
        function setupHelpEvents() {
                try {
                        const closeBtn = document.getElementById("fgs-help-close");
                        const overlay = document.getElementById("fgs-help-overlay");
                        if (closeBtn) {
                                closeBtn.addEventListener("click", (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        closeHelpModal();
                                });
                        }
                        if (overlay) {
                                overlay.addEventListener("click", (e) => {
                                        if (e.target === overlay) {
                                                closeHelpModal();
                                        }
                                });
                        }
                        document.addEventListener("keydown", (e) => {
                                if (e.key === "Escape" && helpModal && helpModal.style.display !== "none") {
                                        closeHelpModal();
                                }
                        });
                } catch (error) {
                        // Silent error handling for production
                }
        }

        /**
         * Closes the help modal by hiding it
         */
        function closeHelpModal() {
                try {
                        if (helpModal) {
                                helpModal.style.display = "none";
                        }
                } catch (error) {
                        // Silent error handling for production
                }
        }

        // ===========================================
        // EVENT LISTENER SETUP
        // ===========================================
        
        /**
         * Event setup without duplicate help buttons
         */
        function setupEvents() {
                try {
                        function safeAddListener(id, event, handler, description) {
                                const element = document.getElementById(id);
                                if (element) {
                                        element.addEventListener(event, function (e) {
                                                try {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handler(e);
                                                } catch (error) {
                                                        // Silent error handling for production
                                                }
                                        });
                                }
                        }
                        
                        // Header controls
                        safeAddListener("fgs-close", "click", () => {
                                if (floatingPopup) floatingPopup.style.display = "none";
                        });
                        safeAddListener("fgs-minimize", "click", () => {
                                const content = document.getElementById("fgs-content");
                                if (content) content.classList.toggle("minimized");
                        });
                        safeAddListener("fgs-help", "click", () => {
                                window.showHelp();
                        });
                        safeAddListener("fgs-settings", "click", toggleSettingsDropdown);
                        
                        // Main calculator buttons
                        safeAddListener("fgs-mode-grade", "click", window.launchGradeCalculator);
                        safeAddListener("fgs-mode-gpa", "click", window.launchGPACalculator);
                        safeAddListener("fgs-back", "click", window.showModeSelection);
                        
                        // Calculator functionality
                        safeAddListener("fgs-add", "click", handleAdd);
                        safeAddListener("fgs-reset", "click", clearAll);
                        safeAddListener("fgs-undo", "click", undo);
                        safeAddListener("fgs-redo", "click", redo);
                        
                        // Settings theme selector
                        safeAddListener("fgs-popup-theme-select", "change", handleSettingsThemeChange);
                        safeAddListener("fgs-settings-back", "click", () => {
                                toggleSettingsDropdown();
                        });
                         
                        // Set current theme in dropdown
                        setTimeout(() => {
                                const popupThemeSelect = document.getElementById("fgs-popup-theme-select");
                                if (popupThemeSelect) {
                                        popupThemeSelect.value = 'default';
                                }
                        }, 100);
                        
                } catch (error) {
                        // Silent error handling for production
                }
        }

        // ===========================================
        // GPA CALCULATOR EVENT SETUP
        // ===========================================
        
        /**
         * Sets up GPA calculator event listeners
         */
        function setupGPACalculatorEvents() {
                try {
                        function safeAddGPAListener(id, event, handler, description) {
                                const element = document.getElementById(id);
                                if (element) {
                                        element.addEventListener(event, function (e) {
                                                try {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handler(e);
                                                } catch (error) {
                                                        // Silent error handling for production
                                                }
                                        });
                                }
                        }
                        
                        // GPA Calculator buttons
                        safeAddGPAListener("fgs-gpa-back", "click", () => {
                                window.showModeSelection();
                        });
                        
                        safeAddGPAListener("fgs-gpa-back-to-classes", "click", () => {
                                if (typeof showGPAStep === 'function') {
                                        showGPAStep(1);
                                }
                        });
                        
                        safeAddGPAListener("fgs-gpa-calculate", "click", () => {
                                if (typeof showGPAStep === 'function') {
                                        showGPAStep(2);
                                }
                        });
                        
                        safeAddGPAListener("fgs-gpa-help", "click", () => {
                                window.showHelp();
                        });
                        
                        safeAddGPAListener("fgs-gpa-help-results", "click", () => {
                                window.showHelp();
                        });
                        
                } catch (error) {
                        // Silent error handling for production
                }
        }

        // ===========================================
        // DRAG & DROP FUNCTIONALITY
        // ===========================================
        
        /**
         * Sets up drag and drop functionality for the popup window
         */
        function setupDrag() {
                try {
                        const header = document.getElementById("fgs-drag-header");
                        if (!header) return;
                        let startX, startY, initialLeft, initialTop;
                        header.addEventListener("mousedown", function (e) {
                                try {
                                        isDragging = !0;
                                        const rect = floatingPopup.getBoundingClientRect();
                                        startX = e.clientX;
                                        startY = e.clientY;
                                        initialLeft = rect.left;
                                        initialTop = rect.top;
                                        document.addEventListener("mousemove", handleDrag);
                                        document.addEventListener("mouseup", stopDrag);
                                        e.preventDefault();
                                } catch (error) {
                                        // Silent error handling for production
                                }
                        });
                        function handleDrag(e) {
                                if (!isDragging || !floatingPopup) return;
                                try {
                                        const deltaX = e.clientX - startX;
                                        const deltaY = e.clientY - startY;
                                        const newLeft = Math.max(0, Math.min(window.innerWidth - floatingPopup.offsetWidth, initialLeft + deltaX));
                                        const newTop = Math.max(0, Math.min(window.innerHeight - floatingPopup.offsetHeight, initialTop + deltaY));
                                        floatingPopup.style.left = newLeft + "px";
                                        floatingPopup.style.top = newTop + "px";
                                        floatingPopup.style.right = "auto";
                                } catch (error) {
                                        // Silent error handling for production
                                }
                        }
                        function stopDrag() {
                                isDragging = !1;
                                document.removeEventListener("mousemove", handleDrag);
                                document.removeEventListener("mouseup", stopDrag);
                        }
                } catch (error) {
                        // Silent error handling for production
                }
        }

        /**
         * Populates the category dropdown with available grading categories
         */
        function populateCategories() {
                try {
                        const dropdown = document.getElementById("fgs-category-dropdown");
                        if (!dropdown) return;
                        const categories = extractCategories();
                        while (dropdown.options.length > 1) {
                                dropdown.remove(1);
                        }
                        categories.forEach((category) => {
                                try {
                                        const option = document.createElement("option");
                                        option.value = category;
                                        option.textContent = category;
                                        dropdown.appendChild(option);
                                } catch (error) {
                                        // Continue adding other categories
                                }
                        });
                } catch (error) {
                        // Silent error handling for production
                }
        }

        // ===========================================
        // CLASS MANAGEMENT
        // ===========================================
        
        /**
         * Ensures current class context is properly set with monitoring
         */
        function ensureCurrentClass() {
                try {
                        const select = document.querySelector("select.student-gb-grades-course");
                        currentClassId = select ? select.value : getCurrentClassKey();
                        saveOriginalRows();
                        nextRowColor = getNextColorFromTable();
                } catch (error) {
                        currentClassId = getCurrentClassKey();
                }
        }

        // ===========================================
        // INITIALIZATION
        // ===========================================
        
        /**
         * Initializes the extension when the page is ready
         */
        function initialize() {
                if (isInitialized) return;
                try {
                        ensureCurrentClass();
                        setupClassChangeMonitoring();
                        isInitialized = !0;
                } catch (error) {
                        // Silent error handling for production
                }
        }

        // ===========================================
        // PAGE LOAD HANDLERS
        // ===========================================
        if (document.readyState === "complete" || document.readyState === "interactive") {
                setTimeout(initialize, 1000);
        }
        window.addEventListener("load", () => {
                setTimeout(initialize, 1500);
        });
        document.addEventListener("DOMContentLoaded", () => {
                setTimeout(initialize, 500);
        });
        setTimeout(initialize, 3000);
})();