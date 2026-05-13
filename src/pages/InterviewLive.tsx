import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { VideoCapture, VideoCaptureHandle } from '@components/VideoCapture'
import { AnalysisDashboard } from '@components/AnalysisDashboard'
import { SessionControls } from '@components/SessionControls'
import { useSession } from '@hooks/useSession'
import { History, LayoutDashboard, Timer, MessageSquare, ChevronRight, Play, Loader2 } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'
const SECONDS_PER_QUESTION = 60

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

  // Guided Interview State
  const [isGuided, setIsGuided] = useState(false)
  const [questions, setQuestions] = useState<string[]>([])
  const [currentIdx, setCurrentIdx] = useState(-1)
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION)
  const [isLoading, setIsLoading] = useState(false)

  // Load Guided Config
  useEffect(() => {
    const configRaw = sessionStorage.getItem('interview_config')
    if (configRaw) {
      try {
        const config = JSON.parse(configRaw)
        setIsGuided(true)
        fetchQuestions(
          config.role, 
          config.resume, 
          config.questionCount || 5, 
          config.focus || 'balanced',
          config.difficulty || 'standard'
        )
      } catch (e) {
        console.error('Failed to parse interview config', e)
        navigate('/interview-setup')
      }
    } else {
      navigate('/interview-setup')
    }
  }, [navigate])

  const fetchQuestions = async (role: string, resume: string, count: number, focus: string, difficulty: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/interview/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, resume, count, focus, difficulty })
      })
      if (!res.ok) throw new Error('Failed to fetch questions')
      const data = await res.json()
      const qs = Array.isArray(data) ? data : data.questions || []
      setQuestions(qs)
    } catch (err) {
      console.error('Error fetching questions:', err)
      setQuestions([
        'Can you walk me through your most significant technical project?',
        'Describe a difficult challenge you encountered and how you solved it.',
        'Why are you interested in this specific role and our company?',
        'How do you stay updated with the latest trends in your field?',
        'Why should we choose you over other candidates for this position?'
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Timer logic for Guided Interview
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>
    if (isRecording && isGuided && currentIdx >= 0 && currentIdx < questions.length) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleNextQuestion()
            return SECONDS_PER_QUESTION
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isRecording, isGuided, currentIdx, questions.length])

  const handleStartGuided = async () => {
    await startSession('mock')
    setCurrentIdx(0)
    setTimeLeft(SECONDS_PER_QUESTION)
  }

  const handleNextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1)
      setTimeLeft(SECONDS_PER_QUESTION)
    } else {
      handleStop()
    }
  }

  const handleStop = async () => {
    const id = await stopSession()
    setCurrentIdx(-1)
    if (id) {
       // Redirect to report after a short delay to ensure DB persistence
       setTimeout(() => navigate(`/report/${id}`), 1500)
    }
  }

  const progress = questions.length > 0 ? ((Math.max(0, currentIdx) + 1) / questions.length) * 100 : 0

  return (
    <div className="page-container">
      <header className="main-header">
        <div className="header-left">
          <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className="brand-dot" />
            <h1>ShadowCoach</h1>
          </div>
          <nav className="header-nav">
            <button className="nav-link active">
              <LayoutDashboard size={18} />
              Guided Interview
            </button>
            <button className="nav-link" onClick={() => navigate('/sessions')}>
              <History size={18} />
              Your Sessions
            </button>
          </nav>
        </div>
        <div className="header-right">
          <div className="system-status">
            <div className="pulse-dot" />
            <span>AI Analyzing Live</span>
          </div>
        </div>
      </header>

      <main className="content">
        <div className="live-grid">
          <div className="video-area">
            {/* Guided Question Banner */}
            {isGuided && currentIdx >= 0 && (
              <div className="question-banner">
                <div className="q-header">
                  <span className="q-index">Question {currentIdx + 1} of {questions.length}</span>
                  <div className="q-timer">
                    <Timer size={16} className={timeLeft < 10 ? 'urgent' : ''} />
                    <span className={timeLeft < 10 ? 'urgent' : ''}>{timeLeft}s</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <h2 className="current-question">{questions[currentIdx]}</h2>
              </div>
            )}

            <div className={`panel video-panel ${currentIdx >= 0 ? 'with-question' : ''}`}>
              <VideoCapture 
                ref={captureRef}
                videoRef={videoRef} 
                isRecording={isRecording} 
                onStop={handleStop} 
                reviewBlob={latestVideoBlob}
                onSave={saveVideo}
              />
              
              {!isRecording && isGuided && !latestVideoBlob && (
                <div className="guided-overlay">
                  {isLoading ? (
                    <div className="loading-state">
                      <Loader2 className="spin" size={40} />
                      <h3>Tailoring your interview...</h3>
                      <p>AI is generating custom questions based on your resume.</p>
                    </div>
                  ) : (
                    <div className="ready-state">
                      <MessageSquare size={48} className="icon-glow" />
                      <h3>Ready for your Interview?</h3>
                      <p>We've prepared {questions.length} tailored questions for you. You'll have {SECONDS_PER_QUESTION}s for each.</p>
                      <button className="btn btn-primary start-guided-btn" onClick={handleStartGuided}>
                        <Play size={20} fill="currentColor" />
                        Start Now
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {!isRecording && latestVideoBlob && (
                 <div className="guided-overlay">
                    <div className="loading-state">
                       <Loader2 className="spin" size={40} />
                       <h3>Session Completed</h3>
                       <p>Analyzing your performance... Preparing your report.</p>
                    </div>
                 </div>
              )}
            </div>
          </div>

          <aside className="sidebar">
            <div className="panel control-panel">
              <SessionControls
                isRecording={isRecording}
                onStart={handleStartGuided}
                onEnd={handleStop}
              />
              {isRecording && isGuided && (
                <button className="btn btn-secondary next-q-btn" onClick={handleNextQuestion}>
                  Next Question
                  <ChevronRight size={18} />
                </button>
              )}
            </div>

            <div className="panel dashboard-panel">
              <AnalysisDashboard 
                metrics={metrics} 
                feedback={feedback} 
                isRecording={isRecording} 
                onSeek={(sec: number) => captureRef.current?.seek(sec)}
              />
            </div>
          </aside>
        </div>
      </main>

      <style>{`
        .question-banner {
          background: rgba(13, 13, 15, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1rem;
          backdrop-filter: blur(10px);
          animation: slideInDown 0.5s ease-out;
        }
        .q-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .q-index { font-size: 0.8rem; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.1em; }
        .q-timer { display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.05); padding: 0.4rem 0.8rem; border-radius: 20px; font-weight: 700; font-variant-numeric: tabular-nums; }
        .q-timer .urgent { color: #ef4444; }
        .progress-bar { height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; margin-bottom: 1.2rem; overflow: hidden; }
        .progress-fill { height: 100%; background: #3b82f6; transition: width 0.3s ease; }
        .current-question { font-size: 1.4rem; font-weight: 700; margin: 0; line-height: 1.4; color: #fff; }
        
        .video-panel.with-question { height: calc(100vh - 380px); min-height: 400px; }
        
        .guided-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 10; border-radius: inherit; }
        .ready-state, .loading-state { text-align: center; max-width: 400px; padding: 2rem; }
        .ready-state h3, .loading-state h3 { font-size: 1.8rem; margin: 1rem 0; }
        .ready-state p, .loading-state p { color: rgba(255,255,255,0.6); margin-bottom: 2rem; line-height: 1.6; }
        .icon-glow { color: #3b82f6; filter: drop-shadow(0 0 10px rgba(59,130,246,0.5)); }
        .start-guided-btn { padding: 1.2rem 2.5rem !important; font-size: 1.1rem; font-weight: 800; gap: 0.8rem; box-shadow: 0 0 30px rgba(59,130,246,0.3); }
        .next-q-btn { width: 100%; margin-top: 1rem; border: 1px solid rgba(255,255,255,0.1); gap: 0.5rem; }
        
        .spin { animation: spin 2s linear infinite; color: #3b82f6; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideInDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  )
}
