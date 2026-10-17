# Laboratorio DevKit AI · selector de horario · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que quien se registra (modal de gracias) o llega con `?id=BYD-…` pueda elegir uno de los 4 horarios del laboratorio DevKit AI, y ajustar la sección `#laboratorio` con la instrucción "Inscríbete después de registrar tu asistencia".

**Architecture:** Todo vive en `devkit-lab.js` (reescrito), sin tocar `rsvp-form.js`. La lógica pura se expone en `window.BEYOND_LAB` para probarla desde la consola. Un solo componente de selector se monta en dos lugares: dentro del `<dialog data-rsvp-thanks>` (tras `beyond:lead`) y en un `<dialog data-lab-dialog>` nuevo (al cargar con `?id=`). Habla con el flujo M por `ENDPOINT_LAB`; vacío = apagado; `?lab=preview` = simulación.

**Tech Stack:** HTML, CSS y JS vanilla (ES5 como el resto del repo), sin build ni dependencias. Pruebas: snippets de JS en la consola del navegador contra `py -m http.server 8766`.

**Spec:** `docs/superpowers/specs/2026-10-16-laboratorio-devkit-design.md`

## Global Constraints

- **No modificar `rsvp-form.js`** ni los campos, nombres, payload o respuesta de los flujos B y G.
- CSS nuevo **al final de `styles.css`**, en un bloque con comentario; reutilizar `.cip-thanks`, `.cip-btn`, `.cip-rsvp__check`.
- Horarios = filas de `window.CIISA_AGENDA.eventos` con `e: 'labs'` y `titulo: 'Laboratorio IA - TI'`: `10:40-12:00`, `13:00-13:45`, `15:00-15:45`, `17:20-18:00`. Clave = hora de inicio. Lugar: "Salón Terraza".
- ID válido: `/^BYD-\d{12}-[0-9a-f]{4}$/i`.
- Payloads y respuestas exactamente como "Contrato con el flujo M" del spec (`origen: 'laboratorio-devkit'`, `accion: 'estado' | 'apartar'`, `200/409/404/403/400`).
- Un horario se cierra al llegar su hora de inicio según `BeyondClock.mx()` el `2026-10-21`.
- Eventos al `dataLayer` sin datos personales: `devkit_lab_selector` (`via: 'modal'|'liga'`) y `devkit_lab_apartado` (`horario`).
- Breakpoints 640 / 1024; revisar 1280, 800 y 375 px; respetar `prefers-reduced-motion`.
- Se trabaja en la rama **`laboratorio-devkit`** (creada desde `main`), nunca directo en `main`. No hacer commit ni push sin que la persona lo pida; al terminar cada tarea, dejar el cambio listo y reportarlo.

## Review Focus

- `beyond:lead` sin correo capturado (registro por el camino honeypot o el submit capturado antes de reset) → el selector no se muestra; el modal se ve como hoy. *(Task 3)*
- Flujo M responde `500`, tarda o falla CORS en `estado` → se muestran los horarios abiertos como disponibles y `apartar` decide. *(Task 2)*
- `?id=` con formato inválido o mayúsculas/minúsculas mezcladas → inválido: página normal; válido en cualquier caso de letras: abre el selector. *(Task 1 y 4)*
- Doble clic en "Apartar mi lugar" → un solo POST (botón deshabilitado mientras espera). *(Task 2)*
- Día del evento después de las 17:20 (todos cerrados) → ni el modal ni la liga ofrecen el laboratorio. *(Task 1 y 3)*

## Archivos

| Archivo | Cambio |
|---|---|
| `devkit-lab.js` | Reescrito: lógica pura (`BEYOND_LAB`), selector, montaje en modal y en liga, envío a M |
| `index.html` | Sección `#laboratorio` (instrucción, botón, tarjeta sin casilla) + contenedor en el modal de gracias + `<dialog data-lab-dialog>` nuevo. Cargar `devkit-lab.js` **después** de `agenda-data.js` y `beyond-clock.js` (ya lo está) |
| `styles.css` | Bloque nuevo al final: selector y diálogo; quitar reglas de `.cip-devkit__check`/`__status` que queden sin uso |
| `agenda-data.js` | Quitar `// por confirmar` de los 3 horarios TI |
| `docs/ARQUITECTURA.md`, `docs/FLUJOS.md`, `.claude/CLAUDE.md` | Contrato de M, filas M/M1 y nota de C, fila de `devkit-lab.js` |

