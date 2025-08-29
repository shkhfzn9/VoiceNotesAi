require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./db');
const notesRouter = require('./routes/notes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ 
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.CLIENT_ORIGIN
  ].filter(Boolean)
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Static hosting for uploaded audio files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API routes
app.use('/api/notes', notesRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('[Error]', error.message);
  res.status(500).json({ error: error.message });
});

connectDB().then(() => {
  app.listen(PORT, () => console.log(`[Server] Listening on http://localhost:${PORT}`));
});
