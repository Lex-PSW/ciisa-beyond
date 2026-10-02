// Recorre la expo: botones de acercar/alejar para el <model-viewer>.
// El zoom con la rueda está desactivado (disable-zoom) para no secuestrar el scroll de la página.
(function () {
  const viewer = document.querySelector('[data-expo3d]');
  if (!viewer) return;

  const MIN = 40, MAX = 110, STEP = 12; // radio en % del encuadre automático (igual que min/max-camera-orbit)
  let radius = 68;

  document.querySelectorAll('[data-expo3d-zoom]').forEach((btn) => {
    btn.addEventListener('click', () => {
      radius = Math.min(MAX, Math.max(MIN, radius + STEP * Number(btn.dataset.expo3dZoom)));
      const orbit = viewer.getCameraOrbit();
      viewer.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${radius}%`;
    });
  });
})();
