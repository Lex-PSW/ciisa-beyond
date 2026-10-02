// Seguimiento de campañas de CiiSA Beyond 2026.
// - Píxeles de Meta (Facebook/Instagram), LinkedIn Insight Tag y TikTok: se cargan solo si su ID
//   está configurado abajo. Sin ID no se carga nada de ese proveedor.
// - Google (GA4 / Google Ads) se maneja desde Google Tag Manager (GTM-TFCPQDS8, ya instalado en
//   index.html): este archivo empuja eventos al dataLayer para crear ahí las etiquetas y conversiones.
// - Captura los UTM de la URL para que el registro guarde de qué campaña vino cada invitado.
// A los píxeles nunca se les envían datos personales (nombre, correo, teléfono).
(function () {
  var CONFIG = {
    META_PIXEL_ID: '',                // Administrador de eventos de Meta → ID del píxel (solo números)
    LINKEDIN_PARTNER_ID: '',          // Campaign Manager → Insight Tag → Partner ID
    LINKEDIN_LEAD_CONVERSION_ID: '29229772',  // Campaign Manager → Conversiones → ID de la conversión "Registro"
    TIKTOK_PIXEL_ID: ''               // TikTok Ads Manager → Eventos → ID del píxel (opcional)
  };

  window.dataLayer = window.dataLayer || [];

  /* ---------- UTM / identificadores de clic ---------- */
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'li_fat_id'];
  var STORE_KEY = 'beyond_utm';

  function readStore() {
    try { return JSON.parse(sessionStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
  }
  function captureUtm() {
    var params = new URLSearchParams(window.location.search);
    var found = {};
    UTM_KEYS.forEach(function (k) { var v = params.get(k); if (v) found[k] = v.slice(0, 200); });
    // Solo se reemplaza lo guardado si esta visita trae parámetros nuevos (conserva la campaña
    // aunque la persona navegue a una sección con #ancla y pierda la query).
    if (Object.keys(found).length) {
      try { sessionStorage.setItem(STORE_KEY, JSON.stringify(found)); } catch (e) {}
      return found;
    }
    return readStore();
  }
  var utm = captureUtm();

  /* ---------- Meta Pixel ---------- */
  if (CONFIG.META_PIXEL_ID) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', CONFIG.META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  /* ---------- LinkedIn Insight Tag ---------- */
  if (CONFIG.LINKEDIN_PARTNER_ID) {
    window._linkedin_partner_id = CONFIG.LINKEDIN_PARTNER_ID;
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push(CONFIG.LINKEDIN_PARTNER_ID);
    (function (l) {
      if (!l) { window.lintrk = function (a, b) { window.lintrk.q.push([a, b]); }; window.lintrk.q = []; }
      var s = document.getElementsByTagName('script')[0];
      var b = document.createElement('script');
      b.type = 'text/javascript'; b.async = true;
      b.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
      s.parentNode.insertBefore(b, s);
    })(window.lintrk);
  }

  /* ---------- TikTok Pixel (opcional) ---------- */
  if (CONFIG.TIKTOK_PIXEL_ID) {
    /* eslint-disable */
    !function (w, d, t) {
      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
      ttq.load(CONFIG.TIKTOK_PIXEL_ID);ttq.page();
    }(window, document, 'ttq');
    /* eslint-enable */
  }

  /* ---------- Envío de eventos a todos los proveedores ---------- */
  function track(name, extra) {
    var payload = { event: 'beyond_' + name };
    Object.keys(utm).forEach(function (k) { payload[k] = utm[k]; });
    if (extra) Object.keys(extra).forEach(function (k) { payload[k] = extra[k]; });
    window.dataLayer.push(payload);

    var fbq = window.fbq, lintrk = window.lintrk, ttq = window.ttq;
    switch (name) {
      case 'registro_completado':
        if (fbq) fbq('track', 'Lead', { content_name: 'CiiSA Beyond 2026' });
        if (lintrk && CONFIG.LINKEDIN_LEAD_CONVERSION_ID) lintrk('track', { conversion_id: Number(CONFIG.LINKEDIN_LEAD_CONVERSION_ID) });
        if (window.gtag) window.gtag('event', 'conversion', { send_to: 'AW-17545418070/GHW8CMnCko0dENaqp65B' });
        if (ttq && CONFIG.TIKTOK_PIXEL_ID) ttq.track('SubmitForm');
        break;
      case 'registro_iniciado':
        if (fbq) fbq('trackCustom', 'InicioRegistro');
        break;
      case 'cta_registro':
        if (fbq) fbq('trackCustom', 'ClicConfirmaAsistencia', extra || {});
        if (ttq && CONFIG.TIKTOK_PIXEL_ID) ttq.track('ClickButton');
        break;
      case 'whatsapp':
        if (fbq) fbq('track', 'Contact');
        if (ttq && CONFIG.TIKTOK_PIXEL_ID) ttq.track('Contact');
        break;
    }
  }

  // API mínima para otros scripts (rsvp-form.js)
  window.BeyondTracking = {
    track: track,
    getUtm: function () { return utm; }
  };

  document.addEventListener('DOMContentLoaded', function () {
    // Clics en "Confirma tu asistencia" (nav, hero)
    document.querySelectorAll('a[href="#registro"]').forEach(function (a, i) {
      a.addEventListener('click', function () {
        track('cta_registro', { ubicacion: a.closest('nav') ? 'nav' : 'hero-' + i });
      });
    });

    // Botón flotante de WhatsApp
    var wa = document.querySelector('.cip-whatsapp');
    if (wa) wa.addEventListener('click', function () { track('whatsapp'); });

    // Primer campo del formulario que se toca = registro iniciado (una sola vez)
    var form = document.querySelector('[data-rsvp-form]');
    if (form) {
      var started = false;
      form.addEventListener('focusin', function () {
        if (started) return;
        started = true;
        track('registro_iniciado');
      });
    }

    // Registro exitoso (lo emite rsvp-form.js cuando Power Automate responde 200)
    document.addEventListener('beyond:lead', function () { track('registro_completado'); });
  });
})();
