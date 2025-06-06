// Background script - handles extension icon clicks
chrome.action.onClicked.addListener((tab) => {
  // Only work on Focus websites
  if (tab.url && tab.url.includes('focusschoolsoftware.com/focus/Modules.php?modname=Grades')) {
    chrome.tabs.sendMessage(tab.id, {type: "openFloatingCalculator"});
  }
});