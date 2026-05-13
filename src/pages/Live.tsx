import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { VideoCapture, VideoCaptureHandle } from '@components/VideoCapture'
import { AnalysisDashboard } from '@components/AnalysisDashboard'
import { SessionControls } from '@components/SessionControls'
import { useSession } from '@hooks/useSession'
import { History, LayoutDashboard, Timer, MessageSquare, ChevronRight, Play, Loader2 } from 'lucide-react'

const SECONDS_PER_QUESTION = 60

export function LivePage() {
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

  const handleStop = async () => {
    const id = await stopSession()
    if (id) {
       // Redirect to report after a short delay
       setTimeout(() => navigate(`/report/${id}`), 1500)
    }
  }

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
              Live Studio
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
            <div className="panel video-panel">
              <VideoCapture 
                ref={captureRef}
                videoRef={videoRef} 
                isRecording={isRecording} 
                onStop={handleStop} 
                reviewBlob={latestVideoBlob}
                onSave={saveVideo}
              />
            </div>
          </div>

          <aside className="sidebar">
            <div className="panel control-panel">
              <SessionControls
                isRecording={isRecording}
                onStart={() => startSession('practice')}
                onEnd={handleStop}
              />
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

