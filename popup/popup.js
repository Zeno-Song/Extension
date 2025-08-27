document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status');
  const toggleBtn = document.getElementById('toggle-btn');
  const rulesCountEl = document.getElementById('rules-count');
  const openOptionsBtn = document.getElementById('open-options');

  // 获取当前设置
  function updateStatus() {
    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
      if (response && response.settings) {
        const settings = response.settings;
        
        // 更新状态显示
        if (settings.enabled) {
          statusEl.textContent = '已启用';
          statusEl.className = 'status enabled';
          toggleBtn.textContent = '禁用';
          toggleBtn.className = 'btn btn-danger';
        } else {
          statusEl.textContent = '已禁用';
          statusEl.className = 'status disabled';
          toggleBtn.textContent = '启用';
          toggleBtn.className = 'btn btn-success';
        }
        
        // 显示规则数量
        const activeRules = settings.rules.filter(rule => {
          const now = new Date();
          const currentTime = now.getHours() * 60 + now.getMinutes();
          const dayOfWeek = now.getDay();
          
          const ruleStart = rule.startHour * 60 + rule.startMinute;
          const ruleEnd = rule.endHour * 60 + rule.endMinute;
          const daysMatch = rule.days.includes(dayOfWeek);
          const timeMatch = currentTime >= ruleStart && currentTime <= ruleEnd;

          return daysMatch && timeMatch;
        });

        rulesCountEl.textContent = `${activeRules.length}/${settings.rules.length} 条规则生效中`;
      }
    });
  }

  // 切换启用状态
  toggleBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'toggleEnabled' }, (response) => {
      if (response && response.success) {
        updateStatus();
      }
    });
  });

  // 打开选项页面
  openOptionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // 初始化状态和统计
  updateStatus();
});