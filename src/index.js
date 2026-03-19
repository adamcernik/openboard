const express = require('express');
const path = require('path');
const tasksRouter = require('./routes/tasks');

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/tasks', tasksRouter);

app.listen(PORT, () => {
  console.log(`Dashboard running at http://localhost:${PORT}`);
});
