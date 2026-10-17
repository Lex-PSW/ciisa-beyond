// Laboratorio práctico DevKit AI: selector de horario (4 horarios de 10 lugares, por orden de llegada).
// Diseño: docs/superpowers/specs/2026-10-16-laboratorio-devkit-design.md · contrato con el flujo M en docs/ARQUITECTURA.md.
// - Recién registrado: tras el 200 del flujo B (evento beyond:lead) el modal de gracias ofrece el selector y envía el correo.
// - Ya registrado: la liga del correo M1 trae ?id=BYD-…; la landing abre el selector en su propio modal y envía el ID.
// - No toca rsvp-form.js: el correo se toma del formulario al enviarlo, con un escucha propio.
// Los horarios salen de agenda-data.js (espacio 'labs', "Laboratorio IA - TI") y se cierran a su hora de inicio (beyond-clock.js).
(function () {
  // CONFIGURACIÓN: pega en ENDPOINT_LAB la "URL HTTP POST" del flujo M. Vacío = apagado (el modal de gracias se ve como
  // siempre y la liga no abre nada). Para revisarlo sin flujo: ?lab=preview en la dirección (simula, no envía nada).
  var ENDPOINT_LAB = 'https://default4699fbe477a74846ad709ce4e38413.35.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/29/workflows/5bc2242f8f5f468c8381a4f2cee4574a/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=wTGEg4QszELL2S8PZE93HBwEcbn6d1SGmbe2ezV1LAY';

  var EVENTO = '2026-10-21';
  var TITULO = 'Laboratorio IA - TI';
  var ID_RE = /^BYD-\d{12}-[0-9a-f]{4}$/i;

  var minutos = function (hhmm) {
    var p = hhmm.split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  };

  var lab = {
    ENDPOINT: ENDPOINT_LAB,

    modo: function () {
      if (/[?&]lab=preview(&|$)/.test(window.location.search)) return 'preview';
      return ENDPOINT_LAB ? 'activo' : 'apagado';
    },

    horarios: function () {
      var sesiones = (window.CIISA_AGENDA && window.CIISA_AGENDA.sesiones) || [];
      return sesiones
        .filter(function (ev) { return ev.e === 'labs' && ev.titulo === TITULO; })
        .map(function (ev) { return { ini: ev.ini, fin: ev.fin }; })
        .sort(function (a, b) { return minutos(a.ini) - minutos(b.ini); });
    },

    // Un horario se cierra al llegar su hora de inicio el día del evento (y todos, pasado el evento)
    cerrado: function (ini, mx) {
      if (mx.date > EVENTO) return true;
      return mx.date === EVENTO && mx.min >= minutos(ini);
    },

    abiertos: function (mx) {
      return lab.horarios().filter(function (h) { return !lab.cerrado(h.ini, mx); });
    },

    idDeUrl: function (search) {
      var id = (new URLSearchParams(search || '').get('id') || '').trim();
      return ID_RE.test(id) ? id : '';
    }
  };

  var LUGAR = 'Salón Terraza';
  var ESPERA_ESTADO = 8000;

  var track = function (data) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(data);
  };

  // POST JSON al flujo M; resuelve { status, body } (body = {} si la respuesta no es JSON)
  var enviar = function (payload) {
    return fetch(ENDPOINT_LAB, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        return { status: res.status, body: body };
      });
    });
  };

  // Estado de los horarios: { '10:40': 'disponible' | 'lleno', … }. Si falla o tarda, todos disponibles y apartar decide.
  var consultarEstado = function () {
    if (lab.modo() !== 'activo') return Promise.resolve({});
    var consulta = enviar({ accion: 'estado', origen: 'laboratorio-devkit' })
      .then(function (r) { return (r.status === 200 && r.body && r.body.horarios) || {}; })
      .catch(function () { return {}; });
    var limite = new Promise(function (resolve) { setTimeout(function () { resolve({}); }, ESPERA_ESTADO); });
    return Promise.race([consulta, limite]);
  };

  var apartar = function (identidad, horario) {
    if (lab.modo() === 'preview') {
      return new Promise(function (resolve) {
        setTimeout(function () { resolve({ status: 200, body: { resultado: 'apartado', horario: horario } }); }, 600);
      });
    }
    var utm = (window.BeyondTracking && window.BeyondTracking.getUtm()) || {};
    var payload = {
      accion: 'apartar',
      origen: 'laboratorio-devkit',
      // Misma forma que guardan los flujos: correo en minúsculas (rsvp-form.js) e ID como BYD-yyMMddHHmmss-xxxx,
      // con el sufijo hexadecimal en minúsculas (el flujo M lo busca en Excel, que distingue mayúsculas)
      id: identidad.id ? 'BYD-' + identidad.id.trim().slice(4).toLowerCase() : '',
      correo: identidad.id ? '' : (identidad.correo || '').trim().toLowerCase(),
      horario: horario,
      fecha: new Date().toISOString()
    };
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) { payload[k] = utm[k] || ''; });
    return enviar(payload);
  };

  // Selector de horario: radios nativos en un fieldset. Se usa en el modal de gracias y en el de la liga.
  lab.montar = function (contenedor, identidad, via) {
    var mx = window.BeyondClock ? window.BeyondClock.mx() : { date: '', min: 0 };
    var form = document.createElement('form');
    form.className = 'cip-lab';
    form.setAttribute('data-lab-form', '');
    form.noValidate = true;

    var fieldset = document.createElement('fieldset');
    fieldset.className = 'cip-lab__fieldset';
    var legend = document.createElement('legend');
    legend.className = 'cip-lab__legend';
    legend.textContent = 'Laboratorio DevKit AI · ' + LUGAR;
    fieldset.appendChild(legend);

    var grid = document.createElement('div');
    grid.className = 'cip-lab__grid';
    var slots = lab.horarios().map(function (h) {
      var label = document.createElement('label');
      label.className = 'cip-lab__slot';
      var input = document.createElement('input');
      input.type = 'radio';
      input.name = 'horario';
      input.value = h.ini;
      var hora = document.createElement('span');
      hora.className = 'cip-lab__time';
      hora.textContent = h.ini + ' – ' + h.fin;
      var estado = document.createElement('span');
      estado.className = 'cip-lab__state';
      label.appendChild(input);
      label.appendChild(hora);
      label.appendChild(estado);
      grid.appendChild(label);
      return { h: h, input: input, label: label, estado: estado, cerrado: lab.cerrado(h.ini, mx) };
    });
    fieldset.appendChild(grid);
    form.appendChild(fieldset);

    var status = document.createElement('p');
    status.className = 'cip-lab__status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    form.appendChild(status);

    var acciones = document.createElement('div');
    acciones.className = 'cip-lab__actions';
    var btn = document.createElement('button');
    btn.type = 'submit';
    btn.className = 'cip-btn cip-btn--primary cip-lab__submit';
    btn.textContent = 'Apartar mi lugar';
    acciones.appendChild(btn);
    form.appendChild(acciones);

    contenedor.appendChild(form);

    var pintar = function (s, valor) {
      var off = s.cerrado || valor === 'lleno';
      s.input.disabled = off;
      if (off) s.input.checked = false;
      s.label.classList.toggle('is-off', off);
      s.estado.textContent = s.cerrado ? 'Cerrado' : (valor === 'lleno' ? 'Lleno' : (valor === 'cargando' ? '' : 'Disponible'));
    };
    var setStatus = function (msg, error) {
      status.textContent = '';
      status.classList.toggle('is-error', !!error);
      if (typeof msg === 'string') status.textContent = msg;
      else if (msg) status.appendChild(msg);
    };

    // Pinta el estado; si ya no queda ningún horario elegible, quita el botón y lo dice
    var refrescar = function (aviso, error) {
      return consultarEstado().then(function (estado) {
        slots.forEach(function (s) { pintar(s, estado[s.h.ini]); });
        var quedan = slots.some(function (s) { return !s.input.disabled; });
        btn.hidden = !quedan;
        btn.disabled = !quedan;
        if (!quedan) setStatus('Los cuatro horarios ya están llenos.', true);
        else setStatus(aviso || '', error);
      });
    };

    slots.forEach(function (s) { pintar(s, 'cargando'); });
    if (lab.modo() === 'activo') setStatus('Consultando horarios…');
    btn.disabled = true;
    refrescar();

    track({ event: 'devkit_lab_selector', via: via });

    var enviando = false;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (enviando) return;
      var elegido = form.querySelector('input[name="horario"]:checked');
      if (!elegido) { setStatus('Elige un horario.', true); return; }
      var horario = elegido.value;
      enviando = true;
      btn.disabled = true;
      setStatus('Apartando tu lugar…');
      apartar(identidad, horario)
        .then(function (r) {
          var resultado = r.body && r.body.resultado;
          if (r.status === 200 && resultado === 'apartado') {
            var ok = document.createElement('p');
            ok.className = 'cip-lab__done';
            ok.setAttribute('role', 'status');
            ok.tabIndex = -1;
            ok.textContent = '¡Listo! Tu lugar es a las ' + horario + ' en el ' + LUGAR + '. Presenta tu QR en el stand del laboratorio.';
            form.replaceWith(ok);
            ok.focus();
            // La vista previa no cuenta como conversión en GTM
            if (lab.modo() !== 'preview') track({ event: 'devkit_lab_apartado', horario: horario });
            return;
          }
          if (r.status === 409) {
            slots.forEach(function (s) { if (s.h.ini === horario) pintar(s, 'lleno'); });
            setStatus('Ese horario se acaba de llenar. Elige otro.', true);
            enviando = false;
            refrescar('Ese horario se acaba de llenar. Elige otro.', true);
            return;
          } else if (r.status === 404 && via === 'modal') {
            // B evita duplicados por correo: quien ya estaba registrado y se vuelve a registrar recibe 200 de B,
            // pero M solo acepta el correo de registros recientes. Su camino es la liga del correo.
            setStatus('Ya tenías un registro anterior: usa la liga de tu correo para elegir tu horario.', true);
          } else if (r.status === 404) {
            var p = document.createDocumentFragment();
            p.appendChild(document.createTextNode('No encontramos tu registro. '));
            var a = document.createElement('a');
            a.href = '#registro';
            a.textContent = 'Regístrate primero';
            a.addEventListener('click', function () {
              var dlg = contenedor.closest('dialog');
              if (dlg && dlg.open) dlg.close();
            });
            p.appendChild(a);
            p.appendChild(document.createTextNode('.'));
            setStatus(p, true);
          } else {
            setStatus('No pudimos apartar tu lugar. Inténtalo de nuevo.', true);
          }
          enviando = false;
          btn.disabled = false;
        })
        .catch(function () {
          setStatus('No pudimos apartar tu lugar. Inténtalo de nuevo.', true);
          enviando = false;
          btn.disabled = false;
        });
    });
  };

  window.BEYOND_LAB = lab;

  // Recién registrado: el correo se guarda al enviar el formulario (rsvp-form.js lo limpia tras el éxito) y,
  // cuando el flujo B confirma (beyond:lead), el modal de gracias ofrece el selector.
  var montarEnGracias = function () {
    var form = document.querySelector('[data-rsvp-form]');
    var dialog = document.querySelector('[data-rsvp-thanks]');
    var caja = dialog && dialog.querySelector('[data-lab-thanks]');
    if (!form || !caja) return;
    var correo = '';

    form.addEventListener('submit', function () {
      correo = form.correo ? form.correo.value.trim() : '';
    }, true);

    var limpiar = function () {
      caja.hidden = true;
      while (caja.firstChild) caja.removeChild(caja.firstChild);
    };

    document.addEventListener('beyond:lead', function () {
      var mx = window.BeyondClock ? window.BeyondClock.mx() : { date: '', min: 0 };
      var listo = correo && lab.modo() !== 'apagado' && lab.abiertos(mx).length > 0;
      var identidad = { correo: correo };
      correo = '';
      if (!listo) return;
      limpiar();
      var titulo = document.createElement('h3');
      titulo.className = 'cip-thanks__lab-title';
      titulo.textContent = '¿Apartas tu lugar en el laboratorio DevKit AI?';
      caja.appendChild(titulo);
      lab.montar(caja, identidad, 'modal');
      var acciones = caja.querySelector('.cip-lab__actions');
      if (acciones) {
        var skip = document.createElement('button');
        skip.type = 'button';
        skip.className = 'cip-lab__skip';
        skip.setAttribute('data-lab-skip', '');
        skip.textContent = 'Ahora no';
        skip.addEventListener('click', limpiar);
        acciones.appendChild(skip);
      }
      caja.hidden = false;
    });

    dialog.addEventListener('close', limpiar);
  };

  // Ya registrado: la liga del correo M1 trae ?id=BYD-…; se abre el selector en su propio modal, sin formulario
  var abrirDesdeLiga = function () {
    var id = lab.idDeUrl(window.location.search);
    var dialog = document.querySelector('[data-lab-dialog]');
    var caja = dialog && dialog.querySelector('[data-lab-liga]');
    if (!id || !caja || typeof dialog.showModal !== 'function') return;
    var mx = window.BeyondClock ? window.BeyondClock.mx() : { date: '', min: 0 };
    if (lab.modo() === 'apagado' || !lab.abiertos(mx).length) return;
    lab.montar(caja, { id: id }, 'liga');
    var close = dialog.querySelector('[data-lab-close]');
    if (close) close.addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
    dialog.showModal();
  };

  // Pasos 01-02-03 de la sección: aparición escalonada, igual que los beneficios. Sin JS o con movimiento reducido se ven de inmediato.
  var revelarPasos = function () {
    var list = document.querySelector('[data-devkit-steps]');
    if (!list || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var steps = [].slice.call(list.children);
    list.classList.add('is-reveal-ready');
    var io = new IntersectionObserver(function (entries) {
      if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
      steps.forEach(function (step, i) {
        setTimeout(function () { step.classList.add('is-visible'); }, i * 160);
      });
      io.disconnect();
    }, { threshold: 0.3 });
    io.observe(list);
  };

  document.addEventListener('DOMContentLoaded', function () {
    revelarPasos();
    montarEnGracias();
    abrirDesdeLiga();
  });
})();
