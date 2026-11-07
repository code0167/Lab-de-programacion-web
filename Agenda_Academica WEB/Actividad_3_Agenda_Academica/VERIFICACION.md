# Verificación de la entrega

## Pruebas automatizadas ejecutadas

Comando: `node --test tests/core.test.cjs`

**Resultado: 10 pruebas aprobadas, 0 fallidas.** Cubren límites de campos, fechas inválidas y bisiestas, vencimientos, búsqueda sin acentos, filtros combinados, ordenamiento, serialización y rechazo de datos corruptos. Se comprobó también la sintaxis de `core.js` y `app.js` con `node --check`.

## Comprobaciones realizadas en Chrome

- El formulario vacío mostró errores sin crear registros.
- Se agregó una tarea con todos sus campos.
- La edición recuperó el registro y actualizó título y prioridad sin duplicarlo.
- Una búsqueda en mayúsculas y sin acento encontró el título con acento.
- El texto `<b>texto</b>` se mostró literalmente dentro del título.
- Completar una tarea cambió el contador y el progreso al 100%.
- La tarea editada y completada se recuperó después de recargar.
- Cancelar el diálogo de eliminación conservó el registro.
- Confirmar la eliminación y recargar inmediatamente conservó el borrado.
- Los cuatro ejemplos produjeron tres tareas pendientes, una completada y una vencida.
- Los filtros de materia, estado y texto funcionaron simultáneamente.
- El orden por prioridad colocó alta antes de media y baja.
- Volver a cargar ejemplos con tareas existentes mostró un aviso sin duplicarlas.
- Se revisó la distribución en marcos de 390 y 320 píxeles sin desbordamiento horizontal. En el ancho menor, fecha y prioridad se apilan para que la fecha sea legible.

## Alcance de la revisión

La revisión de interfaz se hizo en Chrome. No se ejecutó una matriz de navegadores ni una auditoría completa de accesibilidad. El bloqueo de almacenamiento y su cuota agotada tienen manejo de errores, pero no se forzaron en la prueba de navegador. El rechazo de datos corruptos sí está cubierto por las pruebas automatizadas.
