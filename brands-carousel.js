(function () {
  var LOGOS = [
    { file: 'hpe.svg', name: 'HPE', size: 'hpe' },
    { file: 'hpi.svg', name: 'HPI', size: 'hpi' },
    { file: 'pyxoom-hr-ai.svg', name: 'Pyxoom' },
    { file: 'hpe-networking.svg', name: 'HPE Networking' },
    { file: 'dell.svg', name: 'Dell' },
    { file: 'microsoft.svg', name: 'Microsoft' },
    { file: 'lenovo.svg', name: 'Lenovo', size: 'sm' },
    { file: 'poly.svg', name: 'Poly', size: 'xl' },
    { file: 'autodesk.svg', name: 'Autodesk', size: 'wide' },
    { file: 'cyberpower.svg', name: 'CyberPower', size: 'sm' },
    { file: 'fortinet.svg', name: 'Fortinet', size: 'wide' },
    { file: 'honeywell.svg', name: 'Honeywell', size: 'sm' },
    { file: 'ibm.svg', name: 'IBM', size: 'ibm' },
    { file: 'sophos.svg', name: 'Sophos', size: 'wide' },
    { file: 'ciisa-fs.svg', name: 'CiiSA FS', size: 'xl' },
    { file: 'asus.svg', name: 'ASUS', size: 'sm' }
  ];

  var BASE_PATH = 'assets/img/logos/';
  var REPEATS = 3;
  var SPEED = 0.55; // px per frame, ~33px/s @ 60fps

  document.addEventListener('DOMContentLoaded', function () {
    var track = document.querySelector('[data-logos-track]');
    if (!track) return;
    var viewport = track.parentElement;

    for (var r = 0; r < REPEATS; r++) {
      LOGOS.forEach(function (logo) {
        var item = document.createElement('div');
        item.className = 'cip-brands__item' + (logo.size ? ' cip-brands__item--' + logo.size : '');
        var img = document.createElement('img');
        img.src = BASE_PATH + logo.file;
        img.alt = logo.name;
        // Not "lazy": the browser decides what to load based on each image's
        // static layout position, not where the CSS transform visually scrolls
        // it to. In an infinite-loop track this leaves later repeats (and now,
        // with bigger/wider logos, even later items in the first repeat) stuck
        // unloaded forever.
        img.loading = 'eager';
        img.draggable = false;
        item.appendChild(img);
        track.appendChild(item);
      });
    }

    var setWidth = 0;
    function measure() {
      // Distancia real entre el primer logo y el primero de la siguiente repetición
      // (incluye el gap final, que scrollWidth no cuenta).
      setWidth = track.children[LOGOS.length].offsetLeft - track.children[0].offsetLeft;
    }

    var offset = 0;
    var dragging = false;
    var paused = false;
    var dragStartX = 0;
    var dragStartOffset = 0;

    function apply() {
      track.style.transform = 'translate3d(' + (-offset) + 'px,0,0)';
    }

    function wrap(v) {
      if (!setWidth) return 0;
      return ((v % setWidth) + setWidth) % setWidth;
    }

    var wheelVel = 0; // inercia de la rueda, px/frame

    function tick() {
      if (!dragging) {
        if (Math.abs(wheelVel) > 0.1) {
          offset = wrap(offset + wheelVel);
          wheelVel *= 0.92;
          apply();
        } else if (!paused) {
          wheelVel = 0;
          offset = wrap(offset + SPEED);
          apply();
        }
      }
      requestAnimationFrame(tick);
    }

    function onPointerDown(e) {
      dragging = true;
      track.classList.add('is-dragging');
      dragStartX = e.clientX;
      dragStartOffset = offset;
      if (track.setPointerCapture && e.pointerId != null) {
        track.setPointerCapture(e.pointerId);
      }
    }
    function onPointerMove(e) {
      if (!dragging) return;
      var dx = e.clientX - dragStartX;
      offset = wrap(dragStartOffset - dx);
      apply();
    }
    function onPointerUp() {
      dragging = false;
      track.classList.remove('is-dragging');
    }

    track.addEventListener('pointerdown', onPointerDown);
    track.addEventListener('pointermove', onPointerMove);
    track.addEventListener('pointerup', onPointerUp);
    track.addEventListener('pointercancel', onPointerUp);
    track.addEventListener('pointerleave', function () {
      if (!dragging) return;
      onPointerUp();
    });

    // Rueda del mouse / trackpad: recorre el carrusel mientras el cursor está encima.
    viewport.addEventListener('wheel', function (e) {
      var delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!delta) return;
      e.preventDefault();
      if (e.deltaMode === 1) delta *= 16; // líneas -> px
      // Cada golpe de rueda suma velocidad y se frena solo: un giro recorre
      // varios logos en vez de un solo paso.
      wheelVel = Math.max(-90, Math.min(90, wheelVel + delta * 0.2));
    }, { passive: false });

    viewport.addEventListener('mouseenter', function () { paused = true; });
    viewport.addEventListener('mouseleave', function () { paused = false; });

    window.addEventListener('resize', measure);
    // Los SVG sin dimensiones miden 0 hasta cargar: si se mide antes, el ancho del
    // set sale mínimo y el carrusel reinicia en HPE. Se vuelve a medir al cargar cada uno.
    track.querySelectorAll('img').forEach(function (img) {
      if (!img.complete) img.addEventListener('load', measure);
    });
    window.addEventListener('load', measure);

    // Give images a frame to lay out before measuring the natural width.
    requestAnimationFrame(function () {
      measure();
      requestAnimationFrame(tick);
    });
  });
})();
