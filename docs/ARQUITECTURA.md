# Arquitectura

Cómo está armado el front y qué le promete a Power Automate. Es un documento público: aquí no van ligas firmadas, tokens ni datos de personas.

## Panorama

```
Visitante ──► index.html ──(JSON)──► Flujo B  ──► Excel maestro + correo de confirmación
                          └─(JSON)──► Flujo G  ──► Excel de invitaciones (quién invitó, fuente)

Invitado  ──► mi-experiencia.html?id=BYD-… ──(JSON)──► Flujo I ──► Excel de perfiles + correo "Tu ruta Beyond"
```

- El sitio es estático (GitHub Pages). **Power Automate es la única parte con servidor.**
- Cada flujo arranca con "Cuando se recibe una solicitud HTTP" (conector Premium). La URL del disparador lleva una firma (`sig=…`) y por diseño queda en el JS del navegador.
- Los demás flujos (HubSpot → Excel, QR, calendario, campaña de correos) no tienen contacto con este repo. Ver [FLUJOS.md](FLUJOS.md).

## Registro (`index.html` + `rsvp-form.js`) · en producción

**No modificar sin avisar.** Cualquier cambio en campos, nombres de campo, validación u orden puede romper los flujos B y G y los correos.

Campos que viajan en el POST (JSON):

| Campo | Origen |
|---|---|
| `nombre`, `empresa`, `puesto`, `correo`, `telefono` | Formulario |
| `invito` | "¿Quién te invitó?" (autocompletado restringido a `invito-data.js`) |
| `privacidad` | `"Aceptado"` (casilla obligatoria) |
| `fecha` | ISO 8601 del navegador |
| `origen` | Siempre `"landing-beyond"` |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` | `tracking.js`; vacíos si no hubo campaña |
| `fuente`, `procedencia` | `tracking.js`: Google Ads, LinkedIn Ads, LinkedIn, Correo, Directo… y dominio de procedencia |

Destinos:

| Constante en `rsvp-form.js` | Flujo | Respuesta |
|---|---|---|
| `ENDPOINT` | **B** · agrega la fila al Excel maestro con un ID `BYD-aammddhhmmss-xxxx`, evita duplicados por correo y manda la confirmación | `200` si guardó; `403` si no viene de la landing |
| `ENDPOINT_INVITO` | **G** · copia al Excel de invitaciones. Si falla, no afecta al registro | no se lee |

Comportamiento: botón desactivado hasta que todo es válido; campo trampa `website` (si viene lleno, se finge éxito sin enviar); si el flujo falla, se ofrece el Microsoft Forms de respaldo (`data-fallback`). Al éxito se abre el `<dialog data-rsvp-thanks>` y se emite el evento `beyond:lead`.

## Encuesta (`mi-experiencia`)

Estado: **publicada y conectada al flujo I** (12 oct 2026).

- **Entrada:** `mi-experiencia.html?id=BYD-aammddhhmmss-xxxx` (el ID del registro). Sin ID, la última pantalla pide el correo con el que se registró.
- **Pasos:** industria (una opción), tecnologías (varias), qué resolver (hasta 3), marcas que quiere ver (opcional) y objetivo (varias) + casilla "quiero que me contacte un asesor".
- **Ruta:** se calcula en el navegador. Cada marca suma 2 puntos por cada tecnología y solución en común, +2 si coincide la industria y +5 si el visitante la eligió. Se muestran de 3 a 6 marcas con el motivo.
- **Vocabulario cerrado:** industrias, tecnologías, soluciones y objetivos viven en `OPCIONES` (`mi-experiencia.js`). Las etiquetas de cada marca, en `catalogo-data.js`. Ambos deben coincidir con el catálogo que se mantiene en Excel. Si agregas una opción, cámbiala en los tres lugares.
- **Configuración:** `ENDPOINT_PERFIL` en `mi-experiencia.js` apunta al flujo I (URL firmada, como los de los flujos B y G). Si se vacía, la página vuelve al modo vista previa (muestra la ruta, no guarda ni manda correo).

Payload hacia el flujo I:

| Campo | Contenido |
|---|---|
| `id` o `correo` | El ID de la URL, o el correo si no hay ID (solo uno viene lleno) |
| `industria` | Un valor del vocabulario |
| `tecnologias`, `soluciones`, `marcas_elegidas`, `objetivos` | Valores del vocabulario separados por coma |
| `ruta` | Marcas de la ruta en orden, separadas por coma |
| `quiere_contacto` | `"Sí"` o `"No"` |
| `fecha`, `origen` (`"mi-experiencia"`), `utm_*` | Como en el registro |

Respuestas esperadas del flujo: `200` con `{"ok":true}`; `404` si el ID o el correo no existen en el Excel maestro (la página invita a registrarse); `403` si `origen` no es `mi-experiencia`. **Las tres respuestas deben llevar los mismos encabezados CORS**, o el navegador las bloquea aunque el flujo funcione.

Seguridad del flujo: el correo destino se toma del Excel maestro a partir del ID, nunca del formulario. Los datos que llegan del navegador se tratan como no confiables (recortar, validar contra el vocabulario).

## Medición

`tracking.js` empuja al `dataLayer` (GTM `GTM-TFCPQDS8`): `beyond_cta_registro`, `beyond_registro_iniciado`, `beyond_registro_completado`, `beyond_whatsapp`, `beyond_perfil_iniciado` y `beyond_perfil_completado`. Ningún evento lleva datos personales. Los píxeles de Meta, LinkedIn y TikTok solo se cargan si su ID está en `CONFIG`.

## Convenciones

- Colores CiiSA en degradado `#BCF200 → #01FBCE → #00CCFF`, siempre en ese orden. Tipografía Poppins.
- Breakpoints: móvil ≤ 640 px, tablet 641 a 1024 px, escritorio ≥ 1025 px.
- CSS de la landing en `styles.css`, ajustes nuevos al final con un comentario. CSS de la encuesta en `mi-experiencia.css`.
- Las animaciones de entrada usan IntersectionObserver y respetan `prefers-reduced-motion`.
