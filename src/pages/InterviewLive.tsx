import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@hooks/useSession'
import { VideoCapture, VideoCaptureHandle } from '@components/VideoCapture'
import { AnalysisDashboard } from '@components/AnalysisDashboard'
import { Timer, ArrowRight, Loader2, Sparkles, Terminal } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

interface InterviewConfig {
  role: string
  resume: string
  questionCount: number
  timePerQuestion: number
}

export function InterviewLive() {
  const navigate = useNavigate()
  const captureRef = useRef<VideoCaptureHandle>(null)
  const {
    isRecording,
    metrics,
    feedback,
    videoRef,
    latestVideoBlob,
    startSession,
    stopSession,
    saveVideo
  } = useSession()

  const [config, setConfig] = useState<InterviewConfig | null>(null)
  const [questions, setQuestions] = useState<string[]>([])
  const [currentIdx, setCurrentIdx] = useState(-1) // -1 is loading/prep
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isFinishing, setIsFinishing] = useState(false)

  // 1. Load config and fetch questions
  useEffect(() => {
    const raw = sessionStorage.getItem('interview_config')
    if (!raw) {
      navigate('/interview-setup')
      return
    }
    const parsed = JSON.parse(raw) as InterviewConfig
    setConfig(parsed)

    fetch(`${API_BASE}/interview/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: parsed.role,
        resume: parsed.resume,
        count: parsed.questionCount
      })
    })
    .then(res => res.json())
    .then(data => {
      setQuestions(data.questions)
      setLoading(false)
    })
    .catch(err => {
      console.error('Failed to load questions', err)
      setQuestions(["Tell me about yourself.", "What are your strengths?", "Where do you see yourself in 5 years?"])
      setLoading(false)
    })
  }, [navigate])

  // 2. Start the recording when questions are ready
  const beginInterview = useCallback(async () => {
    await startSession()
    setCurrentIdx(0)
    if (config) setTimeLeft(config.timePerQuestion)
  }, [startSession, config])

  // 3. Timer logic
  useEffect(() => {
    if (currentIdx < 0 || currentIdx >= questions.length || !isRecording) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up for this question
          if (currentIdx < questions.length - 1) {
            setCurrentIdx(c => c + 1)
            return config?.timePerQuestion || 60
          } else {
            // Last question finished
            handleFinish()
            return 0
          }
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentIdx, questions, isRecording, config])

  const handleFinish = async () => {
    setIsFinishing(true)
    const sessionId = await stopSession()
    if (sessionId) {
        // Redirect to report after a short delay for saving
        setTimeout(() => navigate(`/report/${sessionId}`), 1000)
    }
  }

  if (loading) {
    return (
      <div className="interview-loading">
        <Loader2 className="spinner" size={48} />
        <h2>Generating Tailored Questions...</h2>
        <p>AI is analyzing your background for high-fidelity challenges.</p>
      </div>
    )
  }

  return (
    <div className="interview-live-container">
      <header className="interview-nav">
        <div className="interview-progress">
          {questions.map((_, i) => (
            <div key={i} className={`progress-dot ${i <= currentIdx ? 'active' : ''} ${i === currentIdx ? 'pulse' : ''}`} />
          ))}
        </div>
        <div className="interview-timer">
          <Timer size={18} />
          <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
        </div>
      </header>

      <main className="interview-layout">
        <div className="interview-main">
          {currentIdx === -1 ? (
             <div className="prep-screen">
                <Sparkles size={48} className="icon-glow" />
                <h2>Simulation Ready</h2>
                <p>You have {questions.length} questions. Each has {config?.timePerQuestion} seconds.</p>
                <button className="btn btn-primary start-btn" onClick={beginInterview}>
                  Start Simulation
                </button>
             </div>
          ) : (
            <div className="question-display">
              <div className="q-badge">Question {currentIdx + 1} of {questions.length}</div>
              <h2 className="current-question animate-fade-in">{questions[currentIdx]}</h2>
            </div>
          )}

          <div className="interview-video-wrapper">
             <VideoCapture 
                ref={captureRef}
                videoRef={videoRef}
                isRecording={isRecording}
                onStop={handleFinish}
                reviewBlob={latestVideoBlob}
                onSave={saveVideo}
             />
          </div>
        </div>

        <aside className="interview-sidebar">
          <div className="sidebar-header">
            <Terminal size={16} />
            <span>Real-time Biometrics</span>
          </div>
          <AnalysisDashboard 
            metrics={metrics}
            feedback={feedback}
            isRecording={isRecording}
            onSeek={(s) => captureRef.current?.seek(s)}
          />
        </aside>
      </main>

      <style>{`
        .interview-live-container {
          width: 100%;
          height: 100vh;
          background: #020203;
          color: white;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .interview-nav {
          height: 60px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(10px);
        }

        .interview-progress {
          display: flex;
          gap: 0.5rem;
        }

        .progress-dot {
          width: 32px;
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          transition: all 0.3s;
        }

        .progress-dot.active {
          background: var(--primary);
        }

        .progress-dot.pulse {
          box-shadow: 0 0 10px var(--primary);
        }

        .interview-timer {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
          color: var(--primary);
          background: rgba(35, 131, 226, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 8px;
        }

        .interview-layout {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 400px;
          overflow: hidden;
        }

        .interview-main {
          display: flex;
          flex-direction: column;
          padding: 2rem;
          gap: 2rem;
          height: 100%;
        }

        .question-display {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 2rem;
          border-radius: 16px;
          text-align: center;
          min-height: 180px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .q-badge {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--primary);
          letter-spacing: 0.1em;
          margin-bottom: 1rem;
        }

        .current-question {
          font-size: 1.8rem;
          font-weight: 700;
          line-height: 1.4;
          max-width: 800px;
        }

        .interview-video-wrapper {
          flex: 1;
          background: #000;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.05);
          position: relative;
        }

        .interview-sidebar {
          background: #050507;
          border-left: 1px solid rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
        }

        .sidebar-header {
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.3);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .prep-screen {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .prep-screen h2 {
          font-size: 2.5rem;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
        }

        .prep-screen p {
          color: rgba(255,255,255,0.5);
          margin-bottom: 2.5rem;
        }

        .start-btn {
          padding: 1rem 3rem !important;
          font-size: 1.2rem !important;
          font-weight: 700 !important;
        }

        .icon-glow {
          color: var(--primary);
          filter: drop-shadow(0 0 15px var(--primary));
        }

        .interview-loading {
          width: 100%;
          height: 100vh;
          background: #020203;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .spinner {
          animation: spin 1s linear infinite;
          color: var(--primary);
          margin-bottom: 2rem;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
