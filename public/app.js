const API = '/api/tasks';
const TODOS_API = '/api/todos';
const DEVLOG_API = '/api/devlog';
const PROJECTS_API = '/api/projects';

let filters = { status: '', assignee: '' };
let currentView = 'tasks';
let selectedProjectId = '';
let projectsCache = [];

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// === Projects ===
async function loadProjects() {
  const res = await fetch(PROJECTS_API);
  projectsCache = await res.json();
  populateProjectSelectors();
}

function populateProjectSelectors() {
  // Navbar selector
  const sel = $('#project-selector');
  const current = sel.value;
  sel.innerHTML = '<option value="">All projects</option>' +
    projectsCache.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  sel.value = current;

  // Task form selector
  const taskSel = $('#task-project');
  const taskCurrent = taskSel.value;
  taskSel.innerHTML = '<option value="">No project</option>' +
    projectsCache.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  taskSel.value = taskCurrent;
}

$('#project-selector').addEventListener('change', (e) => {
  selectedProjectId = e.target.value;
  if (currentView === 'tasks') loadTasks();
});

// New project modal
function openProjectModal() {
  $('#project-modal-overlay').classList.add('open');
}

function closeProjectModal() {
  $('#project-modal-overlay').classList.remove('open');
  $('#project-form').reset();
}

$('#new-project-btn').addEventListener('click', openProjectModal);
$('#project-modal-close').addEventListener('click', closeProjectModal);
$('#project-cancel-btn').addEventListener('click', closeProjectModal);
$('#project-modal-overlay').addEventListener('click', (e) => {
  if (e.target === $('#project-modal-overlay')) closeProjectModal();
});

$('#project-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    name: $('#project-name').value,
    description: $('#project-desc').value || null,
  };

  try {
    const res = await fetch(PROJECTS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Request failed');
    }
    const project = await res.json();
    closeProjectModal();
    await loadProjects();
    // Auto-select the newly created project
    $('#project-selector').value = project.id;
    selectedProjectId = String(project.id);
    if (currentView === 'tasks') loadTasks();
  } catch (err) {
    alert(`Failed to create project: ${err.message}`);
  }
});

// Fetch and render tasks
async function loadTasks() {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.assignee) params.set('assignee', filters.assignee);
  if (selectedProjectId) params.set('project_id', selectedProjectId);

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
  $('#converting-todo-id').value = '';
  $('#delete-task-btn').style.display = 'none';
  $('#modal-title').textContent = 'New Task';
}

$('#new-task-btn').addEventListener('click', () => {
  closeModal();
  // Pre-select current project filter
  if (selectedProjectId) {
    $('#task-project').value = selectedProjectId;
  }
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
  $('#task-project').value = task.project_id || '';
  $('#delete-task-btn').style.display = 'inline-block';
  openModal();
}

// Open task modal pre-filled with todo title for conversion
function openConvertModal(todo) {
  closeModal();
  $('#modal-title').textContent = 'Convert Todo → Task';
  $('#task-title').value = todo.title;
  $('#converting-todo-id').value = todo.id;
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
    project_id: $('#task-project').value ? Number($('#task-project').value) : null,
  };

  const id = $('#task-id').value;
  const convertingTodoId = $('#converting-todo-id').value;

  try {
    let res;

    if (convertingTodoId) {
      // Atomic conversion: single endpoint creates task + marks todo converted
      res = await fetch(`${TODOS_API}/${convertingTodoId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else if (id) {
      res = await fetch(`${API}/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    } else {
      res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Request failed');
    }
  } catch (err) {
    alert(`Failed to save: ${err.message}`);
    return;
  }

  closeModal();
  loadTasks();
  if (convertingTodoId) loadTodos();
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
  $('#task-filters').style.display = 'none';
  $('#task-grid').style.display = 'none';
  $('#todos-panel').style.display = 'none';
  $('#devlog-panel').style.display = 'none';
  $('#new-task-btn').style.display = 'none';

  if (view === 'tasks') {
    $('#task-filters').style.display = '';
    $('#task-grid').style.display = '';
    $('#new-task-btn').style.display = '';
    $('#view-title').textContent = 'All Tasks';
    updateViewTitle();
    loadTasks();
  } else if (view === 'todos') {
    $('#view-title').textContent = 'Todos';
    $('#todos-panel').style.display = '';
    loadTodos();
  } else if (view === 'devlog') {
    $('#view-title').textContent = 'Dev Log';
    $('#devlog-panel').style.display = '';
    loadDevLog();
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
          <div class="todo-item ${t.done ? 'todo-done' : ''} ${t.converted ? 'todo-converted' : ''}" data-id="${t.id}">
            <label class="todo-checkbox">
              <input type="checkbox" ${t.done ? 'checked' : ''} ${t.converted ? 'disabled' : ''} data-todo-id="${t.id}">
              <span class="todo-title">${esc(t.title)}</span>
            </label>
            ${t.converted
              ? '<span class="todo-converted-badge">Converted</span>'
              : `<button class="todo-convert" data-todo-id="${t.id}" title="Convert to Task">&#x2197;</button>`}
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

  // Convert to task
  panel.querySelectorAll('.todo-convert').forEach(btn => {
    btn.addEventListener('click', () => {
      const todo = todos.find(t => t.id === +btn.dataset.todoId);
      if (todo) openConvertModal(todo);
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

// === Dev Log ===
const AGENT_COLORS = { Erik: '#3b82f6', Brock: '#a855f7', Tars: '#22c55e' };

async function loadDevLog() {
  const res = await fetch(DEVLOG_API);
  const entries = await res.json();
  renderDevLog(entries);
}

function renderDevLog(entries) {
  const timeline = $('#devlog-timeline');
  if (entries.length === 0) {
    timeline.innerHTML = '<div class="empty-state">No dev log entries yet.</div>';
    return;
  }

  timeline.innerHTML = entries.map(e => {
    const date = new Date(e.created_at + 'Z');
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const color = AGENT_COLORS[e.agent] || 'var(--text-muted)';

    return `
      <div class="devlog-entry">
        <div class="devlog-dot" style="background:${color}"></div>
        <div class="devlog-content">
          <div class="devlog-header">
            <span class="devlog-agent" style="background:${color}20;color:${color}">${esc(e.agent || 'Unknown')}</span>
            <span class="devlog-date">${dateStr}</span>
          </div>
          <div class="devlog-title">${esc(e.title)}</div>
          ${e.branch || e.pr_url ? `
            <div class="devlog-meta">
              ${e.branch ? `<span class="devlog-branch">${esc(e.branch)}</span>` : ''}
              ${e.pr_url ? `<a class="devlog-link" href="${esc(e.pr_url)}" target="_blank" rel="noopener">View PR/Commit</a>` : ''}
            </div>
          ` : ''}
          ${e.notes ? `<div class="devlog-notes">${esc(e.notes)}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

$('#devlog-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    agent: $('#devlog-agent').value,
    title: $('#devlog-title').value,
    branch: $('#devlog-branch').value || null,
    pr_url: $('#devlog-pr').value || null,
    notes: $('#devlog-notes').value || null,
  };

  try {
    const res = await fetch(DEVLOG_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Request failed');
    }
    $('#devlog-form').reset();
    loadDevLog();
  } catch (err) {
    alert(`Failed to save: ${err.message}`);
  }
});

// Init
loadProjects();
loadTasks();
