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

// DELETE /api/todos/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM todos WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  res.json({ success: true });
});

module.exports = router;
