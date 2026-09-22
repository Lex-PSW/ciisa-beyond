document.addEventListener('DOMContentLoaded', () => {
  const sequence = document.querySelector('[data-headline-sequence]');
  if (!sequence) return;

  const headlines = Array.from(sequence.querySelectorAll('.cip-hero__headline'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wordDelay = 220;
  const headlineDisplayDuration = 14000;
  const leavingDuration = 450;

  headlines.forEach((headline) => {
    const text = headline.textContent.replace(/\s+/g, ' ').trim();
    const words = [];
    const textWalker = document.createTreeWalker(headline, NodeFilter.SHOW_TEXT);
    let textNode;
    while ((textNode = textWalker.nextNode())) {
      const highlight = textNode.parentElement.closest('[class*="cip-hero__headline-span--"]');
      textNode.textContent.matchAll(/\S+/g).forEach((wordMatch) => {
        words.push({
          text: wordMatch[0],
          className: highlight ? highlight.className : ''
        });
      });
    }
    headline.setAttribute('aria-label', text);
    headline.textContent = '';

    words.forEach((word, wordIndex) => {
      const wordElement = document.createElement('span');
      wordElement.className = `cip-hero__headline-word${word.className ? ` ${word.className}` : ''}`;
      wordElement.setAttribute('aria-hidden', 'true');
      wordElement.textContent = word.text;
      if (wordIndex < words.length - 1) wordElement.style.marginRight = '0.28em';
      headline.appendChild(wordElement);
    });
  });

  const updateHeadlineAreaHeight = () => {
    const headlineAreaHeight = Math.max(...headlines.map((headline) => {
      const measurement = headline.cloneNode(true);
      measurement.classList.add('is-active');
      measurement.style.position = 'absolute';
      measurement.style.inset = 'auto';
      measurement.style.width = '100%';
      measurement.style.height = 'auto';
      measurement.style.visibility = 'hidden';
      sequence.appendChild(measurement);
      const height = measurement.getBoundingClientRect().height;
      measurement.remove();
      return height;
    }));
    sequence.style.setProperty('--headline-area-height', `${headlineAreaHeight}px`);
  };

  updateHeadlineAreaHeight();
  let resizeFrame;
  window.addEventListener('resize', () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(updateHeadlineAreaHeight);
  });

  if (reducedMotion) {
    headlines[0].classList.add('is-active');
    headlines[0].querySelectorAll('.cip-hero__headline-word').forEach((word) => {
      word.classList.add('is-visible');
    });
    return;
  }

  const wait = (duration) => new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });

  const nextFrame = () => new Promise((resolve) => {
    window.requestAnimationFrame(resolve);
  });

  const revealHeadline = async (headline) => {
    headline.classList.add('is-active');
    await nextFrame();

    const words = headline.querySelectorAll('.cip-hero__headline-word');
    for (const word of words) {
      word.classList.add('is-visible');
      await wait(wordDelay);
    }

    const readingPause = Math.max(
      0,
      headlineDisplayDuration - (words.length * wordDelay) - leavingDuration
    );
    await wait(readingPause);
    headline.classList.add('is-leaving');
    await wait(leavingDuration);
    headline.classList.remove('is-active', 'is-leaving');
    words.forEach((word) => word.classList.remove('is-visible'));
  };

  const runSequence = async () => {
    while (true) {
      for (const headline of headlines) {
        await revealHeadline(headline);
      }
    }
  };

  runSequence();
});
