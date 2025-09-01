import React, { useEffect, useRef, useState } from 'react'
import api from '../api'

export default function Recorder({ onCreated }) {
  const [support, setSupport] = useState({ mic: false, stt: false })
  const [status, setStatus] = useState('idle') // idle | recording | processing | transcribing
  const [liveTranscript, setLiveTranscript] = useState('')
  const [duration, setDuration] = useState(0)
  const [mobileDetected, setMobileDetected] = useState(false)
  const [error, setError] = useState('')
  const mediaRecorderRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const chunksRef = useRef([])
  const startTsRef = useRef(0)
  const recogRef = useRef(null)
  
  // Add unique transcript tracking for each recording session
  const currentTranscriptRef = useRef('')
  const recordingIdRef = useRef(null)

  // Detect mobile device
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    setMobileDetected(isMobile)
    console.log('[Recorder] Mobile device detected:', isMobile)
    console.log('[Recorder] User Agent:', navigator.userAgent)
  }, [])

  useEffect(() => {
    async function check() {
      const mic = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const hasSTT = !!SpeechRecognition
      
      console.log('[Recorder] Browser support check:')
      console.log('  - Microphone:', mic)
      console.log('  - Speech Recognition:', hasSTT)
      console.log('  - SpeechRecognition:', !!window.SpeechRecognition)
      console.log('  - webkitSpeechRecognition:', !!window.webkitSpeechRecognition)
      
      setSupport({ mic, stt: hasSTT })
    }
    check()
    
    // Cleanup function to ensure resources are released
    return () => {
      console.log('[Recorder] Component unmounting, cleaning up...')
      if (recogRef.current) {
        try { recogRef.current.stop() } catch { /* ignore */ }
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  // Get the best audio format for the current browser
  function getBestAudioFormat() {
    const formats = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ]
    
    for (const format of formats) {
      if (MediaRecorder.isTypeSupported(format)) {
        console.log('[Recorder] Using audio format:', format)
        return format
      }
    }
    
    // Fallback for older browsers
    console.log('[Recorder] No specific format supported, using default')
    return ''
  }

  // Test function to debug speech recognition
  function testSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech Recognition not supported in this browser')
      return
    }
    
    console.log('[Recorder] Testing speech recognition...')
    const testRecog = new SpeechRecognition()
    testRecog.lang = 'en-US'
    testRecog.continuous = false
    testRecog.interimResults = false
    testRecog.maxAlternatives = 1
    
    testRecog.onstart = () => console.log('[Test] Speech recognition started')
    testRecog.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      console.log('[Test] Transcript received:', transcript)
      alert('Test successful! Transcript: ' + transcript)
    }
    testRecog.onerror = (e) => {
      console.error('[Test] Speech recognition error:', e.error, e.message)
      alert('Test failed: ' + e.error + ' - ' + e.message)
    }
    testRecog.onend = () => console.log('[Test] Speech recognition ended')
    
    try {
      testRecog.start()
    } catch (err) {
      console.error('[Test] Failed to start test:', err)
      alert('Failed to start test: ' + err.message)
    }
  }

  // Function to completely reset recorder state
  function resetRecorder() {
    console.log('[Recorder] Resetting recorder state...')
    
    // Stop any ongoing processes
    if (recogRef.current) {
      try { 
        recogRef.current.stop() 
        recogRef.current = null
      } catch { /* ignore */ }
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch { /* ignore */ }
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop())
      mediaStreamRef.current = null
    }
    
    // Reset all state and session tracking
    setStatus('idle')
    setLiveTranscript('')
    setDuration(0)
    setError('')
    chunksRef.current = []
    currentTranscriptRef.current = ''
    recordingIdRef.current = null
    
    console.log('[Recorder] Recorder state and session tracking reset complete')
  }

  async function start() {
    if (!support.mic) {
      setError('Microphone not supported in this browser.')
      return
    }
    
    // Reset error state
    setError('')
    
    // Create unique recording session
    const newRecordingId = Date.now().toString()
    recordingIdRef.current = newRecordingId
    currentTranscriptRef.current = ''
    
    console.log('[Recorder] Starting new recording session:', newRecordingId)
    
    // Reset all state for new recording
    setStatus('recording')
    setLiveTranscript('')
    setDuration(0)
    chunksRef.current = []
    
    // Clear any previous speech recognition
    if (recogRef.current) {
      try { 
        recogRef.current.stop() 
        recogRef.current = null
      } catch { /* ignore */ }
    }

    try {
      // Use the exact same simple constraints that worked in the test
      console.log('[Recorder] Requesting microphone with simple constraints')
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true  // Simple constraint that works on all devices
      })
      
      // Check if stream is active and has audio tracks
      if (!stream || !stream.active) {
        throw new Error('Stream is not active after creation')
      }
      
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks found in stream')
      }
      
      console.log('[Recorder] Stream active:', stream.active)
      console.log('[Recorder] Audio tracks:', audioTracks.length)
      console.log('[Recorder] Track state:', audioTracks[0].readyState)
      
      mediaStreamRef.current = stream
      console.log('[Recorder] Microphone access granted')
      
      // Get the best audio format for this browser
      const audioFormat = getBestAudioFormat()
      const mr = new MediaRecorder(stream, audioFormat ? { mimeType: audioFormat } : {})
      mediaRecorderRef.current = mr
      startTsRef.current = Date.now()

      mr.ondataavailable = (e) => { 
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
          console.log('[Recorder] Data chunk received, size:', e.data.size)
        }
      }
      
      mr.onerror = (e) => {
        console.error('[Recorder] MediaRecorder error:', e.error)
        setError('Recording error: ' + e.error)
        setStatus('idle')
      }
      
      mr.onstart = () => {
        console.log('[Recorder] MediaRecorder started successfully')
      }
      
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: audioFormat || 'audio/webm' })
        const secs = Math.round((Date.now() - startTsRef.current) / 1000)
        setDuration(secs)
        
        console.log('[Recorder] Media recorder stopped, blob size:', blob.size, 'duration:', secs)
        
        // Wait a bit for final speech recognition results to be processed
        if (support.stt && recogRef.current) {
          console.log('[Recorder] Waiting for final transcript processing...')
          await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds for final transcripts
        }
        
        // Pass the recording ID to ensure we use the correct transcript
        await sendToServer(blob, secs, newRecordingId)
        
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(t => t.stop())
          mediaStreamRef.current = null
        }
      }

      mr.start(1000) // Record in 1-second chunks
      console.log('[Recorder] Media recorder started')
      
      // Monitor stream health
      window.streamHealthCheckInterval = setInterval(() => {
        if (mediaStreamRef.current) {
          const isActive = mediaStreamRef.current.active
          const audioTracks = mediaStreamRef.current.getAudioTracks()
          const hasActiveTracks = audioTracks.some(track => track.readyState === 'live')
          
          console.log('[Recorder] Stream health check - Active:', isActive, 'Tracks:', audioTracks.length, 'Live tracks:', hasActiveTracks)
          
          if (!isActive || !hasActiveTracks) {
            console.error('[Recorder] Stream became inactive unexpectedly')
            setError('Microphone stream was closed unexpectedly. Please try again.')
            setStatus('idle')
            if (window.streamHealthCheckInterval) {
              clearInterval(window.streamHealthCheckInterval)
              window.streamHealthCheckInterval = null
            }
          }
        } else {
          if (window.streamHealthCheckInterval) {
            clearInterval(window.streamHealthCheckInterval)
            window.streamHealthCheckInterval = null
          }
        }
      }, 2000) // Check every 2 seconds

      // Start STT using the exact same approach that worked in the test
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition && support.stt) {
        console.log('[Recorder] Starting speech recognition for session:', newRecordingId)
        
        // Use the same settings as the successful test
        setTimeout(() => {
          try {
            const recog = new SpeechRecognition()
            recog.lang = 'en-US'
            recog.continuous = true
            recog.interimResults = true
            recog.maxAlternatives = 1
            
            console.log('[STT] Using same settings as successful test')
            
            recog.onresult = (e) => {
              console.log('[STT] Raw results received:', e.results)
              
              // Only process results for the current recording session
              if (recordingIdRef.current !== newRecordingId) {
                console.log('[STT] Ignoring transcript for old session:', recordingIdRef.current)
                return
              }
              
              let txt = ''
              let hasFinalResults = false
              
              for (let i = 0; i < e.results.length; i++) {
                const result = e.results[i]
                if (result.isFinal) {
                  hasFinalResults = true
                  txt += result[0].transcript + ' '
                } else {
                  // For interim results, include them if we don't have final results yet
                  if (!hasFinalResults) {
                    txt += result[0].transcript
                  }
                }
              }
              
              const cleanText = txt.trim()
              console.log('[STT] Transcript update for session', newRecordingId, ':', cleanText, '(final:', hasFinalResults, ')')
              
              // Update both the ref and the state
              currentTranscriptRef.current = cleanText
              setLiveTranscript(cleanText)
            }
            
            recog.onerror = (e) => {
              console.warn('[STT] Error:', e.error, e.message)
              
              if (e.error === 'not-allowed') {
                setError('Microphone access denied. Please allow microphone access and try again.')
              } else if (e.error === 'no-speech') {
                console.log('[STT] No speech detected - this is normal at the start')
              } else if (e.error === 'network') {
                console.warn('[STT] Network error - speech recognition may not work properly')
                setError('Network error with speech recognition. You can still record and add transcripts manually.')
              } else if (e.error === 'audio-capture') {
                console.warn('[STT] Audio capture error - microphone may not be working')
                setError('Microphone error detected. Please check your microphone and try again.')
              } else {
                console.warn('[STT] Unknown error:', e.error, e.message)
                setError(`Speech recognition error: ${e.error}. You can still record and add transcripts manually.`)
              }
            }
            
            recog.onend = () => { 
              console.log('[STT] Speech recognition ended for session:', newRecordingId)
            }
            
            recog.onstart = () => {
              console.log('[STT] Speech recognition started for session:', newRecordingId)
              setStatus('transcribing')
            }
            
            recog.start()
            recogRef.current = recog
            console.log('[Recorder] Speech recognition started successfully for session:', newRecordingId)
          } catch (err) {
            console.error('[Recorder] Failed to start speech recognition:', err)
            setStatus('recording') // Fallback to just recording
            setError('Speech recognition failed to start. You can still record and add transcripts manually.')
          }
        }, 1000) // Same delay as the test
      } else {
        console.log('[Recorder] No speech recognition support, recording only')
        setStatus('recording') // No STT support, just recording
      }
    } catch (error) {
      console.error('[Recorder] Error starting recording:', error)
      
      // Try a fallback approach for mobile browsers
      if (mobileDetected && error.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access and try again.')
      } else if (mobileDetected && error.name === 'NotReadableError') {
        setError('Microphone is in use by another application. Please close other apps using the microphone.')
      } else if (mobileDetected && error.name === 'NotFoundError') {
        setError('No microphone found. Please check your device has a microphone.')
      } else {
        setError('Failed to start recording: ' + error.message)
      }
      
      setStatus('idle')
    }
  }

  async function stop() {
    console.log('[Recorder] Stopping recording...')
    
    // Clear any stream health checks
    if (window.streamHealthCheckInterval) {
      clearInterval(window.streamHealthCheckInterval)
      window.streamHealthCheckInterval = null
    }
    
    // Stop speech recognition first with a small delay to ensure final transcripts are processed
    if (recogRef.current) {
      try { 
        console.log('[Recorder] Stopping speech recognition...')
        // Add a small delay to ensure final transcripts are processed
        setTimeout(() => {
          try {
            if (recogRef.current) {
              recogRef.current.stop()
              recogRef.current = null
              console.log('[Recorder] Speech recognition stopped after delay')
            }
          } catch (err) {
            console.warn('[Recorder] Error stopping speech recognition after delay:', err)
          }
        }, 500) // 500ms delay to process final transcripts
      } catch (err) { 
        console.warn('[Recorder] Error stopping speech recognition:', err)
      }
    }
    
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('[Recorder] Stopping media recorder...')
      setStatus('processing')
      mediaRecorderRef.current.stop()
    }
    
    // Stop microphone stream
    if (mediaStreamRef.current) {
      console.log('[Recorder] Stopping microphone stream...')
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log('[Recorder] Stopped track:', track.kind)
      })
      mediaStreamRef.current = null
    }
  }

  async function sendToServer(blob, secs, recordingId) {
    try {
      console.log('[Recorder] Sending to server for session:', recordingId)
      console.log('[Recorder] Current transcript for this session:', currentTranscriptRef.current)
      console.log('[Recorder] Live transcript state:', liveTranscript)
      
      // Verify this is still the current recording session
      if (recordingIdRef.current !== recordingId) {
        console.warn('[Recorder] Recording session mismatch, aborting upload')
        setStatus('idle')
        return
      }
      
      // Capture the transcript for this specific recording session
      let transcript = currentTranscriptRef.current || liveTranscript || ''
      
      console.log('[Recorder] Final transcript to use:', transcript)
      console.log('[Recorder] Transcript length:', transcript.length)
      console.log('[Recorder] Has transcript:', !!transcript.trim())
      
      // If we have speech recognition support but no transcript, the user might not have spoken
      if (support.stt && (!transcript || !transcript.trim())) {
        console.log('[Recorder] No transcript detected, prompting user for manual entry')
        
        // Check if we're still waiting for speech recognition to finish
        if (recogRef.current && recogRef.current.state !== 'inactive') {
          console.log('[Recorder] Speech recognition still active, waiting a bit more...')
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Check transcript again after waiting
          transcript = currentTranscriptRef.current || liveTranscript || ''
          console.log('[Recorder] Transcript after waiting:', transcript)
        }
        
        if (!transcript || !transcript.trim()) {
          const manualTranscript = prompt(
            'No transcript was detected for this recording. This could mean:\n' +
            '• You didn\'t speak clearly enough\n' +
            '• Microphone permissions were denied\n' +
            '• Speech recognition failed to start\n' +
            '• Speech recognition is still processing\n\n' +
            'Please enter what you said, or click Cancel to re-record:',
            ''
          )
          if (manualTranscript === null) {
            // User clicked Cancel
            console.log('[Recorder] User cancelled manual transcript entry for session:', recordingId)
            setStatus('idle')
            return
          }
          transcript = manualTranscript
        }
      }
      
      // If no speech recognition support, always prompt for manual entry
      if (!support.stt) {
        console.log('[Recorder] No STT support, prompting for manual transcript')
        transcript = prompt('Your browser does not support Web Speech API. Enter a transcript for this note:', '') || ''
      }

      // Final validation - if still no transcript, cancel the operation
              if (!transcript || !transcript.trim()) {
          console.error('[Recorder] Still no transcript after all attempts')
          setError('Transcript is required. Please speak clearly or enter manually.')
          setStatus('idle')
          return
        }

      const fd = new FormData()
      fd.append('audio', blob, 'note.webm')
      fd.append('transcript', transcript.trim())
      fd.append('duration', String(secs))
      fd.append('recordingId', recordingId) // Append recordingId to the FormData
      // Title can be first 60 chars of transcript or a timestamp
      const t = transcript?.trim() ? transcript.trim().slice(0, 60) : new Date().toLocaleString()
      fd.append('title', t)

      // Log what we're sending for debugging
      console.log('[Recorder] Sending data for session', recordingId, ':', {
        transcript: transcript.trim(),
        duration: secs,
        title: t,
        blobSize: blob.size,
        blobType: blob.type
      })

      // Don't set Content-Type manually - let browser handle multipart boundary
      const res = await api.post('/notes', fd)
      if (onCreated) onCreated(res.data)
      
      // Reset state after successful upload
      setStatus('idle')
      setLiveTranscript('')
      setDuration(0)
      setError('')
      
      console.log('[Recorder] Upload successful for session:', recordingId, 'state reset')
    } catch (e) {
      console.error('[Recorder] Upload error for session:', recordingId, e)
      console.error('[Recorder] Response data:', e.response?.data)
      console.error('[Recorder] Response status:', e.response?.status)
      setError('Upload failed: ' + (e.response?.data?.error || e.message))
      setStatus('idle')
    }
  }

  return (
    <div className="recorder">
      <div className="buttons">
        {status === 'idle' && <button className="button primary" onClick={start}>Start Recording</button>}
        {status !== 'idle' && <button className="button danger" onClick={stop}>Stop Recording</button>}
        {/* {status === 'idle' && <button className="button secondary" onClick={resetRecorder}>Reset</button>}
        {status === 'idle' && <button className="button secondary" onClick={testSpeechRecognition}>Test STT</button>} */}
      </div>
      <div>
        <div className="status">
          <b>Status:</b> {status}
          {status === 'recording' && support.stt && <span> • Starting speech recognition...</span>}
          {status === 'transcribing' && <span> • Speak now - your words will appear below</span>}
          {!support.stt && <span className="small"> (Tip: Use Chrome/Edge for in-browser transcription)</span>}
        </div>
        <div className="live" aria-live="polite">
          {liveTranscript || (
            status === 'transcribing' 
              ? 'Start speaking... your transcript will appear here'
              : status === 'recording'
              ? 'Initializing speech recognition...'
              : '(live transcript will appear here while recording...)'
          )}
        </div>
                {duration ? <div className="small">Recorded duration: {duration}s</div> : null}
        {error && (
          <div className="error" style={{color: '#dc3545', marginTop: '8px', fontSize: '14px'}}>
            ⚠️ {error}
          </div>
        )}
        {mobileDetected && (
          <div className="small" style={{color: '#ff6b6b', marginTop: '8px'}}>
            📱 Mobile browser detected. Speech recognition may not work reliably. 
            You can still record and add transcripts manually.
          </div>
        )}
        </div>
      </div>
  )
}
