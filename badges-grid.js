document.addEventListener('DOMContentLoaded', () => {
  const stage = document.querySelector('[data-badges-stage]');
  if (!stage) return;

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

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        runSequence();
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  observer.observe(stage);
});
