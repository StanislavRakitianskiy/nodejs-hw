require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pinoHttp = require('pino-http');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(pinoHttp());

// Routes
app.get('/notes', (req, res) => {
  res.status(200).json({
    message: 'Retrieved all notes'
  });
});

app.get('/notes/:noteId', (req, res) => {
  const { noteId } = req.params;
  res.status(200).json({
    message: `Retrieved note with ID: ${noteId}`
  });
});

app.get('/test-error', () => {
  throw new Error('Simulated server error');
});

// 404 middleware
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

// 500 error middleware
app.use((err, req, res, next) => {
  res.status(500).json({
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
