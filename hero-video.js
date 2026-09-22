document.addEventListener('DOMContentLoaded', () => {
  const video = document.querySelector('[data-hero-video]');
  if (!video) return;

  const mobileQuery = window.matchMedia('(max-width: 767px)');
  const sources = {
    desktop: 'assets/video/bg-beyond-h.mp4',
    mobile: 'assets/video/bg-beyond-v.mp4'
  };
  let currentSource;

  const loadVideo = () => {
    const nextSource = mobileQuery.matches ? sources.mobile : sources.desktop;
    if (nextSource === currentSource) return;

    currentSource = nextSource;
    video.src = nextSource;
    video.load();

    const startPlayback = () => {
      video.play().catch(() => {});
      video.removeEventListener('canplay', startPlayback);
    };
    video.addEventListener('canplay', startPlayback);
  };

  loadVideo();
  mobileQuery.addEventListener('change', loadVideo);
});
