/**
 * CONTENT-MAIN.JS
 * Main content script for the Focus Grade Calculator extension.
 * Manages popup lifecycle, event wiring, drag-and-drop, and state management with debouncing.
 */

(function () {
        "use strict";

        // ===========================================
        // POPUP STATE MANAGEMENT
        // ===========================================
        let isPopupInitializing = false;
        let lastClickTime = 0;
        const CLICK_DEBOUNCE_MS = 300; // Prevent clicks within 300ms of each other

        // ===========================================
        // CACHED DOM ELEMENT LOOKUPS
        // ===========================================
        let cachedElements = {};

        /**
         * Returns a cached reference to a DOM element by ID.
         * Avoids redundant document.getElementById calls for frequently accessed elements.
         */
        function getCachedElement(id) {
                if (!cachedElements[id]) {
                        cachedElements[id] = document.getElementById(id);
                }
                return cachedElements[id];
        }

        // ===========================================
        // CHROME EXTENSION SETUP
        // ===========================================
        if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
                chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
                        try {
                                if (request.type === "openFloatingCalculator") {
                                        handleExtensionClick();
                                        sendResponse({ success: true });
                                }
                        } catch (error) {
                                sendResponse({ error: error.message });
                        }
                        return true;
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
                        const modeSelection = getCachedElement("fgs-mode-selection");
                        const calculatorForm = getCachedElement("fgs-calculator-form");
                        const gpaCalculator = getCachedElement("fgs-gpa-calculator");
                        const settingsDropdown = getCachedElement("fgs-settings-dropdown");

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
         * Launches grade calculator with URL validation and score editing activation
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

                const modeSelection = getCachedElement("fgs-mode-selection");
                const calculatorForm = getCachedElement("fgs-calculator-form");
                const gpaCalculator = getCachedElement("fgs-gpa-calculator");
                const settingsDropdown = getCachedElement("fgs-settings-dropdown");

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

                // Enable score editing with better timing and feedback
                // Shorter delay since we're already in the calculator
                setTimeout(() => {
                        if (typeof makeScoresEditable === 'function') {
                        makeScoresEditable();
                        } else {
                        console.error("makeScoresEditable function not found!");
                        }
                }, 300); // Reduced from 500ms to 300ms

                }, 100);

        } catch (error) {
                console.error("Error in launchGradeCalculator:", error);
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
                        const modeSelection = getCachedElement('fgs-mode-selection');
                        const calculatorForm = getCachedElement('fgs-calculator-form');
                        const gpaCalculator = getCachedElement('fgs-gpa-calculator');
                        const settingsDropdown = getCachedElement('fgs-settings-dropdown');

                        if (modeSelection) modeSelection.style.display = 'flex';
                        if (calculatorForm) calculatorForm.style.display = 'none';
                        if (gpaCalculator) gpaCalculator.style.display = 'none';
                        if (settingsDropdown) settingsDropdown.style.display = 'none';

                        // Show inline warning instead of blocking alert
                        const existingWarning = document.getElementById('fgs-page-warning');
                        if (existingWarning) existingWarning.remove();

                        const warningDiv = document.createElement('div');
                        warningDiv.id = 'fgs-page-warning';
                        warningDiv.style.cssText = 'background: rgba(255,193,7,0.15); border: 1px solid rgba(255,193,7,0.4); border-radius: 8px; padding: 10px 12px; margin: 8px 12px; font-size: 12px; color: inherit; text-align: center;';

                        const strong = document.createElement('strong');
                        strong.textContent = '\u26A0\uFE0F Grade Calculator works best on individual class pages.';
                        warningDiv.appendChild(strong);
                        warningDiv.appendChild(document.createElement('br'));
                        warningDiv.appendChild(document.createTextNode('Please navigate to a specific class in Focus to use this feature.'));

                        if (modeSelection) {
                                modeSelection.insertAdjacentElement('afterend', warningDiv);
                                setTimeout(() => { if (warningDiv.parentNode) warningDiv.remove(); }, 6000);
                        }

                } catch (error) {
                        // Silent error handling for production
                }
        }


        /**
         * Creates floating popup with proper initialization sequence
         */
        function createFloatingPopup() {
                try {
                        if (floatingPopup) {
                                floatingPopup.remove();
                        }
                        floatingPopup = document.createElement("div");
                        floatingPopup.id = "focus-grade-simulator-popup";
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

                        // Setup events after a small delay
                        setTimeout(() => {
                                setupEvents();
                                setupGPACalculatorEvents();
                                        setupDrag();
                                setupFeedbackSystem();
                                setupNewFeaturesSection();
                                window.showModeSelection();

                                // Per request: do not auto-enable editing; user must click Grade Calculator
                        }, 50);
                } catch (error) {
                        console.error("Error in createFloatingPopup:", error);
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
                                // Show inline warning instead of blocking alert
                                const existingWarning = document.getElementById('fgs-page-warning');
                                if (existingWarning) existingWarning.remove();

                                const warningDiv = document.createElement('div');
                                warningDiv.id = 'fgs-page-warning';
                                warningDiv.style.cssText = 'background: rgba(255,193,7,0.15); border: 1px solid rgba(255,193,7,0.4); border-radius: 8px; padding: 10px 12px; margin: 8px 12px; font-size: 12px; color: inherit; text-align: center;';

                                const strong = document.createElement('strong');
                                strong.textContent = '\u26A0\uFE0F GPA Calculator requires the Grades page.';
                                warningDiv.appendChild(strong);
                                warningDiv.appendChild(document.createElement('br'));
                                warningDiv.appendChild(document.createTextNode('Please navigate to the "Grades" tab in Focus to use this feature.'));

                                const modeSelection = getCachedElement('fgs-mode-selection');
                                if (modeSelection) {
                                        modeSelection.insertAdjacentElement('afterend', warningDiv);
                                        setTimeout(() => { if (warningDiv.parentNode) warningDiv.remove(); }, 6000);
                                }
                                return;
                        }

                        // Hide other interfaces and show GPA calculator
                        const modeSelection = getCachedElement('fgs-mode-selection');
                        const calculatorForm = getCachedElement('fgs-calculator-form');
                        const gpaCalculator = getCachedElement('fgs-gpa-calculator');
                        const settingsDropdown = getCachedElement('fgs-settings-dropdown');

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
         * Handles extension icon clicks with debouncing and proper state management
         * to prevent the popup from glitching and auto-closing
         */
        function handleExtensionClick() {
                try {
                        // DEBOUNCE: Prevent rapid clicks
                        const now = Date.now();
                        if (now - lastClickTime < CLICK_DEBOUNCE_MS) {
                                return;
                        }
                        lastClickTime = now;

                        if (floatingPopup) {
                                // Popup already exists - toggle visibility
                                const currentDisplay = floatingPopup.style.display;

                                if (currentDisplay === "none") {
                                        // Currently hidden - show it
                                        floatingPopup.style.display = "block";
                                        floatingPopup.style.visibility = "visible";
                                        floatingPopup.style.opacity = "1";
                                        applySizingForCurrentInterface();
                                } else {
                                        // Currently visible - hide it
                                        floatingPopup.style.display = "none";
                                }
                        } else {
                                // Popup doesn't exist - create it
                                if (isPopupInitializing) {
                                        return;
                                }

                                isPopupInitializing = true;

                                createFloatingPopup();

                                // Wait for popup to be fully created and rendered
                                setTimeout(() => {
                                        if (floatingPopup) {
                                                // Force display to block with full visibility
                                                floatingPopup.style.display = "block";
                                                floatingPopup.style.visibility = "visible";
                                                floatingPopup.style.opacity = "1";

                                                isPopupInitializing = false;
                                        } else {
                                                console.error("Popup creation failed");
                                                isPopupInitializing = false;
                                        }
                                }, 150); // Increased timeout for better reliability
                        }
                } catch (error) {
                        console.error("Error in handleExtensionClick:", error);
                        isPopupInitializing = false;
                }
        }


        // ===========================================
        // SETTINGS DROPDOWN MANAGEMENT
        // ===========================================

        /**
         * Settings dropdown with proper sizing
         */
        let previousScreenBeforeSettings = null; // Track which screen was active before settings

        function toggleSettingsDropdown() {
                try {
                        const settingsDropdown = getCachedElement("fgs-settings-dropdown");
                        const modeSelection = getCachedElement("fgs-mode-selection");
                        const calculatorForm = getCachedElement("fgs-calculator-form");
                        const gpaCalculator = getCachedElement("fgs-gpa-calculator");

                        if (!settingsDropdown) return;

                        const isCurrentlyVisible = settingsDropdown.style.display === "block";

                        if (isCurrentlyVisible) {
                                // Hide settings, restore the previous screen
                                settingsDropdown.style.display = "none";

                                if (previousScreenBeforeSettings === 'calculator') {
                                        if (calculatorForm) calculatorForm.style.display = "flex";
                                } else if (previousScreenBeforeSettings === 'gpa') {
                                        if (gpaCalculator) gpaCalculator.style.display = "flex";
                                } else {
                                        if (modeSelection) modeSelection.style.display = "flex";
                                }

                                previousScreenBeforeSettings = null;
                                applySizingForCurrentInterface();
                        } else {
                                // Remember which screen is currently visible before hiding
                                if (calculatorForm && calculatorForm.style.display === "flex") {
                                        previousScreenBeforeSettings = 'calculator';
                                } else if (gpaCalculator && gpaCalculator.style.display === "flex") {
                                        previousScreenBeforeSettings = 'gpa';
                                } else {
                                        previousScreenBeforeSettings = 'mode-selection';
                                }

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
        // TUTORIAL POPUP HELPER
        // ===========================================

        /**
         * Creates a tutorial popup with video playback and backdrop dismiss.
         * @param {Object} config
         * @param {string} config.backdropId - Unique ID for the backdrop element
         * @param {string} config.title - Header title text (hardcoded, not user input)
         * @param {string} config.videoFile - Video filename under popup/ directory
         * @param {boolean} config.autoplay - Whether to auto-play the video on open
         * @param {boolean} config.loop - Whether the video should loop
         * @param {boolean} config.muted - Whether the video should be muted
         * @param {boolean} config.controls - Whether the video should show controls
         */
        function createTutorialPopup({ backdropId, title, videoFile, autoplay = false, loop = false, muted = false, controls = false }) {
                const existingBackdrop = document.getElementById(backdropId);
                if (existingBackdrop) {
                        existingBackdrop.remove();
                }

                const backdrop = document.createElement('div');
                backdrop.id = backdropId;
                backdrop.className = 'fgs-tutorial-backdrop';

                const popup = document.createElement('div');
                popup.className = 'fgs-tutorial-popup';

                // Build header
                const header = document.createElement('div');
                header.className = 'fgs-tutorial-header';
                const titleSpan = document.createElement('span');
                titleSpan.textContent = title;
                const closeButton = document.createElement('button');
                closeButton.className = 'fgs-tutorial-close';
                closeButton.setAttribute('aria-label', 'Close tutorial');
                closeButton.textContent = '\u00d7';
                header.appendChild(titleSpan);
                header.appendChild(closeButton);

                // Build body with video
                const body = document.createElement('div');
                body.className = 'fgs-tutorial-body';
                const video = document.createElement('video');
                video.className = 'fgs-tutorial-video';
                video.setAttribute('playsinline', '');
                if (controls) video.setAttribute('controls', '');
                if (muted) video.setAttribute('muted', '');
                if (loop) video.setAttribute('loop', '');
                if (controls) video.setAttribute('preload', 'metadata');
                body.appendChild(video);

                popup.appendChild(header);
                popup.appendChild(body);
                backdrop.appendChild(popup);
                document.body.appendChild(backdrop);

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
                                ? chrome.runtime.getURL('popup/' + videoFile)
                                : 'popup/' + videoFile;
                        video.src = src;
                        video.loop = loop;
                        video.muted = muted;
                        if (controls) {
                                video.controls = true;
                        }
                        if (autoplay) {
                                try {
                                        video.load();
                                        video.play().catch(() => {});
                                } catch (_) {}
                        } else {
                                video.play()?.catch(() => {});
                        }
                }

                backdrop.addEventListener('click', backdropHandler);
                if (closeBtn) closeBtn.addEventListener('click', closeHandler);
        }

        // ===========================================
        // EVENT LISTENER SETUP
        // ===========================================

        /**
         * Event setup without duplicate help buttons
         */
        function setupEvents() {
                try {
                        function safeAddListener(id, event, handler) {
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
                        // Tutorial popup events
                        safeAddListener("fgs-tutorial", "click", () => {
                                createTutorialPopup({
                                        backdropId: 'fgs-full-tutorial-backdrop',
                                        title: 'Full Tutorial',
                                        videoFile: 'popup-tutorial.mp4',
                                        controls: true,
                                        autoplay: true,
                                        loop: false,
                                        muted: false
                                });
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
                        function safeAddGPAListener(id, event, handler) {
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

                        safeAddGPAListener("fgs-gpa-help-results", "click", () => {
                                window.showHelp();
                        });

                        safeAddGPAListener("fgs-gpa-help-video", "click", () => {
                                createTutorialPopup({
                                        backdropId: 'fgs-tutorial-backdrop',
                                        title: 'Focus Grades Tutorial',
                                        videoFile: 'tutorial.mp4',
                                        controls: false,
                                        autoplay: false,
                                        loop: true,
                                        muted: true
                                });
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

                        // Semester selector event listener
                        safeAddGPAListener("fgs-gpa-semester-select", "change", (e) => {
                                const selectedSemester = e.target.value;
                                if (typeof gpaCalculatorData !== 'undefined') {
                                        gpaCalculatorData.selectedSemester = selectedSemester;

                                        // Update default credits for all classes based on semester
                                        if (typeof DEFAULT_CREDITS !== 'undefined') {
                                                gpaCalculatorData.selectedClasses.forEach(classData => {
                                                        // Only update if user hasn't manually set credits
                                                        if (classData.userCredits === null) {
                                                                let defaultCredits = DEFAULT_CREDITS[selectedSemester] || 0.5;
                                                                // For full year, semester-only classes get 0.5
                                                                if (selectedSemester === 'fullYear' && classData.isSemesterOnlyClass) {
                                                                        defaultCredits = 0.5;
                                                                }
                                                                classData.credits = defaultCredits;
                                                        }
                                                });
                                        }
                                }

                                // Update subheading text based on semester
                                const subheading = document.getElementById('fgs-gpa-subheading-text');
                                if (subheading) {
                                        if (selectedSemester === 'semester2') {
                                                subheading.textContent = 'Focus grades are auto-filled when available. Confirm or adjust Q3, Q4, and Semester Exam letters for each course.';
                                        } else if (selectedSemester === 'fullYear') {
                                                subheading.textContent = 'Full year mode calculates 1.0 credits per class. Adjust credits per class if needed.';
                                        } else {
                                                subheading.textContent = 'Focus grades are auto-filled when available. Confirm or adjust Q1, Q2, and Semester Exam letters for each course.';
                                        }
                                }

                                // Show/hide warning banners
                                const fullYearWarning = document.getElementById('fgs-gpa-full-year-warning');
                                const doubleCountWarning = document.getElementById('fgs-gpa-double-count-warning');
                                const s1InS2Warning = document.getElementById('fgs-gpa-s1-in-s2-warning');

                                if (fullYearWarning) {
                                        fullYearWarning.style.display = selectedSemester === 'fullYear' ? 'block' : 'none';
                                }

                                // Count how many classes have Q3 grades (indicates we're in S2)
                                let classesWithQ3 = 0;
                                if (typeof gpaCalculatorData !== 'undefined') {
                                        classesWithQ3 = gpaCalculatorData.selectedClasses.filter(c => c.hasS2Grades).length;
                                }

                                // Show S1-in-S2 warning if user selects S1 but appears to be in S2 (3+ classes with Q3)
                                if (s1InS2Warning) {
                                        const showS1Warning = selectedSemester === 'semester1' && classesWithQ3 >= 3;
                                        s1InS2Warning.style.display = showS1Warning ? 'block' : 'none';
                                }

                                // Check for potential double-counting issue in full year mode
                                if (doubleCountWarning && typeof gpaCalculatorData !== 'undefined') {
                                        let hasS1FinalGrades = false;
                                        if (selectedSemester === 'fullYear') {
                                                // Check if any class has S1 grades (potential double-count)
                                                hasS1FinalGrades = gpaCalculatorData.selectedClasses.some(c => c.hasS1Grades);
                                        }
                                        doubleCountWarning.style.display = hasS1FinalGrades && selectedSemester === 'fullYear' ? 'block' : 'none';
                                }

                                // Update manual modal visibility
                                const sem1Fields = document.getElementById('fgs-manual-sem1-fields');
                                const sem2Fields = document.getElementById('fgs-manual-sem2-fields');
                                if (sem1Fields && sem2Fields) {
                                        if (selectedSemester === 'semester2') {
                                                sem1Fields.style.display = 'none';
                                                sem2Fields.style.display = 'flex';
                                        } else if (selectedSemester === 'fullYear') {
                                                sem1Fields.style.display = 'flex';
                                                sem2Fields.style.display = 'flex';
                                        } else {
                                                sem1Fields.style.display = 'flex';
                                                sem2Fields.style.display = 'none';
                                        }
                                }

                                // Re-render class list with new semester fields
                                if (typeof renderClassList === 'function') {
                                        renderClassList();
                                }
                        });

                        safeAddGPAListener("fgs-manual-add-btn", "click", () => {
                                const nameInput = document.getElementById('fgs-manual-class-name');
                                const typeSelect = document.getElementById('fgs-manual-class-type');

                                // Get grades based on current semester selection
                                const selectedSemester = (typeof gpaCalculatorData !== 'undefined') ? gpaCalculatorData.selectedSemester : 'semester2';

                                // Semester 1 fields
                                const q1Select = document.getElementById('fgs-manual-q1');
                                const q2Select = document.getElementById('fgs-manual-q2');
                                const s1ExamSelect = document.getElementById('fgs-manual-s1-exam');

                                // Semester 2 fields
                                const q3Select = document.getElementById('fgs-manual-q3');
                                const q4Select = document.getElementById('fgs-manual-q4');
                                const s2ExamSelect = document.getElementById('fgs-manual-s2-exam');

                                const className = nameInput?.value.trim() || '';
                                const classType = typeSelect?.value || 'DualEnrollment';

                                // Get all grades
                                const q1Grade = q1Select?.value || '';
                                const q2Grade = q2Select?.value || '';
                                const s1ExamGrade = s1ExamSelect?.value || '';
                                const q3Grade = q3Select?.value || '';
                                const q4Grade = q4Select?.value || '';
                                const s2ExamGrade = s2ExamSelect?.value || '';

                                if (!className) {
                                        if (nameInput) {
                                                nameInput.style.borderColor = '#dc3545';
                                                nameInput.placeholder = 'Class name is required';
                                                nameInput.addEventListener('input', function handler() {
                                                        nameInput.style.borderColor = '';
                                                        nameInput.placeholder = 'Class Name (e.g., Dual Enrollment Math)';
                                                        nameInput.removeEventListener('input', handler);
                                                }, { once: true });
                                        }
                                        return;
                                }

                                // Determine display grade based on semester
                                let displayGrade = '\u2014';
                                if (selectedSemester === 'semester2') {
                                        displayGrade = q3Grade || q4Grade || s2ExamGrade || '\u2014';
                                } else if (selectedSemester === 'fullYear') {
                                        displayGrade = q3Grade || q4Grade || q1Grade || q2Grade || '\u2014';
                                } else {
                                        displayGrade = q1Grade || q2Grade || s1ExamGrade || '\u2014';
                                }

                                // Determine semester data availability
                                const hasS1Grades = !!(q1Grade || q2Grade || s1ExamGrade);
                                const hasS2Grades = !!(q3Grade || q4Grade || s2ExamGrade);
                                const isSemesterOnlyClass = (hasS1Grades && !hasS2Grades) || (!hasS1Grades && hasS2Grades);

                                // Determine default credits based on semester mode
                                let defaultCredits = 0.5;
                                if (typeof DEFAULT_CREDITS !== 'undefined') {
                                        defaultCredits = DEFAULT_CREDITS[selectedSemester] || 0.5;
                                        if (selectedSemester === 'fullYear' && !isSemesterOnlyClass) {
                                                defaultCredits = 1.0;
                                        }
                                }

                                // Create a manual class object with all quarter fields
                                const manualClass = {
                                        id: 'manual_' + Date.now(),
                                        name: className,
                                        baseType: classType,
                                        type: classType,
                                        manualType: classType,
                                        typeEditorOpen: false,
                                        isCore: typeof isCoreSubject === 'function' ? isCoreSubject(className) : false,
                                        credits: defaultCredits,
                                        userCredits: null,
                                        isEOC: typeof isEOCCourse === 'function' ? isEOCCourse(className) : false,
                                        grade: displayGrade,
                                        hasS1Grades: hasS1Grades,
                                        hasS2Grades: hasS2Grades,
                                        isSemesterOnlyClass: isSemesterOnlyClass,
                                        quarters: {
                                                q1: q1Grade,
                                                q2: q2Grade,
                                                q3: q3Grade,
                                                q4: q4Grade,
                                                s1Exam: s1ExamGrade,
                                                s2Exam: s2ExamGrade,
                                                exam: selectedSemester === 'semester2' ? s2ExamGrade : s1ExamGrade
                                        },
                                        sourceTexts: {
                                                q1: q1Grade,
                                                q2: q2Grade,
                                                q3: q3Grade,
                                                q4: q4Grade,
                                                s1Exam: s1ExamGrade,
                                                s2Exam: s2ExamGrade,
                                                exam: selectedSemester === 'semester2' ? s2ExamGrade : s1ExamGrade
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
                                        isDragging = true;
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
                                isDragging = false;
                                document.removeEventListener("mousemove", handleDrag);
                                document.removeEventListener("mouseup", stopDrag);
                        }

                        // Keep popup in viewport on window resize
                        window.addEventListener("resize", function() {
                                if (!floatingPopup || floatingPopup.style.display === "none") return;
                                const rect = floatingPopup.getBoundingClientRect();
                                const maxLeft = window.innerWidth - floatingPopup.offsetWidth;
                                const maxTop = window.innerHeight - floatingPopup.offsetHeight;
                                if (rect.left > maxLeft) floatingPopup.style.left = Math.max(0, maxLeft) + "px";
                                if (rect.top > maxTop) floatingPopup.style.top = Math.max(0, maxTop) + "px";
                        });
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
                        isInitialized = true;
                } catch (error) {
                        // Silent error handling for production
                }
        }

        // document_idle guarantees DOM is parsed; single delayed init for Focus page rendering
        setTimeout(initialize, 1000);
})();
