# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# CiiSA Beyond Expo 2026 · landing

Landing de registro de **CiiSA Beyond Expo 2026**: miércoles 21 de octubre de 2026, 10:00 a 21:00 (horario abierto), El Ejecutivo Eventos, Río Danubio 395-B Ote., Del Valle, San Pedro Garza García, N.L. La métrica que manda es el número de registros. Contexto de producto, audiencia y tono: `PRODUCT.md` (lo usa Impeccable). Para incorporarse al proyecto: `README.md` y `docs/ARQUITECTURA.md` (contrato con los flujos). El traspaso (quién hace qué, accesos, estado, riesgos) está en `privada/handoff-beyond.md`.

**Este repo es público y este archivo se sube a git.** No pongas aquí URLs firmadas, tokens, contraseñas, correos ni datos de personas, ni nombres de sitios o archivos de SharePoint. Lo que no deba ser público va en la carpeta `privada/` (está en `.gitignore` y se comparte por zip) y lo privado de cada máquina, en `CLAUDE.local.md` (también ignorado).

**Regla del registro en vivo:** `index.html` y `rsvp-form.js` ya reciben registros reales. Se deja intacto lo que capta el primer encuentro (campos, nombres de campo, payload, respuesta de los flujos B y G). Lo nuevo se construye al lado, sin tocarlo, y cualquier cambio ahí se avisa antes.

## Fuente de verdad de los flujos (no se replica aquí)

Los flujos de Power Automate (A, B, C, E, E.2, F, G, H, I, I2, J, J1, K, L, L2, M, M1), el Excel maestro, la parte de HubSpot de Pyxoom 5 y las plantillas de correo **se documentan en la carpeta `privada/`** (fuera de git), no en este repo (aquí `docs/FLUJOS.md` solo trae el mapa de alto nivel):

- `privada/docs/FLUJOS.md` · mapa completo y estado de los flujos. La sección 3 es la de Beyond.
- `privada/docs/correos-beyond/` · plantillas HTML de los correos de Beyond, con su `README.md` (expresión del nombre por flujo) y `preview.html`.
- `privada/docs/flujo-F/`, `flujo-I/`, `flujo-I2/`, `flujo-J1/` y `flujo-L/` (con `L2-rebotes.md`) · guías paso a paso de esos flujos.

`privada/` es una copia de entrega; la fuente de los flujos vive en el repo privado de Diseño y su ruta está en `CLAUDE.local.md`. Si no tienes `privada/`, pídela por zip. **Antes de responder o cambiar algo de flujos, Excel, HubSpot o correos, lee esos archivos**; no confíes en lo que recuerdes. Si ves que algo de este repo cambia un flujo (por ejemplo, el payload de `rsvp-form.js` o una URL del sitio), avisa para actualizar `FLUJOS.md` allá. No copies su contenido a este repo.

Reglas de trabajo con los flujos:
- Los flujos nuevos (I, I2, J, J1, K, L, L2, M, M1) los modifica Automatización; el QR (C, que absorbe al antiguo D) y la etiqueta, Diseño. Claude no tiene acceso por API a Power Automate: da pasos y expresiones para que la persona los arme a mano.
- Power Automate evalúa cualquier `@` seguido de `{` en un cuerpo HTML, incluso dentro de comentarios.
- *Enumerar filas* de Excel Online devuelve respuestas **en caché** si la consulta se repite idéntica (`x-ms-apihub-cached-response: true`) y solo admite un filtro simple (un `eq`, `ne`, `contains`, `startswith` o `endswith`; `and` da `BadRequest`). Cambiar `$top` o usar `rand(…)` **no** la evita. Para decidir si algo ya se hizo, no te apoyes en una lectura de lista: escribe una marca con *Actualizar una fila* (no usa caché), vuelve a leer esa fila con *Obtener una fila* antes de actuar, y para dos criterios filtra por uno y usa *Filtrar matriz* con el otro.
- En el diseñador de Power Automate, si no aparece "modo avanzado" en una condición, se usa una expresión (pestaña *Expresión*) a la izquierda, `es igual a` y `true` a la derecha.
- **Envíos masivos (lección del 12 oct, J1 mandó 593 correos a 65 personas):** la clave de unicidad es el **correo**, no el ID; la marca de "ya enviado" va en el maestro (columna `InvitacionExp`) y se escribe **antes** de enviar; el correo va al final de una cadena de verificaciones y cualquier duda lo detiene; control de simultaneidad en 1 en el disparador; tope de lectura y de envíos por ciclo; en modo prueba no se escribe nada. No leas *Elementos enviados* con *Obtener correos (V3)* para deduplicar: el destinatario viene en `toRecipients` (no `to`), cada correo trae su cuerpo y con 1000 se agota el tiempo.
- En *Configurar ejecutar después* las casillas se suman: para una rama solo de error, **desmarca *Es correcto*** y marca *Ha fallado* y *Ha expirado*. Si no, corre también tras el éxito.
- Los nombres de acciones se escriben **sin corchetes** (los corchetes de las guías solo señalan el nombre); con corchetes Power Automate los convierte en guiones bajos y rompe las referencias. Borrar una condición borra lo que tiene dentro.
- `destinoPrueba` vacío es un envío real. No lo dejes vacío sin un filtro temporal que limite la lista a tus filas de prueba.
- Copilot de Power Automate edita variables, `Compose` y frecuencia/intervalo del disparador; no condiciones, filtros (`Pendientes`), zona horaria ni horario, y a veces dice haber hecho cambios que no hizo. Antes de activar una prueba real, revisa la versión **guardada** del flujo (filtro temporal, `destinoPrueba` vacío, límite y fecha de la guardia).

