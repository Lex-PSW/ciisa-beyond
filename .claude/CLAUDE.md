# CiiSA Beyond Expo 2026 · landing

Landing de registro de **CiiSA Beyond Expo 2026**: miércoles 21 de octubre de 2026, 10:00 a 21:00 (horario abierto), El Ejecutivo Eventos, Río Danubio 395-B Ote., Del Valle, San Pedro Garza García, N.L. La métrica que manda es el número de registros. Contexto de producto, audiencia y tono: `PRODUCT.md` (lo usa Impeccable). Para incorporarse al proyecto: `README.md` y `docs/ARQUITECTURA.md` (contrato con los flujos). El traspaso (quién hace qué, accesos, estado, riesgos) está en `privada/handoff-beyond.md`.

**Este repo es público y este archivo se sube a git.** No pongas aquí URLs firmadas, tokens, contraseñas, correos ni datos de personas, ni nombres de sitios o archivos de SharePoint. Lo que no deba ser público va en la carpeta `privada/` (está en `.gitignore` y se comparte por zip) y lo privado de cada máquina, en `CLAUDE.local.md` (también ignorado).

**Regla del registro en vivo:** `index.html` y `rsvp-form.js` ya reciben registros reales. Se deja intacto lo que capta el primer encuentro (campos, nombres de campo, payload, respuesta de los flujos B y G). Lo nuevo se construye al lado, sin tocarlo, y cualquier cambio ahí se avisa antes.

## Fuente de verdad de los flujos (no se replica aquí)

Los flujos de Power Automate (A, B, C, E, E.2, F, G, H, I, I2, J, J1, K, L, L2), el Excel maestro, la parte de HubSpot de Pyxoom 5 y las plantillas de correo **se documentan en la carpeta `privada/`** (fuera de git), no en este repo (aquí `docs/FLUJOS.md` solo trae el mapa de alto nivel):

- `privada/docs/FLUJOS.md` · mapa completo y estado de los flujos. La sección 3 es la de Beyond.
- `privada/docs/correos-beyond/` · plantillas HTML de los correos de Beyond, con su `README.md` (expresión del nombre por flujo) y `preview.html`.
- `privada/docs/flujo-F/`, `flujo-I/`, `flujo-I2/`, `flujo-J1/` y `flujo-L/` (con `L2-rebotes.md`) · guías paso a paso de esos flujos.

`privada/` es una copia de entrega; la fuente de los flujos vive en el repo privado de Diseño y su ruta está en `CLAUDE.local.md`. Si no tienes `privada/`, pídela por zip. **Antes de responder o cambiar algo de flujos, Excel, HubSpot o correos, lee esos archivos**; no confíes en lo que recuerdes. Si ves que algo de este repo cambia un flujo (por ejemplo, el payload de `rsvp-form.js` o una URL del sitio), avisa para actualizar `FLUJOS.md` allá. No copies su contenido a este repo.

Reglas de trabajo con los flujos:
- Los flujos nuevos (I, I2, J, J1, K, L, L2) los modifica Automatización; el QR (C, que absorbe al antiguo D) y la etiqueta, Diseño. Claude no tiene acceso por API a Power Automate: da pasos y expresiones para que la persona los arme a mano.
- Power Automate evalúa cualquier `@` seguido de `{` en un cuerpo HTML, incluso dentro de comentarios.
- *Enumerar filas* de Excel Online devuelve respuestas **en caché** si la consulta se repite idéntica (`x-ms-apihub-cached-response: true`) y solo admite un filtro simple (un `eq`, `ne`, `contains`, `startswith` o `endswith`; `and` da `BadRequest`). Para ver lo recién escrito, activa *Primeros puestos* con `rand(…)`; para dos criterios, filtra por uno y usa *Filtrar matriz* con el otro.
- En el diseñador de Power Automate, si no aparece "modo avanzado" en una condición, se usa una expresión (pestaña *Expresión*) a la izquierda, `es igual a` y `true` a la derecha.

## Stack y estructura

HTML, CSS y JS vanilla. Sin framework ni paso de build: no agregues ninguno sin preguntar.

| Archivo | Qué hace |
|---|---|
| `index.html` | Página única. Secciones en orden: hero (`.cip-hero`) → `#ilusionista` "Más allá de la tecnología" + grilla de logos → `#agenda` (¿Para quién es BEYOND?, cifras +18/+10/+50, "Tu registro incluye" con 5 beneficios, tagline) → `#como-llegar` (fecha, subtítulos, lugar) → `#registro` (contador + formulario) → `#ilusionista-2` "¿Quién es CiiSA?" + badges → `#marcas` (carrusel) → footer |
| `styles.css` | Todo el CSS de la landing. Los ajustes nuevos se agregan **al final**, en bloques con un comentario que explica el cambio |
| `mi-experiencia.html`, `.js`, `.css` | Encuesta "Diseña tu experiencia" (5 pasos, ruta de marcas por invitado, `?id=BYD-…`). El CSS va aparte para no tocar `styles.css`, que es el de producción. Envía al Flujo I (`ENDPOINT_PERFIL`; si se vacía, vuelve a vista previa). Contrato en `docs/ARQUITECTURA.md` |
| `catalogo-data.js` | Etiquetas de cada marca para la encuesta; espejo del catálogo de marcas en Excel. El vocabulario de `OPCIONES` en `mi-experiencia.js`, estas etiquetas y el Excel deben coincidir |
| `hero-lottie.js` | Logo animado Beyond + CiiSA para la encuesta (el index lo tiene en línea) |
| `rsvp-form.js` | Formulario propio: validación, botón deshabilitado hasta que todo es válido, POST JSON al Flujo B (`origen: 'landing-beyond'` + UTM), modal `<dialog data-rsvp-thanks>`, evento `beyond:lead`. Si falla, enlaza al Microsoft Forms de respaldo (`data-fallback`) |
| `tracking.js` | UTM a `sessionStorage` y eventos al `dataLayer`. Píxeles de Meta, LinkedIn y TikTok solo cargan si su ID está en `CONFIG`. Google va por GTM (`GTM-TFCPQDS8`) y la etiqueta de Google Ads está en `index.html` |
| `logos-data.js` | Lista única de marcas (`window.CIISA_LOGOS`); la usan `logos-grid.js` (grilla) y `brands-carousel.js` (carrusel). `grid: false` saca una marca de la grilla |
| `exp-slots.js` | Animación tipo slot de las cifras y aparición escalonada de los beneficios (igual que los badges) |
| `badges-grid.js`, `countdown.js`, `hero-*.js` | Badges, contador al 2026-10-21T10:00-06:00 y animaciones del hero (Lottie en `assets/lottie/`) |

Convenciones visuales:
- Palabras clave en degradado con la clase `cip-hero__headline-span--pulse`. Colores CiiSA: `#BCF200` → `#01FBCE` → `#00CCFF`. Tipografía Poppins.
- Breakpoints: móvil ≤ 640 px, tablet 641 a 1024 px, escritorio ≥ 1025 px. Las animaciones de entrada usan IntersectionObserver.
- El proyecto tiene hooks de Impeccable. Se aceptaron a propósito: texto en degradado, franja del modal y easing con rebote.

## Probar en local

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
