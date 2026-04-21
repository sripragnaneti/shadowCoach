import { Square, Save, Video, Check } from 'lucide-react'
import { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react'
import { useNavigate } from 'react-router-dom'

interface VideoCaptureProps {
  videoRef: React.RefObject<HTMLVideoElement>
  isRecording: boolean
  onStop?: () => void
  reviewBlob?: Blob | null
  onSave?: () => Promise<boolean> | void
}

export interface VideoCaptureHandle {
  seek: (seconds: number) => void
}

export const VideoCapture = forwardRef<VideoCaptureHandle, VideoCaptureProps>(({ 
  videoRef, 
  isRecording, 
  onStop, 
  reviewBlob, 
  onSave 
}, ref) => {
  const navigate = useNavigate()
  const [reviewUrl, setReviewUrl] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const reviewVideoRef = useRef<HTMLVideoElement>(null)

  const handleSave = async () => {
    if (onSave) {
      const success = await onSave()
      if (success) setIsSaved(true)
    }
  }

  useImperativeHandle(ref, () => ({
    seek: (seconds: number) => {
      if (reviewVideoRef.current) {
        reviewVideoRef.current.currentTime = seconds
        reviewVideoRef.current.play()
      }
    }
  }))

  useEffect(() => {
    setIsSaved(false) // Reset for new session
    if (reviewBlob && !isRecording) {
      const url = URL.createObjectURL(reviewBlob)
      setReviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [reviewBlob, isRecording])

  // Trick to fix "Infinity" duration on Chrome recorded WebM blobs
  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget
    if (video.duration === Infinity) {
      video.currentTime = 1e101
      video.ontimeupdate = () => {
        video.ontimeupdate = null
        video.currentTime = 0
      }
    }
  }

  return (
    <div className="video-capture">
      {/* Live Feed */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="video-feed" 
        style={{ display: isRecording || !reviewUrl ? 'block' : 'none' }} 
      />

      {/* Review Feed */}
      {!isRecording && reviewUrl && (
        <div className="review-area">
          <video 
            ref={reviewVideoRef}
            src={reviewUrl} 
            controls 
            className="video-feed review" 
            onLoadedMetadata={handleLoadedMetadata}
          />
          <div className="review-overlay">
            <button 
              className={`review-btn save ${isSaved ? 'success' : ''}`} 
              onClick={handleSave}
              disabled={isSaved}
            >
              {isSaved ? <Check size={16} /> : <Save size={16} />}
              {isSaved ? 'Saved' : 'Save Video'}
            </button>
            <button className="review-btn report" onClick={() => navigate('/sessions')}>
              <Video size={16} /> History
            </button>
          </div>
        </div>
      )}

      {isRecording && (
        <>
          <div className="recording-indicator">
            <div className="dot" />
            Live Session
          </div>

          <button className="video-stop-btn" onClick={onStop} title="Stop Session (Esc)">
            <Square size={16} fill="currentColor" />
            <span>End Session</span>
          </button>
        </>
      )}

      {!isRecording && !reviewUrl && (
        <div className="placeholder">
          <p>Ready to start your interview engine?</p>
          <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>High-performance analysis starts here</span>
        </div>
      )}
    </div>
  )
})


