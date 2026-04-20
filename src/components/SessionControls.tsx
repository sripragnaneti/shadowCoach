import React from 'react'
import type { FeedbackData } from '@types/index'

interface SessionControlsProps {
  isRecording: boolean
  onStart: () => void
  onEnd: () => void
}

export function SessionControls({ isRecording, onStart, onEnd }: SessionControlsProps): React.ReactNode {
  return (
    <div className="session-controls">
      {!isRecording ? (
        <button onClick={onStart} className="btn btn-primary">
          Start Session
        </button>
      ) : (
        <button onClick={onEnd} className="btn btn-danger">
          End Session
        </button>
      )}
    </div>
  )
}
