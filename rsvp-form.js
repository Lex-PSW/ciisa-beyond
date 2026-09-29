// Registro propio de CiiSA Beyond.
// Envía las respuestas (mismas preguntas que el Microsoft Forms) a un flujo de Power Automate,
// que las agrega como fila al Excel del sitio MARKETEAM, y muestra el modal de agradecimiento.
//
// CONFIGURACIÓN: pega en ENDPOINT la "URL HTTP POST" del disparador
// "Cuando se recibe una solicitud HTTP" del flujo. Mientras esté vacío, el botón abre el
// Microsoft Forms original en otra pestaña (data-fallback), así el registro nunca se pierde.
(function () {
  var ENDPOINT = 'https://default4699fbe477a74846ad709ce4e38413.35.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/13/workflows/c273ece400074563b98a09cce05979ed/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=jBbBlFeq3DQ3Solhc3MT-9YvP5SM60Tie6oRyMpTJtQ';

  // Reglas por campo: devuelven '' si es válido o el mensaje de error.
  var RULES = {
    nombre: function (v) {
      if (!v) return 'Escribe tu nombre y apellido.';
      if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]+$/.test(v)) return 'Usa solo letras.';
      if (v.split(/\s+/).filter(function (p) { return p.length >= 2; }).length < 2) return 'Incluye nombre y apellido.';
      return '';
    },
    empresa: function (v) {
      if (!v) return 'Escribe el nombre de tu empresa.';
      if (v.length < 2) return 'El nombre es muy corto.';
      return '';
    },
    puesto: function (v) {
      if (!v) return 'Escribe tu puesto.';
      if (v.length < 2) return 'El puesto es muy corto.';
      return '';
    },
    correo: function (v) {
      if (!v) return 'Escribe tu correo.';
      if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v)) return 'Revisa el formato: nombre@empresa.com';
      return '';
    },
    telefono: function (v) {
      if (!v) return 'Escribe tu teléfono.';
      if (!/^[+\d\s().-]+$/.test(v)) return 'Usa solo números.';
      var digits = v.replace(/\D/g, '');
      if (digits.length < 10) return 'Debe tener al menos 10 dígitos.';
      if (digits.length > 13) return 'Tiene demasiados dígitos.';
      return '';
    },
    privacidad: function (v, el) {
      return el.checked ? '' : 'Debes aceptar el Aviso de Privacidad.';
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.querySelector('[data-rsvp-form]');
    if (!form) return;

    var status = form.querySelector('[data-rsvp-status]');
    var button = form.querySelector('button[type="submit"]');
    var label = form.querySelector('[data-rsvp-label]');
    var dialog = document.querySelector('[data-rsvp-thanks]');
    var fallback = form.getAttribute('data-fallback');
    var defaultLabel = label ? label.textContent : '';
    var sending = false;
    var names = Object.keys(RULES);

    // Validación propia: se desactivan los globos nativos del navegador
    form.setAttribute('novalidate', '');

    function check(name, show) {
      var el = form.elements[name];
      var msg = RULES[name](el.type === 'checkbox' ? '' : el.value.trim(), el);
      var err = document.getElementById('rsvp-' + name + '-error');
      if (show) {
        el.setAttribute('aria-invalid', msg ? 'true' : 'false');
        el.closest('.cip-rsvp__field, .cip-rsvp__check-wrap').classList.toggle('is-invalid', !!msg);
        el.closest('.cip-rsvp__field, .cip-rsvp__check-wrap').classList.toggle('is-valid', !msg);
        if (err) err.textContent = msg;
      }
      return !msg;
    }

    // El botón queda desactivado hasta que todos los campos sean válidos
    function refresh() {
      var ok = names.every(function (n) { return check(n, false); });
      button.disabled = !ok || sending;
      button.setAttribute('aria-disabled', button.disabled ? 'true' : 'false');
      return ok;
    }

    names.forEach(function (name) {
      var el = form.elements[name];
      var touched = false;
      // Al salir del campo se muestra el error; mientras escribe, solo se corrige
      el.addEventListener('blur', function () { touched = true; check(name, true); refresh(); });
      el.addEventListener('input', function () { if (touched) check(name, true); refresh(); });
      el.addEventListener('change', function () { touched = true; check(name, true); refresh(); });
    });

    function setStatus(msg, isError) {
      status.textContent = msg || '';
      status.classList.toggle('is-error', !!isError);
    }

    function setBusy(busy) {
      sending = busy;
      form.classList.toggle('is-busy', busy);
      if (label) label.textContent = busy ? 'Enviando…' : defaultLabel;
      refresh();
    }

    function resetForm() {
      form.reset();
      names.forEach(function (n) {
        var el = form.elements[n];
        el.removeAttribute('aria-invalid');
        var wrap = el.closest('.cip-rsvp__field, .cip-rsvp__check-wrap');
        wrap.classList.remove('is-invalid', 'is-valid');
        var err = document.getElementById('rsvp-' + n + '-error');
        if (err) err.textContent = '';
      });
      refresh();
    }

    function showThanks(name) {
      var first = (name || '').trim().split(/\s+/)[0] || '';
      var slot = dialog && dialog.querySelector('[data-rsvp-name]');
      if (slot) slot.textContent = first;
      if (dialog && typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        setStatus('¡Gracias! Tu registro quedó confirmado.');
      }
    }

    if (dialog) {
      var close = dialog.querySelector('[data-rsvp-close]');
      if (close) close.addEventListener('click', function () { dialog.close(); });
      dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      setStatus('');

      // Seguro extra por si alguien fuerza el envío: valida todo y muestra los errores
      var allOk = names.map(function (n) { return check(n, true); }).every(Boolean);
      if (!allOk || sending) {
        var firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Campo trampa lleno = bot: se finge éxito sin enviar nada
      if (form.website && form.website.value) {
        resetForm();
        showThanks('');
        return;
      }

      if (!ENDPOINT) {
        if (fallback) window.open(fallback, '_blank', 'noopener');
        return;
      }

      var data = {
        nombre: form.nombre.value.trim(),
        empresa: form.empresa.value.trim(),
        puesto: form.puesto.value.trim(),
        correo: form.correo.value.trim().toLowerCase(),
        telefono: form.telefono.value.trim(),
        privacidad: 'Aceptado',
        fecha: new Date().toISOString(),
        origen: 'landing-beyond'
      };

      // Campaña de origen (UTM) capturada por tracking.js; campos vacíos si no hubo campaña
      var utm = (window.BeyondTracking && window.BeyondTracking.getUtm()) || {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
        data[k] = utm[k] || '';
      });

      setBusy(true);
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          resetForm();
          showThanks(data.nombre);
          // Aviso para los píxeles de campañas (tracking.js); no lleva datos personales
          document.dispatchEvent(new CustomEvent('beyond:lead'));
        })
        .catch(function () {
          setStatus('No pudimos enviar tu registro. Inténtalo de nuevo o usa el ', true);
          if (fallback) {
            var a = document.createElement('a');
            a.href = fallback;
            a.target = '_blank';
            a.rel = 'noopener';
            a.textContent = 'formulario alterno';
            status.appendChild(a);
            status.appendChild(document.createTextNode('.'));
          }
        })
        .then(function () { setBusy(false); });
    });

    refresh();
  });
})();
