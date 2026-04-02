# Architecture Overview

## Stack

- **Backend:** Node.js + Express
- **Frontend:** Vanilla HTML / CSS / JavaScript
- **Database:** SQLite via `better-sqlite3`

## Current app shape

Openboard is a small server-rendered/static frontend app with a JSON API.

### Backend responsibilities
- serve static frontend files
- expose API endpoints for tasks, todos, dev log, and projects
- initialize and migrate SQLite schema

### Frontend responsibilities
- render views and navigation
- switch between Tasks / Todos / Dev Log
- submit forms and update state through the API
- manage lightweight responsive UI behavior

## Data domains

### Tasks
Structured work items with priority, status, assignee, and optional project assignment.

### Todos
Quick notes / raw ideas that may later be converted into tasks.

### Dev Log
Timeline of development activity and significant work history.

### Projects
Higher-level grouping for tasks and future context organization.

## Design direction

Keep the system:
- local-first
- understandable without framework complexity
- easy for AI agents to inspect and modify
- easy for Adam to reason about

## Constraints

- Prefer clear code over abstraction
- Migrations should be simple and safe for SQLite
- UI should work well on desktop first, but remain usable on mobile
