import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSessionById } from '@lib/db'
import type { StoredSession } from '@types/index'
import { StressChart } from '@components/StressChart'
import { 
  ArrowLeft, 
  MessageSquare, 
  Target, 
  AlertCircle, 
  CheckCircle2, 
  Quote,
  Video
} from 'lucide-react'

export function ReportPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState<StoredSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (id) {
      getSessionById(id).then(s => {
        setSession(s)
        setLoading(false)
        if (s?.videoBlob) {
          const url = URL.createObjectURL(s.videoBlob)
          setVideoUrl(url)
        }
      })
    }

    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl)
    }
  }, [id])

  if (loading) return <div className="loading-screen">Analyzing session data...</div>
  if (!session) return <div className="error-screen">Session not found.</div>

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    })
  }

  const getDuration = (start: number, end: number) => {
    const totalSecs = Math.floor((end - start) / 1000)
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${mins}m ${secs}s`
  }

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds
      videoRef.current.play()
    }
  }

  return (
    <div className="page-container">
      <header className="main-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/sessions')}>
            <ArrowLeft size={18} />
          </button>
          <h1>Interview Retrospective</h1>
        </div>
        <div className="header-actions">
           {formatDate(session.startTime)}
        </div>
      </header>

      <main className="content report-content">
        <div className="report-grid">
          <div className="report-main">
            {/* Video Player */}
            <section className="report-card video-card">
              <div className="card-header">
                <Video size={20} className="icon-primary" />
                <h3>Session Recording</h3>
              </div>
              <div className="video-player-container">
                {videoUrl ? (
                  <video ref={videoRef} src={videoUrl} controls className="review-video" />
                ) : (
                  <div className="video-placeholder">No video recorded for this session.</div>
                )}
              </div>
            </section>

            <section className="report-hero">
              <div className="hero-stat">
                <label>Overall Score</label>
                <div className="score-number">{session.metrics.finalScore ?? '--'}<span className="score-total">/10</span></div>
              </div>
              <div className="hero-divider" />
              <div className="hero-details">
                <div className="detail-item">
                  <label>Duration</label>
                  <p>{getDuration(session.startTime, session.endTime)}</p>
                </div>
                <div className="detail-item">
                  <label>Filler Words</label>
                  <p>{session.metrics.fillerCount}</p>
                </div>
                <div className="detail-item">
                  <label>Avg Pace</label>
                  <p>{Math.round(session.metrics.avgWpm)} WPM</p>
                </div>
              </div>
            </section>

            <section className="report-card">
              <div className="card-header">
                <Quote size={20} className="icon-primary" />
                <h3>Interactive Transcript</h3>
                <span className="helper-text">Click text to jump video</span>
              </div>
              <div className="transcript-box interactive">
                {session.segments && session.segments.length > 0 ? (
                  session.segments.map((seg, i) => (
                    <span 
                      key={i} 
                      className="transcript-segment"
                      onClick={() => seekTo(seg.start)}
                    >
                      {seg.text}{' '}
                    </span>
                  ))
                ) : (
                  <div className="text-muted">No transcript segments available.</div>
                )}
              </div>
            </section>
          </div>

          <aside className="report-side">
            <div className="side-section">
              <h3><Target size={18} /> Performance Insights</h3>
              <div className="insights-list">
                {session.feedback.filter(f => f.type === 'suggestion').map((f, i) => (
                  <div key={i} className="insight-item">
                    <div className="insight-icon"><CheckCircle2 size={16} /></div>
                    <div className="insight-text">{f.message.replace(/^Score \d+\/10 — /, '')}</div>
                  </div>
                ))}
                {session.metrics.fillerCount > 5 && (
                  <div className="alert-item warn">
                    <strong>Filler redundancy</strong>
                    <p>Too many filler words detected. Practice "silent pauses".</p>
                  </div>
                )}
              </div>
            </div>

            <div className="side-section">
              <h3><MessageSquare size={18} /> Performance Events</h3>
              <div className="mini-log">
                {session.feedback.filter(f => f.type !== 'eye_contact' && f.type !== 'suggestion').map((f, i) => (
                  <div key={i} className={`mini-log-item log-${f.type}`}>
                    <span className="log-time">
                      {Math.floor((f.timestamp - session.startTime) / 1000)}s
                    </span>
                    <span className="log-msg" style={{cursor:'pointer', textDecoration:'underline'}} onClick={() => seekTo((f.timestamp - session.startTime)/1000)}>
                      {f.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
