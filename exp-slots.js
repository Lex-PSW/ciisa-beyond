// Numerales de "Experiencia Beyond" (+18, +10, +400) con efecto de rodillo tipo slot:
// cada dígito gira de 0 hasta su valor cuando la sección entra en pantalla.
// Se construye igual en las dos capas del fundido (delgada y bold) para que giren sincronizadas.
(function () {
  var SPINS = 2;          // vueltas completas (0-9) antes de caer en el dígito final
  var BASE_MS = 1400;     // duración del primer dígito
  var STEP_MS = 350;      // cada dígito siguiente tarda un poco más (efecto escalonado)

  function buildReels(span) {
    var text = span.textContent.trim();
    span.textContent = '';
    span.classList.remove('cip-hero__headline-span--pulse');
    span.classList.add('cip-slot-num');
    span.setAttribute('aria-label', text);

    var digitIndex = 0;
    text.split('').forEach(function (ch) {
      if (!/\d/.test(ch)) {
        var sym = document.createElement('span');
        sym.className = 'cip-slot__sym cip-hero__headline-span--pulse';
        // El símbolo se desenfoca igual que el primer dígito
        sym.style.setProperty('--slot-dur', BASE_MS + 'ms');
        sym.setAttribute('aria-hidden', 'true');
        sym.textContent = ch;
        span.appendChild(sym);
        return;
      }
      var target = parseInt(ch, 10);
      var reel = document.createElement('span');
      reel.className = 'cip-slot';
      reel.setAttribute('aria-hidden', 'true');
      var strip = document.createElement('span');
      strip.className = 'cip-slot__strip cip-hero__headline-span--pulse';
      var digits = [];
      for (var s = 0; s < SPINS; s++) for (var d = 0; d < 10; d++) digits.push(d);
      for (var t = 0; t <= target; t++) digits.push(t);
      strip.innerHTML = digits.map(function (d) { return '<span>' + d + '</span>'; }).join('');
      strip.style.setProperty('--slot-steps', digits.length - 1);
      var dur = (BASE_MS + digitIndex * STEP_MS) + 'ms';
      strip.style.transitionDuration = dur;
      strip.style.setProperty('--slot-dur', dur);
      reel.setAttribute('data-final', target);
      reel.appendChild(strip);
      span.appendChild(reel);
      digitIndex++;
    });
  }

  // Cada rodillo mide desde el inicio el ancho de su dígito final, así el espaciado es el del texto
  // normal (sin hueco tras el "1") y no hay salto al detenerse. El recorte es solo vertical
  // (clip-path en CSS): los dígitos más anchos pueden sobresalir a los lados mientras giran.
  function fitReel(reel) {
    var probe = document.createElement('span');
    probe.className = 'cip-slot__probe';
    probe.textContent = reel.getAttribute('data-final');
    reel.parentNode.insertBefore(probe, reel);
    var w = probe.getBoundingClientRect().width;
    probe.remove();
    if (w) reel.style.width = w + 'px';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var grid = document.querySelector('.cip-exp-grid');
    if (!grid) return;
    var spans = grid.querySelectorAll('.cip-exp-head__num .cip-hero__headline-span--pulse');
    if (!spans.length) return;
    spans.forEach(buildReels);

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var reels = Array.prototype.slice.call(grid.querySelectorAll('.cip-slot'));
    var fitAll = function () { reels.forEach(function (r) { r.style.width = ''; fitReel(r); }); };
    fitAll();
    // Se vuelve a medir cuando termina de cargar Poppins y al cambiar el tamaño de pantalla
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
    window.addEventListener('resize', fitAll);

    var start = function () { grid.classList.add('is-slot-done'); };
    if (reduce || !('IntersectionObserver' in window)) { grid.classList.add('is-slot-instant'); start(); return; }

    // Arranca cuando los numerales están bien dentro de la pantalla (no apenas asoman)
    var stacked = window.matchMedia('(max-width: 900px)').matches;
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) {
        // Un frame de espera asegura que el estado inicial (0) ya se pintó
        requestAnimationFrame(function () { requestAnimationFrame(start); });
        io.disconnect();
      }
    }, stacked ? { threshold: 0.2, rootMargin: '0px 0px -20% 0px' } : { threshold: 0.35 });
    io.observe(grid.querySelector('.cip-exp-head') || grid);
  });
})();
