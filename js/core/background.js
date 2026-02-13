// Background script - handles extension icon clicks and dynamic popup switching

// Function to check if a URL is a valid Focus URL
function isFocusUrl(url) {
    return url && url.includes('focusschoolsoftware.com');
}

// Function to update the extension icon behavior based on the current URL
function updateIconBehavior(tabId, url) {
    if (isFocusUrl(url)) {
        // Valid Focus URL: Remove popup so the onClicked event fires (launching the floating UI)
        chrome.action.setPopup({ tabId: tabId, popup: '' });
        // Optional: Update icon to show active state if you have different icons
    } else {
        // Invalid URL: Set the popup to the help page
        chrome.action.setPopup({ tabId: tabId, popup: 'popup/wrong_page.html' });
    }
}

// Listen for tab updates (navigation)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // We only need to check if the URL changed or the status is complete
    if (changeInfo.url || changeInfo.status === 'complete') {
        updateIconBehavior(tabId, tab.url);
    }
});

// Listen for tab activation (switching tabs)
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (!chrome.runtime.lastError) {
            updateIconBehavior(activeInfo.tabId, tab.url);
        }
    });
});

// Handle the click event (ONLY fires when popup is set to '')
chrome.action.onClicked.addListener((tab) => {
    if (isFocusUrl(tab.url)) {
        chrome.tabs.sendMessage(tab.id, { type: "openFloatingCalculator" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Error sending message:", chrome.runtime.lastError.message);
            }
        });
    }
});