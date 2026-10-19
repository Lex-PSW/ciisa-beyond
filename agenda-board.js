// Agenda por hora: dibuja el tablero de la sección #programa a partir de window.CIISA_AGENDA (agenda-data.js).
// Escritorio (≥1025 px): una columna por espacio y una fila por cada 5 minutos, así cada bloque mide lo que dura.
// Tablet y celular: lista cronológica agrupada por hora, con filtros por espacio. Es la misma estructura en
// ambos casos; el CSS decide cómo se ve.
//
// En vivo (el día del evento, con la hora de beyond-clock.js): una línea de "ahora" baja por el tablero en escritorio;
// los eventos terminados se ponen en gris; el que está en curso se resalta y, en lista, muestra una barra de avance
// dentro de su tarjeta. En tablet y celular los eventos terminados se ocultan y el botón flotante [data-nav-past]
// (index.html, sobre el de WhatsApp) los muestra u oculta con una animación de colapso.
(function () {
  var data = window.CIISA_AGENDA;
  var board = document.querySelector('[data-program-board]');
  if (!data || !board) return;

  var STEP = 5;                                  // minutos por fila del tablero
  var FIRST_STAGE_COL = 3;                       // columnas: 1 hora, 2 rótulo, 3 primera columna, 4 rótulo, 5 segunda columna
  var start = toMin(data.inicio);
  var end = toMin(data.fin);
  var stageIndex = {};
  data.escenarios.forEach(function (s, i) { stageIndex[s.id] = i; });
  // Columna de escritorio de cada espacio (varios espacios pueden compartir una); entre columnas va un carril para los rótulos
  var colOf = {};
  data.escenarios.forEach(function (s, i) { colOf[s.id] = s.col != null ? s.col : i; });
  function gridCol(c) { return FIRST_STAGE_COL + c * 2; }
  function railCol(c) { return gridCol(c) - 1; }

  function toMin(t) { var p = t.split(':'); return (+p[0]) * 60 + (+p[1]); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function suffix(min) { return min >= 720 ? 'p. m.' : 'a. m.'; }
  function clock(min) { var h = Math.floor(min / 60) % 12 || 12; return h + ':' + pad(min % 60); }
  function range(a, b) { return clock(a) + (suffix(a) === suffix(b) ? '' : ' ' + suffix(a)) + ' – ' + clock(b) + ' ' + suffix(b); }
  function hourLabel(min) { return min % 60 === 0 ? (Math.floor(min / 60) % 12 || 12) + ' ' + suffix(min) : clock(min) + ' ' + suffix(min); }
  function iso(min) { return data.fecha + 'T' + pad(Math.floor(min / 60)) + ':' + pad(min % 60) + ':00' + data.zona; }
  function rowOf(min) { return 2 + (min - start) / STEP; }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }
  function place(n, col, r1, r2) {
    n.style.setProperty('--c', col);
    n.style.setProperty('--r1', r1);
    n.style.setProperty('--r2', r2);
    return n;
  }

  board.style.setProperty('--rows', (end - start) / STEP);

  /* ---- Encabezados de cada espacio ---- */
  data.escenarios.forEach(function (s) {
    if (s.cabecera === false) return;
    var head = el('div', 'cip-program__head');
    head.setAttribute('data-stage', s.id);
    head.appendChild(el('span', 'cip-program__head-name', s.nombre));
    if (s.lugar) head.appendChild(el('span', 'cip-program__head-place', s.lugar));
    board.appendChild(place(head, gridCol(colOf[s.id]), 1, 2));
  });

  /* ---- Líneas de cada hora y rótulos de tema (solo escritorio) ---- */
  var seq = [];                                  // elementos que se ordenan cronológicamente
  for (var m = start; m < end; m += 30) {
    if (m !== start && m % 60 !== 0) continue;
    var r = rowOf(m);
    var rule = el('div', 'cip-program__rule');
    rule.setAttribute('aria-hidden', 'true');
    board.appendChild(place(rule, '2 / -1', r, r + 1));
    var hour = el('div', 'cip-program__hour', hourLabel(m));
    seq.push({ t: m, o: 0, s: 0, n: place(hour, 1, r, r + 1) });
  }

  var temas = {};
  data.sesiones.forEach(function (s) {
    if (!s.tema) return;
    var a = toMin(s.ini), b = toMin(s.fin);
    var t = temas[s.tema] || (temas[s.tema] = { a: a, b: b });
    t.a = Math.min(t.a, a); t.b = Math.max(t.b, b);
  });
  Object.keys(temas).forEach(function (name) {
    var rail = el('div', 'cip-program__rail', name);
    rail.setAttribute('aria-hidden', 'true');
    board.appendChild(place(rail, railCol(0), rowOf(temas[name].a), rowOf(temas[name].b)));
  });
  // Los espacios sin cabecera propia (PC Experiencias) se rotulan con una etiqueta vertical sobre su tramo de horas
  data.escenarios.forEach(function (s) {
    if (s.cabecera !== false) return;
    var a = Infinity, b = 0;
    data.sesiones.forEach(function (x) { if (x.e === s.id) { a = Math.min(a, toMin(x.ini)); b = Math.max(b, toMin(x.fin)); } });
    if (a >= b) return;
    var rail = el('div', 'cip-program__rail cip-program__rail--' + s.id, s.nombre);
    rail.setAttribute('aria-hidden', 'true');
    board.appendChild(place(rail, railCol(colOf[s.id]), rowOf(a), rowOf(b)));
  });

  /* ---- Sesiones ---- */
  var items = [];                                // { node, a, b } para el estado en vivo
  data.sesiones.forEach(function (s) {
    var a = toMin(s.ini), b = toMin(s.fin), dur = b - a;
    var all = s.e === 'todos';                    // ocupa todas las columnas en escritorio
    // Networking y clausura son de todos: sin nombre de espacio, sin su color y visibles con cualquier filtro.
    // Un networking de una sola columna (e: 'exito') conserva su lugar en escritorio.
    var neutral = all || s.tipo === 'networking';
    var card = el('article', 'cip-program__item' + (dur <= 20 ? ' is-short' : '') + (dur <= 10 ? ' is-tiny' : '') + (s.tipo ? ' is-' + s.tipo : ''));
    card.setAttribute('data-stage', neutral ? 'todos' : s.e);

    var meta = el('div', 'cip-program__meta');
    var time = el('time', 'cip-program__time', range(a, b));
    time.setAttribute('datetime', iso(a));
    meta.appendChild(time);
    meta.appendChild(el('span', 'cip-program__live', 'Ahora'));
    meta.appendChild(el('span', 'cip-program__dur', dur + ' min'));
    if (!neutral) {
      // Espacio y lugar, en palabras (solo se ve en lista): "Casos de éxito · Escenario principal".
      // Una sesión puede cambiar solo la palabra con "etiqueta" ("Workshop · Escenario principal"); el filtro sigue por espacio
      var esc = data.escenarios[stageIndex[s.e]];
      var stage = el('span', 'cip-program__stage', s.etiqueta || esc.nombre);
      if (esc.lugar) stage.appendChild(el('span', 'cip-program__place', ' · ' + esc.lugar));
      meta.appendChild(stage);
    }
    if (s.marca) meta.appendChild(el('span', 'cip-program__brand', s.marca));
    card.appendChild(meta);

    card.appendChild(el('h3', 'cip-program__title', s.titulo));
    if (s.tema) card.appendChild(el('span', 'cip-program__tema', s.tema));

    // Barra de avance dentro de la tarjeta: solo se ve en lista y mientras el evento está en curso
    var bar = el('div', 'cip-program__progress');
    bar.setAttribute('aria-hidden', 'true');
    bar.appendChild(document.createElement('span'));
    card.appendChild(bar);

    var col = all ? FIRST_STAGE_COL + ' / -1' : gridCol(colOf[s.e]);
    seq.push({ t: a, o: 1, s: all ? -1 : stageIndex[s.e], n: place(card, col, rowOf(a), rowOf(b)), stage: s.e });
    items.push({ node: card, a: a, b: b });
  });

  seq.sort(function (x, y) { return x.t - y.t || x.o - y.o || x.s - y.s; });
  seq.forEach(function (x) { board.appendChild(x.n); });

  /* ---- Línea de "ahora" (escritorio): una capa del tamaño del tablero y la línea dentro ---- */
  var nowLayer = el('div', 'cip-program__now-layer');
  nowLayer.setAttribute('aria-hidden', 'true');
  nowLayer.hidden = true;
  var nowLine = el('div', 'cip-program__now');
  var nowLabel = el('span', 'cip-program__now-label');
  nowLine.appendChild(nowLabel);
  nowLayer.appendChild(nowLine);
  board.appendChild(place(nowLayer, '1 / -1', 2, 2 + (end - start) / STEP));

  /* ---- Filtros por espacio y eventos pasados (tablet y celular) ---- */
  var bar = document.querySelector('[data-program-filters]');
  var pastBtn = document.querySelector('[data-nav-past]');
  var pastCount = document.querySelector('[data-nav-past-count]');
  var pastTip = document.querySelector('[data-nav-past-tip]');

  /* ---- Ayudas cognitivas del botón de pasados ----
     - El globo cuenta los eventos terminados que aún no has visto: al revelarlos y recorrerlos (cada uno entra en pantalla)
       dejan de contar; si terminan más, el globo vuelve.
     - Si el botón se pulsa más de 3 veces, la persona ya lo conoce: el globo se apaga y regresa a las 2 horas.
     Se guarda en localStorage (con try/catch: puede estar bloqueado); sin él, todo funciona solo mientras dura la página. */
  var HINT_KEY = 'beyond:past-hint';
  var HINT_PRESSES = 3;                       // a partir de la pulsación 4 se apaga el globo
  var HINT_PAUSE = 2 * 60 * 60 * 1000;        // y vuelve a las 2 horas
  var hint = { n: 0, until: 0, seen: {} };
  try {
    var raw = window.localStorage.getItem(HINT_KEY);
    var saved = raw ? JSON.parse(raw) : null;
    if (saved && typeof saved === 'object') {
      hint.n = +saved.n || 0;
      hint.until = +saved.until || 0;
      if (saved.seen && typeof saved.seen === 'object') hint.seen = saved.seen;
    }
  } catch (e) { /* sin almacenamiento: se queda en memoria */ }
  function saveHint() { try { window.localStorage.setItem(HINT_KEY, JSON.stringify(hint)); } catch (e) { /* ignorar */ } }
  function hintSilenced() {
    if (!hint.until) return false;
    if (Date.now() >= hint.until) { hint.until = 0; hint.n = 0; saveHint(); return false; }
    return true;
  }
  var mq = window.matchMedia('(max-width: 1024px)');
  var filter = 'all';
  var state = 'before';                          // before | live | after
  var showPast = false;
  var pastTotal = 0;

  // sp = si se muestran los pasados (por defecto, el estado actual); sirve para saber qué saldría o entraría al cambiarlo
  function hiddenByTime(node, sp) {
    if (sp === undefined) sp = showPast;
    return mq.matches && state === 'live' && !sp && node.classList.contains('is-past');
  }
  function visible(node, sp) {
    var stage = node.getAttribute('data-stage');
    return (filter === 'all' || stage === filter || stage === 'todos') && !hiddenByTime(node, sp);
  }

  // En lista, una hora sin eventos visibles no se muestra; en escritorio todas las horas quedan a la vista
  function syncHours() {
    var kids = Array.prototype.slice.call(board.querySelectorAll('.cip-program__hour, .cip-program__item'));
    var current = null, any = false;
    function close() { if (current) current.hidden = mq.matches && !any; }
    kids.forEach(function (k) {
      if (k.classList.contains('cip-program__hour')) { close(); current = k; any = false; }
      else if (visible(k)) any = true;
    });
    close();
  }

  function syncPastButton() {
    if (!pastBtn) return;
    var on = mq.matches && state === 'live' && pastTotal > 0;
    pastBtn.hidden = !on;
    pastBtn.setAttribute('aria-pressed', showPast ? 'true' : 'false');
    var unseen = 0;
    items.forEach(function (it, i) { if (it.node.classList.contains('is-past') && !hint.seen[i]) unseen++; });
    var badge = unseen > 0 && !hintSilenced();
    var label = (showPast ? 'Ocultar eventos pasados' : 'Mostrar eventos pasados') + (badge ? ' (' + unseen + ' sin ver)' : '');
    pastBtn.setAttribute('aria-label', label);
    pastBtn.setAttribute('title', label);
    if (pastCount) { pastCount.textContent = unseen; pastCount.hidden = !badge; }
    if (pastTip) pastTip.textContent = unseen === 0 ? '' : (unseen === 1 ? '1 evento terminó' : unseen + ' eventos terminaron');
    // site-nav.js decide, según lo que se vea en pantalla, si el botón se muestra
    window.dispatchEvent(new Event('beyond:agenda-state'));
  }

  // Marca como "vistos" los eventos pasados que entran en pantalla mientras están revelados
  var seenObs = null;
  function watchSeen(on) {
    if (seenObs) { seenObs.disconnect(); seenObs = null; }
    if (!on || !('IntersectionObserver' in window)) return;
    seenObs = new IntersectionObserver(function (entries) {
      var changed = false;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = items.map(function (it) { return it.node; }).indexOf(e.target);
        if (i >= 0 && !hint.seen[i]) { hint.seen[i] = true; changed = true; }
      });
      if (changed) { saveHint(); syncPastButton(); }
    }, { threshold: 0.6 });
    items.forEach(function (it) { if (it.node.classList.contains('is-past')) seenObs.observe(it.node); });
  }

  /* ---- Estado en vivo ---- */
  function update() {
    var c = window.BeyondClock ? window.BeyondClock.mx() : null;
    state = 'before';
    if (c) {
      if (c.date === data.fecha) state = c.min < start ? 'before' : (c.min >= end ? 'after' : 'live');
      else if (c.date > data.fecha) state = 'after';
    }
    board.setAttribute('data-live', state);
    pastTotal = 0;
    items.forEach(function (it) {
      var live = state === 'live' && c.min >= it.a && c.min < it.b;
      var past = state === 'live' && c.min >= it.b;
      it.node.classList.toggle('is-live', live);
      it.node.classList.toggle('is-past', past);
      if (live) it.node.setAttribute('aria-current', 'time'); else it.node.removeAttribute('aria-current');
      if (live) it.node.style.setProperty('--pct', (((c.min - it.a) / (it.b - it.a)) * 100).toFixed(1) + '%');
      if (past) pastTotal++;
    });
    nowLayer.hidden = state !== 'live';
    if (state === 'live') {
      nowLayer.style.setProperty('--now-off', (c.min - start).toFixed(2));
      var whole = Math.floor(c.min);
      nowLabel.textContent = clock(whole) + ' ' + suffix(whole);
    }
    syncPastButton();
    syncHours();
    if (showPast) watchSeen(true);   // por si terminó otro evento mientras están revelados
  }

  function setFilter(next) {
    filter = next;
    board.setAttribute('data-filter', next);
    if (bar) Array.prototype.forEach.call(bar.children, function (b) {
      var on = b.getAttribute('data-filter') === next;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    syncHours();
  }

  if (bar) {
    [{ id: 'all', nombre: 'Todo' }].concat(data.escenarios).forEach(function (s) {
      var b = el('button', 'cip-program__chip', s.nombre);
      b.type = 'button';
      b.setAttribute('data-filter', s.id);
      b.setAttribute('data-stage', s.id);
      b.addEventListener('click', function () { setFilter(s.id); });
      bar.appendChild(b);
    });
  }
  /* ---- Mostrar y ocultar los eventos pasados, con animación ----
     En la lista (flex en columna con separación) cada bloque colapsa o se expande animando altura, opacidad, relleno y
     margen; el margen inferior negativo se come la separación para que no haya salto al final. Con
     prefers-reduced-motion, o sin Web Animations, el cambio es directo. */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var toggling = false;
  var DURATION = 450;
  var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

  function applyPast(next) {
    showPast = next;
    board.classList.toggle('show-past', showPast);
    syncPastButton();
    syncHours();
    // Al revelar, el recorrido cuenta cuando termina la animación (mientras crecen, entran en pantalla a medias)
    watchSeen(false);
    if (next) window.setTimeout(function () { if (showPast) watchSeen(true); }, reduceMotion.matches ? 0 : DURATION + 150);
  }

  function collapse(node, out) {
    var cs = window.getComputedStyle(node);
    var gap = parseFloat(window.getComputedStyle(board).rowGap) || 0;
    var full = { height: node.offsetHeight + 'px', opacity: cs.opacity, paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom, marginTop: cs.marginTop, marginBottom: '0px' };
    var none = { height: '0px', opacity: '0', paddingTop: '0px', paddingBottom: '0px', marginTop: '0px', marginBottom: (-gap) + 'px' };
    node.style.overflow = 'hidden';
    var anim = node.animate(out ? [full, none] : [none, full], { duration: DURATION, easing: EASE, fill: out ? 'forwards' : 'backwards' });
    var done = function () { node.style.overflow = ''; };
    var end = anim.finished || new Promise(function (r) { anim.onfinish = r; });
    return { anim: anim, finished: end.then(done, done) };
  }

  // Espera a que terminen las animaciones, con un tope por si el navegador las pausa (pestaña en segundo plano)
  function settle(runs) {
    var all = Promise.all(runs.map(function (r) { return r.finished; }));
    var cap = new Promise(function (r) { window.setTimeout(r, DURATION + 250); });
    return Promise.race([all, cap]);
  }

  /* Mantiene quieto lo que la persona está mirando mientras la lista cambia de altura. Se toma como ancla el primer bloque
     a la vista que no entra ni sale, y en cada cuadro se corrige el scroll para que su posición en pantalla no cambie.
     Se apaga el ajuste automático del navegador (overflow-anchor), que se sumaba a este y hacía rebotar, y se corrige con
     behavior "instant" porque la página tiene scroll-behavior: smooth, que haría la corrección lenta y visible. */
  function pickAnchor(skip) {
    var kids = board.querySelectorAll('.cip-program__hour, .cip-program__item');
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i];
      if (k.hidden || (skip && skip.indexOf(k) >= 0)) continue;
      var r = k.getBoundingClientRect();
      if (r.height > 0 && r.bottom > 0 && r.top < window.innerHeight) return k;
    }
    return null;
  }
  function holdView(anchor) {
    if (!anchor) return function () {};
    var top0 = anchor.getBoundingClientRect().top;
    var stopped = false;
    function fix() {
      var d = anchor.getBoundingClientRect().top - top0;
      if (Math.abs(d) > 0.5) window.scrollBy({ top: d, left: 0, behavior: 'instant' });
    }
    board.style.overflowAnchor = 'none';
    (function step() { fix(); if (!stopped) window.requestAnimationFrame(step); })();
    return function release() { stopped = true; fix(); board.style.overflowAnchor = ''; };
  }

  // Cada hora con sus bloques: una hora desaparece cuando ninguno de sus bloques queda a la vista
  function hourGroups() {
    var groups = [], cur = null;
    Array.prototype.forEach.call(board.querySelectorAll('.cip-program__hour, .cip-program__item'), function (k) {
      if (k.classList.contains('cip-program__hour')) { cur = { hour: k, items: [] }; groups.push(cur); }
      else if (cur) cur.items.push(k);
    });
    return groups;
  }

  function togglePast() {
    if (toggling) return;
    var next = !showPast;
    // Cuenta las pulsaciones: a partir de la 4.ª se apaga el globo por 2 horas
    if (!hintSilenced()) {
      hint.n++;
      if (hint.n > HINT_PRESSES) hint.until = Date.now() + HINT_PAUSE;
      saveHint();
    }
    var animate = mq.matches && state === 'live' && !reduceMotion.matches && typeof board.animate === 'function';
    if (!animate) { applyPast(next); return; }
    toggling = true;
    var groups = hourGroups();

    if (!next) {
      // Ocultar: primero se colapsa lo que se va (bloques pasados visibles y horas que quedarán vacías) y al final se aplica el estado
      var leaving = [];
      groups.forEach(function (g) {
        g.items.forEach(function (n) { if (visible(n) && !visible(n, false)) leaving.push(n); });
        var staysAny = g.items.some(function (n) { return visible(n, false); });
        if (!g.hour.hidden && !staysAny) leaving.push(g.hour);
      });
      var release = holdView(pickAnchor(leaving));
      var runs = leaving.map(function (n) { return collapse(n, true); });
      settle(runs).then(function () {
        applyPast(false);
        runs.forEach(function (r) { r.anim.cancel(); });
        leaving.forEach(function (n) { n.style.overflow = ''; });
        release();
        toggling = false;
      });
    } else {
      // Mostrar: se aplica el estado y se expanden los bloques y horas que aparecen
      var hiddenBefore = groups.map(function (g) { return g.hour.hidden; });
      var shownBefore = [];
      groups.forEach(function (g) { g.items.forEach(function (n) { if (visible(n)) shownBefore.push(n); }); });
      var release2 = holdView(pickAnchor());   // el ancla se mide antes de que cambie la lista
      applyPast(true);
      var runs2 = [];
      groups.forEach(function (g, i) {
        if (hiddenBefore[i] && !g.hour.hidden) runs2.push(collapse(g.hour, false));
        g.items.forEach(function (n) { if (visible(n) && shownBefore.indexOf(n) < 0) runs2.push(collapse(n, false)); });
      });
      settle(runs2).then(function () { release2(); toggling = false; });
    }
  }
  if (pastBtn) pastBtn.addEventListener('click', togglePast);

  if (mq.addEventListener) mq.addEventListener('change', function () { syncPastButton(); syncHours(); });
  setFilter('all');
  update();
  window.setInterval(update, 15000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) update(); });
})();
