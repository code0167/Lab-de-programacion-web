/* Lógica de datos independiente del DOM; también se puede probar con Node.js. */
(() => {
  'use strict';
  const PRIORITIES = ['alta', 'media', 'baja'];
  const normalize = (text) => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  // Las fechas YYYY-MM-DD se comparan como texto, sin convertirlas a UTC.
  const validDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    if (year < 1900 || year > 9999) return false;
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  };

  const cleanInput = (input) => ({
    title: String(input.title ?? '').trim(),
    subject: String(input.subject ?? '').trim(),
    dueDate: String(input.dueDate ?? ''),
    priority: String(input.priority ?? ''),
    notes: String(input.notes ?? '').trim()
  });

  const validate = (input) => {
    const data = cleanInput(input);
    const errors = {};
    if (data.title.length < 3 || data.title.length > 80) errors.title = 'Escribe un título de 3 a 80 caracteres.';
    if (data.subject.length < 2 || data.subject.length > 50) errors.subject = 'Escribe una materia de 2 a 50 caracteres.';
    if (!validDate(data.dueDate)) errors.dueDate = 'Selecciona una fecha válida entre 1900 y 9999.';
    if (!PRIORITIES.includes(data.priority)) errors.priority = 'Selecciona una prioridad válida.';
    if (data.notes.length > 500) errors.notes = 'Las notas deben tener como máximo 500 caracteres.';
    return { data, errors, valid: Object.keys(errors).length === 0 };
  };

  const isOverdue = (task, today = localDate()) => !task.completed && task.dueDate < today;
  const summarize = (tasks, today = localDate()) => {
    const completed = tasks.filter((task) => task.completed).length;
    return { total: tasks.length, completed, pending: tasks.length - completed,
      overdue: tasks.filter((task) => isOverdue(task, today)).length,
      percent: tasks.length ? Math.round((completed / tasks.length) * 100) : 0 };
  };

  const selectTasks = (tasks, filters, today = localDate()) => tasks.filter((task) => {
    const matchesText = normalize(`${task.title} ${task.subject} ${task.notes}`).includes(normalize(filters.query.trim()));
    const matchesSubject = !filters.subject || task.subject === filters.subject;
    const matchesState = filters.status === 'all' || (filters.status === 'pending' && !task.completed)
      || (filters.status === 'completed' && task.completed) || (filters.status === 'overdue' && isOverdue(task, today));
    return matchesText && matchesSubject && matchesState;
  }).sort((a, b) => {
    if (filters.sort === 'priority') return PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority) || a.dueDate.localeCompare(b.dueDate);
    if (filters.sort === 'recent') return b.createdAt.localeCompare(a.createdAt);
    if (filters.sort === 'title') return a.title.localeCompare(b.title, 'es');
    return a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title, 'es');
  });

  // Rechaza datos corruptos antes de usarlos. Nunca ejecuta contenido almacenado.
  const decode = (raw) => {
    if (raw === null) return [];
    const payload = JSON.parse(raw);
    if (!payload || payload.version !== 1 || !Array.isArray(payload.tasks)) throw new Error('Formato no compatible');
    const ids = new Set();
    return payload.tasks.map((task) => {
      if (!task || typeof task !== 'object') throw new Error('Registro no válido');
      const fields = ['title', 'subject', 'dueDate', 'priority', 'notes'];
      const { data, valid } = validate(task);
      if (!valid || fields.some((field) => typeof task[field] !== 'string')
        || typeof task.id !== 'string' || !task.id || task.id.length > 100 || ids.has(task.id)
        || typeof task.completed !== 'boolean' || typeof task.createdAt !== 'string'
        || typeof task.updatedAt !== 'string' || !Number.isFinite(Date.parse(task.createdAt))
        || !Number.isFinite(Date.parse(task.updatedAt))) throw new Error('Registro no válido');
      ids.add(task.id);
      return { ...data, id: task.id, completed: task.completed, createdAt: task.createdAt, updatedAt: task.updatedAt };
    });
  };
  const encode = (tasks) => JSON.stringify({ version: 1, tasks });
  const api = { PRIORITIES, normalize, localDate, validDate, cleanInput, validate, isOverdue, summarize, selectTasks, decode, encode };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.AgendaCore = api;
})();
