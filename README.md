# Aula · Agenda académica

**Laboratorio de Programación Web — Actividad 3: Aplicación interactiva con JavaScript moderno.**

Aula es una aplicación del lado del cliente para administrar tareas académicas. Permite agregar, visualizar, editar, completar y eliminar registros sin recargar la página. Guarda la información mediante `localStorage`.

## Ejecutar la aplicación

1. Descomprime la entrega completa.
2. Abre **`dist/index.html`** en un navegador moderno (Chrome, Edge, Firefox o Safari).
3. Agrega una tarea o pulsa **Cargar ejemplo** para cargar cuatro registros de demostración cuando la agenda esté vacía.

No se requiere instalar dependencias, crear una cuenta ni configurar una base de datos. Los archivos CSS y JavaScript deben permanecer junto a `index.html` dentro de `dist/`.

**Opción recomendada para evaluar la persistencia:** abre la carpeta con Visual Studio Code y ejecuta `dist/index.html` con Live Server. También puedes utilizar Python:

```bash
python -m http.server 8000 --directory dist
```

Después entra a `http://localhost:8000`. El servidor solo entrega archivos estáticos; toda la lógica y los registros permanecen en el navegador. Abrir el archivo directamente suele funcionar, pero los permisos y el comportamiento de `localStorage` para direcciones `file://` dependen del navegador. Usa siempre la misma dirección para comprobar la recuperación de datos.

## Funciones

- **Agregar:** registra título, materia, fecha de entrega, prioridad y notas opcionales.
- **Visualizar:** muestra tarjetas con toda la información principal y la condición de entrega.
- **Editar:** carga un registro en el formulario y conserva su identificador y estado.
- **Eliminar:** solicita confirmación y elimina únicamente la tarea seleccionada.
- **Completar o reabrir:** cambia el estado con el círculo situado a la izquierda de cada tarea.
- **Buscar:** busca en título, materia y notas, sin distinguir mayúsculas ni acentos.
- **Filtrar:** permite combinar estado, materia y búsqueda.
- **Ordenar:** por fecha, prioridad, nombre o creación reciente.
- **Calcular:** muestra tareas pendientes, completadas, vencidas y porcentaje de avance.
- **Conservar datos:** recupera los registros al recargar o volver a abrir la misma dirección.

## Estructura del proyecto

| Archivo | Responsabilidad |
| --- | --- |
| `dist/index.html` | Estructura semántica, formulario, lista, plantilla de tarjeta y diálogo de confirmación. |
| `dist/styles.css` | Diseño adaptable a computadora y teléfono, estados y estilos de accesibilidad. |
| `dist/core.js` | Validación, normalización, filtros, ordenamiento, contadores y serialización. |
| `dist/app.js` | Estado, eventos, operaciones CRUD, persistencia y manipulación del DOM. |
| `dist/icon.svg` | Icono local de la aplicación. |
| `tests/core.test.cjs` | Pruebas de la lógica de datos con el ejecutor incluido en Node.js. |
| `DEMO_3_MINUTOS.md` | Guion con tiempos y acciones para exponer en clase o grabar un video. |
| `PRUEBAS_MANUALES.md` | Casos de prueba reproducibles para revisar la aplicación. |

El proyecto usa **HTML5, CSS3 y JavaScript ES6+**, sin frameworks, bibliotecas remotas ni compilación. El archivo `.openai/hosting.json` únicamente configura la versión alojada; no es necesario para ejecutar la entrega local.

## Modelo de datos

Los registros se guardan en un arreglo de objetos. Cada tarea tiene esta forma:

```javascript
{
  id: 'identificador-unico',
  title: 'Preparar la exposición',
  subject: 'Programación Web',
  dueDate: '2026-11-05',
  priority: 'alta', // alta, media o baja
  notes: 'Revisar DOM y eventos.',
  completed: false,
  createdAt: '2026-10-27T18:00:00.000Z',
  updatedAt: '2026-10-27T18:00:00.000Z'
}
```

La clave de almacenamiento es **`aula.agenda.v1`**. Su valor contiene un objeto con `version: 1` y `tasks: [...]`, convertido a texto con `JSON.stringify`. Al iniciar, `JSON.parse` recupera el contenido y `decode` valida cada registro antes de utilizarlo.

Las fechas de entrega se conservan como `YYYY-MM-DD` y se comparan con la fecha local del dispositivo. Una tarea es vencida si no está completada y su fecha es anterior a hoy. Se admiten fechas pasadas para registrar entregas atrasadas.

## Cómo funciona el código

1. `loadTasks()` lee el almacenamiento y recupera el arreglo.
2. `render()` actualiza materias, contadores y tarjetas.
3. El evento `submit` usa `preventDefault()` para evitar recargar la página.
4. `Core.validate()` limpia espacios y revisa los campos. Si encuentra errores, se muestran junto al campo correspondiente y se enfoca el primero.
5. Para crear se añade un objeto con el operador de propagación `...`. Para editar se usa `map`; para eliminar, `filter`; para seleccionar un registro, `find`.
6. `commit()` actualiza el arreglo, guarda los datos y vuelve a dibujar la interfaz.
7. Un solo listener en la lista utiliza delegación de eventos para atender los botones de todas las tarjetas.

