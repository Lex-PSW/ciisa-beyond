// Navegación fija (Inicio, Agenda, Laboratorio, Registro) y parallax suave de scroll.
// - Marca la sección activa y mueve la pastilla bajo el enlace.
// - Parallax: el contenido del hero se queda atrás y se desvanece al salir, el video de fondo se desplaza un poco
//   y el encabezado de la agenda va con un ligero retraso. Todo corre en un solo requestAnimationFrame y se
//   desactiva con prefers-reduced-motion. El CSS lee las variables --hero-p, --vid-y y --par.
(function () {
  var nav = document.querySelector('[data-sitenav]');
  if (!nav) return;

  var links = [].slice.call(nav.querySelectorAll('[data-nav]'));
  var sections = links.map(function (a) { return document.getElementById(a.getAttribute('data-nav')); });
  var hero = document.getElementById('inicio');
  var video = document.querySelector('[data-hero-video]');
  var drifters = [].slice.call(document.querySelectorAll('[data-parallax]'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var current = -1;
  var ticking = false;

  function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }

  /* ---------- Sección activa ---------- */
  function setActive(i) {
    current = i;
    links.forEach(function (a, n) {
      var on = n === i;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    var a = links[i];
    nav.style.setProperty('--thumb-x', a.offsetLeft + 'px');
    nav.style.setProperty('--thumb-w', a.offsetWidth + 'px');
  }

  // El botón flotante de eventos pasados (tablet y celular) solo se muestra cuando, dentro de la agenda, se ve el "ahora":
  // el evento en curso (o, si no hay uno, el siguiente), nunca los eventos futuros lejanos. Con los pasados ya revelados
  // también se queda mientras se recorren, para poder esconderlos. Así se revelan o esconden cerca de donde se está.
  // El CSS lo desvanece con .is-agenda
  var agenda = document.getElementById('programa');
  var pastFab = document.querySelector('[data-nav-past]');
  var inAgenda = null;
  var tipShown = false;
  // Margen de 150 px: el botón aparece un poco antes de que el "ahora" entre en pantalla y sigue un poco después de que
  // sale, así se entiende de qué trata y no parpadea en el borde. Antes estuvo en 300 px (más tiempo para su
  // desvanecimiento, pero también más ocasiones de revelar con los pasados cerca de la pantalla)
  var NOW_PAD = 150;
  function inView(el) {
    var r = el.getBoundingClientRect();
    return r.height > 0 && r.bottom > -NOW_PAD && r.top < window.innerHeight + NOW_PAD;
  }
  // El bloque del "ahora": el evento en curso o, si no hay uno, el primer evento que aún no termina
  function nowNode() {
    var items = agenda.querySelectorAll('.cip-program__item');
    var now = agenda.querySelector('.cip-program__item.is-live');
    if (!now) {
      for (var i = 0; i < items.length; i++) {
        if (!items[i].classList.contains('is-past') && items[i].getBoundingClientRect().height > 0) { now = items[i]; break; }
      }
    }
    return now;
  }

  function nearNow() {
    var items = agenda.querySelectorAll('.cip-program__item');
    var now = nowNode(), revealed = agenda.querySelector('.cip-program__board.show-past');
    var i;
    if (now && inView(now)) return true;
    if (revealed) {
      for (i = 0; i < items.length; i++) { if (items[i].classList.contains('is-past') && inView(items[i])) return true; }
    }
    return false;
  }
  function spyAgenda() {
    if (!agenda || !pastFab) return;
    var r = agenda.getBoundingClientRect(), line = window.innerHeight * 0.4;
    var on = r.top <= line && r.bottom > line && nearNow();
    if (on === inAgenda) return;
    inAgenda = on;
    pastFab.classList.toggle('is-agenda', on);
    // Ayuda cognitiva: la primera vez que se llega a la agenda, y solo si hay pasados sin ver, un aviso de texto junto al botón
    var count = pastFab.querySelector('[data-nav-past-count]');
    if (on && !tipShown && count && !count.hidden) {
      tipShown = true;
      window.setTimeout(function () { pastFab.classList.add('has-tip'); }, 900);
      window.setTimeout(function () { pastFab.classList.remove('has-tip'); }, 6500);
    }
  }

  function spy() {
    var line = window.innerHeight * 0.4, idx = 0;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= line) idx = i; });
    if (idx !== current) setActive(idx);
    spyAgenda();
  }

  /* ---------- Parallax ---------- */
  function clearParallax() {
    if (hero) hero.style.removeProperty('--hero-p');
    if (video) video.style.removeProperty('--vid-y');
    drifters.forEach(function (d) { d._par = 0; d.style.removeProperty('--par'); });
  }

  function parallax() {
    var y = window.scrollY || window.pageYOffset;
    if (hero) {
      var p = clamp(y / hero.offsetHeight, 0, 1);
      hero.style.setProperty('--hero-p', p.toFixed(4));
    }
    if (video) video.style.setProperty('--vid-y', (-clamp(y * 0.03, 0, 36)).toFixed(1));
    var vh = window.innerHeight;
    drifters.forEach(function (d) {
      var r = d.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var k = parseFloat(d.getAttribute('data-parallax')) || 0.1;
      // Distancia del elemento al centro de la pantalla, sin contar el desplazamiento que ya tiene aplicado;
      // se mueve en sentido contrario para quedarse atrás del scroll
      var offset = (r.top - (d._par || 0)) + r.height / 2 - vh / 2;
      d._par = clamp(-offset * k, -40, 40);
      d.style.setProperty('--par', d._par.toFixed(1));
    });
  }

  function frame() {
    ticking = false;
    spy();
    if (!reduce.matches) parallax();
  }
  function onScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(frame); }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  // agenda-board.js avisa cuando cambia qué está en curso o si los pasados están revelados
  window.addEventListener('beyond:agenda-state', spyAgenda);
  window.addEventListener('resize', function () { setActive(Math.max(current, 0)); onScroll(); });
  if (reduce.addEventListener) reduce.addEventListener('change', function () { if (reduce.matches) clearParallax(); onScroll(); });

  // En celular, con el teclado abierto en el formulario la barra inferior estorba: se oculta mientras se escribe
  var form = document.querySelector('[data-rsvp-form]');
  if (form) {
    form.addEventListener('focusin', function () { nav.classList.add('is-away'); });
    form.addEventListener('focusout', function () { nav.classList.remove('is-away'); });
  }

  // La pastilla necesita las medidas finales de los enlaces: se coloca cuando cargan las fuentes
  setActive(0);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setActive(Math.max(current, 0)); });
  frame();
})();
