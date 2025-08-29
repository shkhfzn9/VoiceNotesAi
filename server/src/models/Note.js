const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'New Voice Note' },
    audio: {
      url: { type: String, required: true }, // e.g., /uploads/filename.webm
      duration: { type: Number, default: 0 }, // seconds
    },
    transcript: { type: String, required: true },
    summary: { type: String, default: null },
    isSummaryOutdated: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', NoteSchema);
