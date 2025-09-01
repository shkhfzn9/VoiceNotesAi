const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  summarizeNote
} = require('../controllers/notesController');

// Ensure uploads directory exists
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('[Routes] Created uploads directory:', uploadsDir);
}

// Multer disk storage for audio files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '.webm') || '.webm';
    const name = crypto.randomBytes(8).toString('hex') + ext;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  const ok = [
    'audio/webm',
    'audio/ogg',
    'audio/mpeg',
    'audio/wav',
    'audio/mp4',
    'video/webm' // some browsers label it as video/webm
  ];
  if (ok.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Unsupported audio format: ' + file.mimetype));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/', getNotes);
router.get('/:id', getNoteById);
router.post('/', upload.single('audio'), createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);
router.post('/:id/summarize', summarizeNote);

module.exports = router;
