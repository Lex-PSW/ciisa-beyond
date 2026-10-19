// Celebración "¡Ya empezamos!": confeti en Lottie (2D, responsivo) y la frase, 5 segundos y desaparece.
// Sale una sola vez por dispositivo, la primera vez que alguien entra el día del evento entre las 10:00 y las 11:00
// (hora de Monterrey). Va por encima de todo (z-index máximo) y no bloquea clics. Con prefers-reduced-motion
// muestra solo la frase, sin confeti. Con ?ahora=… (ver beyond-clock.js) se puede probar en cualquier momento.
(function () {
  var clock = window.BeyondClock;
  if (!clock) return;

  var FECHA = '2026-10-21';
  var DESDE = 10 * 60, HASTA = 11 * 60;          // ventana en minutos
  var DURACION = 5000, SALIDA = 600;             // ms totales y ms de desvanecimiento al final
  var KEY = 'beyond-ya-empezamos';

  var now = clock.mx();
  if (now.date !== FECHA || now.min < DESDE || now.min >= HASTA) return;

  // Primera vez: en una prueba con hora simulada no se guarda ni se respeta la marca
  var seen = false;
  if (!clock.simulated) {
    try { seen = window.localStorage.getItem(KEY) === '1'; } catch (e) {}
    if (seen) return;
    try { window.localStorage.setItem(KEY, '1'); } catch (e) {}
  }

  function show() {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var layer = document.createElement('div');
    layer.className = 'cip-celebra';
    layer.setAttribute('role', 'status');
    layer.setAttribute('aria-live', 'polite');

    var stage = document.createElement('div');
    stage.className = 'cip-celebra__lottie';
    stage.setAttribute('aria-hidden', 'true');
    layer.appendChild(stage);

    var text = document.createElement('p');
    text.className = 'cip-celebra__text';
    text.innerHTML = '¡Ya <span class="cip-hero__headline-span--pulse">empezamos!</span>';
    layer.appendChild(text);
    document.body.appendChild(layer);

    var anim = null;
    if (!reduce && window.lottie) {
      var portrait = window.innerHeight > window.innerWidth;
      anim = window.lottie.loadAnimation({
        container: stage,
        renderer: 'svg',
        loop: false,
        autoplay: true,
        path: 'assets/lottie/confeti-' + (portrait ? 'vertical' : 'horizontal') + '.json',
        rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
      });
    }

    // Entra en el siguiente cuadro para que la transición de opacidad se note
    window.setTimeout(function () { layer.classList.add('is-in'); }, 30);
    window.setTimeout(function () { layer.classList.add('is-out'); }, DURACION - SALIDA);
    window.setTimeout(function () {
      if (anim) anim.destroy();
      if (layer.parentNode) layer.parentNode.removeChild(layer);
    }, DURACION);
  }

  // Si la pantalla de carga (index.html) sigue puesta, espera a que se quite para que la celebración no quede tapada
  function arranca() {
    if (window.__beyondLoaded === false) window.addEventListener('beyond:loader-done', show);
    else show();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arranca);
  else arranca();
})();
