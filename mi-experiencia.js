// "Diseña tu experiencia": encuesta de 5 pasos que arma la ruta de marcas del visitante.
// Calcula la ruta en el navegador (catalogo-data.js) y manda las respuestas + la ruta al Flujo I
// de Power Automate, que guarda el perfil en el Excel y envía el correo "Tu ruta Beyond" con ligas.
//
// Identidad: los correos traen ?id=BYD-… (el ID del Excel maestro). Sin ID se pide el correo. El flujo
// nunca manda correo a una dirección escrita aquí: resuelve el correo en el Excel con el ID o el correo
// y responde 404 si no hay registro.
//
// CONFIGURACIÓN: pega en ENDPOINT_PERFIL la "URL HTTP POST" del Flujo I. Vacío = modo vista previa
// (muestra la ruta, no guarda ni manda correo).
(function () {
  var ENDPOINT_PERFIL = 'https://default4699fbe477a74846ad709ce4e38413.35.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/09/workflows/e931412f28b9436b90da4fe25a495131/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=3_M20VLy4FrFAPTISEmKSP3caDgVu54v2pm_FRvG1UE';
  var CONTACTO = 'hola@ciisa.com';

  // Vocabulario cerrado: mismos valores que el Excel (CatalogoMarcas) y catalogo-data.js
  var OPCIONES = {
    industria: [
      ['manufactura', 'Manufactura'], ['retail', 'Retail y comercio'], ['salud', 'Salud'],
      ['educacion', 'Educación'], ['gobierno', 'Gobierno'], ['financiero', 'Financiero'],
      ['construccion', 'Construcción'], ['servicios', 'Servicios'], ['otra', 'Otra']
    ],
    tecnologias: [
      ['infraestructura', 'Infraestructura y nube'], ['ciberseguridad', 'Ciberseguridad'], ['redes', 'Redes'],
      ['computo', 'Equipos de cómputo'], ['impresion', 'Impresión'], ['colaboracion', 'Colaboración y videoconferencia'],
      ['ia-datos', 'Inteligencia artificial y datos'], ['diseno', 'Diseño e ingeniería'],
      ['identificacion', 'Identificación y automatización'], ['talento', 'Gestión de talento']
    ],
    soluciones: [
      ['proteger', 'Proteger mi información'], ['modernizar', 'Modernizar mi infraestructura'],
      ['productividad', 'Ser más productivo'], ['talento', 'Atraer y desarrollar talento'],
      ['conectar', 'Conectar a mi gente y mis sitios'], ['automatizar', 'Automatizar operaciones']
    ],
    objetivos: [
      ['demo', 'Ver demos en vivo'], ['cotizar', 'Pedir una cotización'], ['casos', 'Conocer casos de éxito'],
      ['descuentos', 'Aprovechar descuentos'], ['networking', 'Hacer networking']
    ]
  };
  var ORDEN = ['industria', 'tecnologias', 'soluciones', 'marcas', 'objetivos'];
  var RUTA_MIN = 3;
  var RUTA_MAX = 6;

  var ID_RE = /^BYD-\d{12}-[0-9a-f]{4}$/i;
  var CORREO_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

  function labelOf(group, value) {
    var list = OPCIONES[group] || [];
    for (var i = 0; i < list.length; i++) if (list[i][0] === value) return list[i][1];
    return value;
  }

  /* ---------- Cálculo de la ruta ---------- */
  function overlap(a, b) {
    return a.filter(function (x) { return b.indexOf(x) > -1; });
  }

  function computeRoute(answers, catalogo) {
    var scored = catalogo.map(function (b, i) {
      var techs = overlap(answers.tecnologias, b.tecnologias);
      var sols = overlap(answers.soluciones, b.soluciones);
      var chosen = answers.marcas.indexOf(b.slug) > -1;
      var industria = b.industrias.indexOf(answers.industria) > -1;
      var score = techs.length * 2 + sols.length * 2 + (industria ? 2 : 0) + (chosen ? 5 : 0);
      var reasons = [];
      if (chosen) reasons.push('La elegiste');
      techs.forEach(function (t) { reasons.push(labelOf('tecnologias', t)); });
      sols.forEach(function (s) { reasons.push(labelOf('soluciones', s)); });
      if (industria) reasons.push(labelOf('industria', answers.industria));
      return { brand: b, score: score, reasons: reasons, order: i };
    });
    scored.sort(function (x, y) { return y.score - x.score || x.order - y.order; });
    var route = scored.filter(function (s) { return s.score > 0; }).slice(0, RUTA_MAX);
    // Si las respuestas coinciden con muy pocas marcas, se completa con las siguientes del catálogo
    for (var i = 0; route.length < RUTA_MIN && i < scored.length; i++) {
      if (route.indexOf(scored[i]) === -1) route.push(scored[i]);
    }
    return route;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.querySelector('[data-mx]');
    var form = root && root.querySelector('[data-mx-form]');
    var catalogo = window.CIISA_CATALOGO || [];
    if (!form || !catalogo.length) return;

    var steps = ORDEN.map(function (n) { return form.querySelector('[data-mx-step="' + n + '"]'); });
    var bar = form.querySelector('[data-mx-bar]');
    var count = form.querySelector('[data-mx-count]');
    var btnBack = form.querySelector('[data-mx-back]');
    var btnNext = form.querySelector('[data-mx-next]');
    var btnSubmit = form.querySelector('[data-mx-submit]');
    var label = form.querySelector('[data-mx-label]');
    var status = form.querySelector('[data-mx-status]');
    var emailWrap = form.querySelector('[data-mx-email-wrap]');
    var correoErr = document.getElementById('mx-correo-error');
    var result = root.querySelector('[data-mx-result]');
    var current = 0;
    var sending = false;
    var started = false;
    var submitLabel = label.textContent;

    var idParam = (new URLSearchParams(window.location.search).get('id') || '').trim();
    var hasId = ID_RE.test(idParam);
    emailWrap.hidden = hasId;

    /* ---------- Opciones de los pasos ---------- */
    function uid(group, value) { return 'mx-' + group + '-' + value; }

    Object.keys(OPCIONES).forEach(function (group) {
      var box = form.querySelector('[data-mx-options="' + group + '"]');
      var type = box.getAttribute('data-mx-type');
      OPCIONES[group].forEach(function (opt, n) {
        var wrap = document.createElement('label');
        wrap.className = 'mx__option';
        wrap.style.setProperty('--i', n);
        var input = document.createElement('input');
        input.type = type;
        input.name = group;
        input.value = opt[0];
        input.id = uid(group, opt[0]);
        var span = document.createElement('span');
        span.textContent = opt[1];
        wrap.appendChild(input);
        wrap.appendChild(span);
        box.appendChild(wrap);
      });
    });

    var brandBox = form.querySelector('[data-mx-brands]');
    catalogo.forEach(function (b, n) {
      var wrap = document.createElement('label');
      wrap.className = 'mx__brand-tile';
      wrap.style.setProperty('--i', n);
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'marcas';
      input.value = b.slug;
      var img = document.createElement('img');
      img.src = 'assets/img/logos/' + b.file;
      img.alt = '';
      img.draggable = false;
      var name = document.createElement('span');
      name.className = 'mx__sr';
      name.textContent = b.name;
      wrap.appendChild(input);
      wrap.appendChild(img);
      wrap.appendChild(name);
      brandBox.appendChild(wrap);
    });

    /* ---------- Lectura y validación ---------- */
    function values(name) {
      return Array.prototype.map.call(form.querySelectorAll('input[name="' + name + '"]:checked'), function (el) { return el.value; });
    }
    function readAnswers() {
      return {
        industria: values('industria')[0] || '',
        tecnologias: values('tecnologias'),
        soluciones: values('soluciones'),
        marcas: values('marcas'),
        objetivos: values('objetivos'),
        quiereContacto: !!form.elements.quiere_contacto.checked
      };
    }
    function correoMsg() {
      var v = form.elements.correo.value.trim();
      if (!v) return 'Escribe el correo con el que te registraste.';
      if (!CORREO_RE.test(v)) return 'Revisa el formato: nombre@empresa.com';
      return '';
    }
    function stepValid(i) {
      var a = readAnswers();
      switch (ORDEN[i]) {
        case 'industria': return !!a.industria;
        case 'tecnologias': return a.tecnologias.length > 0;
        case 'soluciones': return a.soluciones.length > 0;
        case 'marcas': return true;
        case 'objetivos': return a.objetivos.length > 0 && (hasId || !correoMsg());
      }
      return false;
    }

    // En "Qué quieres resolver" el tope es 3: al llegar, las demás opciones se desactivan
    function limitSolutions() {
      var inputs = form.querySelectorAll('input[name="soluciones"]');
      var n = values('soluciones').length;
      var full = n >= 3;
      var counter = form.querySelector('[data-mx-sol-count]');
      if (counter) counter.textContent = '(' + n + ' de 3)';
      Array.prototype.forEach.call(inputs, function (el) {
        el.disabled = full && !el.checked;
        el.closest('.mx__option').classList.toggle('is-disabled', el.disabled);
      });
    }

    function render() {
      var last = current === steps.length - 1;
      steps.forEach(function (s, i) { s.hidden = i !== current; });
      bar.style.width = (((current + 1) / steps.length) * 100) + '%';
      count.textContent = 'Paso ' + (current + 1) + ' de ' + steps.length;
      btnBack.hidden = current === 0;
      btnNext.hidden = last;
      btnSubmit.hidden = !last;
      var ok = stepValid(current);
      btnNext.disabled = !ok;
      btnSubmit.disabled = !ok || sending;
    }

    function go(delta) {
      current = Math.max(0, Math.min(steps.length - 1, current + delta));
      render();
      status.textContent = '';
      var legend = steps[current].querySelector('legend');
      if (legend) { legend.setAttribute('tabindex', '-1'); legend.focus({ preventScroll: true }); }
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    form.addEventListener('change', function (e) {
      if (!started) {
        started = true;
        if (window.BeyondTracking) window.BeyondTracking.track('perfil_iniciado');
      }
      if (e.target.name === 'soluciones') limitSolutions();
      render();
    });
    form.elements.correo.addEventListener('input', function () { correoErr.textContent = ''; render(); });
    form.elements.correo.addEventListener('blur', function () { correoErr.textContent = hasId ? '' : (form.elements.correo.value ? correoMsg() : ''); });
    btnBack.addEventListener('click', function () { go(-1); });
    btnNext.addEventListener('click', function () { if (stepValid(current)) go(1); });

    /* ---------- Resultado ---------- */
    function showResult(route, saved) {
      var lead = result.querySelector('[data-mx-result-lead]');
      var note = result.querySelector('[data-mx-note]');
      var list = result.querySelector('[data-mx-route]');
      list.textContent = '';
      route.forEach(function (r, i) {
        var li = document.createElement('li');
        li.className = 'mx__route-item';
        li.style.setProperty('--i', i);
        var num = document.createElement('span');
        num.className = 'mx__route-num';
        num.textContent = String(i + 1);
        var img = document.createElement('img');
        img.src = 'assets/img/logos/' + r.brand.file;
        img.alt = r.brand.name;
        img.draggable = false;
        var why = document.createElement('p');
        why.className = 'mx__route-why';
        why.textContent = r.reasons.slice(0, 3).join(' · ');
        li.appendChild(num);
        li.appendChild(img);
        li.appendChild(why);
        list.appendChild(li);
      });
      lead.textContent = 'Estas son las ' + route.length + ' marcas que no te debes perder, en el orden que te recomendamos.';
      note.textContent = saved
        ? 'Te enviamos el detalle con ligas a su contenido a tu correo. Si no lo ves en unos minutos, revisa tu carpeta de spam.'
        : 'Vista previa: esta ruta aún no se guarda ni se envía por correo.';
      form.hidden = true;
      result.hidden = false;
      var title = result.querySelector('#mx-result-title');
      title.focus({ preventScroll: true });
      result.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function setBusy(busy) {
      sending = busy;
      form.classList.toggle('is-busy', busy);
      label.textContent = busy ? 'Armando tu ruta…' : submitLabel;
      render();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = '';
      status.classList.remove('is-error');
      if (sending) return;
      if (!ORDEN.every(function (n, i) { return stepValid(i); })) { render(); return; }

      // Campo trampa lleno = bot: se muestra el resultado sin enviar nada
      if (form.elements.website.value) { showResult(computeRoute(readAnswers(), catalogo), false); return; }

      var a = readAnswers();
      var route = computeRoute(a, catalogo);
      var data = {
        id: hasId ? idParam.toUpperCase() : '',
        correo: hasId ? '' : form.elements.correo.value.trim().toLowerCase(),
        industria: a.industria,
        tecnologias: a.tecnologias.join(','),
        soluciones: a.soluciones.join(','),
        marcas_elegidas: a.marcas.join(','),
        ruta: route.map(function (r) { return r.brand.slug; }).join(','),
        objetivos: a.objetivos.join(','),
        quiere_contacto: a.quiereContacto ? 'Sí' : 'No',
        fecha: new Date().toISOString(),
        origen: 'mi-experiencia'
      };
      var utm = (window.BeyondTracking && window.BeyondTracking.getUtm()) || {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) { data[k] = utm[k] || ''; });

      function done(saved) {
        // Aviso para analítica: sin datos personales
        if (window.BeyondTracking) window.BeyondTracking.track('perfil_completado', { marcas_ruta: route.length });
        showResult(route, saved);
      }

      if (!ENDPOINT_PERFIL) { done(false); return; }

      setBusy(true);
      fetch(ENDPOINT_PERFIL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          if (res.status === 404) {
            var err = new Error('sin-registro');
            err.noRegistro = true;
            throw err;
          }
          if (!res.ok) throw new Error('HTTP ' + res.status);
          setBusy(false);
          done(true);
        })
        .catch(function (err) {
          setBusy(false);
          status.classList.add('is-error');
          if (err.noRegistro) {
            status.textContent = 'No encontramos ese registro. Revisa que sea el correo con el que te registraste o regístrate en ';
            var link = document.createElement('a');
            link.href = '/#registro';
            link.textContent = 'beyond.ciisa.com';
            status.appendChild(link);
            status.appendChild(document.createTextNode('.'));
          } else {
            status.textContent = 'No pudimos guardar tu ruta. Inténtalo de nuevo o escríbenos a ' + CONTACTO + '.';
          }
        });
    });

    limitSolutions();
    render();
  });
})();
