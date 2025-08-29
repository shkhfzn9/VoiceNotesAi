const fs = require('fs');
const path = require('path');
const Note = require('../models/Note');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY;
let model = null;
if (apiKey) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  } catch (err) {
    console.error('[Gemini] Init error:', err.message);
  }
}

exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notes', details: err.message });
  }
};

exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch the note', details: err.message });
  }
};

exports.createNote = async (req, res) => {
  try {
    console.log('[CreateNote] Request body:', req.body);
    console.log('[CreateNote] File:', req.file);
    
    const file = req.file;
    const { title, transcript, duration } = req.body;

    if (!file) return res.status(400).json({ error: 'Audio file is required' });
    if (!transcript || !transcript.trim()) return res.status(400).json({ error: 'Transcript is required' });

    const noteData = {
      title: title && title.trim() ? title.trim() : 'New Voice Note',
      audio: {
        url: '/uploads/' + file.filename,
        duration: duration ? Number(duration) : 0,
      },
      transcript: transcript.trim(),
      summary: null,
      isSummaryOutdated: true,
    };
    
    console.log('[CreateNote] Creating note with data:', noteData);
    const note = await Note.create(noteData);
    console.log('[CreateNote] Note created:', note);

    res.status(201).json(note);
  } catch (err) {
    console.error('[CreateNote] Error:', err);
    res.status(500).json({ error: 'Failed to create note', details: err.message });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { transcript, title } = req.body;
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    if (typeof title === 'string') note.title = title;
    if (typeof transcript === 'string') {
      note.transcript = transcript;
      note.summary = null;
      note.isSummaryOutdated = true;
    }

    await note.save();
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update note', details: err.message });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    // Attempt to delete the underlying file (best-effort)
    const rel = note.audio?.url || '';
    if (rel && rel.startsWith('/uploads/')) {
      const p = path.join(__dirname, '..', '..', rel);
      fs.unlink(p, (err) => {
        if (err) console.warn('[Delete] Could not remove file:', p, err.message);
      });
    }

    await note.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note', details: err.message });
  }
};

exports.summarizeNote = async (req, res) => {
  try {
    if (!model) return res.status(500).json({ error: 'Gemini model not initialized. Check GEMINI_API_KEY.' });

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const prompt = `You are an expert note-taker. Produce a concise summary (3–6 bullet points) of the following voice-note transcript. 
Focus on key points and any action items. Use short, clear bullets.\n\nTRANSCRIPT:\n${note.transcript}`;

    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() || 'No summary generated.';

    note.summary = text;
    note.isSummaryOutdated = false;
    await note.save();

    res.json({ summary: note.summary, isSummaryOutdated: note.isSummaryOutdated });
  } catch (err) {
    const status = err?.response?.status || 500;
    res.status(status).json({ error: 'Failed to summarize', details: err.message });
  }
};
