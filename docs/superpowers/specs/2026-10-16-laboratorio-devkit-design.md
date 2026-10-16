# Laboratorio DevKit AI · inscripción por horario

Diseño acordado el 16 oct 2026. Documento público: aquí no van ligas firmadas, nombres de archivos de SharePoint ni datos de personas. Las guías paso a paso de los flujos nuevos se escriben en `privada/docs/` (ver "Flujos nuevos").

## Por qué

El laboratorio práctico DevKit AI tiene **4 horarios de 10 lugares** el miércoles 21 de octubre, y se llenan por orden de llegada. Queremos que tanto quien se registra hoy como quien ya se registró antes puedan apartar su lugar sin volver a llenar datos y sin tocar el registro en vivo, que es la métrica que manda.

## Metas

- Quien se registra en la landing puede apartar horario **justo después**, en el modal de gracias, con un clic.
- Quien ya está registrado recibe un correo con una liga `https://beyond.ciisa.com/?id=BYD-…#laboratorio`; la landing reconoce el ID y le abre el mismo selector, sin formulario.
- El selector solo dice si cada horario está **disponible o lleno** (no cuántos lugares quedan).
- Dos personas no pueden quedarse con el último lugar de un horario.

## No metas

- No hay sección nueva con horarios en la landing: los horarios ya están en la agenda (`#programa`).
- No hay correo de confirmación del horario: basta el mensaje en pantalla. La asistencia se confirma leyendo el QR en el stand del laboratorio.
- No hay lista de espera.
- No se saluda por nombre en la vista que abre la liga del correo (evita una consulta previa).

## Anti-metas (sería un fracaso aunque funcione)

- Que cambie lo que capta el registro: campos, nombres de campo, payload o respuesta de los flujos B y G.
- Que el registro falle o se retrase porque el flujo del laboratorio falló.
- Que se aparten más de 10 lugares en un horario.
- Que alguien reciba el correo de invitación al laboratorio más de una vez (lección del 12 oct con J1).

## Restricciones

- Sitio estático (GitHub Pages), HTML/CSS/JS vanilla, sin build. Power Automate es la única parte con servidor.
- Regla del registro en vivo (`CLAUDE.md`): `index.html` y `rsvp-form.js` se dejan intactos en lo que capta el registro; lo nuevo va al lado. **`rsvp-form.js` no se modifica.**
- El flujo B responde solo `200` y **no devuelve el ID**, así que el modal de gracias identifica a la persona por el **correo** que acaba de escribir. El correo es la clave única del maestro.
- Excel Online: *Enumerar filas* devuelve caché si la consulta se repite; para decidir cupo se usa *Obtener una fila* (sin caché) y control de simultaneidad 1.
- El evento es el 21 oct; el front y el flujo M deben estar listos antes de que salga el correo M1.

## Lo que se decidió (de la conversación)

### 1. Sección `#laboratorio` (ya existe, se ajusta)

La sección adaptada de `reff/` se queda donde está (entre "Experiencia Beyond" y "Cómo llegar"). Cambios:

- Debajo del botón principal, la instrucción: **"Inscríbete después de registrar tu asistencia."** junto con "Cupo limitado: 4 horarios de 10 lugares."
- El botón principal pasa a "Registra tu asistencia" y lleva a `#registro`.
- La tarjeta de cierre pierde la casilla de interés y dice "¿Ya te registraste? Usa la liga de tu correo para elegir tu horario."
- Se retira el guardado en `sessionStorage` (`beyond_devkit`) de la versión anterior.
- La sección **no consulta** el estado de los horarios: el texto es fijo. Así no se lanza una ejecución del flujo por cada visita (decisión de Claude).

### 2. Selector en el modal de gracias (recién registrado)

- Tras el `200` del flujo B (evento `beyond:lead`), dentro del `<dialog data-rsvp-thanks>` aparece: "¿Apartas tu lugar en el laboratorio DevKit AI?", los 4 horarios como opciones (los llenos, deshabilitados y rotulados "Lleno"), "Apartar mi lugar" y "Ahora no".
- El correo se toma del formulario **al momento del envío** con un escucha propio de `devkit-lab.js` (el formulario se limpia después del éxito). No se toca `rsvp-form.js`.
- Si el registro se hizo por el Microsoft Forms de respaldo, no hay selector: esa persona recibirá el correo M1.
- **Aviso:** esto agrega marcado dentro del modal del registro en vivo. Lo que capta el formulario no cambia.

### 3. Llegada desde el correo (`?id=BYD-…`)

