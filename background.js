// save settings
let settings = {
  enabled: true,
  password: '',
  rules: []
};

// import settings into <settings> dictionary
chrome.storage.sync.get(['settings'], (result) => {
  if (result.settings) {
    settings = { ...settings, ...result.settings };
  }
});

// listen for navigation event, jump to blocked.html to realise blocking effect
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (!settings.enabled) return;
  
  const url = new URL(details.url);
  const domain = url.hostname;
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const dayOfWeek = now.getDay(); // 0 is Sun, 6 is Sat

  // check if website is within Rules list
  for (const rule of settings.rules) {
    const ruleStart = rule.startHour * 60 + rule.startMinute;
    const ruleEnd = rule.endHour * 60 + rule.endMinute;
    const daysMatch = rule.days.includes(dayOfWeek);
    const timeMatch = currentTime >= ruleStart && currentTime <= ruleEnd;
    const domainMatch = domain.includes(rule.domain) || url.href.includes(rule.domain);

    if (daysMatch && timeMatch && domainMatch) {
      // jump to blocked.html, effectively blocking the website
      chrome.tabs.update(details.tabId, {
        url: chrome.runtime.getURL('blocked.html')
      });
      return;
    }
  }
});


// save settings into local storage
function saveSettings() {
  chrome.storage.sync.set({ settings });
}

// accept and send messages from popup and options, links popup and options changes together
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    sendResponse({ settings });
  } else if (request.action === 'updateSettings') {
    if (request.password === settings.password) {   // store pwd in local storage, pwd function not complete
      settings = { ...settings, ...request.settings };
      saveSettings();
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Incorrect Password' });
    }
  } else if (request.action === 'toggleEnabled') {
    settings.enabled = !settings.enabled;
    saveSettings();
    sendResponse({ success: true, enabled: settings.enabled });
  }
});