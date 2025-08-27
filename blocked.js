function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US');
    const dateString = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });

    console.log(timeString, ";", dateString);
    document.getElementById('current-time').textContent = timeString;
    document.getElementById('current-date').textContent = dateString;
}

function goBack() {
    window.history.back();
}

function goHome() {
    window.location.href = 'https://www.google.com';
}

// 更新时间
updateTime();
setInterval(updateTime, 1000);