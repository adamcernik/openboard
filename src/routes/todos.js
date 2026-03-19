const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/todos
router.get('/', (req, res) => {
  let sql = 'SELECT * FROM todos WHERE 1=1';
  const params = [];

  if (req.query.category) {
    sql += ' AND category = ?';
    params.push(req.query.category);
  }

  sql += ' ORDER BY done ASC, created_at ASC';

  const todos = db.prepare(sql).all(...params);
  res.json(todos);
});

// POST /api/todos
router.post('/', (req, res) => {
  const { title, category } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const result = db.prepare(
    'INSERT INTO todos (title, category) VALUES (?, ?)'
  ).run(title.trim(), category || null);

  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(todo);
});

// PATCH /api/todos/:id
router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  if (req.body.converted !== undefined && ![0, 1].includes(req.body.converted)) {
    return res.status(400).json({ error: 'converted must be 0 or 1' });
  }

  const fields = ['title', 'category', 'done', 'converted'];
  const updates = [];
  const params = [];

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      params.push(req.body[field]);
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  params.push(req.params.id);
  db.prepare(`UPDATE todos SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id);
  res.json(todo);
});

// POST /api/todos/:id/convert — atomic todo→task conversion
router.post('/:id/convert', (req, res) => {
  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id);
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  if (todo.converted) {
    return res.status(409).json({ error: 'Todo already converted' });
  }

  const { description, priority, status, assignee } = req.body;

  const convert = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO tasks (title, description, priority, status, assignee)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      todo.title,
      description || '',
      priority || 'medium',
      status || 'todo',
      assignee || null
    );

    db.prepare('UPDATE todos SET converted = 1 WHERE id = ?').run(todo.id);

    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  });

  try {
    const task = convert();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Conversion failed' });
  }
});

// DELETE /api/todos/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM todos WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  res.json({ success: true });
});

module.exports = router;
