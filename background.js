// 存储插件状态
let settings = {
  enabled: true,
  password: '',
  rules: []
};

// 网站分类定义
const websiteCategories = {
  'social': {
    name: '社交媒体',
    domains: ['facebook.com', 'twitter.com', 'instagram.com', 'weibo.com', 'zhihu.com', 'douyin.com', 'bilibili.com', 'reddit.com', 'linkedin.com']
  },
  'entertainment': {
    name: '娱乐',
    domains: ['youtube.com', 'netflix.com', 'spotify.com', 'qq.com', 'youku.com', 'iqiyi.com', 'mgtv.com', 'tiktok.com', 'twitch.tv']
  },
  'work': {
    name: '工作学习',
    domains: ['github.com', 'stackoverflow.com', 'google.com', 'baidu.com', 'bing.com', 'wikipedia.org', 'docs.google.com', 'office.com', 'notion.so']
  },
  'shopping': {
    name: '购物',
    domains: ['amazon.com', 'taobao.com', 'tmall.com', 'jd.com', 'ebay.com', 'aliexpress.com', 'pinduoduo.com', 'suning.com']
  },
  'news': {
    name: '新闻资讯',
    domains: ['cnn.com', 'bbc.com', 'reuters.com', 'sina.com.cn', 'sohu.com', '163.com', 'qq.com/news', 'xinhuanet.com']
  },
  'other': {
    name: '其他',
    domains: []
  }
};

// 访问时间统计
let visitStats = {
  totalTime: 0,
  categories: {},
  lastVisit: null,
  currentSession: {
    startTime: null,
    category: null
  }
};

// 加载保存的设置和统计数据
chrome.storage.sync.get(['settings', 'visitStats'], (result) => {
  if (result.settings) {
    settings = { ...settings, ...result.settings };
  }
  if (result.visitStats) {
    visitStats = { ...visitStats, ...result.visitStats };
  }
});

// 获取网站分类
function getWebsiteCategory(domain) {
  for (const [category, config] of Object.entries(websiteCategories)) {
    if (config.domains.some(catDomain => domain.includes(catDomain))) {
      return category;
    }
  }
  return 'other';
}

// 更新访问统计
function updateVisitStats(domain, isActive = true) {
  const category = getWebsiteCategory(domain);
  const now = Date.now();
  
  // 如果当前有活跃会话，先结束它
  if (visitStats.currentSession.startTime && visitStats.currentSession.category) {
    const sessionDuration = now - visitStats.currentSession.startTime;
    const prevCategory = visitStats.currentSession.category;
    
    if (!visitStats.categories[prevCategory]) {
      visitStats.categories[prevCategory] = { time: 0, visits: 0 };
    }
    visitStats.categories[prevCategory].time += sessionDuration;
    visitStats.categories[prevCategory].visits += 1;
    visitStats.totalTime += sessionDuration;
  }
  
  // 开始新的会话
  if (isActive) {
    visitStats.currentSession = {
      startTime: now,
      category: category
    };
  } else {
    visitStats.currentSession = {
      startTime: null,
      category: null
    };
  }
  
  visitStats.lastVisit = now;
  
  // 保存统计数据
  chrome.storage.sync.set({ visitStats });
}

// 监听标签页激活事件
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url && tab.url.startsWith('http')) {
      const url = new URL(tab.url);
      updateVisitStats(url.hostname, true);
    }
  });
});

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    const url = new URL(tab.url);
    updateVisitStats(url.hostname, true);
  }
});

// 监听标签页关闭事件
chrome.tabs.onRemoved.addListener((tabId) => {
  updateVisitStats('', false);
});

// 监听窗口焦点变化
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // 窗口失去焦点，暂停当前会话
    updateVisitStats('', false);
  } else {
    // 窗口获得焦点，恢复当前会话
    chrome.tabs.query({ active: true, windowId: windowId }, (tabs) => {
      if (tabs[0] && tabs[0].url && tabs[0].url.startsWith('http')) {
        const url = new URL(tabs[0].url);
        updateVisitStats(url.hostname, true);
      }
    });
  }
});

// TODO: 监听导航事件，阻止访问黑名单网站


// 保存设置
function saveSettings() {
  chrome.storage.sync.set({ settings });
}

// 获取访问统计
function getVisitStats() {
  // 确保当前会话时间也被计算在内
  const now = Date.now();
  const stats = { ...visitStats };
  
  if (stats.currentSession.startTime && stats.currentSession.category) {
    const sessionDuration = now - stats.currentSession.startTime;
    const category = stats.currentSession.category;
    
    if (!stats.categories[category]) {
      stats.categories[category] = { time: 0, visits: 0 };
    }
    stats.categories[category].time += sessionDuration;
    stats.totalTime += sessionDuration;
  }
  
  return stats;
}

// 重置统计数据
function resetVisitStats() {
  visitStats = {
    totalTime: 0,
    categories: {},
    lastVisit: null,
    currentSession: {
      startTime: null,
      category: null
    }
  };
  chrome.storage.sync.set({ visitStats });
}

// 接收来自popup或options页的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    sendResponse({ settings });
  } else if (request.action === 'updateSettings') {
    if (request.password === settings.password) {
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
  } else if (request.action === 'getVisitStats') {
    sendResponse({ stats: getVisitStats(), categories: websiteCategories });
  } else if (request.action === 'resetVisitStats') {
    resetVisitStats();
    sendResponse({ success: true });
  }
});