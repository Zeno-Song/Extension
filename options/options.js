// 存储设置
let settings = {
  enabled: true,
  password: '',
  rules: []
};

// 分类颜色配置
const categoryColors = {
  'social': '#FF6B6B',
  'entertainment': '#4ECDC4',
  'work': '#45B7D1',
  'shopping': '#96CEB4',
  'news': '#FFEAA7',
  'other': '#DDA0DD'
};

// 加载设置
chrome.storage.sync.get(['settings'], (result) => {
  if (result.settings) {
    settings = { ...settings, ...result.settings };
  }
  renderSettings();
  updateStatsDisplay();
});

// 格式化时间显示
function formatTime(milliseconds) {
  const minutes = Math.floor(milliseconds / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours}小时${remainingMinutes}分钟`;
  } else {
    return `${minutes}分钟`;
  }
}

// 格式化日期显示
function formatDate(timestamp) {
  if (!timestamp) return '从未访问';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 24 * 60 * 60 * 1000) {
    // 今天
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } else if (diff < 48 * 60 * 60 * 1000) {
    // 昨天
    return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } else {
    // 更早
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
}

// 更新统计显示
function updateStatsDisplay() {
  chrome.runtime.sendMessage({ action: 'getVisitStats' }, (response) => {
    if (response && response.stats && response.categories) {
      const stats = response.stats;
      const categories = response.categories;
      
      // 更新总时间和最后访问
      document.getElementById('total-time-display').textContent = formatTime(stats.totalTime);
      document.getElementById('last-visit-display').textContent = formatDate(stats.lastVisit);
      
      // 更新分类统计
      const categoryList = document.getElementById('category-breakdown-list');
      categoryList.innerHTML = '';
      
      const sortedCategories = Object.entries(stats.categories)
        .filter(([category, data]) => data.time > 0)
        .sort((a, b) => b[1].time - a[1].time);
      
      sortedCategories.forEach(([category, data]) => {
        const percentage = stats.totalTime > 0 ? ((data.time / stats.totalTime) * 100).toFixed(1) : 0;
        const categoryName = categories[category]?.name || '其他';
        const color = categoryColors[category] || categoryColors.other;
        
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.innerHTML = `
          <div class="category-name">
            <div class="category-color" style="background-color: ${color}"></div>
            <div class="category-info">
              <div class="category-label">${categoryName}</div>
              <div class="category-details">${formatTime(data.time)} · ${data.visits}次访问</div>
            </div>
          </div>
          <div class="category-percentage">${percentage}%</div>
        `;
        
        categoryList.appendChild(categoryItem);
      });
      
      if (sortedCategories.length === 0) {
        categoryList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">暂无访问数据</p>';
      }
    }
  });
}

// 渲染设置界面
function renderSettings() {
  // 设置启用状态
  document.getElementById('enabled').checked = settings.enabled;
  
  // 设置密码字段
  document.getElementById('password').value = settings.password;
  document.getElementById('confirm-password').value = settings.password;
  
  // 渲染规则列表
  const rulesContainer = document.getElementById('rules-container');
  rulesContainer.innerHTML = '';
  
  settings.rules.forEach((rule, index) => {
    const li = document.createElement('li');
    
    const daysText = rule.days.map(d => ['日','一','二','三','四','五','六'][d]).join(',');
    const timeText = `${rule.startHour}:${rule.startMinute.toString().padStart(2, '0')} - ${rule.endHour}:${rule.endMinute.toString().padStart(2, '0')}`;
    
    li.innerHTML = `
      <div class="rule-info">
        <span class="domain">${rule.domain}</span>
        <span class="time">${timeText}</span>
        <span class="days">${daysText}</span>
      </div>
      <button class="delete-rule" data-index="${index}">删除</button>
    `;
    
    // 设置data属性
    li.dataset.startHour = rule.startHour;
    li.dataset.startMinute = rule.startMinute;
    li.dataset.endHour = rule.endHour;
    li.dataset.endMinute = rule.endMinute;
    li.dataset.days = JSON.stringify(rule.days);
    
    rulesContainer.appendChild(li);
  });
  
  // 添加删除规则事件
  document.querySelectorAll('.delete-rule').forEach(btn => {
    btn.addEventListener('click', (e) => {
      console.log('1', e.target)
      const index = parseInt(e.target.getAttribute('data-index'));
      settings.rules.splice(index, 1);
      renderSettings();
    });
  });
}

// 添加规则
document.getElementById('add-rule').addEventListener('click', () => {
  const domain = document.getElementById('domain').value.trim();
  const startHour = parseInt(document.getElementById('start-hour').value);
  const startMinute = parseInt(document.getElementById('start-minute').value);
  const endHour = parseInt(document.getElementById('end-hour').value);
  const endMinute = parseInt(document.getElementById('end-minute').value);
  
  const days = Array.from(document.querySelectorAll('input[name="day"]:checked'))
    .map(checkbox => parseInt(checkbox.value));
  
  if (!domain) {
    alert('请输入域名');
    return;
  }
  
  if (days.length === 0) {
    alert('请选择至少一个生效日');
    return;
  }
  
  settings.rules.push({
    domain,
    startHour,
    startMinute,
    endHour,
    endMinute,
    days
  });
  
  document.getElementById('domain').value = '';
  renderSettings();
});

// 重置统计数据
document.getElementById('reset-stats').addEventListener('click', () => {
  if (confirm('确定要重置所有访问统计数据吗？此操作不可恢复。')) {
    chrome.runtime.sendMessage({ action: 'resetVisitStats' }, (response) => {
      if (response && response.success) {
        alert('统计数据已重置');
        updateStatsDisplay();
      } else {
        alert('重置失败');
      }
    });
  }
});

// TODO: 导出统计数据


// 保存设置按钮
document.getElementById('save-settings').addEventListener('click', async () => {
  try {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const enabled = document.getElementById('enabled').checked;
    
    if (password !== confirmPassword) {
      throw new Error('两次输入的密码不一致');
    }
    
    const newSettings = {
      enabled: enabled,
      password: password,
      rules: collectRules()
    };
    
    const response = await chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: newSettings,
      password: settings.password || password
    });
    
    if (response?.success) {
      settings = newSettings;
      alert('设置已保存');
    } else {
      throw new Error(response?.error || '保存失败');
    }
  } catch (error) {
    console.error('保存设置出错:', error);
    alert(`保存失败: ${error.message}`);
  }
});

// 收集所有规则的函数
function collectRules() {
  return Array.from(document.querySelectorAll('#rules-container li')).map(li => {
    return {
      domain: li.querySelector('.domain').textContent,
      startHour: parseInt(li.dataset.startHour),
      startMinute: parseInt(li.dataset.startMinute),
      endHour: parseInt(li.dataset.endHour),
      endMinute: parseInt(li.dataset.endMinute),
      days: JSON.parse(li.dataset.days)
    };
  });
}


