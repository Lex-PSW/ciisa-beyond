// "¿Quién te invitó?": campo con autocompletado restringido (patrón combobox de ARIA).
// Al enfocar muestra los canales (LinkedIn, Google, por su cuenta); al escribir filtra los
// asesores sin importar acentos ni mayúsculas, con máximo 5 resultados para no alargar
// el formulario en celular. Solo se aceptan valores de window.CIISA_INVITO: la validación
// (y el botón deshabilitado) viven en rsvp-form.js, a quien se avisa con eventos input/change.
(function () {
  var MAX = 5;
  var data = window.CIISA_INVITO || { canales: [], asesores: [] };

  var fold = function (s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  };

  // Valor canónico si el texto coincide con una opción (ignora acentos y mayúsculas); si no, ''
  window.CIISA_INVITO.match = function (text) {
    var t = fold(text || '');
    var all = data.canales.concat(data.asesores);
    for (var i = 0; i < all.length; i++) if (fold(all[i]) === t) return all[i];
    return '';
  };

  document.addEventListener('DOMContentLoaded', function () {
    var input = document.getElementById('rsvp-invito');
    var list = document.getElementById('rsvp-invito-list');
    if (!input || !list) return;

    var options = [];
    var active = -1;

    // Cada palabra escrita debe ser el inicio de alguna palabra del nombre: "jo sal" → "José Salgado"
    function search(q) {
      var tokens = fold(q).split(/\s+/).filter(Boolean);
      if (!tokens.length) return data.canales.slice();
      var pool = data.asesores.concat(data.canales);
      return pool.filter(function (name) {
        var words = fold(name).split(/\s+/);
        return tokens.every(function (t) {
          return words.some(function (w) { return w.indexOf(t) === 0; });
        });
      }).slice(0, MAX);
    }

    function render(items, q) {
      options = items;
      active = -1;
      list.innerHTML = '';
      if (!items.length) {
        var empty = document.createElement('li');
        empty.className = 'cip-combo__empty';
        empty.textContent = 'No encontramos ese nombre. Revisa cómo lo escribiste.';
        list.appendChild(empty);
      }
      items.forEach(function (name, i) {
        var li = document.createElement('li');
        li.id = 'rsvp-invito-opt-' + i;
        li.className = 'cip-combo__option' + (data.canales.indexOf(name) > -1 ? ' cip-combo__option--canal' : '');
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', 'false');
        li.textContent = name;
        // mousedown en lugar de click: así el campo no pierde el foco ni marca error antes de elegir
        li.addEventListener('mousedown', function (e) { e.preventDefault(); choose(name); });
        list.appendChild(li);
      });
      open(true);
      input.removeAttribute('aria-activedescendant');
    }

    function open(yes) {
      list.hidden = !yes;
      input.setAttribute('aria-expanded', yes ? 'true' : 'false');
    }

    function highlight(i) {
      var items = list.querySelectorAll('[role="option"]');
      if (!items.length) return;
      active = (i + items.length) % items.length;
      items.forEach(function (el, j) { el.setAttribute('aria-selected', j === active ? 'true' : 'false'); });
      input.setAttribute('aria-activedescendant', items[active].id);
      items[active].scrollIntoView({ block: 'nearest' });
    }

    function notify() {
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function choose(name) {
      input.value = name;
      open(false);
      notify();
    }

    input.addEventListener('focus', function () { render(search(input.value), input.value); });
    input.addEventListener('input', function (e) {
      if (!e.isTrusted) return; // eventos propios de choose()
      render(search(input.value), input.value);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (list.hidden) render(search(input.value)); highlight(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(active - 1); }
      else if (e.key === 'Enter' && !list.hidden && active > -1) { e.preventDefault(); choose(options[active]); }
      else if (e.key === 'Escape') { open(false); }
    });

    // Al salir: si el texto coincide con una opción, se normaliza a como está escrita en la lista
    input.addEventListener('blur', function () {
      open(false);
      var canon = window.CIISA_INVITO.match(input.value);
      if (canon && canon !== input.value) { input.value = canon; notify(); }
    });

    // El formulario se limpia tras enviar: cierra la lista
    if (input.form) input.form.addEventListener('reset', function () { open(false); });
  });
})();
