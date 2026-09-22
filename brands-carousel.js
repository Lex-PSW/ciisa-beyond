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
      setWidth = track.scrollWidth / REPEATS;
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

    function tick() {
      if (!dragging && !paused) {
        offset = wrap(offset + SPEED);
        apply();
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

    viewport.addEventListener('mouseenter', function () { paused = true; });
    viewport.addEventListener('mouseleave', function () { paused = false; });

    window.addEventListener('resize', measure);

    // Give images a frame to lay out before measuring the natural width.
    requestAnimationFrame(function () {
      measure();
      requestAnimationFrame(tick);
    });
  });
})();
