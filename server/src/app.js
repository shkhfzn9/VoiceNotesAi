require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./db');
const notesRouter = require('./routes/notes');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('[Server] Created uploads directory:', uploadsDir);
}

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://voice-notes-ai-nu.vercel.app',
  process.env.CLIENT_ORIGIN
].filter(Boolean);

console.log('[Server] Allowed CORS origins:', allowedOrigins);

app.use(cors({ 
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('[CORS] Allowed request from:', origin);
      callback(null, true);
    } else {
      console.warn('[CORS] Blocked request from:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Static hosting for uploaded audio files with error handling
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(uploadsDir, req.path);
  if (fs.existsSync(filePath)) {
    express.static(uploadsDir)(req, res, next);
  } else {
    console.warn('[Server] File not found:', filePath);
    res.status(404).json({ error: 'Audio file not found' });
  }
});

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
