/**
 * FEEDBACK-SYSTEM.JS
 * Handles ANONYMOUS user feedback collection and email sending for Focus Grade Calculator
 * PRODUCTION VERSION: Removed console logs
 * Uses Web3Forms API for anonymous feedback delivery
 * Removed auto-initialization to prevent feedback box from opening automatically
 */

/**
 * Sets up feedback system event listeners
 */
function setupFeedbackSystem() {
    try {
        // Set up feedback events immediately and when popup is created
        setTimeout(setupFeedbackEvents, 500);
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Sets up feedback form event listeners for the bottom feedback box
 */
function setupFeedbackEvents(retries = 0) {
    try {
        const sendButton = document.getElementById('fgs-send-feedback');
        const textarea = document.getElementById('fgs-feedback-text');
        const toggleButton = document.getElementById('fgs-feedback-toggle');
        const feedbackContent = document.getElementById('fgs-feedback-content');
        const feedbackHeader = document.querySelector('.fgs-feedback-header');
        
        if (!sendButton || !textarea) {
            if (retries < 5) setTimeout(() => setupFeedbackEvents(retries + 1), 1000);
            return;
        }
        
        // Avoid duplicate event listeners
        if (sendButton.getAttribute('data-feedback-setup') === 'true') {
            return;
        }
        sendButton.setAttribute('data-feedback-setup', 'true');
        
        // Always start with feedback box collapsed when popup opens
        if (feedbackContent && toggleButton) {
            feedbackContent.classList.add('collapsed');
            toggleButton.textContent = '+';
        }
        
        // Send feedback event
        sendButton.addEventListener('click', handleSendFeedback);
        
        // Enable/disable send button based on textarea content
        textarea.addEventListener('input', () => {
            const hasContent = textarea.value.trim().length > 0;
            sendButton.disabled = !hasContent;
        });
        
        // Toggle feedback box collapse/expand
        if (toggleButton && feedbackContent) {
            toggleButton.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFeedbackBox();
            });
        }
        
        // Also allow header click to toggle
        if (feedbackHeader && feedbackContent) {
            feedbackHeader.addEventListener('click', toggleFeedbackBox);
        }
        
        // Initial button state
        sendButton.disabled = textarea.value.trim().length === 0;
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Toggles feedback box expand/collapse
 */
function toggleFeedbackBox() {
    try {
        const feedbackContent = document.getElementById('fgs-feedback-content');
        const toggleButton = document.getElementById('fgs-feedback-toggle');
        
        if (feedbackContent && toggleButton) {
            const isCollapsed = feedbackContent.classList.contains('collapsed');
            
            if (isCollapsed) {
                feedbackContent.classList.remove('collapsed');
                toggleButton.textContent = '−';
            } else {
                feedbackContent.classList.add('collapsed');
                toggleButton.textContent = '+';
            }
        }
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Handles sending feedback via Web3Forms - completely automated!
 */
function handleSendFeedback() {
    try {
        const textarea = document.getElementById('fgs-feedback-text');
        const sendButton = document.getElementById('fgs-send-feedback');
        const statusSpan = document.getElementById('fgs-feedback-status');
        
        if (!textarea || !sendButton || !statusSpan) return;
        
        const feedbackText = textarea.value.trim();
        if (!feedbackText) {
            showFeedbackStatus('error', 'Please enter your feedback first');
            return;
        }
        
        // Show sending status
        sendButton.disabled = true;
        sendButton.textContent = '📤 Sending...';
        showFeedbackStatus('sending', 'Sending...');
        
        // Send via Web3Forms - completely automated
        sendViaWeb3Forms(feedbackText)
            .then(() => {
                // Success
                showFeedbackStatus('success', '✅ Sent!');
                textarea.value = '';
                sendButton.textContent = '📧 Send';
                sendButton.disabled = true;
                
                // Hide success message after 3 seconds
                setTimeout(() => {
                    statusSpan.style.opacity = '0';
                }, 3000);
            })
            .catch((error) => {
                // Error
                showFeedbackStatus('error', '❌ Failed');
                sendButton.textContent = '📧 Send';
                sendButton.disabled = false;
            });
        
    } catch (error) {
        showFeedbackStatus('error', '❌ Error occurred');
    }
}

/**
 * Shows feedback status message
 */
function showFeedbackStatus(type, message) {
    try {
        const statusSpan = document.getElementById('fgs-feedback-status');
        if (!statusSpan) return;
        
        // Clear existing classes
        statusSpan.classList.remove('success', 'error', 'sending');
        
        // Add new class and message
        statusSpan.classList.add(type);
        statusSpan.textContent = message;
        statusSpan.style.opacity = '1';
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Send via Web3Forms - completely automated, user just types and clicks send!
 */
function sendViaWeb3Forms(feedbackText) {
    return new Promise((resolve, reject) => {
        try {
            // Create form data with your Web3Forms access key
            const formData = new FormData();
            formData.append('access_key', '4a01005a-93cd-4a05-83fd-7a972d602c15');
            
            // Required fields
            formData.append('name', 'Focus Grade Calculator User');
            formData.append('email', 'noreply@focusextension.com'); // Dummy email since user doesn't provide one
            formData.append('message', feedbackText);
            
            // Additional useful info
            formData.append('timestamp', new Date().toISOString());
            formData.append('extension_version', '1.7.0');
            formData.append('page_url', window.location.href);
            formData.append('user_agent', navigator.userAgent);
            
            // Web3Forms configuration
            formData.append('subject', 'Focus Grade Calculator - New Feedback');
            
            // Send to Web3Forms API
            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (response.ok) {
                    resolve();
                } else {
                    throw new Error(`Web3Forms HTTP ${response.status}`);
                }
            })
            .catch(error => {
                reject(error);
            });
            
        } catch (error) {
            reject(error);
        }
    });
}

// Removed all auto-initialization calls to prevent feedback box from opening automatically
// The feedback system will only initialize when the popup is actually created

/**
 * Sets up new features showcase functionality - opens modal popup
 */
function setupNewFeaturesSection() {
    try {
        const newFeaturesBtn = document.getElementById('fgs-new-features-btn');

        if (newFeaturesBtn) {
            newFeaturesBtn.addEventListener('click', openNewFeaturesModal);
        }
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Opens the new features showcase modal
 */
function openNewFeaturesModal() {
    try {
        const backdropId = 'fgs-new-features-backdrop';
        const existingBackdrop = document.getElementById(backdropId);
        if (existingBackdrop) {
            existingBackdrop.remove();
        }

        const backdrop = document.createElement('div');
        backdrop.id = backdropId;
        backdrop.className = 'fgs-new-features-backdrop';

        const modal = document.createElement('div');
        modal.className = 'fgs-new-features-modal';
        modal.innerHTML = `
            <div class="fgs-new-features-modal-header">
                <span>✨ What's New in Focus Grade Calculator</span>
                <button class="fgs-new-features-close" aria-label="Close">×</button>
            </div>
            <div class="fgs-new-features-modal-body">
                <div class="fgs-features-grid">

                    <!-- MAIN FEATURE - Top 50% of screen -->
                    <div class="fgs-feature-card fgs-feature-main">
                        <div class="fgs-feature-badge-container">
                            <span class="fgs-feature-badge fgs-badge-new">NEW</span>
                        </div>
                        <div class="fgs-feature-icon">📆</div>
                        <h3 class="fgs-feature-title">Semester 2 & Full Year GPA</h3>
                        <p class="fgs-feature-description">The GPA Calculator now supports Semester 2 (Q3, Q4, S2 Exam) and Full Year mode. Switch between Semester 1, Semester 2, or Full Year from the dropdown to project your GPA across any time period.</p>
                        <div class="fgs-feature-tags">
                            <span class="fgs-feature-tag">Semester 2</span>
                            <span class="fgs-feature-tag">Full Year</span>
                            <span class="fgs-feature-tag">BCPS Formula</span>
                        </div>
                    </div>

                    <!-- SECONDARY FEATURE - Bottom left 25% -->
                    <div class="fgs-feature-card fgs-feature-secondary">
                        <div class="fgs-feature-badge-container">
                            <span class="fgs-feature-badge fgs-badge-fixed">FIXED</span>
                        </div>
                        <div class="fgs-feature-icon">🐛</div>
                        <h3 class="fgs-feature-title">Z Grade Bug Fix</h3>
                        <p class="fgs-feature-description">Fixed a bug where editing a Z (zero) grade would cause wildly incorrect hypothetical grades. Z grades now calculate correctly.</p>
                        <div class="fgs-feature-tags">
                            <span class="fgs-feature-tag">Grade calc fix</span>
                            <span class="fgs-feature-tag">Accurate %</span>
                        </div>
                    </div>

                    <!-- SECONDARY FEATURE - Bottom right 25% -->
                    <div class="fgs-feature-card fgs-feature-secondary">
                        <div class="fgs-feature-badge-container">
                            <span class="fgs-feature-badge fgs-badge-new">NEW</span>
                        </div>
                        <div class="fgs-feature-icon">📝</div>
                        <h3 class="fgs-feature-title">Letter Grade Editing</h3>
                        <p class="fgs-feature-description">Click any letter grade to edit it directly. Points and percentages update automatically and stay in sync.</p>
                        <div class="fgs-feature-tags">
                            <span class="fgs-feature-tag">Click to edit</span>
                            <span class="fgs-feature-tag">Auto-sync</span>
                        </div>
                    </div>

                </div>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        const closeBtn = modal.querySelector('.fgs-new-features-close');

        const closeModal = () => {
            backdrop.removeEventListener('click', backdropHandler);
            if (closeBtn) closeBtn.removeEventListener('click', closeHandler);
            backdrop.remove();
        };

        const closeHandler = (event) => {
            event.preventDefault();
            closeModal();
        };

        const backdropHandler = (event) => {
            if (event.target === backdrop) {
                closeModal();
            }
        };

        backdrop.addEventListener('click', backdropHandler);
        if (closeBtn) closeBtn.addEventListener('click', closeHandler);

    } catch (error) {
        console.error('New features modal failed', error);
    }
}

// Make functions globally available
window.setupFeedbackSystem = setupFeedbackSystem;
window.setupNewFeaturesSection = setupNewFeaturesSection;