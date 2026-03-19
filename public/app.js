const API = '/api/tasks';
const TODOS_API = '/api/todos';

let filters = { status: '', assignee: '' };
let currentView = 'tasks';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Fetch and render tasks
async function loadTasks() {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.assignee) params.set('assignee', filters.assignee);

  const res = await fetch(`${API}?${params}`);
  const tasks = await res.json();
  renderTasks(tasks);
}

function renderTasks(tasks) {
  const grid = $('#task-grid');
  if (tasks.length === 0) {
    grid.innerHTML = '<div class="empty-state">No tasks found. Create one!</div>';
    return;
  }

  grid.innerHTML = tasks.map(t => `
    <div class="task-card" data-id="${t.id}">
      <div class="task-card-header">
        <span class="task-card-title">${esc(t.title)}</span>
        <span class="priority-badge priority-${t.priority}">${t.priority}</span>
      </div>
      ${t.description ? `<div class="task-card-desc">${esc(t.description)}</div>` : ''}
      <div class="task-card-footer">
        <span class="status-tag status-${t.status}">${formatStatus(t.status)}</span>
        <span class="assignee-tag">${t.assignee || 'Unassigned'}</span>
      </div>
    </div>
  `).join('');

  $$('.task-card').forEach(card => {
    card.addEventListener('click', () => openEditModal(tasks.find(t => t.id === +card.dataset.id)));
  });
}

function formatStatus(s) {
  return { 'todo': 'To Do', 'in-progress': 'In Progress', 'done': 'Done' }[s] || s;
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// Filters
$$('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.filter;
    const value = btn.dataset.value;
    filters[type] = value;

    $$(`.filter-btn[data-filter="${type}"]`).forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    updateViewTitle();
    loadTasks();
  });
});

function updateViewTitle() {
  const parts = [];
  if (filters.status) parts.push(formatStatus(filters.status));
  if (filters.assignee) parts.push(filters.assignee);
  $('#view-title').textContent = parts.length ? parts.join(' - ') : 'All Tasks';
}

// Modal
function openModal() {
  $('#modal-overlay').classList.add('open');
}

function closeModal() {
  $('#modal-overlay').classList.remove('open');
  $('#task-form').reset();
  $('#task-id').value = '';
  $('#delete-task-btn').style.display = 'none';
  $('#modal-title').textContent = 'New Task';
}

$('#new-task-btn').addEventListener('click', () => {
  closeModal();
  openModal();
});

$('#modal-close').addEventListener('click', closeModal);
$('#cancel-btn').addEventListener('click', closeModal);

$('#modal-overlay').addEventListener('click', (e) => {
  if (e.target === $('#modal-overlay')) closeModal();
});

function openEditModal(task) {
  $('#modal-title').textContent = 'Edit Task';
  $('#task-id').value = task.id;
  $('#task-title').value = task.title;
  $('#task-desc').value = task.description || '';
  $('#task-priority').value = task.priority;
  $('#task-status').value = task.status;
  $('#task-assignee').value = task.assignee || '';
  $('#delete-task-btn').style.display = 'inline-block';
  openModal();
}

// Save
$('#task-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    title: $('#task-title').value,
    description: $('#task-desc').value,
    priority: $('#task-priority').value,
    status: $('#task-status').value,
    assignee: $('#task-assignee').value || null,
  };

  const id = $('#task-id').value;

  if (id) {
    await fetch(`${API}/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  } else {
    await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  }

  closeModal();
  loadTasks();
});

// Delete
$('#delete-task-btn').addEventListener('click', async () => {
  const id = $('#task-id').value;
  if (id && confirm('Delete this task?')) {
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    closeModal();
    loadTasks();
  }
});

// === View switching ===
$$('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    switchView(btn.dataset.view);
  });
});

function switchView(view) {
  currentView = view;
  if (view === 'tasks') {
    $('#task-filters').style.display = '';
    $('#task-grid').style.display = '';
    $('#todos-panel').style.display = 'none';
    $('#new-task-btn').style.display = '';
    $('#view-title').textContent = 'All Tasks';
    updateViewTitle();
    loadTasks();
  } else {
    $('#task-filters').style.display = 'none';
    $('#task-grid').style.display = 'none';
    $('#todos-panel').style.display = '';
    $('#new-task-btn').style.display = 'none';
    $('#view-title').textContent = 'Todos';
    loadTodos();
  }
}

// === Todos ===
async function loadTodos() {
  const res = await fetch(TODOS_API);
  const todos = await res.json();
  renderTodos(todos);
}

function renderTodos(todos) {
  const panel = $('#todos-panel');
  const grouped = {};
  todos.forEach(t => {
    const cat = t.category || 'Uncategorized';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(t);
  });

  const categoryOrder = ['Infrastruktura & Workflow', 'Tým botů', 'Dashboard', 'Projekty'];
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    const ai = categoryOrder.indexOf(a);
    const bi = categoryOrder.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  panel.innerHTML = sortedKeys.map(cat => `
    <div class="todo-category">
      <h3 class="todo-category-title">${esc(cat)}</h3>
      <div class="todo-list">
        ${grouped[cat].map(t => `
          <div class="todo-item ${t.done ? 'todo-done' : ''}" data-id="${t.id}">
            <label class="todo-checkbox">
              <input type="checkbox" ${t.done ? 'checked' : ''} data-todo-id="${t.id}">
              <span class="todo-title">${esc(t.title)}</span>
            </label>
            <button class="todo-delete" data-todo-id="${t.id}">&times;</button>
          </div>
        `).join('')}
      </div>
      <div class="todo-add">
        <input type="text" class="todo-add-input" placeholder="+ Add todo..." data-category="${esc(cat)}">
      </div>
    </div>
  `).join('');

  // Toggle done
  panel.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', async () => {
      await fetch(`${TODOS_API}/${cb.dataset.todoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: cb.checked ? 1 : 0 })
      });
      loadTodos();
    });
  });

  // Delete
  panel.querySelectorAll('.todo-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      await fetch(`${TODOS_API}/${btn.dataset.todoId}`, { method: 'DELETE' });
      loadTodos();
    });
  });

  // Add todo
  panel.querySelectorAll('.todo-add-input').forEach(input => {
    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        await fetch(TODOS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: input.value.trim(), category: input.dataset.category })
        });
        loadTodos();
      }
    });
  });
}

// Init
loadTasks();
