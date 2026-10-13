# Flujos · CiiSA Beyond Expo 2026

Mapa de alto nivel. Es un documento público: el detalle (acciones, nombres de archivos y tablas del Excel, segmentos de HubSpot, plantillas de correo) está en la carpeta **`privada/`**, que no se sube a git y se comparte por zip. Allí se actualiza cuando algo cambie; aquí no se copia.

| Flujo | Qué hace | Disparador | Estado |
|---|---|---|---|
| **A** | Respuesta de Microsoft Forms → Excel maestro + confirmación | Nueva respuesta | ✅ |
| **B** | Registro de la landing → Excel maestro + confirmación | HTTP desde `rsvp-form.js` | ✅ |
| **C** | QR para impresión física: lote de etiquetas y escaneo → asistencia y módulos (absorbe al antiguo D) | Programado y por escaneo | 📝 por rediseñar |
| **E** | Presenciales de HubSpot (Pyxoom 5) → Excel maestro | Programado | ✅ |
| **E.2** | Igual que E leyendo el segmento completo; red de seguridad | Programado | ✅ |
| **F** | Invitación de calendario a registrados online de Pyxoom 5 | Programado | ✅ |
| **G** | Registro de la landing → Excel de invitaciones (quién invitó, fuente) | HTTP desde `rsvp-form.js` | ✅ |
| **H** | Segmento de presenciales de HubSpot → Excel de invitaciones | Programado | ✅ |
| **I** | Encuesta `mi-experiencia` → perfil y correo "Tu ruta Beyond" | HTTP desde `mi-experiencia.js` | ✅ |
| **I2** | Aviso a gerentes cuando alguien pide que lo contacte un asesor | HTTP desde el flujo I | ✅ |
| **J1** | Invitación a diseñar la experiencia, 30 minutos después del registro, una sola vez por correo | Programado | 🔧 rediseñado y probado; desactivado hasta su revisión |
| **J** | Recordatorios a registrados del 15 al 21 de octubre (tope de frecuencia para marketing, bajas y rebotes) | Programado, una copia por correo | 🔧 J15, J17, J19 y J20 armados y con prueba real aprobada (desactivados, falta revisión de Oscar); J21 por copiar |
| **K** | Correo post-evento según módulos visitados | Programado | 📝 |
| **L** | Invitación de calendario del evento a quien confirmó, desde la cuenta de Beyond | Programado | ✅ |
| **L2** | Marca los correos que rebotan para no insistirles | Correo nuevo en la bandeja de Beyond | ✅ |

**Quién los edita:** los flujos nuevos (I, I2, J, J1, K, L, L2) los modifica Automatización; el QR (C) y la etiqueta, Diseño; los existentes, con aviso previo.

**El contrato que este repo le promete a los flujos B, G e I** (campos, respuestas, encabezados) está en [ARQUITECTURA.md](ARQUITECTURA.md). Si cambia, hay que avisar a quien mantiene el flujo.
