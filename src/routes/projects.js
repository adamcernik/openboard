const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/projects
router.get('/', (req, res) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY name ASC').all();
  res.json(projects);
});

// POST /api/projects
router.post('/', (req, res) => {
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    const stmt = db.prepare('INSERT INTO projects (name, description) VALUES (?, ?)');
    const result = stmt.run(name.trim(), description || null);
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(project);
  } catch (e) {
    if (e.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'A project with that name already exists' });
    }
    throw e;
  }
});

module.exports = router;