---

### Task 1: Lógica pura en `window.BEYOND_LAB`

**Files:**
- Modify (reescribir): `devkit-lab.js`
- Modify: `agenda-data.js:40,43,45` (quitar comentario "por confirmar")

**Interfaces:**
- Produces (en `window.BEYOND_LAB`):
  - `ENDPOINT: string` (constante `ENDPOINT_LAB = ''` arriba del archivo con el comentario de configuración, como `mi-experiencia.js`)
  - `modo(): 'apagado' | 'preview' | 'activo'` — `preview` si `?lab=preview`; si no, `activo` si `ENDPOINT` no vacío; si no, `apagado`
  - `horarios(): Array<{ini: string, fin: string}>` — desde `CIISA_AGENDA`, ordenados por `ini`
  - `cerrado(ini: string, mx: {date: string, min: number}): boolean` — `true` si `mx.date > '2026-10-21'`, o si `mx.date === '2026-10-21'` y `mx.min >= minutos(ini)`
  - `abiertos(mx): Array<{ini, fin}>`
  - `idDeUrl(search: string): string` — ID válido o `''`

- [ ] **Step 1: Escribir la prueba de consola** (guardarla en el reporte; se corre en Step 4)

```js
var L = window.BEYOND_LAB;
console.assert(JSON.stringify(L.horarios().map(function (h) { return h.ini + '-' + h.fin; })) === '["10:40-12:00","13:00-13:45","15:00-15:45","17:20-18:00"]', 'horarios');
console.assert(L.cerrado('13:00', { date: '2026-10-21', min: 12 * 60 + 59 }) === false, 'abierto 12:59');
console.assert(L.cerrado('13:00', { date: '2026-10-21', min: 13 * 60 }) === true, 'cerrado 13:00');
console.assert(L.cerrado('10:40', { date: '2026-10-16', min: 900 }) === false, 'antes del evento');
console.assert(L.cerrado('10:40', { date: '2026-10-22', min: 0 }) === true, 'después del evento');
console.assert(L.abiertos({ date: '2026-10-21', min: 17 * 60 + 20 }).length === 0, 'todos cerrados');
console.assert(L.idDeUrl('?id=BYD-261016101500-a1F9') === 'BYD-261016101500-a1F9', 'id válido');
console.assert(L.idDeUrl('?id=BYD-123') === '' && L.idDeUrl('') === '', 'id inválido');
console.assert(L.modo() === 'apagado', 'apagado sin endpoint');
'ok';
```

- [ ] **Step 2: Correrla y ver que falla** — servir con `py -m http.server 8766`, abrir `http://localhost:8766/index.html?bust=10`. Esperado: `TypeError: Cannot read properties of undefined` (aún no existe `BEYOND_LAB`).
- [ ] **Step 3: Implementar** las funciones de arriba en `devkit-lab.js` (IIFE, `var`, comentarios en español como el resto). Quitar el código de `sessionStorage`/casilla de la versión anterior. Quitar los 3 `// por confirmar` de `agenda-data.js`.
- [ ] **Step 4: Correr la prueba** con `?bust=11`. Esperado: `'ok'` sin `Assertion failed` en consola. Con `?lab=preview`: `BEYOND_LAB.modo() === 'preview'`.

---

### Task 2: Componente selector y envío al flujo M

**Files:**
- Modify: `devkit-lab.js`
- Modify: `styles.css` (bloque nuevo al final: "Selector de horario del laboratorio DevKit AI (16 oct)")

