(function () {
  var el = document.getElementById('cip-countdown');
  if (!el) return;

  var targetDate = new Date(el.getAttribute('data-target'));
  var section = document.getElementById('registro');

  // beyond-clock.js permite simular la hora con ?ahora=; sin él se usa la hora real
  function nowMs() { return window.BeyondClock ? window.BeyondClock.now() : Date.now(); }

  var daysEl = document.getElementById('cip-countdown-days');
  var hoursEl = document.getElementById('cip-countdown-hours');
  var minutesEl = document.getElementById('cip-countdown-minutes');
  var secondsEl = document.getElementById('cip-countdown-seconds');

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function update() {
    var now = new Date(nowMs());
    var target = targetDate;

    // A partir de la hora del evento la sección cambia de estado: sin cuenta regresiva y con el texto de entrada
    if (section) section.classList.toggle('is-now', target <= now);
    // También en <html>, para lo que queda fuera de #registro (el botón del hero)
    document.documentElement.classList.toggle('is-now', target <= now);

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
