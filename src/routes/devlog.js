const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/devlog — list all entries, newest first
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM dev_log ORDER BY created_at DESC').all();
  res.json(rows);
});

// POST /api/devlog — create entry
router.post('/', (req, res) => {
  const { agent, title, branch, pr_url, notes } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const result = db.prepare(
    'INSERT INTO dev_log (agent, title, branch, pr_url, notes) VALUES (?, ?, ?, ?, ?)'
  ).run(agent || null, title.trim(), branch || null, pr_url || null, notes || null);

  const entry = db.prepare('SELECT * FROM dev_log WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(entry);
});

module.exports = router;