**Interfaces:**
- Consumes: `BEYOND_LAB.modo/horarios/abiertos/ENDPOINT`, `BeyondClock.mx()`, `tracking.js` no se toca (los UTM se leen de `sessionStorage` igual que `rsvp-form.js`; si no hay, van vacíos).
- Produces: `BEYOND_LAB.montar(contenedor: HTMLElement, identidad: {id?: string, correo?: string}, via: 'modal'|'liga'): void`

Marcado que genera `montar` (dentro de `contenedor`):
`<form class="cip-lab" data-lab-form>` → `<fieldset><legend>` "Laboratorio DevKit AI · Salón Terraza" → por horario un `<label class="cip-lab__slot">` con `<input type="radio" name="horario" value="10:40">` y "10:40 – 12:00" + estado (`Disponible` / `Lleno` / `Cerrado`; lleno y cerrado → `disabled`) → `<p class="cip-lab__status" role="status" aria-live="polite">` → `<button type="submit" class="cip-btn cip-btn--primary">Apartar mi lugar</button>`.

Comportamiento:
- Al montar: `dataLayer.push({event:'devkit_lab_selector', via})`. En `activo`, POST `{accion:'estado', origen:'laboratorio-devkit'}`; mientras espera, radios deshabilitados y estado "Consultando horarios…". Si falla o tarda más de 8 s, los abiertos se muestran disponibles. En `preview`, todos los abiertos disponibles.
- Submit sin horario: "Elige un horario." Con horario: botón deshabilitado, POST `apartar` con `id` **o** `correo` (el otro `''`), `horario`, `fecha` ISO, `utm_*`.
- Respuestas → mensajes exactos del spec (sección 4). `200`: reemplaza el formulario por el mensaje de éxito y `dataLayer.push({event:'devkit_lab_apartado', horario})`. `409`: mensaje "lleno", marca ese horario como Lleno, vuelve a habilitar. `404`: mensaje con enlace `#registro` (que cierra el diálogo abierto). Otro/red: mensaje de error, re-habilita.
- `preview`: simula `200` tras 600 ms sin `fetch`.

- [ ] **Step 1: Prueba de consola** (en `?lab=preview&bust=20`):

```js
var box = document.createElement('div'); document.body.appendChild(box);
BEYOND_LAB.montar(box, { correo: 'prueba@ejemplo.com' }, 'modal');
console.assert(box.querySelectorAll('input[name="horario"]').length === 4, '4 radios');
var btn = box.querySelector('button[type="submit"]');
btn.click(); console.assert(/Elige un horario/.test(box.textContent), 'sin horario');
box.querySelector('input[value="13:00"]').click(); btn.click(); btn.click();
console.assert(btn.disabled, 'deshabilitado al enviar');
await new Promise(function (r) { setTimeout(r, 900); });
console.assert(/13:00/.test(box.textContent) && /Salón Terraza/.test(box.textContent), 'éxito');
console.assert(dataLayer.filter(function (e) { return e.event === 'devkit_lab_apartado'; }).length === 1, 'un solo apartado');
box.remove(); 'ok';
```

Y con `?lab=preview&ahora=2026-10-21T13:30&bust=21`: los radios `10:40` y `13:00` están `disabled` y dicen "Cerrado".

- [ ] **Step 2: Correrla y ver que falla** (`montar` no existe).
- [ ] **Step 3: Implementar `montar`** y los estilos (`.cip-lab`, `.cip-lab__slot` en rejilla de 2 columnas, 1 en ≤ 640 px; estado deshabilitado con opacidad 0.5; colores por posición verde/menta/cian como los pasos 01-02-03).
- [ ] **Step 4: Correr ambas pruebas.** Esperado: `'ok'` y los dos horarios cerrados. Para el caso de red: con `ENDPOINT_LAB` temporal `'http://localhost:9/x'` (sin `?lab=preview`), montar y comprobar que tras ≤ 8 s los 4 horarios quedan disponibles; **regresar `ENDPOINT_LAB` a `''`**.

---

### Task 3: Selector en el modal de gracias

