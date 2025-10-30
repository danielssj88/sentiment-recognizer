import { useEffect, useRef, useState } from 'react'
import { analyzeImage } from './api'
import { speak, listVoices } from './tts'

export default function App() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [streamOk, setStreamOk] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [voices, setVoices] = useState([])
  const [voiceName, setVoiceName] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setStreamOk(true)
      } catch (e) {
        setError('Camera permission denied or unavailable.')
      }
    })()

    // load TTS voices
    listVoices().then(v => setVoices(v))
  }, [])

  const capture = async () => {
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
      const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' })
      const data = await analyzeImage(file)
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const onSpeak = () => {
    if (result?.poem) {
      speak(result.poem, { voiceName, rate: 1, pitch: 1 })
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '40px auto', padding: 16 }}>
      <h1>Emotion → Poem</h1>
      <p>With your consent, we analyze the current facial expression and craft a short poem to match.</p>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr' }}>
        <video ref={videoRef} playsInline muted style={{ width: '100%', borderRadius: 12, background: '#000' }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={capture} disabled={!streamOk || loading}>
            {loading ? 'Analyzing…' : 'Capture & Generate Poem'}
          </button>
          <button onClick={() => setResult(null)} disabled={loading}>Clear</button>

          {/* Voice selector (optional) */}
          <select value={voiceName} onChange={e => setVoiceName(e.target.value)}>
            <option value="">Default voice</option>
            {voices.map(v => (
              <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
            ))}
          </select>

          <button onClick={onSpeak} disabled={!result?.poem}>🔊 Speak</button>
        </div>

        {error && <div style={{ color: 'crimson' }}>{error}</div>}

        {result && (
          <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
            <div><strong>Emotion:</strong> {result.emotion} ({Math.round(result.confidence * 100)}%)</div>
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>{result.poem}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
