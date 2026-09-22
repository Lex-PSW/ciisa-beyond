/* =============================================
   PYXOOM 4.2.3 — SCRIPT PRINCIPAL
   Archivo: script.js
   ============================================= */

// Datos de sesiones con tooltips
const SESSIONS = {
  // mes (0-indexed), dia: {title, time, link}
  "4-12": { title:"Webinar Inaugural — Pyxoom 4.2.3", time:"Mar 12 Mayo · 10:00 AM - 10:30 AM (CST)", link:"https://tiuoe.share.hsforms.com/2E5K-PdjmQyWxJlBfpXA3DA" },
  "4-11": { title:"Sesión 1 — Curso Pyxoom 4.2", time:"Lun 11 Mayo · 15:30 PM - 17:00 PM (CST)", link:"https://events.teams.microsoft.com/event/6d40fa90-4487-43c7-9cda-e8910e61bb84@4699fbe4-77a7-4846-ad70-9ce4e3841335" },
  "4-15": { title:"Webinar Sesión informativa: Proceso de Actualización de tu Pyxoom", time:"Vie 15 Mayo · 10:00 AM - 10:30 AM (CST)", link:"https://events.teams.microsoft.com/event/7a88a1a1-bfda-488f-9674-f257be1fcc56@4699fbe4-77a7-4846-ad70-9ce4e3841335" },
  "4-18": { title:"Sesión 2 — Curso Pyxoom 4.2", time:"Lun 18 Mayo · 15:30 PM - 17:00 PM (CST)", link:"https://events.teams.microsoft.com/event/26f81aed-13fb-43f9-88d2-09806cfffaa4@4699fbe4-77a7-4846-ad70-9ce4e3841335" },
  "4-25": { title:"Sesión 3 — Curso Pyxoom 4.2", time:"Lun 25 Mayo · 15:30 PM - 17:00 PM (CST)", link:"https://events.teams.microsoft.com/event/e2cb28d8-215f-4c1c-9f76-f916b593919a@4699fbe4-77a7-4846-ad70-9ce4e3841335" },
  "5-1":  { title:"Sesión 4 — Curso Pyxoom 4.2", time:"Lun 1 Jun · 3:30 PM - 5:00 PM (CST)",   link:"https://events.teams.microsoft.com/event/69d9c7cf-e6f2-4cb1-8d67-3235f9d35f10@4699fbe4-77a7-4846-ad70-9ce4e3841335" },
  "5-12": { title:"Sesión 5 — Curso Pyxoom 4.2", time:"Vie 12 Jun · 9:30 AM - 11:00 AM (CST)",   link:"https://events.teams.microsoft.com/event/6b2cf06b-3655-4fc8-b465-473cbb035f0f@4699fbe4-77a7-4846-ad70-9ce4e3841335" },
  "5-15": { title:"Sesión 6 — Curso Pyxoom 4.2", time:"Lun 15 Jun · 3:30 PM - 5:00 PM (CST)",  link:"https://events.teams.microsoft.com/event/98a80cc9-a2e3-4df5-8968-a68e0e7f6cac@4699fbe4-77a7-4846-ad70-9ce4e3841335" },
  "5-18": { title:"Sesión 7 — Curso Pyxoom 4.2", time:"Jue 18 Jun · 3:30 PM - 5:00 PM (CST)", link:"https://events.teams.microsoft.com/event/8fdecd99-8235-4ab1-af4c-e817c0dcdacf@4699fbe4-77a7-4846-ad70-9ce4e3841335" },
  "5-22": { title:"Sesión 8 — Curso Pyxoom 4.2", time:"Lun 22 Jun · 3:30 PM - 5:00 PM (CST)",  link:"https://events.teams.microsoft.com/event/66864e6f-5c9c-44cf-8da9-65770d63bab5@4699fbe4-77a7-4846-ad70-9ce4e3841335" },
  "5-25": [
    { title:"Sesión 9 — Curso Pyxoom 4.2", time:"Jue 25 Jun · 3:30 PM - 5:00 PM (CST)",  link:"https://events.teams.microsoft.com/event/fe04310a-68f4-4df0-b0f6-e3c591ba9ef2@4699fbe4-77a7-4846-ad70-9ce4e3841335" },
    { title:"Webinar Sesión informativa: Proceso de Actualización de tu Pyxoom", time:"Jue 25 Jun · 10:00 AM - 10:30 AM (CST)", link:"https://events.teams.microsoft.com/event/fe04310a-68f4-4df0-b0f6-e3c591ba9ef2@4699fbe4-77a7-4846-ad70-9ce4e3841335" }
  ],
  "5-30": { title:"Sesión 10 — Cierre del Programa", time:"Mar 30 Jun · 3:30 PM - 5:00 PM (CST)",  link:"https://events.teams.microsoft.com/event/a8ff9a53-3b82-4412-871b-9fd8de3ae095@4699fbe4-77a7-4846-ad70-9ce4e3841335" },
};

const MONTHS = [  
  { name:"Mayo",  year:2026, month:4 },
  { name:"Junio", year:2026, month:5 },
  { name:"Julio", year:2026, month:6 },
];

const DAY_NAMES = ["Do","Lu","Ma","Mi","Ju","Vi","Sá"];

