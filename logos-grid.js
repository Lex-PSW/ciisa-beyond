// Grilla de logos de "Sobre Beyond": mismas marcas y orden que el carrusel (logos-data.js).
// 16 logos = 3 columnas (5 filas de 3 + 1 centrado). Cada logo se escala según su proporción
// para que todos pesen parecido: los muy alargados (Sophos, Autodesk) llenan el ancho de la celda
// y los compactos (IBM, HPI) se quedan más chicos.
(function () {
  var BASE_PATH = 'assets/img/logos/';
  var AREA = 0.24;      // fracción del área de la celda que ocupa cada logo
  var CELL_RATIO = 1.6; // ancho / alto de la celda (ver .cip-logos-grid__item en styles.css)
  var MAX_W = 0.92;     // ancho máximo del logo, relativo a la celda

  function fit(img) {
    if (!img.naturalWidth || !img.naturalHeight) return;
    var r = img.naturalWidth / img.naturalHeight;
    var w = Math.min(MAX_W, Math.sqrt(AREA * r / CELL_RATIO));
    img.style.width = (w * 100).toFixed(1) + '%';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var grid = document.querySelector('[data-logos-grid]');
    var logos = (window.CIISA_LOGOS || []).filter(function (l) { return l.grid !== false; });
    if (!grid || !logos.length) return;

    logos.forEach(function (logo, i) {
      var item = document.createElement('div');
      item.className = 'cip-logos-grid__item';
      item.style.transitionDelay = (i * 0.05) + 's';
      var img = document.createElement('img');
      img.src = BASE_PATH + logo.file;
      img.alt = logo.name;
      img.draggable = false;
      img.addEventListener('load', function () { fit(img); });
      item.appendChild(img);
      grid.appendChild(item);
      if (img.complete) fit(img);
    });

    var items = Array.from(grid.children);
    var reveal = function () { items.forEach(function (el) { el.classList.add('is-visible'); }); };

    if (!('IntersectionObserver' in window)) { reveal(); return; }

    // Mismo criterio que badges-grid.js: en móvil/tablet espera a que la grilla esté bien dentro.
    var stacked = window.matchMedia('(max-width: 900px)').matches;
    var options = stacked ? { threshold: 0.4, rootMargin: '0px 0px -15% 0px' } : { threshold: 0.3 };
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) {
        reveal();
        io.disconnect();
      }
    }, options);
    io.observe(grid);
  });
})();
