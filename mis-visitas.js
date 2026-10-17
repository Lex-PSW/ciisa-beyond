// "Mis visitas" en mi-experiencia.html: el día del evento muestra qué marcas ya visitó el invitado
// y cuáles de su ruta le faltan. Lee la API de asistencia (beyond.pyxoomsaas.com); no toca la encuesta,
// ni el flujo I, ni rsvp-form.js. Sin ?id=, sin visitas o si la API no responde, la sección no aparece.
(function () {
  'use strict';

  var API = 'https://beyond.pyxoomsaas.com/api/publico/visitas/';
  var ESPERA_MS = 4000;
  var REFRESCO_MS = 180000;  // cada 3 min y solo con la pestaña visible (la red del lugar comparte IP)
  var ID_RE = /^BYD-\d{12}-[0-9a-z]{4}$/i;

  var caja = document.getElementById('mis-visitas');
  var id = (new URLSearchParams(window.location.search).get('id') || '').trim();
  if (!caja || !ID_RE.test(id) || !window.fetch) return;

  var catalogo = {};
  (window.CIISA_CATALOGO || []).forEach(function (b) { catalogo[b.slug] = b; });

  function logo(slug, nombre) {
    var b = catalogo[slug];
    if (b) {
      var img = document.createElement('img');
      img.src = 'assets/img/logos/' + b.file;
      img.alt = b.name;
      img.loading = 'lazy';
      return img;
    }
    var span = document.createElement('span');
    span.className = 'mv__texto';
    span.textContent = nombre || slug;
    return span;
  }

  function lista(titulo, elementos, clase) {
    var bloque = document.createElement('div');
    bloque.className = 'mv__bloque ' + clase;
    var h = document.createElement('h3');
    h.className = 'mv__subtitulo';
    h.textContent = titulo;
    var ul = document.createElement('ul');
    ul.className = 'mv__logos';
    elementos.forEach(function (el) {
      var li = document.createElement('li');
      li.appendChild(el);
      ul.appendChild(li);
    });
    bloque.appendChild(h);
    bloque.appendChild(ul);
    return bloque;
  }

  function pintar(d) {
    if (!d.visitadas.length) { caja.hidden = true; return; }
    while (caja.firstChild) caja.removeChild(caja.firstChild);
    var titulo = document.createElement('h2');
    titulo.className = 'mx__title mv__titulo';
    titulo.textContent = 'Tu recorrido de hoy';
    var lead = document.createElement('p');
    lead.className = 'mx__lead';
    lead.textContent = d.visitadas.length === 1
      ? 'Ya visitaste 1 marca.'
      : 'Ya visitaste ' + d.visitadas.length + ' marcas.';
    caja.appendChild(titulo);
    caja.appendChild(lead);
    caja.appendChild(lista('Ya visitaste', d.visitadas.map(function (m) {
      return logo(m.catalogo_slugs[0], m.nombre);
    }), 'mv__bloque--hechas'));
    if (d.pendientes_ruta.length) {
      caja.appendChild(lista('Te faltan de tu ruta', d.pendientes_ruta.map(function (s) { return logo(s); }), 'mv__bloque--faltan'));
    }
    caja.hidden = false;
  }

  function cargar() {
    var control = window.AbortController ? new AbortController() : null;
    var reloj = setTimeout(function () { if (control) control.abort(); }, ESPERA_MS);
    fetch(API + encodeURIComponent(id), { signal: control ? control.signal : undefined, cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(pintar)
      .catch(function () { /* sin datos: la sección se queda como estaba */ })
      .then(function () { clearTimeout(reloj); });
  }

  cargar();
  setInterval(function () { if (!document.hidden) cargar(); }, REFRESCO_MS);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) cargar(); });
})();
