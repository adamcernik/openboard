const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/tasks
router.get('/', (req, res) => {
  let sql = 'SELECT * FROM tasks WHERE 1=1';
  const params = [];

  if (req.query.status) {
    sql += ' AND status = ?';
    params.push(req.query.status);
  }
  if (req.query.assignee) {
    sql += ' AND assignee = ?';
    params.push(req.query.assignee);
  }

  sql += ' ORDER BY created_at DESC';

  const tasks = db.prepare(sql).all(...params);
  res.json(tasks);
});

// POST /api/tasks
router.post('/', (req, res) => {
  const { title, description, priority, status, assignee } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const stmt = db.prepare(`
    INSERT INTO tasks (title, description, priority, status, assignee)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    title.trim(),
    description || '',
    priority || 'medium',
    status || 'todo',
    assignee || null
  );

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(task);
});

// PATCH /api/tasks/:id
router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const fields = ['title', 'description', 'priority', 'status', 'assignee'];
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

  updates.push("updated_at = datetime('now')");
  params.push(req.params.id);

  db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json(task);
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json({ success: true });
});

module.exports = router;
