document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status');
  const toggleBtn = document.getElementById('toggle-btn');
  const rulesCountEl = document.getElementById('rules-count');
  const openOptionsBtn = document.getElementById('open-options');
  const totalTimeEl = document.getElementById('total-time');
  const categoryStatsEl = document.getElementById('category-stats');
  const resetStatsBtn = document.getElementById('reset-stats');
  const statsChart = document.getElementById('stats-chart');

  // 分类颜色配置
  const categoryColors = {
    'social': '#FF6B6B',
    'entertainment': '#4ECDC4',
    'work': '#45B7D1',
    'shopping': '#96CEB4',
    'news': '#FFEAA7',
    'other': '#DDA0DD'
  };

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

  // 绘制饼图
  function drawChart(stats, categories) {
    const ctx = statsChart.getContext('2d');
    const centerX = statsChart.width / 2;
    const centerY = statsChart.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // 清除画布
    ctx.clearRect(0, 0, statsChart.width, statsChart.height);

    if (stats.totalTime === 0) {
      // 如果没有数据，显示空状态
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('暂无数据', centerX, centerY);
      return;
    }

    let currentAngle = 0;
    const sortedCategories = Object.entries(stats.categories)
      .filter(([category, data]) => data.time > 0)
      .sort((a, b) => b[1].time - a[1].time);

    sortedCategories.forEach(([category, data]) => {
      const sliceAngle = (data.time / stats.totalTime) * 2 * Math.PI;
      const color = categoryColors[category] || categoryColors.other;

      // 绘制扇形
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // 绘制边框
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      currentAngle += sliceAngle;
    });
  }

  // 更新统计显示
  function updateStatsDisplay(stats, categories) {
    // 更新总时间
    totalTimeEl.textContent = formatTime(stats.totalTime);

    // 更新分类统计
    categoryStatsEl.innerHTML = '';
    
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
      
      categoryStatsEl.appendChild(categoryItem);
    });

    // 绘制图表
    drawChart(stats, categories);
  }

  // 获取统计数据
  function updateStats() {
    chrome.runtime.sendMessage({ action: 'getVisitStats' }, (response) => {
      if (response && response.stats && response.categories) {
        updateStatsDisplay(response.stats, response.categories);
      }
    });
  }

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

  // 重置统计数据
  resetStatsBtn.addEventListener('click', () => {
    if (confirm('确定要重置所有访问统计数据吗？')) {
      chrome.runtime.sendMessage({ action: 'resetVisitStats' }, (response) => {
        if (response && response.success) {
          updateStats();
        }
      });
    }
  });

  // 初始化状态和统计
  updateStatus();
  updateStats();

  // 定期更新统计数据（每30秒）
  setInterval(updateStats, 30000);
});