Se utiliza `const` para referencias que no cambian y `let` para estado reasignable, como `tasks` y `editingId`. Las arrow functions simplifican callbacks. Los template literals forman mensajes y fechas. Se usan `map`, `filter`, `find`, `some`, `sort`, `forEach`, desestructuración y `Set` cuando resultan apropiados.

La interfaz clona un elemento `<template>` y coloca el contenido del usuario mediante `textContent`. Esto evita interpretar títulos o notas como etiquetas HTML o scripts.

## Validación y errores

| Campo o situación | Regla o respuesta |
| --- | --- |
| Título | Obligatorio; de 3 a 80 caracteres después de quitar espacios externos. |
| Materia | Obligatoria; de 2 a 50 caracteres. |
| Fecha | Obligatoria; fecha real con año entre 1900 y 9999. |
| Prioridad | Únicamente alta, media o baja. |
| Notas | Opcionales; máximo 500 caracteres. |
| JSON corrupto o esquema desconocido | Muestra advertencia y conserva el contenido original hasta confirmar el restablecimiento. |
| Almacenamiento bloqueado o lleno | Mantiene la sesión en memoria y advierte que los cambios no se guardaron. |
| Eliminar registro | Diálogo con acciones de cancelar y confirmar; Escape cancela. |

## Correspondencia con la actividad

| Requisito de la consigna | Implementación |
| --- | --- |
| 1. Aplicación de administración | Agenda académica de tareas por materia. |
| 2. Objetos y arreglos | Arreglo `tasks` y objetos de tarea. |
| 3. Agregar, visualizar, editar y eliminar | Formulario, tarjetas, edición por ID y borrado con confirmación. |
| 4. Manipular el DOM sin recarga | `querySelector`, `cloneNode`, `textContent`, `replaceChildren` y `preventDefault`. |
| 5. Eventos, funciones y ES6+ | `submit`, `click`, `input`, `change`, `const`/`let`, arrow functions, template literals y métodos de arreglos. |
| 6. Validación y mensajes | Errores por campo, foco en el primer error, notificaciones y confirmaciones. |
| 7. Persistencia local | `localStorage.getItem`, `setItem`, `JSON.parse` y `JSON.stringify`. |
| 8. Función adicional | Búsqueda, filtros, ordenamiento, materias, contadores y progreso. |

## Pruebas

Si tienes Node.js instalado, ejecuta desde la raíz:

```bash
node --test tests/core.test.cjs
```

Las pruebas cubren validación, fechas, búsquedas, filtros combinados, ordenamiento sin mutar el arreglo, estadísticas y serialización con rechazo de datos corruptos. Para verificar las acciones del navegador, utiliza `PRUEBAS_MANUALES.md`.

## Repositorio y entrega

La entrega descargable incluye **`agenda-academica.bundle`**, una copia portátil del repositorio Git con su historial. Si tienes Git instalado, puedes restaurarlo así, desde la carpeta que contiene el archivo:

```bash
git clone agenda-academica.bundle agenda-academica
cd agenda-academica
git log --oneline
```

La aplicación también está incluida como archivos normales: no necesitas Git para abrirla.

Si tu profesor exige una URL de **GitHub**, crea allí un repositorio vacío, sustituye `TU_USUARIO` por tu nombre de usuario y ejecuta dentro del repositorio clonado:

```bash
git remote remove origin
git remote add origin https://github.com/TU_USUARIO/agenda-academica.git
git branch -M main
git push -u origin main
```

No se ha creado un repositorio en una cuenta de GitHub. El bundle es un repositorio Git real, pero no sustituye una URL de GitHub cuando el docente la exige. El sitio alojado es privado inicialmente; para entregar a otra persona, usa el ZIP o publica tu propia copia con el acceso adecuado.

## Demostración

Sigue **`DEMO_3_MINUTOS.md`** para presentar la aplicación en clase o grabar un video. Incluye creación, validación, edición, búsqueda, cambio de estado, eliminación y recuperación al recargar. El archivo es un guion, no un video ya grabado.

## Alcance y límites

- Los datos pertenecen al navegador, perfil y dirección utilizados. No se sincronizan entre dispositivos, pestañas ni con cuentas.
- Para evitar sobrescribir cambios entre pestañas, utiliza una sola pestaña de la agenda a la vez.
- Borrar los datos del navegador elimina la información guardada. El modo privado puede descartarla al cerrar.
- No hay autenticación propia, notificaciones programadas ni backend de datos.
- El porcentaje se calcula como `completadas / total * 100`, redondeado; con cero tareas muestra 0%.
- Los ejemplos solo se cargan cuando la agenda está vacía y se pueden editar o eliminar como cualquier tarea.

Antes de entregar, agrega tu nombre completo, grupo y matrícula si tu docente los solicita, y revisa el código para explicar su funcionamiento con tus propias palabras.
