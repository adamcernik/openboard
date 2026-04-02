# Openboard

A lightweight task management dashboard for small teams. Manage tasks with priorities, statuses, and assignees, organize todos by category, and convert todos into tasks with one click.

## Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** Vanilla HTML/CSS/JS (dark theme)
- **Database:** SQLite (via better-sqlite3, WAL mode)

## Getting Started

```bash
npm install
npm run dev      # starts with --watch on localhost:3001
```

The database initializes automatically on first run.

## Project Home

Project documentation lives in [`docs/`](./docs):
- product vision
- roadmap
- architecture overview
- decisions log
- workflow

Start with [`docs/README.md`](./docs/README.md).

## API

| Endpoint | Methods |
|---|---|
| `/api/tasks` | GET, POST, PATCH, DELETE |
| `/api/todos` | GET, POST, PATCH, DELETE |
| `/api/todos/:id/convert` | POST |
