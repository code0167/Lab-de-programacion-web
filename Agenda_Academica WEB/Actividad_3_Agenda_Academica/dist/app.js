/* Controlador: estado de la agenda, eventos, persistencia y actualización del DOM. */
(() => {
  'use strict';
  const Core = window.AgendaCore;
  const STORAGE_KEY = 'aula.agenda.v1';
  const $ = (selector) => document.querySelector(selector);
  const form = $('#task-form');
  const fields = ['title', 'subject', 'dueDate', 'priority', 'notes'];
  const filters = { query: '', status: 'all', subject: '', sort: 'date' };
  let tasks = [];
  let editingId = null;
  let pendingDialogAction = null;
  let toastTimer;
  let storageBlocked = false;

  const notify = (message) => {
    clearTimeout(toastTimer);
    $('#toast').textContent = message;
    $('#toast').hidden = false;
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 5000);
  };

  const setStorageState = (message = '', corrupt = false) => {
    const status = $('#storage-status');
    status.classList.toggle('unsaved', Boolean(message));
    status.replaceChildren();
    const dot = document.createElement('span');
    dot.className = 'status-dot';
    dot.setAttribute('aria-hidden', 'true');
    status.append(dot, document.createTextNode(message ? 'Cambios sin guardar' : 'Guardado en este navegador'));
    $('#storage-warning').hidden = !message;
    $('#storage-warning-text').textContent = message;
    $('#reset-storage').hidden = !corrupt;
  };

  const loadTasks = () => {
    let raw;
    try { raw = localStorage.getItem(STORAGE_KEY); }
    catch { setStorageState('El navegador bloqueó el almacenamiento. Puedes usar la agenda, pero los cambios se perderán al cerrar o recargar la página.'); return; }
    try { tasks = Core.decode(raw); }
    catch {
      storageBlocked = true;
      setStorageState('Los datos guardados no tienen un formato válido. No se han sobrescrito. Las tareas nuevas quedan solo en memoria hasta que restablezcas el almacenamiento.', true);
    }
  };

  const saveTasks = () => {
    if (storageBlocked) return false;
    try { localStorage.setItem(STORAGE_KEY, Core.encode(tasks)); setStorageState(); return true; }
    catch { setStorageState('No se pudieron guardar los cambios. Revisa el espacio o los permisos del navegador. Las tareas actuales solo permanecerán abiertas en esta pestaña.'); return false; }
  };

  const commit = (nextTasks, message) => {
    tasks = nextTasks;
    const saved = saveTasks();
    render();
    notify(saved ? message : `${message} Aviso: todavía no se ha guardado en el navegador.`);
  };

  const makeId = () => window.crypto?.randomUUID ? window.crypto.randomUUID() : `task-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const formatDate = (value) => new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
  const updateToday = () => {
    const today = new Date();
    $('#today-date').dateTime = Core.localDate(today);
    $('#today-date').textContent = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(today);
  };

  const renderSubjects = () => {
    const subjects = [...new Set(tasks.map((task) => task.subject))].sort((a, b) => a.localeCompare(b, 'es'));
    if (!subjects.includes(filters.subject)) filters.subject = '';
    const select = $('#subject-filter');
    select.replaceChildren(new Option('Todas las materias', ''));
    const datalist = $('#subjects');
    datalist.replaceChildren();
    subjects.forEach((subject) => { select.add(new Option(subject, subject)); datalist.append(new Option(subject, subject)); });
    select.value = filters.subject;
  };

  const renderSummary = () => {
    const summary = Core.summarize(tasks);
    $('#pending-count').textContent = summary.pending;
    $('#completed-count').textContent = summary.completed;
    $('#overdue-count').textContent = summary.overdue;
    $('#total-count').textContent = summary.total;
    $('#task-progress').value = summary.percent;
    $('#task-progress').textContent = `${summary.percent}%`;
    $('#progress-percent').textContent = `${summary.percent}%`;
    $('#progress-label').textContent = summary.total
      ? `${summary.completed} de ${summary.total} ${summary.total === 1 ? 'tarea completada' : 'tareas completadas'}`
      : 'Tu próxima tarea empieza aquí';
  };

  const renderTask = (task) => {
    const card = $('#task-template').content.firstElementChild.cloneNode(true);
    card.dataset.id = task.id;
    card.classList.toggle('is-completed', task.completed);
    // El texto del usuario se inserta con textContent, nunca con innerHTML.
    card.querySelector('.task-title').textContent = task.title;
    card.querySelector('.task-subject').textContent = task.subject;
    card.querySelector('.task-notes').textContent = task.notes;
    card.querySelector('.task-notes').hidden = !task.notes;
    const priority = card.querySelector('.priority-badge');
    priority.textContent = `Prioridad ${task.priority}`;
    priority.classList.add(`priority-${task.priority}`);
    const date = card.querySelector('.task-date');
    date.dateTime = task.dueDate;
    date.textContent = formatDate(task.dueDate);
    const label = card.querySelector('.due-label');
    const overdue = Core.isOverdue(task);
    label.textContent = task.completed ? 'Completada' : overdue ? 'Vencida' : task.dueDate === Core.localDate() ? 'Entrega hoy' : '';
    label.classList.toggle('overdue', overdue);
    const toggle = card.querySelector('[data-action="toggle"]');
    toggle.setAttribute('aria-pressed', String(task.completed));
    toggle.setAttribute('aria-label', `${task.completed ? 'Marcar como pendiente' : 'Completar'}: ${task.title}`);
    card.querySelector('[data-action="edit"]').setAttribute('aria-label', `Editar: ${task.title}`);
    card.querySelector('[data-action="delete"]').setAttribute('aria-label', `Eliminar: ${task.title}`);
    return card;
  };

  const hasFilters = () => Boolean(filters.query || filters.subject || filters.status !== 'all');
  const renderList = () => {
    const visible = Core.selectTasks(tasks, filters);
    const fragment = document.createDocumentFragment();
    visible.forEach((task) => fragment.append(renderTask(task)));
    $('#task-list').replaceChildren(fragment);
    $('#results-description').textContent = `${visible.length} de ${tasks.length} ${tasks.length === 1 ? 'tarea' : 'tareas'}`;
    $('#clear-filters').hidden = !hasFilters();
    $('#empty-state').hidden = visible.length > 0;
    const noTasks = tasks.length === 0;
    $('#empty-title').textContent = noTasks ? 'Haz espacio para lo que sigue' : 'No hay tareas en esta vista';
    $('#empty-description').textContent = noTasks ? 'Agrega tu primera tarea y empieza a organizar tu semestre.' : 'Prueba otra búsqueda o limpia los filtros para ver tus tareas.';
    $('#empty-action').textContent = noTasks ? 'Crear mi primera tarea →' : 'Limpiar filtros';
    $('.list-footnote').hidden = visible.length === 0;
    document.querySelectorAll('[data-filter]').forEach((button) => {
      const active = button.dataset.filter === filters.status;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  };

  const render = () => { updateToday(); renderSubjects(); renderSummary(); renderList(); };
  const clearErrors = () => fields.forEach((name) => { $(`#${name}`).removeAttribute('aria-invalid'); $(`#${name}-error`).hidden = true; });
  const resetForm = () => {
    editingId = null;
    form.reset();
    clearErrors();
    $('#form-heading').textContent = 'Nueva tarea';
    $('#form-subheading').textContent = 'Sácala de tu cabeza. Ponla aquí.';
    $('#submit-task').textContent = '＋ Agregar tarea';
    $('#cancel-edit').hidden = true;
    $('#notes-count').textContent = '0/500';
  };
  const resetFilters = () => {
    Object.assign(filters, { query: '', subject: '', status: 'all', sort: 'date' });
    $('#search').value = ''; $('#subject-filter').value = ''; $('#sort').value = 'date';
    renderList();
  };

  const startEdit = (task) => {
    editingId = task.id;
    clearErrors();
    fields.forEach((name) => { $(`#${name}`).value = task[name]; });
    $('#form-heading').textContent = 'Editar tarea';
    $('#form-subheading').textContent = 'Ajusta lo que cambió y sigue adelante.';
    $('#submit-task').textContent = 'Guardar cambios';
    $('#cancel-edit').hidden = false;
    $('#notes-count').textContent = `${task.notes.length}/500`;
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    $('#title').focus({ preventScroll: true });
  };

  const confirmAction = (title, description, label, action) => {
    $('#dialog-title').textContent = title;
    $('#dialog-description').textContent = description;
    $('#confirm-action').textContent = label;
    pendingDialogAction = action;
    $('#confirm-dialog').returnValue = 'cancel';
    $('#confirm-dialog').showModal();
  };

  // CREATE / UPDATE: validación, cambio del arreglo y render sin recarga.
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearErrors();
    const input = Object.fromEntries(new FormData(form).entries());
    const { data, errors, valid } = Core.validate(input);
    if (!valid) {
      Object.entries(errors).forEach(([name, message]) => {
        $(`#${name}`).setAttribute('aria-invalid', 'true');
        $(`#${name}-error`).textContent = message;
        $(`#${name}-error`).hidden = false;
      });
      $(`#${Object.keys(errors)[0]}`).focus();
      notify('Revisa los campos señalados antes de guardar.');
      return;
    }
    const now = new Date().toISOString();
    if (editingId) {
      if (!tasks.some((task) => task.id === editingId)) { notify('Esta tarea ya no existe. Vuelve a agregarla.'); resetForm(); return; }
      commit(tasks.map((task) => task.id === editingId ? { ...task, ...data, updatedAt: now } : task), 'Cambios guardados.');
    } else {
      commit([...tasks, { ...data, id: makeId(), completed: false, createdAt: now, updatedAt: now }], 'Tarea agregada.');
    }
    resetForm();
    resetFilters();
  });

  // Delegación de eventos: un listener atiende todas las tarjetas actuales y futuras.
  $('#task-list').addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const id = button.closest('[data-id]').dataset.id;
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    if (button.dataset.action === 'edit') startEdit(task);
    if (button.dataset.action === 'toggle') {
      commit(tasks.map((item) => item.id === id ? { ...item, completed: !item.completed, updatedAt: new Date().toISOString() } : item), task.completed ? 'Tarea marcada como pendiente.' : '¡Una tarea menos! Marcada como completada.');
      const replacement = [...$('#task-list').children].find((card) => card.dataset.id === id);
      if (replacement) replacement.querySelector('[data-action="toggle"]').focus();
      else document.querySelector('[data-filter].active').focus();
    }
    if (button.dataset.action === 'delete') confirmAction('¿Eliminar esta tarea?', `Se eliminará “${task.title}”. Esta acción no se puede deshacer.`, 'Eliminar tarea', () => {
      if (editingId === id) resetForm();
      commit(tasks.filter((item) => item.id !== id), 'Tarea eliminada.');
      $('#search').focus();
    });
  });

  // Confirma y guarda en el mismo evento, incluso si se recarga inmediatamente.
  $('#confirm-dialog form').addEventListener('submit', (event) => {
    event.preventDefault();
    const action = pendingDialogAction;
    pendingDialogAction = null;
    const confirmed = event.submitter?.value === 'confirm';
    $('#confirm-dialog').close(confirmed ? 'confirm' : 'cancel');
    if (confirmed && action) action();
  });
  $('#confirm-dialog').addEventListener('close', () => { pendingDialogAction = null; });
  $('#cancel-edit').addEventListener('click', () => { resetForm(); $('#title').focus(); });
  $('#notes').addEventListener('input', () => { $('#notes-count').textContent = `${$('#notes').value.length}/500`; });
  $('#search').addEventListener('input', (event) => { filters.query = event.target.value; renderList(); });
  $('#subject-filter').addEventListener('change', (event) => { filters.subject = event.target.value; renderList(); });
  $('#sort').addEventListener('change', (event) => { filters.sort = event.target.value; renderList(); });
  $('.status-filters').addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (button) { filters.status = button.dataset.filter; renderList(); }
  });
  $('#clear-filters').addEventListener('click', resetFilters);
  $('#empty-action').addEventListener('click', () => { if (tasks.length) resetFilters(); else $('#title').focus(); });

  // Los ejemplos son opcionales y nunca se mezclan con registros existentes.
  $('#load-examples').addEventListener('click', () => {
    if (tasks.length) { notify('Los ejemplos se cargan únicamente cuando la agenda está vacía.'); return; }
    const relativeDate = (days) => { const date = new Date(); date.setDate(date.getDate() + days); return Core.localDate(date); };
    const now = new Date().toISOString();
    const examples = [
      { title: 'Desarrollar la aplicación interactiva', subject: 'Programación Web', dueDate: relativeDate(2), priority: 'alta', notes: 'Implementar el CRUD y preparar la demostración de 3 minutos.', completed: false },
      { title: 'Repasar planificación de procesos', subject: 'Sistemas Operativos', dueDate: relativeDate(0), priority: 'media', notes: 'Resolver un ejemplo de Round Robin y otro de FCFS.', completed: false },
      { title: 'Entregar el modelo entidad-relación', subject: 'Bases de Datos', dueDate: relativeDate(-2), priority: 'alta', notes: 'Revisar las entidades, las claves y las relaciones.', completed: false },
      { title: 'Organizar los apuntes de la unidad', subject: 'Programación Web', dueDate: relativeDate(-1), priority: 'baja', notes: '', completed: true }
    ].map((task) => ({ ...task, id: makeId(), createdAt: now, updatedAt: now }));
    commit(examples, 'Se cargaron 4 tareas de ejemplo. Puedes editarlas o eliminarlas.');
    resetFilters();
  });

  $('#reset-storage').addEventListener('click', () => confirmAction('¿Restablecer los datos guardados?', 'Se reemplazará el contenido ilegible de esta agenda por las tareas que ves ahora. Solo se modificará el almacenamiento de Aula.', 'Restablecer', () => {
    storageBlocked = false;
    if (saveTasks()) notify('Almacenamiento restablecido. Tus tareas actuales están guardadas.');
  }));

  // Actualiza los vencimientos al regresar a la pestaña (por ejemplo, al día siguiente).
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
  loadTasks();
  render();
})();
