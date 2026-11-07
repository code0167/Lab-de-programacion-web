# Lista de verificación funcional

Ejecuta estas pruebas en una copia o perfil de navegador de prueba. Las pruebas modifican únicamente los registros de esa agenda.

| Caso | Acción | Resultado esperado |
| --- | --- | --- |
| Inicio vacío | Abre la aplicación sin registros. | Contadores en 0 y estado vacío útil. |
| Requeridos | Envía el formulario vacío. | Mensajes en título, materia y fecha; no se crea tarea. |
| Solo espacios | Introduce espacios como título y materia. | Se rechazan después de aplicar `trim`. |
| Crear | Registra una tarea válida. | Aparece una tarjeta y aumenta el contador de pendientes. |
| Editar | Cambia el título, materia, fecha, notas y prioridad. | Se modifica la misma tarjeta sin duplicarla. |
| Cancelar edición | Cambia campos y pulsa Cancelar edición. | El registro conserva los datos anteriores. |
| Completar | Marca el círculo de una tarea. | Cambia su apariencia, estado, contador y progreso. |
| Reabrir | Marca otra vez una tarea completada. | Vuelve a pendiente. |
| Buscar | Busca una palabra con o sin acentos y en distintas mayúsculas. | Se encuentran coincidencias equivalentes. |
| Sin resultados | Busca una cadena inexistente. | Mensaje claro y opción para limpiar filtros. |
| Filtros combinados | Combina materia, estado y búsqueda. | Solo se muestran tareas que cumplan todas las condiciones. |
| Ordenar | Prueba fecha, prioridad, creación y nombre. | Las tarjetas se muestran en el orden elegido. |
| Vencimientos | Crea una tarea con fecha de ayer. | Cuenta como vencida mientras esté pendiente; hoy no cuenta como vencida. |
| Persistencia | Recarga tras agregar, editar y completar. | Se recuperan exactamente los cambios guardados. |
| Cancelar eliminación | Abre el diálogo y cancela o pulsa Escape. | La tarea permanece. |
| Eliminar | Confirma el borrado y recarga. | La tarea no aparece y los contadores son correctos. |
| Texto HTML | Escribe `<b>Mi tarea</b>` como título. | Se muestra como texto literal, no como HTML. |
| Ejemplos | En agenda vacía, pulsa Cargar ejemplo. | Aparecen cuatro registros: uno completado, tres pendientes y uno vencido. |
| No duplicar ejemplos | Pulsa Cargar ejemplo con registros existentes. | Muestra aviso y no agrega registros. |
| Pantalla pequeña | Prueba a 390 px y 320 px de ancho. | Formulario y lista se apilan sin desbordamiento horizontal. |
| Teclado | Usa Tab, Enter y Escape. | Foco visible, etiquetas accesibles y diálogo operable. |

## Casos de almacenamiento con DevTools (solo en una agenda de prueba)

1. **JSON corrupto:** en Application/Storage, cambia el valor de `aula.agenda.v1` por texto que no sea JSON y recarga. Debe aparecer una advertencia sin sobrescribir ese contenido. Agregar una tarea no debe ocultar el aviso. El botón Restablecer almacenamiento debe pedir confirmación antes de reemplazarlo por las tareas de la sesión.
2. **Persistencia no disponible:** bloquea el almacenamiento desde los permisos del entorno de prueba y vuelve a intentar guardar. Debe aparecer un aviso de cambios sin guardar; la interfaz debe seguir disponible mientras la pestaña esté abierta.

Para comprobar las reglas de datos sin navegador, ejecuta `node --test tests/core.test.cjs`.
