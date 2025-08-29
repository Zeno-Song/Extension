// save settings
let settings = {
  enabled: true,
  password: '',
  rules: []
};

// 加载保存的设置和统计数据
chrome.storage.sync.get(['settings'], (result) => {
  if (result.settings) {
    settings = { ...settings, ...result.settings };
  }
});

// TODO: 监听导航事件，阻止访问黑名单网站
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (!settings.enabled) return;
  
  const url = new URL(details.url);
  const domain = url.hostname;
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const dayOfWeek = now.getDay(); // 0是周日，6是周六

  // 检查是否有匹配的规则
  for (const rule of settings.rules) {
    const ruleStart = rule.startHour * 60 + rule.startMinute;
    const ruleEnd = rule.endHour * 60 + rule.endMinute;
    const daysMatch = rule.days.includes(dayOfWeek);
    const timeMatch = currentTime >= ruleStart && currentTime <= ruleEnd;
    const domainMatch = domain.includes(rule.domain) || url.href.includes(rule.domain);

    if (daysMatch && timeMatch && domainMatch) {
      // 阻止访问
      chrome.tabs.update(details.tabId, {
        url: chrome.runtime.getURL('blocked.html')
      });
      return;
    }
  }
});


// 保存设置
function saveSettings() {
  chrome.storage.sync.set({ settings });
}

// 接收来自popup或options页的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    sendResponse({ settings });
  } else if (request.action === 'updateSettings') {
    if (request.password === settings.password) {   // store pwd in local storage, pwd function not complete
      settings = { ...settings, ...request.settings };
      saveSettings();
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: '密码错误' });
    }
  } else if (request.action === 'toggleEnabled') {
    settings.enabled = !settings.enabled;
    saveSettings();
    sendResponse({ success: true, enabled: settings.enabled });
  }
});