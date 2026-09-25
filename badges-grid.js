document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-badges-stage]').forEach(initBadgesStage);
});

function initBadgesStage(stage) {

  const intro = stage.querySelector('[data-badges-intro]');
  const grid = stage.querySelector('[data-badges-grid]');
  const items = Array.from(grid.querySelectorAll('.cip-badge-item'));
  const COLUMNS = 2;

  // Los items se revelan por fila: los 2 de arriba primero, luego los 2 de abajo.
  items.forEach((item, i) => {
    const row = Math.floor(i / COLUMNS);
    item.style.transitionDelay = `${row * 0.25}s`;
  });

  const INTRO_HOLD_MS = 1600;

  const runSequence = () => {
    intro.classList.add('is-visible');
    setTimeout(() => {
      intro.classList.add('is-hidden');
      grid.classList.add('is-visible');
      items.forEach((item) => item.classList.add('is-visible'));
    }, INTRO_HOLD_MS);
  };

  if (!('IntersectionObserver' in window)) {
    runSequence();
    return;
  }

  // En móvil/tablet el bloque queda apilado debajo del texto: si se dispara apenas
  // asoma por el borde inferior, la secuencia ocurre fuera de la vista. Ahí se
  // espera a que el bloque esté casi completo y lejos del borde inferior.
  const isStacked = window.matchMedia('(max-width: 900px)').matches;
  const observerOptions = isStacked
    ? { threshold: 0.7, rootMargin: '0px 0px -20% 0px' }
    : { threshold: 0.3 };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        runSequence();
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  observer.observe(stage);
}
