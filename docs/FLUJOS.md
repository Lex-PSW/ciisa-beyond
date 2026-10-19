# Flujos · CiiSA Beyond Expo 2026

Mapa de alto nivel. Es un documento público: el detalle (acciones, nombres de archivos y tablas del Excel, segmentos de HubSpot, plantillas de correo) está en la carpeta **`privada/`**, que no se sube a git y se comparte por zip. Allí se actualiza cuando algo cambie; aquí no se copia.

| Flujo | Qué hace | Disparador | Estado |
|---|---|---|---|
| **A** | Respuesta de Microsoft Forms → Excel maestro + confirmación | Nueva respuesta | ✅ |
| **B** | Registro de la landing → Excel maestro + confirmación | HTTP desde `rsvp-form.js` | ✅ |
| **C** | QR y gafete para impresión física: de cada registro nuevo genera el QR (C1 a C3), arma el gafete en PDF con un script local (C4) y lo sube a SharePoint (C5). El escaneo en el evento (asistencia y módulos, antiguo D) sigue por definir. En el stand del laboratorio DevKit AI, el escaneo consulta las reservas del flujo M | Programado (C1 a C5) y por escaneo | ✅ ciclo C1 a C5 en marcha (19 oct); escaneo 📝 por definir |
| **E** | Presenciales de HubSpot (Pyxoom 5) → Excel maestro | Programado | ✅ |
| **E.2** | Igual que E leyendo el segmento completo; red de seguridad | Programado | ✅ |
| **F** | Invitación de calendario a registrados online de Pyxoom 5 | Programado | ✅ |
| **G** | Registro de la landing → Excel de invitaciones (quién invitó, fuente) | HTTP desde `rsvp-form.js` | ✅ |
| **H** | Segmento de presenciales de HubSpot → Excel de invitaciones | Programado | ✅ |
| **I** | Encuesta `mi-experiencia` → perfil y correo "Tu ruta Beyond" | HTTP desde `mi-experiencia.js` | ✅ |
| **I2** | Aviso a gerentes cuando alguien pide que lo contacte un asesor | HTTP desde el flujo I | ✅ |
| **J1** | Invitación a diseñar la experiencia, 30 minutos después del registro, una sola vez por correo | Programado | 🔧 rediseñado y probado; desactivado hasta su revisión |
| **J** | Recordatorios a registrados del 15 al 21 de octubre (tope de frecuencia para marketing, bajas y rebotes) | Programado, una copia por correo | 🔧 J19 y J20 programados; J21 con prueba real aprobada (falta restaurarlo) |
| **K** | Correo post-evento según módulos visitados | Programado | 📝 |
| **L** | Invitación de calendario del evento a quien confirmó, desde la cuenta de Beyond | Programado | ✅ |
| **L2** | Marca los correos que rebotan para no insistirles | Correo nuevo en la bandeja de Beyond | ✅ |
| **M** | Laboratorio DevKit AI: estado de los 4 horarios y apartar lugar (10 por horario, por orden de llegada) | HTTP desde `devkit-lab.js` | ✅ armado y probado (16 oct); conectado a la landing |
| **M1** | Invitación al laboratorio DevKit AI con liga personal `?id=` a registrados con perfil TI, una sola vez por correo | Programado, diario hasta el 20 oct | 🔧 en modo prueba; falta el envío real |

**Quién los edita:** los flujos nuevos (I, I2, J, J1, K, L, L2, M, M1) los modifica Automatización; el QR (C) y la etiqueta, Diseño; los existentes, con aviso previo.

**El contrato que este repo le promete a los flujos B, G, I y M** (campos, respuestas, encabezados) está en [ARQUITECTURA.md](ARQUITECTURA.md). Si cambia, hay que avisar a quien mantiene el flujo.