function buildTooltip(session, isPast) {
  if (!session) return '';
  if (isPast) {
    return `
        <div class="cip-tooltip cip-tooltip--past">
          <div class="cip-tooltip__title">${session.title}</div>
          <div class="cip-tooltip__date">${session.time}</div>
          <a class="cip-btn cip-btn--outline cip-btn--disabled" href="#" aria-disabled="true" tabindex="-1">Concluido</a>
        </div>`;
  }
  return `
        <div class="cip-tooltip">
          <div class="cip-tooltip__title">${session.title}</div>
          <div class="cip-tooltip__date">${session.time}</div>
          <a class="cip-btn cip-btn--primary" href="${session.link}" target="_blank">Registrarse →</a>
        </div>`;
}

function buildCalendar(cfg) {
  const { name, year, month } = cfg;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const today = new Date();

  const headerHTML = DAY_NAMES.map(d => `<div class="cip-calendar__day-name">${d}</div>`).join('');
  let daysHTML = '';

  // Celdas vacías al inicio
  for(let i=0;i<firstDay;i++) daysHTML += `<div class="cip-cal-day cip-cal-day--empty"></div>`;

  for(let d=1;d<=daysInMonth;d++) {
    const key = `${month}-${d}`;
    const session = SESSIONS[key];
    const isToday = (today.getFullYear()===year && today.getMonth()===month && today.getDate()===d);
    const isPast = new Date(year, month, d) < today && !isToday;
    let cls = "cip-cal-day";
    if(session) cls += " cip-cal-day--session";
    if(isPast && session) cls += " cip-cal-day--past";
    if(isToday) cls += " cip-cal-day--today";

    let tooltip = '';
    if(session) {
      if (Array.isArray(session)) {
        tooltip = `<div class="cip-tooltips">${session.map(s => buildTooltip(s, isPast)).join('')}</div>`;
      } else {
        tooltip = buildTooltip(session, isPast);
      }
    }

    daysHTML += `<div class="${cls}">${d}${tooltip}</div>`;
  }

  const hasSessions = Object.keys(SESSIONS).some(k => k.startsWith(`${month}-`));

  return `
    <div class="cip-calendar">
      <div class="cip-calendar__month">
        ${name} ${year}
        ${hasSessions ? '<span class="cip-calendar__month-tag">Activo</span>' : '<span class="cip-calendar__month-tag" style="background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.3)">Próximo</span>'}
      </div>
      <div class="cip-calendar__days-header">${headerHTML}</div>
      <div class="cip-calendar__grid">${daysHTML}</div>
    </div>`;
}

// Construir webinat card
function buildWebinarCard() {
  return `
    <div class="cip-webinar-card">
      <div class="cip-webinar-card__eyebrow">Sesión 10</div>
      <div class="cip-webinar-card__title">Cierre del Programa</div>
      <div class="cip-webinar-card__meta">
        <div class="cip-webinar-card__meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span><strong>Martes 30 de Junio, 2026</strong></span>
        </div>
        <div class="cip-webinar-card__meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span><strong>3:30 PM</strong> — 5:00 PM (Hora CST)</span>
        </div>
        <div class="cip-webinar-card__meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span>Abierto a todos los clientes</span>
        </div>
      </div>
      <a href="https://events.teams.microsoft.com/event/a8ff9a53-3b82-4412-871b-9fd8de3ae095@4699fbe4-77a7-4846-ad70-9ce4e3841335" target="_blank" class="cip-btn cip-btn--primary" style="width:100%;justify-content:center;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        Registrate a este curso
      </a>
    </div>`;
}

// Render calendarios al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('calendarios-container');
  if (!container) return;

  let html = '';
  MONTHS.forEach(cfg => {
    const { name, year, month } = cfg;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const today = new Date();
    const hasSessions = Object.keys(SESSIONS).some(k => k.startsWith(`${month}-`));

    let headerHTML = DAY_NAMES.map(d => `<div class="cip-calendar__day-name">${d}</div>`).join('');
    let gridHTML = '';

    for(let i=0;i<firstDay;i++) gridHTML += `<div class="cip-cal-day cip-cal-day--empty"></div>`;

    for(let d=1;d<=daysInMonth;d++){
      const key = `${month}-${d}`;
      const session = SESSIONS[key];
      const isToday = (today.getFullYear()===year && today.getMonth()===month && today.getDate()===d);
      const isPast = new Date(year, month, d) < today && !isToday;
      let cls = "cip-cal-day";
      if(session) cls += " cip-cal-day--session";
      if(isPast && session) cls += " cip-cal-day--past";
      if(isToday) cls += " cip-cal-day--today";

      let tooltip = '';
      if(session){
        if (Array.isArray(session)) {
          tooltip = `<div class="cip-tooltips">${session.map(s => buildTooltip(s, isPast)).join('')}</div>`;
        } else {
          tooltip = buildTooltip(session, isPast);
        }
      }
      gridHTML += `<div class="${cls}">${d}${tooltip}</div>`;
    }

    html += `
      <div class="cip-calendar">
        <div class="cip-calendar__month">
          ${name} ${year}
          ${hasSessions
            ? '<span class="cip-calendar__month-tag">Activo</span>'
            : '<span class="cip-calendar__month-tag" style="background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.3)">Próximo</span>'}
        </div>
        <div class="cip-calendar__days-header">${headerHTML}</div>
        <div class="cip-calendar__grid">${gridHTML}</div>
      </div>`;
  });

  html += buildWebinarCard();
  container.innerHTML = html;
});