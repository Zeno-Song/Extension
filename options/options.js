// 存储设置
let settings = {
  enabled: true,
  password: '',
  rules: []
};

// 加载设置
chrome.storage.sync.get(['settings'], (result) => {
  if (result.settings) {
    settings = { ...settings, ...result.settings };
  }
  renderSettings();
});

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


