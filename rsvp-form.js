// Registro propio de CiiSA Beyond.
// Envía las respuestas (mismas preguntas que el Microsoft Forms) a un flujo de Power Automate,
// que las agrega como fila al Excel del sitio MARKETEAM, y muestra el modal de agradecimiento.
//
// CONFIGURACIÓN: pega en ENDPOINT la "URL HTTP POST" del disparador
// "Cuando se recibe una solicitud HTTP" del flujo. Mientras esté vacío, el botón abre el
// Microsoft Forms original en otra pestaña (data-fallback), así el registro nunca se pierde.
(function () {
  // Flujo G (Excel "Invitaciones Beyond 2026"): recibe la misma copia del registro con "invito".
  // Vacío = no se envía. Si falla, no afecta el registro ni el correo, que siguen en el Flujo B.
  var ENDPOINT_INVITO = 'https://default4699fbe477a74846ad709ce4e38413.35.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/28/workflows/5df6ddabea0d474fb4bc0678dc671bfa/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=FSiHczELRu6jFnK6u5Phz1-WJQaur_8wVeqNJ0mTlmk';

  var ENDPOINT = 'https://default4699fbe477a74846ad709ce4e38413.35.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/13/workflows/c273ece400074563b98a09cce05979ed/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=jBbBlFeq3DQ3Solhc3MT-9YvP5SM60Tie6oRyMpTJtQ';

  /* === Filtro de empresa y puesto (19 oct) ===
     Frena lo que no aporta nada al negocio ("N/A", "nada", "ama de casa", solo números, teclazos como "asdf"), sin
     bloquear nombres reales: las siglas (3M, HP, BMW, TI, CEO) y las palabras de oficio ("Pruebas", "Test Engineer") pasan.
     Es un filtro estático del lado de la página; no cambia los campos ni lo que se envía. Quien manda el registro sin
     pasar por la página no lo ve. La lista se ajusta aquí: BASURA (frases completas) y BASURA_EN (frases que la contienen). */
  function normaliza(v) {
    var s = String(v || '').toLowerCase();
    if (s.normalize) s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return s.replace(/[^a-z0-9]+/g, ' ').replace(/^\s+|\s+$/g, '');
  }
  // Frases que, escritas solas, no son una empresa ni un puesto
  var BASURA = ['na', 'n a', 'nn', 'no', 'si', 'ok', 'x', 'xx', 'xxx', 'xxxx', 'xyz', 'abc', 'abcd', 'aaa', 'asdf', 'asdfg', 'qwer', 'qwerty', 'zxcv',
    'nada', 'nadie', 'ninguno', 'ninguna', 'ninguno de los anteriores', 'no aplica', 'no tengo', 'no se', 'no trabajo', 'sin dato', 'sin datos',
    'sin empresa', 'sin puesto', 'sin empleo', 'sin trabajo', 'desempleado', 'desempleada', 'dato', 'varios', 'otro', 'otros', 'algo', 'cualquiera',
    'test', 'testing', 'prueba', 'pruebas', 'hola', 'hello', 'lol', 'jaja', 'jeje', 'jiji', 'casa', 'mi casa', 'en casa', 'hogar', 'yo', 'yo mismo', 'yo misma'];
  // Frases que, aunque vengan acompañadas, delatan que no es un dato real
  var BASURA_EN = [/\bamas? de casa\b/, /\blabores del hogar\b/, /\bno aplica\b/, /\bsin empleo\b/, /\bno tengo (empresa|trabajo|puesto)\b/, /\bno trabajo\b/];
  // Groserías: se comparan palabra por palabra (por eso "Vergara", "Cabrera" o "Culiacán" pasan), con cifras de reemplazo
  // (p0to, put4) y con letras repetidas colapsadas (puuuto). Se dejó fuera lo que también es palabra o siglas legítimas
  // ("pinche" de cocina, CTM, HDP, mamón). Se ajusta aquí.
  var GROSERIAS = ('puta puto putas putos putita putito putada puton verga vergas vergon vergudo pendejo pendeja pendejos pendejas pendejada ' +
    'cabron cabrona cabrones chinga chingar chingada chingado chingas chingue chingues chingon chingona chingatumadre mierda mierdas culero culera ' +
    'culo culos joder jodido jodida carajo imbecil idiota idiotas estupido estupida mamada mamadas hijueputa hijoputa malparido gonorrea ' +
    'fuck fucking shit bitch asshole pussy bastard dumbass').split(' ');
  function colapsa(s) { return s.replace(/(.)\1+/g, '$1'); }
  function tieneGroseria(n) {
    var base = n.replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's');
    var variantes = [n, base.replace(/0/g, 'o'), base.replace(/0/g, 'u')];   // el 0 puede ser "o" o "u" (p0to)
    var v, tokens, i, k;
    for (v = 0; v < variantes.length; v++) {
      tokens = variantes[v].split(' ');
      for (i = 0; i < tokens.length; i++) {
        for (k = 0; k < GROSERIAS.length; k++) {
          if (tokens[i] === GROSERIAS[k] || colapsa(tokens[i]) === colapsa(GROSERIAS[k])) return true;
        }
      }
    }
    return false;
  }
  var TECLADO = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', 'poiuytrewq', 'lkjhgfdsa', 'mnbvcxz'];

  // Devuelve true si el texto parece basura. Las siglas y los nombres cortos reales no se tocan
  function esBasura(v) {
    var n = normaliza(v), i, solo = n.replace(/ /g, ''), letras = (n.match(/[a-z]/g) || []).length;
    if (!n || letras < 1) return true;                                // solo números o símbolos
    if (BASURA.indexOf(n) >= 0) return true;
    if (tieneGroseria(n)) return true;
    for (i = 0; i < BASURA_EN.length; i++) { if (BASURA_EN[i].test(n)) return true; }
    if (/(.)\1{3,}/.test(solo)) return true;                          // "aaaa", "jjjjj", "0000"
    if (/^(..?)\1{2,}$/.test(solo)) return true;                      // "jajaja", "lalala", "xdxdxd"
    if (letras >= 5 && !/[aeiouy]/.test(n)) return true;            // "kjhgf" (sin vocales; las siglas de 3 o 4 letras sí pasan)
    for (i = 0; i < TECLADO.length; i++) {                            // "qwerty", "asdfgh": 5 teclas seguidas de una fila
      for (var j = 0; j + 5 <= TECLADO[i].length; j++) { if (solo.indexOf(TECLADO[i].substr(j, 5)) >= 0) return true; }
    }
    return false;
  }
  /* === Fin del filtro === */

  // Reglas por campo: devuelven '' si es válido o el mensaje de error.
  /* === Registro repetido en el mismo dispositivo (19 oct) ===
     Al registrarse con éxito se guarda una marca del correo (un hash corto, no el correo) en localStorage. Si vuelven a
     escribir ese correo en este navegador, el campo avisa y el botón se queda apagado: evita dobles envíos y que alguien
     se registre otra vez sin saber que ya lo hizo. Solo ve este dispositivo: otro celular u otra computadora no lo detectan.
     En un equipo compartido (una tableta del registro) la marca es por correo, así que no frena a otra persona.
     Para probar sin que estorbe: agrega ?registro=libre a la dirección. */
  var KEY_REG = 'beyond:registrados';
  var REG_LIBRE = /[?&]registro=libre(&|$)/.test(window.location.search);
  function marcaCorreo(c) {
    var h = 2166136261, s = String(c || '').trim().toLowerCase();
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h.toString(36);
  }
  function leeRegistrados() {
    try { var a = JSON.parse(window.localStorage.getItem(KEY_REG) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function yaRegistrado(correo) { return !REG_LIBRE && leeRegistrados().indexOf(marcaCorreo(correo)) !== -1; }
  function guardaRegistrado(correo) {
    try {
      var a = leeRegistrados(), m = marcaCorreo(correo);
      if (a.indexOf(m) === -1) a.push(m);
      window.localStorage.setItem(KEY_REG, JSON.stringify(a.slice(-30)));
    } catch (e) {}
  }

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
      if (esBasura(v)) return 'Escribe el nombre real de tu empresa. Si trabajas por tu cuenta, escribe "Independiente".';
      return '';
    },
    puesto: function (v) {
      if (!v) return 'Escribe tu puesto.';
      if (v.length < 2) return 'El puesto es muy corto.';
      if (esBasura(v)) return 'Escribe tu puesto de trabajo real, por ejemplo "Gerente de Ventas".';
      return '';
    },
    correo: function (v) {
      if (!v) return 'Escribe tu correo.';
      if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v)) return 'Revisa el formato: nombre@empresa.com';
      if (yaRegistrado(v)) return 'Este correo ya quedó registrado desde este dispositivo. Revisa tu bandeja (y la carpeta de spam) para ver tu confirmación. Si necesitas corregir tus datos, avísanos por WhatsApp.';
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
    invito: function (v) {
      if (!v) return 'Dinos quién te invitó o cómo te enteraste.';
      var lista = window.CIISA_INVITO;
      if (lista && lista.match && !lista.match(v)) return 'Elige un nombre de la lista.';
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
        invito: (window.CIISA_INVITO && window.CIISA_INVITO.match(form.invito.value)) || form.invito.value.trim(),
        privacidad: 'Aceptado',
        // Casilla opcional de marketing: siempre viaja, "Sí" solo si la marcó
        marketing: form.marketing && form.marketing.checked ? 'Sí' : 'No',
        fecha: new Date().toISOString(),
        origen: 'landing-beyond'
      };

      // Campaña de origen (UTM) capturada por tracking.js; campos vacíos si no hubo campaña
      var utm = (window.BeyondTracking && window.BeyondTracking.getUtm()) || {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
        data[k] = utm[k] || '';
      });
      // Fuente calculada (Google Ads, LinkedIn, Directo…) y dominio de procedencia, para la columna "Fuente"
      data.fuente = (window.BeyondTracking && window.BeyondTracking.getFuente()) || 'Directo';
      data.procedencia = (window.BeyondTracking && window.BeyondTracking.getReferrer()) || '';

      if (ENDPOINT_INVITO) {
        fetch(ENDPOINT_INVITO, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          keepalive: true
        }).catch(function () {});
      }

      setBusy(true);
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          guardaRegistrado(data.correo);
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
