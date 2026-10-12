# CiiSA Beyond Expo 2026

Landing de registro de **CiiSA Beyond Expo 2026**, el evento de tecnología de CiiSA | PSW:

- **Cuándo:** miércoles 21 de octubre de 2026, de 10:00 a 21:00.
- **Dónde:** El Ejecutivo Eventos, Río Danubio 395-B Ote., Del Valle, San Pedro Garza García, N.L.
- **Sitio:** https://beyond.ciisa.com
- **Métrica que manda:** número de registros.

HTML, CSS y JavaScript sin framework ni paso de build. El único servidor es Power Automate (los formularios mandan JSON a flujos). No agregues un framework ni un bundler sin acordarlo antes.

> **El repositorio es público.** No guardes aquí tokens, contraseñas, ligas firmadas nuevas, correos ni datos de personas. Todo lo que no deba ser público va en la carpeta `privada/`, que está en `.gitignore` y se comparte por zip.

## Páginas

| Página | Estado | Qué es |
|---|---|---|
| `index.html` | **En producción** | Landing con el formulario de registro. **No cambies el registro** (campos, validación, payload, flujos) sin avisar: está recibiendo registros reales. |
| `mi-experiencia.html` | En desarrollo | Encuesta "Diseña tu experiencia" de 5 pasos que arma una ruta de marcas por invitado. Se abre con `?id=BYD-…`. Ver [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md#encuesta-mi-experiencia). |

## Archivos

| Archivo | Qué hace |
|---|---|
| `styles.css` | Todo el CSS de la landing. Los ajustes nuevos van al final con un comentario. |
| `mi-experiencia.css` | CSS de la encuesta, aparte para no tocar el de producción. Carga después de `styles.css`. |
| `rsvp-form.js` | Formulario de registro: validación, envío a Power Automate, modal de gracias. |
| `invito-data.js`, `invito-field.js` | Lista y autocompletado de "¿Quién te invitó?". |
| `tracking.js` | UTM, fuente de la visita y eventos al `dataLayer`. Píxeles solo si hay ID. Google va por GTM. |
| `logos-data.js` | Lista única de marcas (grilla y carrusel). |
| `catalogo-data.js` | Etiquetas de cada marca para la encuesta. Espejo del catálogo de marcas que se mantiene en Excel. |
| `mi-experiencia.js` | Encuesta, cálculo de la ruta y envío al flujo. |
| `hero-lottie.js` | Logo animado Beyond + CiiSA (lo usa la encuesta; el index lo tiene en línea). |
| `hero-*.js`, `countdown.js`, `exp-slots.js`, `badges-grid.js`, `logos-grid.js`, `brands-carousel.js` | Animaciones y secciones de la landing. |
| `assets/` | Imágenes, logos SVG, animaciones Lottie y video de fondo. |
| `CNAME` | Dominio `beyond.ciisa.com` para GitHub Pages. |

## Probar en local

```bash
py -m http.server 8766
```

Abre `http://localhost:8766/` (landing) o `http://localhost:8766/mi-experiencia.html`. En Windows `python` puede no estar en el PATH; `py` sí. Si el navegador cachea CSS o JS, agrega `?bust=1` a la URL o haz recarga forzada. Revisa en 1280, 800 y 375 px de ancho.

## Publicar

GitHub Pages sirve la rama `main` desde la raíz. Un push a `main` publica en unos 10 minutos. Antes de empujar, prueba en local y confirma que el registro de `index.html` sigue funcionando.

## Documentación

- [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md): cómo está armado el front y el contrato con los flujos de Power Automate.
- [docs/FLUJOS.md](docs/FLUJOS.md): mapa de alto nivel de los flujos. El detalle, el traspaso y las plantillas de correo están en la carpeta `privada/` (fuera de git; pídela por zip a quien administra el proyecto).
- [.claude/CLAUDE.md](.claude/CLAUDE.md): contexto para trabajar con Claude Code en este repo.
