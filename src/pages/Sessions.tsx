import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadSessions, deleteSession, clearSessionsByType } from '@lib/db'
import type { StoredSession } from 'types/index'
import { Calendar, Clock, Trash2, ArrowLeft, BarChart2, Video, MessageSquare, Mic, ShieldAlert } from 'lucide-react'

export function SessionsPage() {
  const [sessions, setSessions] = useState<StoredSession[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    const s = await loadSessions()
    setSessions(s.sort((a: StoredSession, b: StoredSession) => b.startTime - a.startTime))
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('Delete this session?')) {
      await deleteSession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
    }
  }

  const handleClear = async (type: 'mock' | 'practice') => {
    const label = type === 'mock' ? 'Mock Interview' : 'Speaking Practice'
    if (confirm(`Clear all ${label} sessions? This cannot be undone.`)) {
      await clearSessionsByType(type)
      fetchSessions()
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

  const mockSessions = sessions.filter(s => s.type === 'mock')
  const practiceSessions = sessions.filter(s => s.type === 'practice' || !s.type)

  return (
    <div className="page-container">
       <header className="main-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={18} />
          </button>
          <h1>Your History</h1>
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
          <div className="sessions-container">
            {/* Section 1: Mock Interviews */}
            <div className="session-section">
              <div className="section-header">
                <div className="section-title">
                  <MessageSquare size={18} />
                  <h3>Mock Interviews ({mockSessions.length})</h3>
                </div>
                {mockSessions.length > 0 && (
                  <button className="clear-btn" onClick={() => handleClear('mock')}>
                    Clear All
                  </button>
                )}
              </div>
              <div className="session-list">
                {mockSessions.map((s) => (
                  <SessionCard key={s.id} session={s} navigate={navigate} onDelete={handleDelete} formatDate={formatDate} formatTime={formatTime} getDuration={getDuration} />
                ))}
              </div>
            </div>

            {/* Section 2: Speaking Practice */}
            <div className="session-section" style={{ marginTop: '2rem' }}>
              <div className="section-header">
                <div className="section-title">
                  <Mic size={18} />
                  <h3>Speaking Practice ({practiceSessions.length})</h3>
                </div>
                {practiceSessions.length > 0 && (
                  <button className="clear-btn" onClick={() => handleClear('practice')}>
                    Clear All
                  </button>
                )}
              </div>
              <div className="session-list">
                {practiceSessions.map((s) => (
                  <SessionCard key={s.id} session={s} navigate={navigate} onDelete={handleDelete} formatDate={formatDate} formatTime={formatTime} getDuration={getDuration} />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .sessions-container { max-width: 1200px; margin: 0 auto; }
        .session-section { margin-bottom: 3rem; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
        .section-title { display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); }
        .section-title h3 { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
        
        .clear-btn { background: transparent; border: 1px solid var(--danger); color: var(--danger); padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.75rem; cursor: pointer; transition: 0.2s; }
        .clear-btn:hover { background: var(--danger); color: white; }

        .score-badge { color: var(--success); font-weight: 700; }
      `}</style>
    </div>
  )
}

function SessionCard({ session, navigate, onDelete, formatDate, formatTime, getDuration }: any) {
  return (
    <div className="session-card" onClick={() => navigate(`/report/${session.id}`)}>
      <div className="session-card-info">
        <div className="session-date">
          <Calendar size={14} className="icon-muted" />
          {formatDate(session.startTime)}
        </div>
        <h3 className="session-title">
          {formatTime(session.startTime)} {session.type === 'mock' ? 'Mock Interview' : 'Speaking Practice'}
        </h3>
        <div className="session-meta">
          <span><Clock size={12} /> {getDuration(session.startTime, session.endTime)}</span>
          <span>•</span>
          <span>{session.metrics.fillerCount} fillers</span>
          {session.metrics.finalScore !== null && (
            <>
              <span>•</span>
              <span className="score-badge">Score: {session.metrics.finalScore}/10</span>
            </>
          )}
          {session.videoBlob && (
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
        <button className="icon-btn delete" onClick={(e) => onDelete(e, session.id)} title="Delete">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  )
}
