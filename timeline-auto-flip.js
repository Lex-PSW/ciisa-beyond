document.addEventListener('DOMContentLoaded', () => {
  const section = document.getElementById('nuevos-usuarios');
  if (!section) return;

  const firstCard = section.querySelector('.cip-tl-card');
  if (!firstCard) return;

  let hasFlipped = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !hasFlipped) {
        hasFlipped = true;
        setTimeout(() => {
          const inner = firstCard.querySelector('.cip-tl-card__inner');
          if (!inner) return;
          firstCard.classList.add('is-flipped');
          inner.setAttribute('aria-pressed', 'true');
        }, 1500);
        observer.disconnect();
      }
    });
  }, { threshold: 0.35 });

  observer.observe(section);
});
