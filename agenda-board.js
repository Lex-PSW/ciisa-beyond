// Agenda por hora: dibuja el tablero de la sección #programa a partir de window.CIISA_AGENDA (agenda-data.js).
// Escritorio (≥1025 px): una columna por espacio y una fila por cada 5 minutos, así cada bloque mide lo que dura.
// Tablet y celular: lista cronológica agrupada por hora, con filtros por espacio. Es la misma estructura en
// ambos casos; el CSS decide cómo se ve.
//
// En vivo (el día del evento, con la hora de beyond-clock.js): una línea de "ahora" baja por el tablero en escritorio;
// los eventos terminados se ponen en gris; el que está en curso se resalta y, en lista, muestra una barra de avance
// dentro de su tarjeta. En tablet y celular los eventos terminados se ocultan y el botón [data-nav-past] de la
// pastilla de navegación (index.html) los muestra u oculta.
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
      // Espacio y lugar, en palabras (solo se ve en lista): "Casos de éxito · Escenario principal"
      var esc = data.escenarios[stageIndex[s.e]];
      var stage = el('span', 'cip-program__stage', esc.nombre);
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
  var mq = window.matchMedia('(max-width: 1024px)');
  var filter = 'all';
  var state = 'before';                          // before | live | after
  var showPast = false;
  var pastTotal = 0;

  function hiddenByTime(node) { return mq.matches && state === 'live' && !showPast && node.classList.contains('is-past'); }
  function visible(node) {
    var stage = node.getAttribute('data-stage');
    return (filter === 'all' || stage === filter || stage === 'todos') && !hiddenByTime(node);
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
    var changed = pastBtn.hidden === on;
    pastBtn.hidden = !on;
    pastBtn.setAttribute('aria-pressed', showPast ? 'true' : 'false');
    var label = showPast ? 'Ocultar eventos pasados' : 'Mostrar eventos pasados';
    pastBtn.setAttribute('aria-label', label);
    pastBtn.setAttribute('title', label);
    if (pastCount) pastCount.textContent = pastTotal;
    // La pastilla de navegación reparte su ancho distinto con o sin el botón
    if (changed) window.dispatchEvent(new Event('beyond:nav-layout'));
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
  if (pastBtn) pastBtn.addEventListener('click', function () {
    showPast = !showPast;
    board.classList.toggle('show-past', showPast);
    syncPastButton();
    syncHours();
  });

  if (mq.addEventListener) mq.addEventListener('change', function () { syncPastButton(); syncHours(); });
  setFilter('all');
  update();
  window.setInterval(update, 15000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) update(); });
})();
