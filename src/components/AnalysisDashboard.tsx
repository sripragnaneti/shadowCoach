import React from 'react'
import type { LiveMetrics, FeedbackData } from '@types/index'

interface AnalysisDashboardProps {
  metrics: LiveMetrics
  feedback: FeedbackData[]
  isRecording: boolean
  onSeek?: (seconds: number) => void
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function PaceBadge({ pace, visible }: { pace: LiveMetrics['pace']; visible: boolean }) {
  if (!visible) return null
  const colors: Record<LiveMetrics['pace'], string> = {
    slow: '#f59e0b',
    ideal: '#22c55e',
    fast: '#ef4444',
  }
  return (
    <span
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: colors[pace],
        marginRight: 5,
        verticalAlign: 'middle',
      }}
    />
  )
}

export function AnalysisDashboard({ metrics, feedback, isRecording, onSeek }: AnalysisDashboardProps): React.ReactNode {
  const transcriptRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll transcript
  React.useEffect(() => {
    if (transcriptRef.current && isRecording) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [metrics.transcript, isRecording])

  return (
    <div className="analysis-dashboard">
      <div className="dashboard-header">
        <h2>Performance Analytics</h2>
        {isRecording && <div className="live-status">● LIVE ANALYSIS</div>}
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Filler Words</span>
          <span className="metric-value">{metrics.fillerCount}</span>
        </div>

        <div className="metric-card">
          <span className="metric-label">
            <PaceBadge pace={metrics.pace} visible={true} />
            Pacing
          </span>
          <span className="metric-value">{metrics.wpm} <small>wpm</small></span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Score</span>
          <span className="metric-value">
            {metrics.answerScore !== null ? `${metrics.answerScore}/10` : '--'}
          </span>
        </div>
      </div>

      <div className="transcript-section">
        <div className="section-label">
          Live Transcript
          {!isRecording && metrics.segments.length > 0 && (
            <span className="helper-hint">Click text to re-watch</span>
          )}
        </div>
        <div className="live-transcript" ref={transcriptRef}>
          {metrics.segments.length > 0 ? (
            metrics.segments.map((seg, i) => (
              <span 
                key={i} 
                className={`transcript-bit ${!isRecording ? 'seekable' : ''}`}
                onClick={() => !isRecording && onSeek?.(seg.start)}
              >
                {seg.text}{' '}
              </span>
            ))
          ) : (
             (isRecording ? 'Listening...' : 'Transcripts will appear here')
          )}
        </div>
      </div>

      <div className="feedback-section">
        <div className="section-label">Real-time Coaching</div>
        <div className="feedback-scroll">
          {feedback.length === 0 ? (
            <div className="empty-state">
              {isRecording ? 'Analyzing your speech patterns...' : 'Complete a session to see detailed feedback'}
            </div>
          ) : (
            [...feedback].reverse().map((item, idx) => (
              <div key={idx} className={`feedback-card feedback-${item.type}`}>
                <div className="feedback-meta">
                  <span className="timestamp">
                    {formatDuration(Math.max(0, Math.round((item.timestamp.getTime() - Date.now() + metrics.sessionDuration * 1000) / 1000)))}s
                  </span>
                  <span className="type-tag">{item.type}</span>
                </div>
                <div className="message">{item.message}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}


