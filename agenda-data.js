// Agenda del evento por hora y por espacio. La dibuja agenda-board.js en la sección #programa.
// Para cambiar un horario, un título o una marca, edita solo este archivo.
//   e     espacio: 'exito', 'labs', 'pc' o 'todos' (ocupa las dos columnas en escritorio)
//   Escritorio: dos columnas. 'pc' comparte la segunda con los laboratorios (col: 1) y no lleva cabecera propia (cabecera: false):
//   su título va como etiqueta vertical, igual que los temas de 'exito'. Sus primeras sesiones se solapan un poco con el laboratorio
//   de Autodesk. En tablet y celular siguen siendo tres espacios, con sus filtros.
//   ini   hora de inicio en 24 h ('13:00'); fin = hora de término
//   marca quién presenta (opcional); tema = bloque temático dentro de "exito" (opcional)
// Las horas van en múltiplos de 5 minutos. Las marcadas "por confirmar" se dedujeron del arte de la agenda,
// que no trae el horario de esos laboratorios ni del segundo networking. Los cuatro "Laboratorio IA - TI" son definitivos
// (16 oct): devkit-lab.js los usa como horarios del selector del laboratorio DevKit AI; si cambias uno, avisa para el flujo M.
window.CIISA_AGENDA = {
  fecha: '2026-10-21',
  zona: '-06:00',
  inicio: '10:30',
  fin: '21:00',
  escenarios: [
    { id: 'exito', nombre: 'Casos de éxito', lugar: 'Escenario principal', col: 0 },
    { id: 'labs', nombre: 'Laboratorios', lugar: 'Salón Terraza', col: 1 },
    { id: 'pc', nombre: 'PC Experiencias Usuario | Data Center', lugar: '', col: 1, cabecera: false }
  ],
  sesiones: [
    // Escenario principal
    { e: 'exito', ini: '10:30', fin: '10:40', titulo: 'Apertura | Dirección General', marca: 'CiiSA' },
    { e: 'exito', ini: '10:40', fin: '11:25', titulo: 'Beyond AI: el nuevo rol del líder', marca: 'PSW' },
    { e: 'exito', ini: '11:30', fin: '12:00', titulo: 'Reforma laboral 40 horas', marca: 'HumanSite' },
    { e: 'exito', ini: '12:00', fin: '12:40', titulo: 'Descubre lo nuevo y único de Pyxoom ONE', marca: 'Pyxoom · amitai' },
    { e: 'exito', ini: '12:40', fin: '12:55', titulo: 'Caso de éxito Garza Ponce', marca: 'Pyxoom' },
    { e: 'exito', ini: '13:00', fin: '14:30', titulo: 'Networking', tipo: 'networking' },
    { e: 'todos', ini: '14:30', fin: '15:00', titulo: 'Networking', tipo: 'networking' },
    { e: 'exito', ini: '15:00', fin: '15:20', titulo: 'Sophos', tema: 'Ciberseguridad' },
    { e: 'exito', ini: '15:25', fin: '15:45', titulo: 'Fortinet', tema: 'Ciberseguridad' },
    { e: 'todos', ini: '15:45', fin: '16:15', titulo: 'Networking', tipo: 'networking' },        // por confirmar
    { e: 'exito', ini: '16:15', fin: '16:35', titulo: 'Adobe', tema: 'Manufactura | Productividad' },
    { e: 'exito', ini: '16:40', fin: '17:00', titulo: 'Metalsa · Raul Arturo De Leon Marquez', marca: 'IBM Maximo', tema: 'Manufactura | Productividad' },
    { e: 'exito', ini: '17:05', fin: '17:20', titulo: 'Experto en TI', marca: 'Lenovo · Windows 11', tema: 'Manufactura | Productividad' },
    { e: 'exito', ini: '17:20', fin: '17:40', titulo: 'Experto en TI', marca: 'Windows 11', tema: 'Manufactura | Productividad' },
    { e: 'exito', ini: '18:00', fin: '18:40', titulo: 'Networking', tipo: 'networking' },

    // Laboratorios · Salón Terraza
    { e: 'labs', ini: '10:40', fin: '12:00', titulo: 'Laboratorio IA - TI' },
    { e: 'labs', ini: '13:00', fin: '13:45', titulo: 'Laboratorio IA - TI' },
    { e: 'labs', ini: '13:45', fin: '14:30', titulo: 'Laboratorio IA - RH' },
    { e: 'labs', ini: '15:00', fin: '15:45', titulo: 'Laboratorio IA - TI' },
    { e: 'labs', ini: '16:15', fin: '17:00', titulo: 'Laboratorio IA - RH' },                  // por confirmar
    { e: 'labs', ini: '17:20', fin: '18:00', titulo: 'Laboratorio IA - TI' },
    { e: 'labs', ini: '18:00', fin: '18:40', titulo: 'Laboratorio Autodesk', marca: 'Autodesk' },

    // PC Experiencias Usuario | Data Center
    { e: 'pc', ini: '18:20', fin: '18:40', titulo: 'Prodynamics · Agustín Mota', marca: 'HPE' },
    { e: 'pc', ini: '18:40', fin: '19:00', titulo: 'PCIA', marca: 'HPE' },
    { e: 'pc', ini: '19:00', fin: '19:20', titulo: 'Welcome HP', marca: 'HP' },
    { e: 'pc', ini: '19:20', fin: '19:40', titulo: 'Frisa · Cómputo · Julio Martínez', marca: 'HP' },
    { e: 'pc', ini: '19:40', fin: '20:00', titulo: 'Muguerza · Impresión · Alvaro Ceballos', marca: 'HP' },

    // Cierre
    { e: 'todos', ini: '20:00', fin: '21:00', titulo: 'Clausura', tipo: 'clausura' }
  ]
};