- Si la URL trae `id` con el formato `^BYD-\d{12}-[0-9a-f]{4}$` (el mismo que usa `mi-experiencia.js`), al cargar se abre un modal con el mismo selector: "Ya estás registrado en Beyond. Elige tu horario para el laboratorio DevKit AI." El formulario de registro no aparece en ese modal.
- Si el ID no tiene el formato, la página se ve normal.
- Si la persona ya tenía horario y elige otro, el flujo lo **cambia** (un lugar por persona; decisión de Claude).

### 4. Respuestas en pantalla

| Respuesta del flujo M | Mensaje |
|---|---|
| `apartado` | "¡Listo! Tu lugar es a las HH:MM en el Salón Terraza. Presenta tu QR en el stand del laboratorio." |
| `lleno` | "Ese horario se acaba de llenar. Elige otro." y se refresca el estado |
| `no_encontrado` | "No encontramos tu registro. Regístrate primero." con enlace a `#registro` |
| error de red | "No pudimos apartar tu lugar. Inténtalo de nuevo." |

### 5. Apagado y vista previa (decisión de Claude)

- Con `ENDPOINT_LAB` vacío en `devkit-lab.js`, el selector está **apagado**: el modal de gracias se ve como hoy y la liga con `?id=` no abre nada. Así el front se puede publicar antes que el flujo M sin dar confirmaciones falsas.
- Para revisarlo sin flujo: `?lab=preview` en la URL muestra el selector con todos los horarios disponibles y simula el éxito sin enviar nada.

### 6. Cierre de cada horario (decisión de Claude)

Un horario se cierra **al llegar su hora de inicio**, con el reloj de `beyond-clock.js` (se puede simular con `?ahora=`). El front lo muestra como "Cerrado" y M rechaza con `409` cualquier horario cuyo inicio ya pasó (hora de Monterrey). Si ya no queda ningún horario abierto, el modal no ofrece el laboratorio.

## Horarios

Salen de `agenda-data.js` (espacio `labs`, título "Laboratorio IA - TI"): **10:40-12:00, 13:00-13:45, 15:00-15:45 y 17:20-18:00**. **Son definitivos** (confirmado el 16 oct): al implementar se quita la marca "por confirmar" de esas filas en `agenda-data.js`. La clave de cada horario es su hora de inicio (`"10:40"`, …). Si cambian, se cambian en `agenda-data.js` y en la tabla de horarios del Excel.

## Contrato con el flujo M (lo que el front promete)

Un solo disparador HTTP con dos acciones. Mismos encabezados CORS en **todas** las respuestas.

**Estado** · al abrir el selector:

```json
{ "accion": "estado", "origen": "laboratorio-devkit" }
```

Respuesta `200`: `{ "horarios": { "10:40": "disponible", "13:00": "lleno", "15:00": "disponible", "17:20": "disponible" } }`

**Apartar**:

```json
{ "accion": "apartar", "origen": "laboratorio-devkit",
  "id": "BYD-…", "correo": "", "horario": "13:00",
  "fecha": "<ISO 8601>", "utm_source": "", "utm_medium": "", "utm_campaign": "", "utm_content": "", "utm_term": "" }
```

Solo uno de `id` o `correo` viene lleno. Respuestas: `200 {"resultado":"apartado","horario":"13:00"}`, `409 {"resultado":"lleno"}`, `404 {"resultado":"no_encontrado"}`, `403` si `origen` no es `laboratorio-devkit`, `400` si el horario no es uno de los cuatro.

Medición: `devkit_lab_selector` (se abrió, con `via: modal|liga`) y `devkit_lab_apartado` (con `horario`) al `dataLayer`, sin datos personales.

## Flujos nuevos

Siguen la nomenclatura de `docs/FLUJOS.md`. La guía paso a paso de cada uno va en `privada/docs/flujo-M/` y `privada/docs/flujo-M1/`, y su fila en `privada/docs/FLUJOS.md` sección 3. Los arma **Automatización** (Claude da pasos y expresiones; no tiene acceso a Power Automate).

### Excel (libro propio del laboratorio · decisión de Claude)

Va en un libro aparte del maestro, para que las escrituras de M nunca bloqueen ni afecten al flujo B. El maestro solo se lee (para resolver ID o correo) y recibe la columna `InvitacionLab`, que escribe M1.

- Tabla **Horarios**: `Horario` (clave, `"10:40"`…), `Cupo` (10), `Ocupados` (número), `Estado` (`disponible`/`lleno`). Cuatro filas.
- Tabla **Reservas**: `Correo` (clave), `ID`, `Horario`, `Fecha`, `Origen` (`modal`/`liga`).
- En el maestro, columna nueva **`InvitacionLab`** (marca de envío de M1).

### Flujo M · Apartar lugar en el laboratorio