## Stack y estructura

HTML, CSS y JS vanilla. Sin framework ni paso de build: no agregues ninguno sin preguntar.

| Archivo | Qué hace |
|---|---|
| `index.html` | Página única. Lleva una **pantalla de carga** (fondo negro y la O de Beyond que se llena; CSS y JS en línea, `#cip-loader`): se quita al cargar la página (mínimo 0.7 s, máximo 4.5 s), marca `window.__beyondLoaded` y avisa con el evento `beyond:loader-done`; `ya-empezamos.js` espera ese evento. Sin JS no se muestra. Secciones en orden: hero (`.cip-hero`) → `#ilusionista` "Más allá de la tecnología" + grilla de logos → `#programa` agenda por hora (3 espacios) → `#agenda` (¿Para quién es BEYOND?, cifras +18/+10/+50, "Tu registro incluye" con 5 beneficios, tagline) → `#laboratorio` (laboratorio práctico DevKit AI) → `#como-llegar` (fecha, subtítulos, lugar) → `#registro` (contador + formulario) → `#ilusionista-2` "¿Quién es CiiSA?" + badges → `#marcas` (carrusel) → footer |
| `styles.css` | Todo el CSS de la landing. Los ajustes nuevos se agregan **al final**, en bloques con un comentario que explica el cambio |
| `mi-experiencia.html`, `.js`, `.css` | Encuesta "Diseña tu experiencia" (5 pasos, ruta de marcas por invitado, `?id=BYD-…`). El CSS va aparte para no tocar `styles.css`, que es el de producción. Envía al Flujo I (`ENDPOINT_PERFIL`; si se vacía, vuelve a vista previa). Contrato en `docs/ARQUITECTURA.md` |
| `catalogo-data.js` | Etiquetas de cada marca para la encuesta; espejo del catálogo de marcas en Excel. El vocabulario de `OPCIONES` en `mi-experiencia.js`, estas etiquetas y el Excel deben coincidir |
| `hero-lottie.js` | Logo animado Beyond + CiiSA para la encuesta (el index lo tiene en línea) |
| `rsvp-form.js` | Formulario propio: validación (Empresa y Puesto pasan además por un filtro estático, `esBasura`, que frena "N/A", "nada", "ama de casa", solo números, teclazos y groserías; las listas `BASURA`, `BASURA_EN` y `GROSERIAS` se ajustan en el archivo; no cambia campos ni payload; además, al registrarse guarda un hash del correo en `localStorage` `beyond:registrados` y, si ese correo se vuelve a escribir en el mismo navegador, el campo avisa y el botón queda apagado; `?registro=libre` lo desactiva para pruebas; solo ve el propio dispositivo), botón deshabilitado hasta que todo es válido, POST JSON al Flujo B (`origen: 'landing-beyond'` + UTM), modal `<dialog data-rsvp-thanks>`, evento `beyond:lead`. Si falla, enlaza al Microsoft Forms de respaldo (`data-fallback`) |
| `invito-data.js`, `invito-field.js` | Campo "¿Quién te invitó?" del registro: combobox ARIA con autocompletado restringido a `window.CIISA_INVITO` (canales y asesores, solo nombre y primer apellido porque el repo es público). La validación vive en `rsvp-form.js`; el valor viaja como `invito` (también al Flujo G). Para sumar o quitar un ejecutivo se edita la lista |
| `tracking.js` | UTM a `sessionStorage` y eventos al `dataLayer`. Píxeles de Meta, LinkedIn y TikTok solo cargan si su ID está en `CONFIG`. Google va por GTM (`GTM-TFCPQDS8`) y la etiqueta de Google Ads está en `index.html` |
| `logos-data.js` | Lista única de marcas (`window.CIISA_LOGOS`); la usan `logos-grid.js` (grilla) y `brands-carousel.js` (carrusel). `grid: false` saca una marca de la grilla |
| `agenda-data.js`, `agenda-board.js` | Agenda por hora de `#programa`: los datos (espacios, horarios, títulos, marcas y, opcional, `etiqueta`: la palabra que se ve en lista en lugar del nombre del espacio, sin afectar los filtros) viven en `agenda-data.js` y `agenda-board.js` dibuja el tablero. Escritorio: dos columnas (PC Experiencias comparte la segunda con los laboratorios, sin cabecera propia y rotulada con una etiqueta vertical, y se solapa un poco con el laboratorio de Autodesk) y una fila por cada 5 minutos; tablet y celular (≤1024 px): lista por hora con filtros por espacio. Los horarios marcados "por confirmar" en el archivo se dedujeron del arte de la agenda. El día del evento el tablero se pone en vivo: línea de "ahora" en escritorio, eventos terminados en gris, y en tablet y celular los terminados se ocultan y el botón flotante `[data-nav-past]` (aparte de la navegación, sobre el de WhatsApp) los muestra u oculta con una animación de colapso (Web Animations; sin animar con `prefers-reduced-motion`) que mantiene fija en pantalla la posición de lo que se está viendo (`holdView`: corrige el scroll con `behavior: 'instant'` en cada cuadro y apaga `overflow-anchor` en el tablero; el `html` tiene `scroll-behavior: smooth`, que haría lenta la corrección); ese botón solo se ve cuando, dentro de la agenda, está en pantalla el "ahora" (el evento en curso o, si no hay, el siguiente; con los pasados revelados también mientras se recorren), con un margen de 150 px (`NOW_PAD` en `site-nav.js`), nunca en los eventos futuros (`site-nav.js` pone `.is-agenda` en él, avisado por el evento `beyond:agenda-state`, y el CSS lo desvanece en 0.5 s, con 0.3 s de espera al aparecer). Ayudas cognitivas: ojo cerrado = pasados escondidos y ojo abierto = a la vista; el globo cuenta los pasados aún no vistos (se dan por vistos al recorrerlos con el botón en "revelado") y se apaga tras más de 3 pulsaciones hasta 2 horas después (`localStorage` `beyond:past-hint`); y un aviso de texto sale una vez al llegar a la agenda |
| `beyond-clock.js` | Reloj compartido en hora de Monterrey (UTC-6) para la agenda en vivo y la celebración. Para probar sin esperar al evento, agrega `?ahora=2026-10-21T14:10` a la dirección (hora de Monterrey): el reloj arranca ahí y sigue avanzando |
| `ya-empezamos.js` | Celebración "¡Ya empezamos!" (confeti en Lottie, `assets/lottie/confeti-horizontal.json` o `-vertical.json` según la orientación, y la frase) por 5 s, por encima de todo. Sale una sola vez por dispositivo (marca en `localStorage`) la primera vez que alguien entra el día del evento entre 10:00 y 11:00; con `?ahora=` no guarda la marca. Los Lottie los genera un script de una sola corrida, no hay fuente editable en el repo |
| `site-nav.js` | Navegación fija con Inicio (`#inicio`), Agenda (`#programa`), Laboratorio (`#laboratorio`) y Registro (`#registro`), en el orden de la página (el espía de scroll lo necesita): marca la sección activa y mueve la pastilla; en escritorio va arriba a la derecha y en tablet y celular abajo a la izquierda, junto al botón de WhatsApp. En celular (≤640 px) cada enlace se ve como ícono (el texto queda solo para lectores de pantalla). También hace el parallax de scroll (contenido del hero, video de fondo y elementos con `data-parallax`), en un solo `requestAnimationFrame` y apagado con `prefers-reduced-motion`. Los enlaces a `#registro` dentro del `<nav>` ya los cuenta `tracking.js` como `ubicacion: nav` |
| `devkit-lab.js` | Laboratorio DevKit AI (4 horarios TI de `agenda-data.js`, 10 lugares cada uno). La sección `#laboratorio` solo informa ("Inscríbete después de registrar tu asistencia") y anima los pasos 01-02-03. El selector de horario sale en el modal de gracias tras `beyond:lead` (envía el correo, que toma al enviar el formulario **sin tocar `rsvp-form.js`**) y en `<dialog data-lab-dialog>` al abrir la landing con `?id=BYD-…` (envía el ID). Va al flujo M (`ENDPOINT_LAB`): vacío = apagado; `?lab=preview` simula. Cada horario se cierra a su hora de inicio (se prueba con `?ahora=`). Contrato en `docs/ARQUITECTURA.md`; diseño en `docs/superpowers/specs/` |
| `exp-slots.js` | Animación tipo slot de las cifras y aparición escalonada de los beneficios (igual que los badges) |
| `badges-grid.js`, `countdown.js`, `hero-*.js` | Badges, contador al 2026-10-21T10:00-06:00 y animaciones del hero (Lottie en `assets/lottie/`). A esa hora (con el reloj de `beyond-clock.js`, que se puede simular con `?ahora=`) `countdown.js` pone `.is-now` en `#registro`: el contador se cambia por "Beyond is Now" y "Confirma tu asistencia" por "Regístrate para ingresar", en el título del registro y en el botón del hero, y el modal de gracias deja de confirmar el lugar para decir que en unos momentos entregan el QR de acceso (los dos estados viven en el HTML, con las clases `cip-state--before` y `cip-state--now`; la marca `.is-now` va en `#registro` y en `<html>`) |

