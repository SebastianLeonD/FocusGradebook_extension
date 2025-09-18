/**
 * FEEDBACK-SYSTEM.JS
 * Handles ANONYMOUS user feedback collection and email sending for Focus Grade Calculator
 * PRODUCTION VERSION: Removed console logs
 * Uses Web3Forms API with access key: 4a01005a-93cd-4a05-83fd-7a972d602c15
 * FIXED: Removed auto-initialization to prevent feedback box from opening automatically
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
function setupFeedbackEvents() {
    try {
        const sendButton = document.getElementById('fgs-send-feedback');
        const textarea = document.getElementById('fgs-feedback-text');
        const toggleButton = document.getElementById('fgs-feedback-toggle');
        const feedbackContent = document.getElementById('fgs-feedback-content');
        const feedbackHeader = document.querySelector('.fgs-feedback-header');
        
        if (!sendButton || !textarea) {
            setTimeout(setupFeedbackEvents, 1000);
            return;
        }
        
        // Avoid duplicate event listeners
        if (sendButton.getAttribute('data-feedback-setup') === 'true') {
            return;
        }
        sendButton.setAttribute('data-feedback-setup', 'true');
        
        // FIXED: Always start with feedback box collapsed when popup opens
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
 * Send via Web3Forms - Your Access Key: 4a01005a-93cd-4a05-83fd-7a972d602c15
 * This is completely automated - user just types and clicks send!
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
            formData.append('extension_version', '1.6.0');
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

// FIXED: Removed all auto-initialization calls to prevent feedback box from opening automatically
// The feedback system will only initialize when the popup is actually created

// Make functions globally available
window.setupFeedbackSystem = setupFeedbackSystem;
window.handleSendFeedback = handleSendFeedback;
window.toggleFeedbackBox = toggleFeedbackBox;