const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../dist/core.js');

const base = { id: '1', title: 'Exposición de JavaScript', subject: 'Programación Web', dueDate: '2026-11-05', priority: 'media', notes: 'Repasar el DOM', completed: false, createdAt: '2026-10-27T12:00:00.000Z', updatedAt: '2026-10-27T12:00:00.000Z' };
const filters = { query: '', status: 'all', subject: '', sort: 'date' };

test('valida campos requeridos y elimina espacios externos', () => {
  assert.equal(Core.validate({ ...base, title: '  Tarea de prueba  ' }).data.title, 'Tarea de prueba');
  assert.equal(Core.validate(base).valid, true);
  const bad = Core.validate({ title: '  ', subject: ' ', priority: 'urgente', dueDate: '' });
  assert.deepEqual(Object.keys(bad.errors), ['title', 'subject', 'dueDate', 'priority']);
});

test('respeta los límites del título, materia y notas', () => {
  assert.equal(Core.validate({ ...base, title: 'a'.repeat(80), subject: 'b'.repeat(50), notes: 'c'.repeat(500) }).valid, true);
  const bad = Core.validate({ ...base, title: 'a'.repeat(81), subject: 'b'.repeat(51), notes: 'c'.repeat(501) });
  assert.deepEqual(Object.keys(bad.errors), ['title', 'subject', 'notes']);
});

test('rechaza fechas imposibles y acepta años bisiestos', () => {
  for (const value of ['2026-02-29', '2026-04-31', '2026-13-01', '2026-00-10', '2026-01-00', '1899-01-01', '26-1-1', '']) assert.equal(Core.validDate(value), false, value);
  for (const value of ['2024-02-29', '2026-12-31', '1900-01-01', '9999-12-31']) assert.equal(Core.validDate(value), true, value);
});

test('cuenta vencidas sin incluir completadas ni entregas de hoy', () => {
  const tasks = [base, { ...base, id: '2', dueDate: '2026-11-04' }, { ...base, id: '3', completed: true, dueDate: '2026-11-01' }];
  assert.deepEqual(Core.summarize(tasks, '2026-11-05'), { total: 3, pending: 2, completed: 1, overdue: 1, percent: 33 });
  assert.deepEqual(Core.summarize([], '2026-11-05'), { total: 0, pending: 0, completed: 0, overdue: 0, percent: 0 });
});

test('busca sin acentos ni mayúsculas en título, materia y notas', () => {
  for (const query of ['EXPOSICION', 'programacion', 'dom']) assert.equal(Core.selectTasks([base], { ...filters, query }).length, 1);
  assert.equal(Core.selectTasks([base], { ...filters, query: 'inexistente' }).length, 0);
});

test('combina búsqueda, estado y materia', () => {
  const tasks = [base, { ...base, id: '2', completed: true }, { ...base, id: '3', subject: 'Bases de Datos' }];
  assert.deepEqual(Core.selectTasks(tasks, { ...filters, query: 'javascript', status: 'pending', subject: 'Programación Web' }).map((item) => item.id), ['1']);
  assert.equal(Core.selectTasks(tasks, { ...filters, status: 'completed' }).length, 1);
  assert.equal(Core.selectTasks(tasks, { ...filters, status: 'overdue' }, '2026-11-06').length, 2);
});

test('ordena por fecha y prioridad sin modificar el arreglo original', () => {
  const tasks = [{ ...base, id: 'a', priority: 'baja', dueDate: '2026-11-06' }, { ...base, id: 'b', priority: 'alta', dueDate: '2026-11-04' }, { ...base, id: 'c', priority: 'media' }];
  assert.deepEqual(Core.selectTasks(tasks, filters).map((item) => item.id), ['b', 'c', 'a']);
  assert.deepEqual(Core.selectTasks(tasks, { ...filters, sort: 'priority' }).map((item) => item.id), ['b', 'c', 'a']);
  assert.deepEqual(tasks.map((item) => item.id), ['a', 'b', 'c']);
});

test('ordena por nombre y fecha de creación', () => {
  const tasks = [{ ...base, id: '1', title: 'Zoología' }, { ...base, id: '2', title: 'Álgebra', createdAt: '2026-10-28T12:00:00.000Z' }];
  assert.deepEqual(Core.selectTasks(tasks, { ...filters, sort: 'title' }).map((item) => item.id), ['2', '1']);
  assert.deepEqual(Core.selectTasks(tasks, { ...filters, sort: 'recent' }).map((item) => item.id), ['2', '1']);
});

test('serializa y recupera todos los campos', () => {
  assert.deepEqual(Core.decode(Core.encode([base])), [base]);
  assert.deepEqual(Core.decode(null), []);
  assert.deepEqual(Core.decode(Core.encode([])), []);
});

test('rechaza JSON corrupto, versiones desconocidas y registros inseguros', () => {
  for (const raw of ['esto no es json', 'null', '[]', '{"version":2,"tasks":[]}', '{"version":1,"tasks":{}}']) assert.throws(() => Core.decode(raw));
  for (const task of [{ ...base, completed: 'false' }, { ...base, dueDate: '2026-02-30' }, { ...base, createdAt: 'ayer' }, { ...base, id: '' }, { ...base, notes: {} }]) assert.throws(() => Core.decode(Core.encode([task])));
  assert.throws(() => Core.decode(Core.encode([base, base])));
});