**Files:**
- Modify: `index.html` (dentro de `<dialog data-rsvp-thanks>`, entre el `<p class="cip-thanks__text">` y el botón "Entendido": `<div class="cip-thanks__lab" data-lab-thanks hidden></div>` con un comentario que explique que lo llena `devkit-lab.js`)
- Modify: `devkit-lab.js`, `styles.css`

**Interfaces:**
- Consumes: `BEYOND_LAB.montar`, `BEYOND_LAB.modo`, `BEYOND_LAB.abiertos`.

Comportamiento:
- Escucha `submit` del `[data-rsvp-form]` en fase de captura y guarda `form.correo.value.trim()` en una variable (no se toca `rsvp-form.js`).
- En `beyond:lead`: si `modo() !== 'apagado'`, hay correo guardado y `abiertos(BeyondClock.mx()).length > 0`, muestra `[data-lab-thanks]` con el título "¿Apartas tu lugar en el laboratorio DevKit AI?" y llama `montar(contenedor, {correo}, 'modal')`. Junto al botón "Apartar mi lugar" va "Ahora no" (botón secundario que oculta el contenedor). Después de usarse, olvida el correo.
- Al cerrar el diálogo, vaciar y ocultar `[data-lab-thanks]` para que un segundo registro empiece limpio.

- [ ] **Step 1: Prueba de consola** (en `?lab=preview&bust=30`):

```js
var f = document.querySelector('[data-rsvp-form]');
f.correo.value = 'prueba@ejemplo.com';
f.dispatchEvent(new Event('submit', { cancelable: true }));   // rsvp-form.js lo valida y no envía: solo queremos la captura
document.querySelector('[data-rsvp-thanks]').showModal();
document.dispatchEvent(new CustomEvent('beyond:lead'));
var lab = document.querySelector('[data-lab-thanks]');
console.assert(!lab.hidden && lab.querySelectorAll('input[name="horario"]').length === 4, 'selector en modal');
document.querySelector('[data-rsvp-thanks]').close();
console.assert(lab.hidden && lab.children.length === 0, 'limpio al cerrar');
'ok';
```

Además: sin `?lab=preview` el mismo snippet deja `lab.hidden === true` (apagado); con `?lab=preview&ahora=2026-10-21T17:30` también (todos cerrados); y un `beyond:lead` sin submit previo no muestra el selector.

- [ ] **Step 2: Correr y ver que falla** (`[data-lab-thanks]` no existe).
- [ ] **Step 3: Implementar** marcado, escuchas y estilos (`.cip-thanks__lab`: separador superior de 1 px, margen 24 px, alineado a la izquierda dentro de la caja centrada).
- [ ] **Step 4: Correr las cuatro verificaciones.** Esperado: `'ok'` y los tres casos ocultos. **Nunca** enviar un registro real al flujo B en estas pruebas: confirmar con `read_network_requests` (o la pestaña Red) que no hubo POST a `powerplatform.com`.

---

### Task 4: Llegada desde la liga (`?id=`)

**Files:**
- Modify: `index.html` (antes de la navegación fija: `<dialog class="cip-thanks cip-lab-dialog" data-lab-dialog aria-labelledby="lab-dialog-title">` con caja `.cip-thanks__box`, eyebrow "Laboratorio DevKit AI", título `#lab-dialog-title` "Ya estás registrado en Beyond", texto "Elige tu horario para el laboratorio DevKit AI.", contenedor `[data-lab-liga]` y botón "Cerrar" `[data-lab-close]`)
- Modify: `devkit-lab.js`, `styles.css`

**Interfaces:**
- Consumes: `BEYOND_LAB.idDeUrl`, `montar`, `modo`, `abiertos`.

Comportamiento: al cargar, si `idDeUrl(location.search)` no es vacío, `modo() !== 'apagado'` y hay horarios abiertos → `montar(contenedor, {id}, 'liga')` y `showModal()`. Cierra con el botón, con clic fuera y con Esc. Si todos están cerrados, no abre nada.

