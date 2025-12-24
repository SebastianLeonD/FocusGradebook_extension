/**
 * CONTENT-MAIN.JS
 * PRODUCTION VERSION: Removed console logs and debug utilities
 * FIXED: Added debouncing and proper state management to prevent popup glitching
 */

(function () {
        "use strict";

        // ===========================================
        // POPUP STATE MANAGEMENT (NEW - FIXES GLITCHING)
        // ===========================================
        let isPopupInitializing = false;
        let lastClickTime = 0;
        const CLICK_DEBOUNCE_MS = 300; // Prevent clicks within 300ms of each other

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
         * IMPROVED: Better score editing activation
         */
        window.launchGradeCalculator = function() {
        try {
                console.log("🚀 Launching grade calculator...");
                
                // Check if user is on the correct page for grade calculator
                if (!isOnGradeCalculatorPage()) {
                showGradeCalculatorPageWarning();
                return;
                }
                
                // Auto-detect class type
                mode = detectClassType();
                console.log("📊 Detected mode:", mode);
                
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
                        if (categoryInput) categoryInput.style.display = "block";
                        if (categoryContainer) categoryContainer.style.display = "none";
                }
                
                // IMPROVED: Enable score editing with better timing and feedback
                // Shorter delay since we're already in the calculator
                setTimeout(() => {
                        console.log("🔧 Activating score editing...");
                        
                        if (typeof makeScoresEditable === 'function') {
                        makeScoresEditable();
                        console.log("✅ Score editing is now ACTIVE!");
                        console.log("💡 Hover over any assignment score and click to edit");
                        } else {
                        console.error("❌ makeScoresEditable function not found!");
                        }
                }, 300); // Reduced from 500ms to 300ms
                
                }, 100);
                
        } catch (error) {
                console.error("❌ Error in launchGradeCalculator:", error);
        }
        };

        /**
         * Checks if user is on correct page for grade calculator
         */
        function isOnGradeCalculatorPage() {
                try {
                        const currentUrl = window.location.href;
                        const hasModulesInUrl = currentUrl.includes('Modules.php');
                        const isFocusGradesView = /Grades\/StudentGBGrades\.php/i.test(currentUrl) || currentUrl.includes('modname=Grades/StudentGBGrades.php');
                        const hasHashList = currentUrl.includes('#!List');
                        const hasStudentAndCourse = currentUrl.includes('student_id=') && currentUrl.includes('course_period_id=');
                        const broadGradesHint = currentUrl.toLowerCase().includes('grades');

                        // Accept if it's clearly the detailed class grade page, or a close variant
                        return (
                                (hasModulesInUrl && isFocusGradesView && (hasStudentAndCourse || hasHashList)) ||
                                (hasModulesInUrl && broadGradesHint)
                        );
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
         * FIXED: Creates floating popup with proper initialization sequence
         */
        function createFloatingPopup() {
                try {
                        console.log("🎨 Creating floating popup...");
                        
                        if (floatingPopup) {
                                floatingPopup.remove();
                        }
                        floatingPopup = document.createElement("div");
                        floatingPopup.id = "focus-grade-simulator-popup";
                        floatingPopup.style.width = '325px';
                        floatingPopup.style.maxHeight = '500px';
                        floatingPopup.style.transition = 'width 0.3s ease, height 0.3s ease';
                        
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
                        if (typeof setPopupSizeForInterface === 'function') {
                                setPopupSizeForInterface('mode-selection');
                        }
                        
                        // CRITICAL FIX: Don't set display here - will be controlled by handleExtensionClick
                        
                        console.log("✅ Popup HTML injected");
                        
                        // Setup events after a small delay
                        setTimeout(() => {
                                setupEvents();
                                setupGPACalculatorEvents();
                                        setupDrag();
                                setupFeedbackSystem();
                                setupNewFeaturesSection();
                                window.showModeSelection();

                                // Per request: do not auto-enable editing; user must click Grade Calculator
                                console.log("✅ Events and mode selection setup complete");
                        }, 50);
                } catch (error) {
                        console.error("❌ Error in createFloatingPopup:", error);
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


        /**
         * FIXED: Handles extension icon clicks with debouncing and proper state management
         * This prevents the popup from glitching and auto-closing
         */
        function handleExtensionClick() {
                try {
                        // DEBOUNCE: Prevent rapid clicks
                        const now = Date.now();
                        if (now - lastClickTime < CLICK_DEBOUNCE_MS) {
                                console.log("⚠️ Click ignored - too soon after last click");
                                return;
                        }
                        lastClickTime = now;
                        
                        console.log("🖱️ Extension icon clicked");
                        console.log("Popup exists?", !!floatingPopup);
                        console.log("Is initializing?", isPopupInitializing);
                        
                        if (floatingPopup) {
                                // Popup already exists - toggle visibility
                                const currentDisplay = floatingPopup.style.display;
                                console.log("Current display:", currentDisplay);
                                
                                if (currentDisplay === "none") {
                                        // Currently hidden - show it
                                        floatingPopup.style.display = "block";
                                        floatingPopup.style.visibility = "visible";
                                        floatingPopup.style.opacity = "1";
                                        applySizingForCurrentInterface();
                                        console.log("✅ Popup shown");
                                } else {
                                        // Currently visible - hide it
                                        floatingPopup.style.display = "none";
                                        console.log("✅ Popup hidden");
                                }
                        } else {
                                // Popup doesn't exist - create it
                                if (isPopupInitializing) {
                                        console.log("⚠️ Popup is already being initialized, please wait");
                                        return;
                                }
                                
                                console.log("Creating new popup...");
                                isPopupInitializing = true;
                                
                                createFloatingPopup();
                                
                                // Wait for popup to be fully created and rendered
                                setTimeout(() => {
                                        if (floatingPopup) {
                                                // Force display to block with full visibility
                                                floatingPopup.style.display = "block";
                                                floatingPopup.style.visibility = "visible";
                                                floatingPopup.style.opacity = "1";
                                                
                                                console.log("✅ Popup created and displayed");
                                                isPopupInitializing = false;
                                        } else {
                                                console.error("❌ Popup creation failed");
                                                isPopupInitializing = false;
                                        }
                                }, 150); // Increased timeout for better reliability
                        }
                } catch (error) {
                        console.error("❌ Error in handleExtensionClick:", error);
                        isPopupInitializing = false;
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

                        // Save theme to localStorage for persistence
                        localStorage.setItem('fgs-selected-theme', selectedTheme);

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
                        // Tutorial popup events (replicates GPA tutorial behavior)
                        safeAddListener("fgs-tutorial", "click", () => {
                                try {
                                        const backdropId = 'fgs-full-tutorial-backdrop';
                                        const existingBackdrop = document.getElementById(backdropId);
                                        if (existingBackdrop) {
                                                existingBackdrop.remove();
                                        }

                                        const backdrop = document.createElement('div');
                                        backdrop.id = backdropId;
                                        backdrop.className = 'fgs-tutorial-backdrop';

                                        const popup = document.createElement('div');
                                        popup.className = 'fgs-tutorial-popup';
                                        popup.innerHTML = `
                                                <div class="fgs-tutorial-header">
                                                        <span>Full Tutorial</span>
                                                        <button class="fgs-tutorial-close" aria-label="Close tutorial">×</button>
                                                </div>
                                                <div class="fgs-tutorial-body">
                                                        <video class="fgs-tutorial-video" controls playsinline preload="metadata"></video>
                                                </div>
                                        `;

                                        backdrop.appendChild(popup);
                                        document.body.appendChild(backdrop);

                                        const video = popup.querySelector('video');
                                        const closeBtn = popup.querySelector('.fgs-tutorial-close');

                                        const closeTutorial = () => {
                                                if (video) {
                                                        try {
                                                                video.pause();
                                                                video.currentTime = 0;
                                                                video.removeAttribute('src');
                                                        } catch (_) {}
                                                }
                                                backdrop.removeEventListener('click', backdropHandler);
                                                if (closeBtn) closeBtn.removeEventListener('click', closeHandler);
                                                backdrop.remove();
                                        };

                                        const closeHandler = (event) => {
                                                event.preventDefault();
                                                closeTutorial();
                                        };

                                        const backdropHandler = (event) => {
                                                if (event.target === backdrop) {
                                                        closeTutorial();
                                                }
                                        };

                                        if (video) {
                                                const src = (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getURL === 'function')
                                                        ? chrome.runtime.getURL('popup/popup-tutorial.mp4')
                                                        : 'popup/popup-tutorial.mp4';
                                                video.src = src;
                                                video.loop = false;
                                                video.muted = false;
                                                video.controls = true;
                                                video.removeAttribute('autoplay');
                                                try {
                                                        video.load();
                                                        video.play().catch(() => {});
                                                } catch (_) {}
                                        }

                                        backdrop.addEventListener('click', backdropHandler);
                                        if (closeBtn) closeBtn.addEventListener('click', closeHandler);
                                } catch (error) {
                                        console.warn('⚠️ Full tutorial popup failed', error);
                                }
                        });
                         
                        // Load and apply saved theme
                        setTimeout(() => {
                                const savedTheme = localStorage.getItem('fgs-selected-theme') || 'default';
                                const popupThemeSelect = document.getElementById("fgs-popup-theme-select");
                                if (popupThemeSelect) {
                                        popupThemeSelect.value = savedTheme;
                                }
                                // Apply the saved theme
                                applyPopupTheme(savedTheme);
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
                                        if (typeof validateGPAGradeInputs === 'function' && !validateGPAGradeInputs(true)) {
                                                return;
                                        }
                                        showGPAStep(2);
                                }
                        });

                        safeAddGPAListener("fgs-gpa-help", "click", () => {
                                window.showHelp();
                        });

                        const tutorialSrc = (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getURL === 'function')
                                ? chrome.runtime.getURL('popup/tutorial.mp4')
                                : 'popup/tutorial.mp4';

                        safeAddGPAListener("fgs-gpa-help-results", "click", () => {
                                window.showHelp();
                        });

                        safeAddGPAListener("fgs-gpa-help-video", "click", () => {
                                console.log('▶️ Tutorial button clicked');
                                const backdropId = 'fgs-tutorial-backdrop';
                                const existingBackdrop = document.getElementById(backdropId);
                                if (existingBackdrop) {
                                        existingBackdrop.remove();
                                }

                                const backdrop = document.createElement('div');
                                backdrop.id = backdropId;
                                backdrop.className = 'fgs-tutorial-backdrop';

                                const popup = document.createElement('div');
                                popup.className = 'fgs-tutorial-popup';
                                popup.innerHTML = `
                                        <div class="fgs-tutorial-header">
                                                <span>Focus Grades Tutorial</span>
                                                <button class="fgs-tutorial-close" aria-label="Close tutorial">×</button>
                                        </div>
                                        <div class="fgs-tutorial-body">
                                                <video class="fgs-tutorial-video" playsinline muted loop></video>
                                        </div>
                                `;

                                backdrop.appendChild(popup);
                                document.body.appendChild(backdrop);

                                const video = popup.querySelector('video');
                                const closeBtn = popup.querySelector('.fgs-tutorial-close');

                                const closeTutorial = (reason) => {
                                        console.log('⏹️ Tutorial closed', reason ? `(${reason})` : '');
                                        if (video) {
                                                video.pause();
                                                video.currentTime = 0;
                                                video.removeAttribute('src');
                                        }
                                        backdrop.removeEventListener('click', backdropHandler);
                                        if (closeBtn) closeBtn.removeEventListener('click', closeHandler);
                                        backdrop.remove();
                                };

                                const closeHandler = (event) => {
                                        event.preventDefault();
                                        closeTutorial('button');
                                };

                                const backdropHandler = (event) => {
                                        if (event.target === backdrop) {
                                                closeTutorial('backdrop');
                                        }
                                };

                                if (video) {
                                        video.src = tutorialSrc;
                                        video.loop = true;
                                        video.muted = true;
                                        video.play()?.catch((err) => console.warn('⚠️ Tutorial playback error', err));
                                }

                                backdrop.addEventListener('click', backdropHandler);
                                if (closeBtn) closeBtn.addEventListener('click', closeHandler);
                        });

                        // Manual Class Creation
                        safeAddGPAListener("fgs-gpa-create-manual", "click", () => {
                                const modal = document.getElementById('fgs-gpa-manual-modal');
                                if (modal) {
                                        modal.style.display = 'flex';
                                        // Clear previous input
                                        const nameInput = document.getElementById('fgs-manual-class-name');
                                        const typeSelect = document.getElementById('fgs-manual-class-type');
                                        const q1Select = document.getElementById('fgs-manual-q1');
                                        const q2Select = document.getElementById('fgs-manual-q2');
                                        const examSelect = document.getElementById('fgs-manual-exam');
                                        if (nameInput) nameInput.value = '';
                                        if (typeSelect) typeSelect.value = 'DualEnrollment';
                                        if (q1Select) q1Select.value = '';
                                        if (q2Select) q2Select.value = '';
                                        if (examSelect) examSelect.value = '';
                                }
                        });

                        safeAddGPAListener("fgs-gpa-manual-close", "click", () => {
                                const modal = document.getElementById('fgs-gpa-manual-modal');
                                if (modal) modal.style.display = 'none';
                        });

                        safeAddGPAListener("fgs-manual-cancel-btn", "click", () => {
                                const modal = document.getElementById('fgs-gpa-manual-modal');
                                if (modal) modal.style.display = 'none';
                        });

                        safeAddGPAListener("fgs-manual-add-btn", "click", () => {
                                const nameInput = document.getElementById('fgs-manual-class-name');
                                const typeSelect = document.getElementById('fgs-manual-class-type');
                                const q1Select = document.getElementById('fgs-manual-q1');
                                const q2Select = document.getElementById('fgs-manual-q2');
                                const examSelect = document.getElementById('fgs-manual-exam');

                                const className = nameInput?.value.trim() || '';
                                const classType = typeSelect?.value || 'DualEnrollment';
                                const q1Grade = q1Select?.value || '';
                                const q2Grade = q2Select?.value || '';
                                const examGrade = examSelect?.value || '';

                                if (!className) {
                                        alert('Please enter a class name');
                                        return;
                                }

                                // Create a manual class object
                                const manualClass = {
                                        id: `manual_${Date.now()}`,
                                        name: className,
                                        baseType: classType,
                                        type: classType,
                                        manualType: classType,
                                        typeEditorOpen: false,
                                        isCore: typeof isCoreSubject === 'function' ? isCoreSubject(className) : false,
                                        credits: 1.0,
                                        isEOC: typeof isEOCCourse === 'function' ? isEOCCourse(className) : false,
                                        grade: q1Grade || q2Grade || examGrade || '—',
                                        quarters: {
                                                q1: q1Grade,
                                                q2: q2Grade,
                                                exam: examGrade
                                        },
                                        sourceTexts: {
                                                q1: q1Grade,
                                                q2: q2Grade,
                                                exam: examGrade
                                        },
                                        semester: {
                                                letter: '',
                                                totalPoints: 0,
                                                passesTwoOfThree: false
                                        },
                                        isManual: true
                                };

                                // Add to the classes and selected classes arrays
                                if (typeof gpaCalculatorData !== 'undefined') {
                                        gpaCalculatorData.classes.push(manualClass);
                                        gpaCalculatorData.selectedClasses.push(manualClass);

                                        // Re-render the class list
                                        if (typeof renderClassList === 'function') {
                                                renderClassList();
                                        }

                                        // Close the modal
                                        const modal = document.getElementById('fgs-gpa-manual-modal');
                                        if (modal) modal.style.display = 'none';
                                }
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
