import React, { useEffect, useMemo, useState } from 'react'
import api, { API_BASE_URL } from './api'
import Recorder from './components/Recorder'
import NoteItem from './components/NoteItem'
import './mobile.css'

export default function App() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  
  // Track if transcript has been modified since last save
  const [transcriptModified, setTranscriptModified] = useState(false)
  const [originalTranscript, setOriginalTranscript] = useState('')
  
  // Add view mode state
  const [viewMode, setViewMode] = useState('details') // 'details', 'edit', 'summary'
  
  // Toast state
  const [toasts, setToasts] = useState([])

  // Toast functions
  const showToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now()
    const newToast = { id, message, type, duration }
    setToasts(prev => [...prev, newToast])
    
    // Auto remove toast after duration
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showSuccessToast = (message) => showToast(message, 'success')
  const showErrorToast = (message) => showToast(message, 'error')
  const showInfoToast = (message) => showToast(message, 'info')
  const showWarningToast = (message) => showToast(message, 'warning')

  async function loadNotes() {
    setLoading(true)
    try {
      const res = await api.get('/notes')
      setNotes(res.data)
      if (res.data.length && !selectedId) {
        setSelectedId(res.data[0]._id)
        setSelected(res.data[0])
      } else if (selectedId) {
        const same = res.data.find(n => n._id === selectedId)
        setSelected(same || null)
      }
    } catch (e) {
      showErrorToast('Failed to load notes: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotes()
  }, [])

  useEffect(() => {
    if (!selectedId) { setSelected(null); return }
    const n = notes.find(n => n._id === selectedId)
    setSelected(n || null)
    
    // Reset transcript modification state when selecting a new note
    if (n) {
      setTranscriptModified(false)
      setOriginalTranscript(n.transcript || '')
    }
  }, [selectedId, notes])

  async function handleCreated(note) {
    setNotes(prev => [note, ...prev])
    setSelectedId(note._id)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this note?')) return
    try {
      await api.delete(`/notes/${id}`)
      setNotes(prev => prev.filter(n => n._id !== id))
      if (selectedId === id) setSelectedId(null)
      showSuccessToast('Note deleted successfully')
    } catch (e) {
      showErrorToast('Delete failed: ' + e.message)
    }
  }

  // Handler for Edit button
  function handleEdit(noteId) {
    setSelectedId(noteId)
    setViewMode('edit')
    // Focus on transcript textarea after component updates
    setTimeout(() => {
      const textarea = document.querySelector('.detail textarea')
      if (textarea) {
        textarea.focus()
        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 200)
  }

  // Handler for Generate Summary button
  function handleGenerateSummary(noteId) {
    setSelectedId(noteId)
    setViewMode('summary')
    // Focus on generate summary button after component updates
    setTimeout(() => {
      const summaryButton = document.querySelector('.detail .button[data-action="generate-summary"]')
      if (summaryButton) {
        summaryButton.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        // Fallback: scroll to summary section
        const summarySection = document.querySelector('.summary')
        if (summarySection) {
          summarySection.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }, 200)
  }

  async function saveTranscript() {
    if (!selected) return
    setSaving(true)
    try {
      const payload = { transcript: selected.transcript, title: selected.title }
      const res = await api.put(`/notes/${selected._id}`, payload)
      // server clears summary and marks as outdated
      setSelected(res.data)
      setNotes(prev => prev.map(n => (n._id === res.data._id ? res.data : n)))
      
      // Reset transcript modification tracking
      setTranscriptModified(false)
      setOriginalTranscript(selected.transcript)
      
      showSuccessToast('Transcript saved successfully')
      console.log('[App] Transcript saved, summary marked as outdated')
    } catch (e) {
      showErrorToast('Save failed: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  // Function to handle regenerating summary (even for up-to-date summaries)
  async function regenerateSummary() {
    if (!selected) return
    
    const confirmRegenerate = confirm(
      'This will replace the existing summary with a new one. Are you sure you want to continue?'
    )
    
    if (confirmRegenerate) {
      // Temporarily mark as outdated to enable the button
      setSelected({ ...selected, isSummaryOutdated: true })
      await generateSummary()
    }
  }

  async function generateSummary() {
    if (!selected) return
    
    // Check if transcript has unsaved changes
    if (transcriptModified) {
      const shouldSave = confirm(
        'You have unsaved changes to the transcript. Would you like to save them before generating a summary?\n\n' +
        'Note: Unsaved changes will be lost when generating a new summary.'
      )
      
      if (shouldSave) {
        await saveTranscript()
        // After saving, the transcript will be updated and we can proceed
        if (!selected.transcript || !selected.transcript.trim()) {
          showWarningToast('Cannot generate summary for empty transcript. Please add some content first.')
          return
        }
      } else {
        // User chose not to save, but we still need a transcript
        if (!selected.transcript || !selected.transcript.trim()) {
          showWarningToast('Cannot generate summary for empty transcript. Please add some content first.')
          return
        }
      }
    }
    
    setSummarizing(true)
    try {
      console.log('[App] Generating summary for note:', selected._id)
      const res = await api.post(`/notes/${selected._id}/summarize`)
      
      const updated = { 
        ...selected, 
        summary: res.data.summary, 
        isSummaryOutdated: false 
      }
      
      setSelected(updated)
      setNotes(prev => prev.map(n => (n._id === updated._id ? updated : n)))
      
      showSuccessToast('Summary generated successfully!')
      console.log('[App] Summary generated successfully:', res.data.summary)
    } catch (e) {
      console.error('[App] Summary generation failed:', e)
      const errorMessage = e.response?.data?.error || e.message || 'Unknown error occurred'
      showErrorToast(`Summarization failed: ${errorMessage}`)
    } finally {
      setSummarizing(false)
    }
  }

  return (
    <div className="app">
      <div className="header">
        <h1>Voice Notes</h1>
      </div>

      <div className="grid">
        {/* Left column: recorder + list */}
        <div className="card">
          <Recorder onCreated={handleCreated} />
          <hr style={{ margin: '16px 0', border: 0, borderTop: '1px solid #eee' }} />
          <h2>All Notes ({notes.length})</h2>
          {loading ? <div>Loading...</div> : (
            <div className="list">
              {notes.map((n, index) => (
                <NoteItem
                  key={n._id}
                  note={n}
                  index={index}
                  selected={selectedId === n._id}
                  onSelect={() => setSelectedId(n._id)}
                  onDelete={() => handleDelete(n._id)}
                  onEdit={handleEdit}
                  onGenerateSummary={handleGenerateSummary}
                />
              ))}
              {!notes.length && <div className="small">No notes yet. Record something!</div>}
            </div>
          )}
        </div>

        {/* Right column: details */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0 }}>
              {viewMode === 'edit' ? 'Edit Note' : 
               viewMode === 'summary' ? 'Generate Summary' : 'Note Details'}
            </h2>
            {selected && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="button secondary" 
                  onClick={() => setViewMode('details')}
                  style={{ fontSize: '12px', padding: '6px 10px' }}
                >
                  Details
                </button>
                <button 
                  className="button secondary" 
                  onClick={() => setViewMode('edit')}
                  style={{ fontSize: '12px', padding: '6px 10px' }}
                >
                  Edit
                </button>
                <button 
                  className="button secondary" 
                  onClick={() => setViewMode('summary')}
                  style={{ fontSize: '12px', padding: '6px 10px' }}
                >
                  Summary
                </button>
              </div>
            )}
          </div>
          
          {!selected ? (
            <div className="small">
              Select a note to view/edit.
              {notes.length > 0 && (
                <div style={{ marginTop: '8px', color: '#888' }}>
                  You have {notes.length} note{notes.length !== 1 ? 's' : ''} available.
                </div>
              )}
            </div>
          ) : viewMode === 'edit' ? (
            // Edit mode - focused on editing transcript
            <div className="detail">
              <div>
                <label className="small">Title</label>
                <input
                  value={selected.title || ''}
                  onChange={e => setSelected({ ...selected, title: e.target.value })}
                  placeholder="Enter note title..."
                  className="titleInput"
                />
              </div>

              <div>
                <label className="small">
                  Transcript
                  {transcriptModified && (
                    <span style={{ color: '#ff6b35', marginLeft: '8px', fontWeight: 'bold' }}>
                      • Modified (needs saving)
                    </span>
                  )}
                </label>
                <textarea
                  value={selected.transcript || ''}
                  onChange={e => {
                    const newTranscript = e.target.value
                    const modified = newTranscript !== originalTranscript
                    setTranscriptModified(modified)
                    
                    // If transcript is modified, mark summary as outdated
                    const updatedNote = { ...selected, transcript: newTranscript }
                    if (modified && updatedNote.summary) {
                      updatedNote.isSummaryOutdated = true
                      updatedNote.summary = null
                    }
                    
                    setSelected(updatedNote)
                  }}
                  onFocus={() => {
                    // Store original transcript when user starts editing
                    setOriginalTranscript(selected.transcript || '')
                    setTranscriptModified(false)
                  }}
                  placeholder="Your transcript will appear here..."
                  style={{ minHeight: '300px' }}
                />
              </div>

              <div className="footer">
                <button className="button" onClick={saveTranscript} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Transcript'}
                </button>
                <button 
                  className="button secondary" 
                  onClick={() => setViewMode('details')}
                >
                  Back to Details
                </button>
              </div>
            </div>
          ) : viewMode === 'summary' ? (
            // Summary mode - focused on generating summary
            <div className="detail">
              <div>
                <label className="small">Title</label>
                <div style={{ 
                  padding: '12px', 
                  background: '#f5f5f5', 
                  borderRadius: '10px', 
                  border: '1px solid #ddd' 
                }}>
                  {selected.title || 'Untitled'}
                </div>
              </div>

              <div>
                <label className="small">Current Transcript</label>
                <div style={{ 
                  padding: '12px', 
                  background: '#f5f5f5', 
                  borderRadius: '10px', 
                  border: '1px solid #ddd',
                  maxHeight: '200px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selected.transcript || 'No transcript available'}
                </div>
              </div>

              <div className="footer">
                <button
                  className="button secondary"
                  onClick={generateSummary}
                  data-action="generate-summary"
                  disabled={
                    summarizing || 
                    (!selected.isSummaryOutdated && !transcriptModified) ||
                    !selected.transcript?.trim()
                  }
                  title={
                    !selected.transcript?.trim() 
                      ? 'Add some content to the transcript first'
                      : !selected.isSummaryOutdated && !transcriptModified
                      ? 'Summary is up-to-date. Edit transcript to re-enable.'
                      : 'Generate AI summary using Gemini'
                  }
                >
                  {summarizing ? 'Generating Summary...' : 'Generate Summary (Gemini)'}
                </button>
                {/* Regenerate button commented out
                {selected.summary && !selected.isSummaryOutdated && (
                  <button
                    className="button secondary"
                    onClick={regenerateSummary}
                    disabled={summarizing}
                    title="Replace existing summary with a new one"
                  >
                    Regenerate
                  </button>
                )}
                */}
                <button 
                  className="button secondary" 
                  onClick={() => setViewMode('details')}
                >
                  Back to Details
                </button>
              </div>

              <div>
                <div className="small">
                  Summary
                  {selected.summary && (
                    <span style={{ 
                      color: selected.isSummaryOutdated ? '#ff6b35' : '#28a745', 
                      marginLeft: '8px', 
                      fontWeight: 'bold' 
                    }}>
                      • {selected.isSummaryOutdated ? 'Outdated' : 'Up-to-date'}
                    </span>
                  )}
                </div>
                <div className="summary">
                  {selected.summary || 'No summary yet. Click "Generate Summary" to create one.'}
                </div>
              </div>
            </div>
          ) : (
            // Default details mode
            <div className="detail">
              <div>
                <label className="small">Title</label>
                <input
                  value={selected.title || ''}
                  onChange={e => setSelected({ ...selected, title: e.target.value })}
                  placeholder="Enter note title..."
                  className="titleInput"
                />
              </div>

              <div>
                <label className="small">Audio</label>
                <audio controls src={`${API_BASE_URL}${selected.audio?.url}`} />
              </div>

              <div>
                <label className="small">
                  Transcript
                  {transcriptModified && (
                    <span style={{ color: '#ff6b35', marginLeft: '8px', fontWeight: 'bold' }}>
                      • Modified (needs saving)
                    </span>
                  )}
                </label>
                <textarea
                  value={selected.transcript || ''}
                  onChange={e => {
                    const newTranscript = e.target.value
                    const modified = newTranscript !== originalTranscript
                    setTranscriptModified(modified)
                    
                    // If transcript is modified, mark summary as outdated
                    const updatedNote = { ...selected, transcript: newTranscript }
                    if (modified && updatedNote.summary) {
                      updatedNote.isSummaryOutdated = true
                      updatedNote.summary = null
                    }
                    
                    setSelected(updatedNote)
                  }}
                  onFocus={() => {
                    // Store original transcript when user starts editing
                    setOriginalTranscript(selected.transcript || '')
                    setTranscriptModified(false)
                  }}
                  placeholder="Your transcript will appear here..."
                />
              </div>

              <div className="footer">
                <button className="button" onClick={saveTranscript} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Transcript'}
                </button>
                <button
                  className="button secondary"
                  onClick={generateSummary}
                  data-action="generate-summary"
                  disabled={
                    summarizing || 
                    (!selected.isSummaryOutdated && !transcriptModified) ||
                    !selected.transcript?.trim()
                  }
                  title={
                    !selected.transcript?.trim() 
                      ? 'Add some content to the transcript first'
                      : !selected.isSummaryOutdated && !transcriptModified
                      ? 'Summary is up-to-date. Edit transcript to re-enable.'
                      : 'Generate AI summary using Gemini'
                  }
                >
                  {summarizing ? 'Generating Summary...' : 'Generate Summary (Gemini)'}
                </button>
                {/* Regenerate button commented out
                {selected.summary && !selected.isSummaryOutdated && (
                  <button
                    className="button secondary"
                    onClick={regenerateSummary}
                    disabled={summarizing}
                    title="Replace existing summary with a new one"
                  >
                    Regenerate
                  </button>
                )}
                */}
              </div>

              <div>
                <div className="small">
                  Summary
                  {selected.summary && (
                    <span style={{ 
                      color: selected.isSummaryOutdated ? '#ff6b35' : '#28a745', 
                      marginLeft: '8px', 
                      fontWeight: 'bold' 
                    }}>
                      • {selected.isSummaryOutdated ? 'Outdated' : 'Up-to-date'}
                    </span>
                  )}
                </div>
                <div className="summary">
                  {selected.summary || 'No summary yet. Click "Generate Summary" to create one.'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`toast toast-${toast.type}`}
            onClick={() => removeToast(toast.id)}
          >
            <div className="toast-content">
              <span className="toast-message">{toast.message}</span>
              <button 
                className="toast-close" 
                onClick={(e) => {
                  e.stopPropagation()
                  removeToast(toast.id)
                }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