- **Disparador:** "Cuando se recibe una solicitud HTTP", **simultaneidad 1** (así dos solicitudes nunca leen el mismo cupo a la vez).
- **Guardas:** `origen` = `laboratorio-devkit` (si no, `403`); `horario` ∈ los cuatro (si no, `400`).
- **`estado`:** *Obtener una fila* por cada uno de los 4 horarios (sin caché) → responde el mapa `horario → Estado`. Solo se pide al abrir el selector, nunca en cada visita.
- **`apartar`:**
  1. Resolver la persona en el maestro: por `id` (*Obtener una fila* por ID) o por `correo` (filtro `eq` simple). Si no existe, `404`. El correo que se guarda es **el del maestro**, nunca el que manda el navegador.
     **Regla de seguridad (acordada):** por `correo` solo se acepta si ese registro se hizo **en los últimos 30 minutos** (es el caso del modal de gracias); si es más antiguo, se responde `404` igual que si no existiera, y la persona debe usar la liga con su `id`. Así nadie puede apartar ni mover el lugar de otro sabiendo solo su correo, y la respuesta no revela si un correo antiguo está registrado. *Nota:* en el modal, la fila la acaba de escribir B; si B tarda, reintentar la búsqueda una vez tras unos segundos antes de responder `404`.
  2. *Obtener una fila* del horario pedido. Si `Ocupados` ≥ `Cupo`, `409`.
  3. Buscar su reserva previa en **Reservas** por correo. Si ya está en ese horario, responder `200` sin escribir. Si está en otro, restar 1 al `Ocupados` del horario anterior (y ponerlo `disponible`).
  4. Sumar 1 a `Ocupados` del horario pedido; si llega a `Cupo`, `Estado` = `lleno`. Volver a leer la fila con *Obtener una fila* para confirmar.
  5. Escribir o actualizar la fila en **Reservas**. Responder `200`.
- **Rama de error** (*Configurar ejecutar después*: desmarcar *Es correcto*, marcar *Ha fallado* y *Ha expirado*): responder `500` con los encabezados CORS.

### Flujo M1 · Invitación al laboratorio para registrados

Correo "Súmate al laboratorio DevKit AI" con la liga personal `https://beyond.ciisa.com/?id=<ID>#laboratorio`.

**A quién (acordado): solo perfil TI.** Criterio (decisión de Claude, ajustable por Automatización): el `Puesto` del maestro contiene alguna de estas palabras, sin importar acentos ni mayúsculas: *TI, IT, sistemas, software, desarrollo, desarrollador, developer, programador, arquitecto, tecnología, infraestructura, CTO, CIO, datos, data, DevOps*; **o** su perfil de la encuesta (flujo I) tiene en `tecnologias` o `soluciones` algo de software, IA o desarrollo. Como *Enumerar filas* solo admite un filtro simple, se filtra por uno y se aplica el resto con *Filtrar matriz*.

**Cuándo (decisión de Claude):** programado una vez al día hasta el 20 oct, para alcanzar también a quien se registre después del primer envío (incluido el Microsoft Forms de respaldo). La marca `InvitacionLab` garantiza un solo correo por persona.

Aplica **todas** las reglas de envíos masivos de `CLAUDE.md`:

- Clave de unicidad: el **correo**. Marca `InvitacionLab` en el maestro, escrita **antes** de enviar y verificada con *Obtener una fila*.
- Excluir a quien ya tiene fila en **Reservas**, bajas y rebotes (L2).
- Simultaneidad 1, tope de lectura y de envíos por ciclo, `destinoPrueba` con filtro temporal en pruebas, modo prueba sin escrituras.
- Si los 4 horarios están llenos, no enviar.
- Plantilla en `privada/docs/correos-beyond/` (recordar que Power Automate evalúa `@{` aun dentro de comentarios).

### Cambio al flujo C (QR) · Diseño

En el stand del laboratorio, el escaneo del QR consulta **Reservas** por el ID del invitado y muestra si tiene lugar en el horario en curso. Lo define Diseño cuando rediseñe C; no bloquea esta entrega.

## Lo que queda a quien construye

- Diseño visual del selector dentro del modal (seguir `.cip-thanks`, botones `.cip-btn` y la casilla/estilos del registro).
- Accesibilidad del grupo de horarios (radios nativos con `fieldset`/`legend`).
- Cómo mostrar el estado mientras carga.
- Qué hacer si `estado` falla: mostrar los horarios como disponibles y dejar que `apartar` decida.

## Pendiente de actualizar al implementar

- `docs/ARQUITECTURA.md`: agregar el contrato del flujo M.
- `docs/FLUJOS.md`: filas M y M1 (y la nota de C).
- `CLAUDE.md`: fila de `devkit-lab.js` con el comportamiento nuevo.
- Avisar para actualizar `privada/docs/FLUJOS.md`.
