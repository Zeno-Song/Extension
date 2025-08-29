// dictionary, save settings
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
  renderSettings();
});

// Rrender new rules in options.html under <id="rules-container">
function renderSettings() {
  // set Activate Extension button to enabled
  document.getElementById('enabled').checked = settings.enabled;
  
  // mport password
  document.getElementById('password').value = settings.password;
  document.getElementById('confirm-password').value = settings.password;
  
  // render new rule
  const rulesContainer = document.getElementById('rules-container');
  rulesContainer.innerHTML = '';
  
  settings.rules.forEach((rule, index) => {
    const li = document.createElement('li');
    
    const daysText = rule.days.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(',');
    const timeText = `${rule.startHour}:${rule.startMinute.toString().padStart(2, '0')} - ${rule.endHour}:${rule.endMinute.toString().padStart(2, '0')}`;
    
    li.innerHTML = `
      <div class="rule-info">
        <span class="domain">${rule.domain}</span>
        <span class="time">${timeText}</span>
        <span class="days">${daysText}</span>
      </div>
      <button class="delete-rule" data-index="${index}">Delete</button>
    `;
    
    // set li attributes
    li.dataset.startHour = rule.startHour;
    li.dataset.startMinute = rule.startMinute;
    li.dataset.endHour = rule.endHour;
    li.dataset.endMinute = rule.endMinute;
    li.dataset.days = JSON.stringify(rule.days);
    
    rulesContainer.appendChild(li);
  });
  
  // delete function
  document.querySelectorAll('.delete-rule').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.getAttribute('data-index'));
      settings.rules.splice(index, 1);
      renderSettings();
    });
  });
}

// add rule
document.getElementById('add-rule').addEventListener('click', () => {
  const domain = document.getElementById('domain').value.trim();
  const startHour = parseInt(document.getElementById('start-hour').value);
  const startMinute = parseInt(document.getElementById('start-minute').value);
  const endHour = parseInt(document.getElementById('end-hour').value);
  const endMinute = parseInt(document.getElementById('end-minute').value);
  
  const days = Array.from(document.querySelectorAll('input[name="day"]:checked'))
    .map(checkbox => parseInt(checkbox.value));
  
  if (!domain) {
    alert('Please input Website');
    return;
  }
  
  if (days.length === 0) {
    alert('Please choose at least one Day of the Week');
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

// save settings
document.getElementById('save-settings').addEventListener('click', async () => {
  try {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const enabled = document.getElementById('enabled').checked;
    
    if (password !== confirmPassword) {
      throw new Error('Password disagreement');
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
      alert('Settings saved');
    } else {
      throw new Error(response?.error || 'Save failed');
    }
  } catch (error) {
    console.error('Save settings error:', error);
    alert(`Save failed: ${error.message}`);
  }
});

// collect rules, called in <newSettings> to be saved to <settings>
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


