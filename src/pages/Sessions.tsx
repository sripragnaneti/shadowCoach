import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadSessions, deleteSession } from '@lib/db'
import type { StoredSession } from 'types/index'
import { Calendar, Clock, Trash2, ArrowLeft, BarChart2, Video } from 'lucide-react'

export function SessionsPage() {
  const [sessions, setSessions] = useState<StoredSession[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    loadSessions().then((s: StoredSession[]) => setSessions(s.sort((a: StoredSession, b: StoredSession) => b.startTime - a.startTime)))
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('Delete this session?')) {
      await deleteSession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
    }
  }

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDuration = (start: number, end: number) => {
    const mins = Math.floor((end - start) / 60000)
    const secs = Math.floor(((end - start) % 60000) / 1000)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="page-container">
       <header className="main-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={18} />
          </button>
          <h1>Your Sessions</h1>
        </div>
      </header>

      <main className="content list-content">
        {sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No sessions recorded yet</h3>
            <p>Your interview sessions and live coaching history will appear here.</p>
            <button className="btn btn-primary" onClick={() => navigate('/')} style={{ width: 'auto', marginTop: '1rem' }}>
              Start your first session
            </button>
          </div>
        ) : (
          <div className="session-list">
            {sessions.map((s: StoredSession) => (
              <div key={s.id} className="session-card" onClick={() => navigate(`/report/${s.id}`)}>
                <div className="session-card-info">
                  <div className="session-date">
                    <Calendar size={14} className="icon-muted" />
                    {formatDate(s.startTime)}
                  </div>
                  <h3 className="session-title">
                    {formatTime(s.startTime)} Interview Session
                  </h3>
                  <div className="session-meta">
                    <span><Clock size={12} /> {getDuration(s.startTime, s.endTime)}</span>
                    <span>•</span>
                    <span>{s.metrics.fillerCount} fillers</span>
                    <span>•</span>
                    <span className="score-badge">Score: {s.metrics.finalScore ?? 'N/A'}/10</span>
                    {s.videoBlob && (
                      <span className="v-badge">
                        <Video size={10} fill="currentColor" />
                        VIDEO
                      </span>
                    )}
                  </div>
                </div>
                <div className="session-card-actions">
                  <button className="icon-btn" title="View Report">
                    <BarChart2 size={18} />
                  </button>
                  <button className="icon-btn delete" onClick={(e) => handleDelete(e, s.id)} title="Delete">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
