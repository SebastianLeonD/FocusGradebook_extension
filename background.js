// Background script - handles extension icon clicks
chrome.action.onClicked.addListener((tab) => {
    // Work on any Focus grades page
    if (tab.url && (
        tab.url.includes('focusschoolsoftware.com/focus/Modules.php') && 
        tab.url.includes('Grades')
    )) {
      chrome.tabs.sendMessage(tab.id, { type: "openFloatingCalculator" });
    }
  });