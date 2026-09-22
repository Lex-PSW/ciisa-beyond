(function () {
  var el = document.getElementById('cip-countdown');
  if (!el) return;

  var targetDate = new Date(el.getAttribute('data-target'));

  var daysEl = document.getElementById('cip-countdown-days');
  var hoursEl = document.getElementById('cip-countdown-hours');
  var minutesEl = document.getElementById('cip-countdown-minutes');
  var secondsEl = document.getElementById('cip-countdown-seconds');

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function update() {
    var now = new Date();
    var target = targetDate;

    if (target <= now) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      return;
    }

    var diffMs = target.getTime() - now.getTime();
    var totalSeconds = Math.floor(diffMs / 1000);

    var days = Math.floor(totalSeconds / 86400);
    totalSeconds -= days * 86400;
    var hours = Math.floor(totalSeconds / 3600);
    totalSeconds -= hours * 3600;
    var minutes = Math.floor(totalSeconds / 60);
    totalSeconds -= minutes * 60;
    var seconds = totalSeconds;

    daysEl.textContent = pad(days);
    hoursEl.textContent = pad(hours);
    minutesEl.textContent = pad(minutes);
    secondsEl.textContent = pad(seconds);
  }

  update();
  setInterval(update, 1000);
})();
