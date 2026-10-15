// Reloj compartido en hora de Monterrey (UTC-6, sin horario de verano), sin importar la zona del visitante.
// Lo usan agenda-board.js (línea de "ahora" y eventos pasados) y ya-empezamos.js (celebración de las 10 a 11 a. m.).
// Para probar sin esperar al evento: agrega ?ahora=2026-10-21T14:10 a la dirección (hora de Monterrey); el reloj
// arranca en ese instante y sigue avanzando. Sin ese parámetro usa la hora real.
(function () {
  var OFFSET = -6 * 3600000;
  var t0 = Date.now();
  var base = null;
  try {
    var p = new URLSearchParams(window.location.search).get('ahora');
    if (p && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(p)) {
      var ms = Date.parse(p + (p.length === 16 ? ':00' : '') + '-06:00');
      if (!isNaN(ms)) base = ms;
    }
  } catch (e) {}

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  window.BeyondClock = {
    simulated: base !== null,
    // { date: 'AAAA-MM-DD', min: minutos desde la medianoche, con fracción }
    mx: function () {
      var d = new Date((base === null ? Date.now() : base + (Date.now() - t0)) + OFFSET);
      return {
        date: d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()),
        min: d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60
      };
    }
  };
})();
