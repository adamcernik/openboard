const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'tasks.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
    status TEXT DEFAULT 'todo' CHECK(status IN ('todo', 'in-progress', 'done')),
    assignee TEXT CHECK(assignee IN ('TARS', 'Erik', 'Brock', 'Adam') OR assignee IS NULL),
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT,
    done INTEGER DEFAULT 0,
    converted INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now'))
  )
`);

// Migration: add converted column if missing (existing databases)
try {
  db.exec('ALTER TABLE todos ADD COLUMN converted INTEGER DEFAULT 0');
} catch (e) {
  if (!e.message.includes('duplicate column')) throw e;
}

// Seed todos if table is empty
const todoCount = db.prepare('SELECT COUNT(*) as count FROM todos').get();
if (todoCount.count === 0) {
  const insert = db.prepare('INSERT INTO todos (title, category, done) VALUES (?, ?, ?)');
  const seed = db.transaction(() => {
    const infra = 'Infrastruktura & Workflow';
    insert.run('HTTP file server — základ pro posílání fotek/souborů přes Telegram + budoucí deployment', infra, 0);
    insert.run('Biketime projekt memory — BIKETIME.md s architekturou, backlogem a statusem', infra, 0);
    insert.run('GitHub integrace — propojit s Biketime repem, hlídat PR/issues/CI', infra, 0);
    insert.run('Ranní briefing — automatická zpráva každé ráno (počasí + kalendář + GH issues)', infra, 0);
    insert.run('Příkazové zkratky — /status, /todo, /briefing, /deploy atd.', infra, 0);
    insert.run('Nastavit Docker', infra, 0);

    const bots = 'Tým botů';
    insert.run('Vytvořit Erika (vývojář bot)', bots, 1);
    insert.run('Vytvořit Brocka (tester bot)', bots, 0);

    const dash = 'Dashboard';
    insert.run('Dashboard MVP — Node.js + Express + SQLite + Vanilla JS', dash, 1);
    insert.run('Fix Tailscale přístup — vyřešit firewall, přístup z MacBooku', dash, 0);
    insert.run('Persistent server — launchd service, auto-start po restartu Mini', dash, 0);
    insert.run('Propojit TARS s Dashboardem — čtu tasky z DB, přiřazuju Erikovi', dash, 0);
    insert.run('Task komentáře — poznámky na taskách pro komunikaci mezi agenty', dash, 0);
    insert.run('GitHub link — propojit tasky s commity/PR', dash, 0);

    const proj = 'Projekty';
    insert.run('Spustit vývoj Biketime Rental', proj, 0);
  });
  seed();
}

// Dev Log table
db.exec(`
  CREATE TABLE IF NOT EXISTS dev_log (
    id INTEGER PRIMARY KEY,
    created_at DATETIME DEFAULT (datetime('now')),
    agent TEXT,
    title TEXT NOT NULL,
    branch TEXT,
    pr_url TEXT,
    notes TEXT
  )
`);

// Seed dev_log if table is empty
const logCount = db.prepare('SELECT COUNT(*) as count FROM dev_log').get();
if (logCount.count === 0) {
  const insertLog = db.prepare(
    'INSERT INTO dev_log (agent, title, branch, pr_url, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const seedLog = db.transaction(() => {
    insertLog.run('Erik', 'Dashboard MVP', 'main', null, null, '2025-06-01 10:00:00');
    insertLog.run('Erik', 'Todos section with DB seeding', 'main', null, null, '2025-06-02 14:00:00');
    insertLog.run(
      'Erik',
      'Todo → Task conversion',
      'feature/todo-to-task',
      'https://github.com/adamcernik/openboard/commit/d456ff0',
      'Atomic conversion via POST /api/todos/:id/convert. Brock reviewed and approved.',
      '2025-06-03 09:00:00'
    );
  });
  seedLog();
}

module.exports = db;
