document.addEventListener('DOMContentLoaded', () => {
  const sequence = document.querySelector('[data-photo-sequence]');
  if (!sequence) return;

  const photos = Array.from(sequence.querySelectorAll('.cip-hero__photo-sequence-item'));
  const logo = sequence.parentElement.querySelector(':scope > .cip-hero__photo');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const displayDuration = 2600;
  const transitionDuration = 900;
  const logoPause = 2200;
  const stackRotations = [-3, 2, -2, 3, -1];

  if (!photos.length || !logo || reducedMotion) return;

  const wait = (duration) => new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });

  const showPhoto = async (photo, photoIndex, previousPhoto) => {
    if (previousPhoto) {
      previousPhoto.classList.remove('is-active');
      previousPhoto.classList.add('is-stacked');
      previousPhoto.style.setProperty('--photo-stack-blur', `${2 + photoIndex * 1.5}px`);
      previousPhoto.style.setProperty('--photo-stack-rotation', `${stackRotations[photoIndex - 1]}deg`);
    }

    photo.style.zIndex = photoIndex + 1;
    photo.classList.remove('is-stacked');
    photo.classList.add('is-active');
    logo.style.setProperty('--logo-blur', `${photoIndex * 1.8}px`);
    await wait(displayDuration);
  };

  const clearPhotos = async () => {
    sequence.classList.add('is-clearing');
    await wait(transitionDuration);
    sequence.classList.remove('is-clearing');
    photos.forEach((photo) => {
      photo.classList.remove('is-active', 'is-stacked');
      photo.style.removeProperty('z-index');
      photo.style.removeProperty('--photo-stack-blur');
      photo.style.removeProperty('--photo-stack-rotation');
    });
    logo.style.setProperty('--logo-blur', '0px');
    await wait(logoPause);
  };

  const runSequence = async () => {
    while (true) {
      let previousPhoto;
      for (const [photoIndex, photo] of photos.entries()) {
        await showPhoto(photo, photoIndex, previousPhoto);
        previousPhoto = photo;
      }
      await clearPhotos();
    }
  };

  runSequence();
});
