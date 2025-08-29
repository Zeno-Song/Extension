document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status');
  const toggleBtn = document.getElementById('toggle-btn');
  const rulesCountEl = document.getElementById('rules-count');
  const openOptionsBtn = document.getElementById('open-options');

  // update status of popup page
  function updateStatus() {
    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
      if (response && response.settings) {
        const settings = response.settings;
        
        // refresh status
        if (settings.enabled) {
          statusEl.textContent = 'Enabled';
          statusEl.className = 'status enabled';
          toggleBtn.textContent = 'Disable';
          toggleBtn.className = 'btn btn-danger';
        } else {
          statusEl.textContent = 'Disabled';
          statusEl.className = 'status disabled';
          toggleBtn.textContent = 'Enable';
          toggleBtn.className = 'btn btn-success';
        }
        
        // display effective rules count
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

        rulesCountEl.textContent = `${activeRules.length}/${settings.rules.length} Rules Effective`;
      }
    });
  }

  // update Enabled/Disabled status
  toggleBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'toggleEnabled' }, (response) => {
      if (response && response.success) {
        updateStatus();
      }
    });
  });

  // open Settings page
  openOptionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // initialise popup page
  updateStatus();
});