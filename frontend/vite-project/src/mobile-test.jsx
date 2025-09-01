import React, { useState, useEffect } from 'react'

export default function MobileTest() {
  const [deviceInfo, setDeviceInfo] = useState({})
  const [permissions, setPermissions] = useState({})
  const [testResults, setTestResults] = useState([])

  useEffect(() => {
    // Gather device information
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      mediaDevices: !!navigator.mediaDevices,
      getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      MediaRecorder: !!window.MediaRecorder,
      SpeechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio
    }
    setDeviceInfo(info)

    // Test permissions
    testPermissions()
  }, [])

  async function testPermissions() {
    const results = {}
    
    try {
      // Test microphone permission
      if (navigator.permissions) {
        const micPermission = await navigator.permissions.query({ name: 'microphone' })
        results.microphone = micPermission.state
      } else {
        results.microphone = 'permissions API not supported'
      }
    } catch (e) {
      results.microphone = 'error: ' + e.message
    }

    setPermissions(results)
  }

  async function testMicrophone() {
    addResult('Testing microphone access...')
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      addResult('✅ Microphone access granted')
      
      // Test MediaRecorder
      if (window.MediaRecorder) {
        const formats = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/ogg;codecs=opus',
          'audio/wav'
        ]
        
        addResult('Testing MediaRecorder formats:')
        formats.forEach(format => {
          const supported = MediaRecorder.isTypeSupported(format)
          addResult(`${supported ? '✅' : '❌'} ${format}`)
        })
        
        // Test recording
        const recorder = new MediaRecorder(stream)
        const chunks = []
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data)
          }
        }
        
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: recorder.mimeType })
          addResult(`✅ Recording successful: ${blob.size} bytes, type: ${blob.type}`)
          stream.getTracks().forEach(track => track.stop())
        }
        
        recorder.start()
        setTimeout(() => {
          recorder.stop()
        }, 2000)
        
        addResult('Recording for 2 seconds...')
      } else {
        addResult('❌ MediaRecorder not supported')
      }
    } catch (e) {
      addResult(`❌ Microphone error: ${e.message}`)
    }
  }

  async function testSpeechRecognition() {
    addResult('Testing speech recognition...')
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      addResult('❌ Speech recognition not supported')
      return
    }
    
    try {
      const recog = new SpeechRecognition()
      recog.lang = 'en-US'
      recog.continuous = false
      recog.interimResults = false
      recog.maxAlternatives = 1
      
      recog.onstart = () => addResult('✅ Speech recognition started')
      recog.onresult = (e) => {
        const transcript = e.results[0][0].transcript
        addResult(`✅ Transcript received: "${transcript}"`)
      }
      recog.onerror = (e) => {
        addResult(`❌ Speech recognition error: ${e.error} - ${e.message}`)
      }
      recog.onend = () => addResult('Speech recognition ended')
      
      recog.start()
    } catch (e) {
      addResult(`❌ Failed to start speech recognition: ${e.message}`)
    }
  }

  function addResult(message) {
    setTestResults(prev => [...prev, { id: Date.now(), message, timestamp: new Date().toLocaleTimeString() }])
  }

  function clearResults() {
    setTestResults([])
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>📱 Mobile Device Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Device Information</h2>
        <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
          <div><strong>Mobile:</strong> {deviceInfo.mobile ? 'Yes' : 'No'}</div>
          <div><strong>Platform:</strong> {deviceInfo.platform}</div>
          <div><strong>Vendor:</strong> {deviceInfo.vendor}</div>
          <div><strong>Language:</strong> {deviceInfo.language}</div>
          <div><strong>Screen:</strong> {deviceInfo.screenWidth} x {deviceInfo.screenHeight}</div>
          <div><strong>Viewport:</strong> {deviceInfo.viewportWidth} x {deviceInfo.viewportHeight}</div>
          <div><strong>Pixel Ratio:</strong> {deviceInfo.devicePixelRatio}</div>
          <div><strong>Online:</strong> {deviceInfo.onLine ? 'Yes' : 'No'}</div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Feature Support</h2>
        <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
          <div><strong>MediaDevices:</strong> {deviceInfo.mediaDevices ? '✅' : '❌'}</div>
          <div><strong>getUserMedia:</strong> {deviceInfo.getUserMedia ? '✅' : '❌'}</div>
          <div><strong>MediaRecorder:</strong> {deviceInfo.MediaRecorder ? '✅' : '❌'}</div>
          <div><strong>SpeechRecognition:</strong> {deviceInfo.SpeechRecognition ? '✅' : '❌'}</div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Permissions</h2>
        <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
          <div><strong>Microphone:</strong> {permissions.microphone || 'Checking...'}</div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Tests</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={testMicrophone}
            style={{
              padding: '10px 15px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Test Microphone
          </button>
          <button 
            onClick={testSpeechRecognition}
            style={{
              padding: '10px 15px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Test Speech Recognition
          </button>
          <button 
            onClick={clearResults}
            style={{
              padding: '10px 15px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Clear Results
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Test Results</h2>
        <div style={{ 
          maxHeight: '300px', 
          overflowY: 'auto', 
          border: '1px solid #ddd', 
          padding: '10px',
          backgroundColor: '#f8f9fa',
          fontSize: '14px'
        }}>
          {testResults.length === 0 ? (
            <div style={{ color: '#6c757d' }}>No test results yet. Run a test to see results.</div>
          ) : (
            testResults.map(result => (
              <div key={result.id} style={{ marginBottom: '5px', padding: '5px 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#6c757d', fontSize: '12px' }}>{result.timestamp}</span>
                <span style={{ marginLeft: '10px' }}>{result.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '20px' }}>
        <p><strong>Instructions:</strong></p>
        <ul>
          <li>Run the microphone test to check if audio recording works</li>
          <li>Run the speech recognition test to check if transcription works</li>
          <li>Check the console for additional debugging information</li>
          <li>If tests fail, try refreshing the page or checking permissions</li>
        </ul>
      </div>
    </div>
  )
}
