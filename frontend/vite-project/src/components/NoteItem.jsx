import React from 'react'

export default function NoteItem({ note, onSelect, onDelete, onEdit, onGenerateSummary, selected, index }) {
  const created = new Date(note.createdAt).toLocaleString()
  const duration = note.audio?.duration ? `${note.audio.duration}s` : '—'
  const hasSummary = !!note.summary
  const summaryStatus = note.isSummaryOutdated ? 'needs update' : 'up-to-date'

  // Function to handle note div click (excluding button clicks)
  const handleNoteClick = (e) => {
    // Don't trigger if clicking on buttons
    if (e.target.closest('.actions')) {
      return
    }
    onSelect()
  }

  return (
    <div 
      className="item" 
      style={{ 
        borderColor: selected ? '#2b6fff' : '#eee', 
        background: selected ? '#eef3ff' : '#fafafa',
        borderWidth: selected ? '2px' : '1px',
        cursor: 'pointer'
      }}
      onClick={handleNoteClick}
    >
      <div className="item-content">
        <div className="title">
          {index !== undefined && <span style={{ 
            color: '#999', 
            marginRight: '10px', 
            fontWeight: '500',
            fontSize: '14px',
            minWidth: '20px',
            display: 'inline-block'
          }}>{index + 1}.</span>}
          {note.title || 'Untitled'}
          {selected && <span style={{ 
            color: '#2b6fff', 
            marginLeft: '8px', 
            fontWeight: 'bold'
          }}>✓</span>}
        </div>
        <div className="meta">
          <span>📅 {created}</span>
          <span>⏱️ {duration}</span>
          <span style={{ 
            color: hasSummary ? (note.isSummaryOutdated ? '#ff6b35' : '#28a745') : '#666',
            fontWeight: hasSummary ? 'bold' : 'normal'
          }}>
            {hasSummary ? `📝 ${summaryStatus}` : '📝 No summary'}
          </span>
        </div>
        {note.transcript && (
          <div className="transcript-preview">
            {note.transcript.length > 100 
              ? `${note.transcript.substring(0, 100)}...` 
              : note.transcript
            }
          </div>
        )}
      </div>
      <div className="actions" onClick={(e) => e.stopPropagation()}>
        <button 
          className="button secondary" 
          onClick={() => onEdit(note._id)}
          title="Edit note transcript"
        >
          Edit
        </button>
        <button 
          className="button danger" 
          onClick={onDelete}
          title="Delete this note"
        >
          Delete
        </button>
        <button 
          className="button secondary" 
          onClick={() => onGenerateSummary(note._id)}
          title="Generate AI summary"
        >
          <span className="desktop-text">Generate Summary</span>
          <span className="mobile-text">Gen Summary</span>
        </button>
      </div>
    </div>
  )
}
