const express = require('express');
const path = require('path');
const tasksRouter = require('./routes/tasks');
const todosRouter = require('./routes/todos');
const devlogRouter = require('./routes/devlog');
const projectsRouter = require('./routes/projects');

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/tasks', tasksRouter);
app.use('/api/todos', todosRouter);
app.use('/api/devlog', devlogRouter);
app.use('/api/projects', projectsRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Dashboard running at http://0.0.0.0:${PORT}`);
});