Convenciones visuales:
- Palabras clave en degradado con la clase `cip-hero__headline-span--pulse`. Colores CiiSA: `#BCF200` → `#01FBCE` → `#00CCFF`. Tipografía Poppins.
- Breakpoints: móvil ≤ 640 px, tablet 641 a 1024 px, escritorio ≥ 1025 px. Las animaciones de entrada usan IntersectionObserver.
- El proyecto tiene hooks de Impeccable. Se aceptaron a propósito: texto en degradado, franja del modal y easing con rebote.

## Probar en local

- No hay pruebas automatizadas, linter ni build: se verifica en el navegador.
- Servir con `py -m http.server 8766` desde la raíz (`python` no está en el PATH; `py` sí).
- El navegador integrado cachea CSS y JS: agrega `?bust=<n>` o recarga la hoja por JS antes de medir.
- Con el panel oculto, las capturas salen en blanco y se congelan transiciones, rAF e IntersectionObserver: mide con JS (`getBoundingClientRect`) y revisa 1280, 800 y 375 px.

## Publicación

- GitHub Pages desde `main` / raíz → **https://beyond.ciisa.com** (archivo `CNAME`; HTTPS forzado). `lex-psw.github.io/ciisa-beyond` redirige ahí. Pages cachea unos 10 minutos.
- **Diseño hace los commits y el push a `main`.** No hagas commit ni push sin que te lo pidan. Otras personas trabajan en una rama y abren un pull request.
- Las URLs absolutas del sitio (etiquetas `og:`/`twitter:`, banner del correo) usan `https://beyond.ciisa.com/`.

## Material fuera del repo

En la carpeta padre (`../`), para que no se publique con el sitio (no está en git: se pide por separado):
- `Carrusel Beyond/` · carrusel de 9 slides 1080×1350 en PNG y SVG editable. `fuente/` tiene `slides.html` y los scripts: `render.sh` saca los PNG con Edge headless; `node server.js` + `node build-svg.js` sacan los SVG.
- `Invitacion Beyond/` · invitación v1 y v2 (PNG y SVG) con su `fuente/` y el diagrama de flujos. Las plantillas de correo no se guardan aquí: viven en `privada/docs/correos-beyond/`.
