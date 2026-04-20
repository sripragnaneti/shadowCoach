import React, { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { VideoCapture, VideoCaptureHandle } from '@components/VideoCapture'
import { AnalysisDashboard } from '@components/AnalysisDashboard'
import { SessionControls } from '@components/SessionControls'
import { useSession } from '@hooks/useSession'
import { History, LayoutDashboard } from 'lucide-react'

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
    await stopSession()
  }

  return (
    <div className="page-container">
      <header className="main-header">
        <div className="header-left">
          <div className="brand">
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
          <p className="header-status">Premium Interview Intelligence</p>
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
                onStart={startSession}
                onEnd={handleStop}
              />
            </div>

            <div className="panel dashboard-panel">
              <AnalysisDashboard 
                metrics={metrics} 
                feedback={feedback} 
                isRecording={isRecording} 
                onSeek={(sec) => captureRef.current?.seek(sec)}
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

