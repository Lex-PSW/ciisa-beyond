// Logo animado de Beyond + "by CiiSA" (Lottie), igual que en el hero de index.html.
// Lo usa mi-experiencia.html; index.html conserva su propio script en línea.
// Lottie solo hace la entrada y se detiene; el giro infinito de la "O" lo hace la clase
// CSS cip-beyond-o-spin sobre su grupo SVG.
document.addEventListener('DOMContentLoaded', function () {
  if (!window.lottie) return;
  document.querySelectorAll('[data-lottie]').forEach(function (el) {
    var isBeyond = el.classList.contains('cip-hero__lottie--beyond');
    var anim = window.lottie.loadAnimation({
      container: el,
      renderer: 'svg',
      loop: false,
      autoplay: !isBeyond,
      path: el.getAttribute('data-lottie')
    });

    if (!isBeyond) return;
    anim.addEventListener('data_ready', function () {
      var markers = anim.markers || [];
      var rotateMarker = markers.find(function (m) { return m.payload && m.payload.name === 'rotateStart'; })
        || markers.find(function (m) { return m.cm === 'rotateStart'; });
      var introEnd = rotateMarker ? rotateMarker.time : anim.totalFrames;

      anim.addEventListener('complete', function onIntroDone() {
        anim.removeEventListener('complete', onIntroDone);
        var oLayer = (anim.renderer.elements || [])
          .find(function (item) { return item && item.data && item.data.nm === 'O'; });
        if (oLayer && oLayer.layerElement) oLayer.layerElement.classList.add('cip-beyond-o-spin');
      });

      anim.playSegments([0, introEnd], true);
    });
  });
});