- [ ] **Step 1: Verificaciones** (cada una en una carga nueva):
  - `?lab=preview&id=BYD-261016101500-a1f9&bust=40` → `document.querySelector('[data-lab-dialog]').open === true` y 4 radios dentro.
  - `?lab=preview&id=BYD-123&bust=41` → `open === false`.
  - `?id=BYD-261016101500-a1f9&bust=42` (sin preview, endpoint vacío) → `open === false`.
  - `?lab=preview&id=BYD-261016101500-a1f9&ahora=2026-10-21T18:00&bust=43` → `open === false`.
- [ ] **Step 2: Correr y ver que fallan** (el diálogo no existe).
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Correr las cuatro.** Esperado: `true, false, false, false`. Revisar a 375 px que el diálogo no desborde (`scrollWidth <= innerWidth`).

---

### Task 5: Ajuste de la sección `#laboratorio`

**Files:**
- Modify: `index.html` (sección `#laboratorio`), `styles.css` (bloque DevKit existente), `devkit-lab.js`

Cambios exactos de texto:
- Botón principal: "Registra tu asistencia" (sigue `href="#registro"`, sin `data-devkit-register`).
- Debajo del botón, sustituye "Horario, duración y requisitos por confirmar." por: `<p class="cip-devkit__note"><strong>Inscríbete después de registrar tu asistencia.</strong> Cupo limitado: 4 horarios de 10 lugares, consulta sus horas en la <a href="#programa">agenda</a>.</p>`
- Tarjeta de cierre: título igual; texto "¿Ya te registraste? Usa la liga de tu correo para elegir tu horario."; se quitan la casilla y el `<p data-devkit-status>`; el botón "Ir al registro" se queda.

- [ ] **Step 1: Verificación:** en `?bust=50`, `document.querySelector('#laboratorio input')` es `null`, el texto de la sección incluye "Inscríbete después de registrar tu asistencia", y `#laboratorio a[href="#programa"]` existe.
- [ ] **Step 2: Correr y ver que falla.**
- [ ] **Step 3: Implementar** y quitar del CSS las reglas `.cip-devkit__check`, `.cip-devkit__status` y la columna de la casilla en `.cip-devkit__register` (vuelve a 2 columnas: texto | botón).
- [ ] **Step 4: Correr la verificación** y revisar a 1280, 800 y 375 px sin desborde horizontal (`document.documentElement.scrollWidth <= innerWidth`) y sin errores en consola.

---

### Task 6: Documentación

**Files:**
- Modify: `docs/ARQUITECTURA.md` (panorama: línea `Invitado ──► index.html?id=BYD-… ──(JSON)──► Flujo M`; sección "Laboratorio (`devkit-lab.js`)" con el contrato copiado del spec y los modos apagado/preview)
- Modify: `docs/FLUJOS.md` (filas **M** "Apartar lugar en el laboratorio DevKit AI · HTTP desde `devkit-lab.js` · 📝", **M1** "Invitación al laboratorio a registrados con perfil TI · Programado diario hasta el 20 oct · 📝"; nota en C: "consulta Reservas en el stand del laboratorio"; M y M1 en "Quién los edita" con Automatización)
- Modify: `.claude/CLAUDE.md` (fila de `devkit-lab.js` con el comportamiento nuevo; agregar M y M1 a la lista de flujos de la sección de flujos y a "Los flujos nuevos … los modifica Automatización")

- [ ] **Step 1:** Escribir los tres cambios.
- [ ] **Step 2: Verificación:** `grep -n "Flujo M\|\*\*M\*\*\|\*\*M1\*\*\|laboratorio-devkit" docs/ARQUITECTURA.md docs/FLUJOS.md .claude/CLAUDE.md` muestra coincidencias en los tres archivos y ninguna URL con `sig=`.
- [ ] **Step 3:** En el reporte final, recordar que hay que **avisar para actualizar `privada/docs/FLUJOS.md`** y escribir las guías `privada/docs/flujo-M/` y `flujo-M1/` (no están en esta máquina).
