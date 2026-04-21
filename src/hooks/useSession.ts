/**
 * useSession — central orchestration hook for a ShadowCoach interview session.
 *
 * Manages:
 *  • Camera/mic capture (getUserMedia)
 *  • AudioRecorder → /transcribe chunks every 5 s
 *  • Filler word detection (regex on each transcript chunk)
 *  • WPM calculation (sliding 10-second window, updated every second)
 *  • Answer scoring (POST /score every 30 s of accumulated speech)
 *  • Session persistence (IndexedDB on stop)
 */

import { useRef, useState, useCallback, useReducer, useEffect } from 'react'
import { AudioRecorder } from '@lib/audio'
import { detectFillers, segmentsToWords, computeWPM } from '@lib/analysis'
import { saveSession, getSessionById } from '@lib/db'
import type {
  FeedbackData,
  TranscriptSegment,
  WordTiming,
  LiveMetrics,
  ScoreResult,
} from '@types/index'
import { initialMetrics } from '@types/index'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

// Score every 30 seconds of accumulated speech
const SCORE_MIN_DURATION_S = 30
// Minimum word count before scoring
const SCORE_MIN_WORDS = 20

// ──────────────────────────────────────────────
// Reducer for LiveMetrics (avoids stale closures)
// ──────────────────────────────────────────────

type MetricsAction =
  | { type: 'TICK'; wpm: number; pace: LiveMetrics['pace']; duration: number }
  | { type: 'FILLERS'; count: number }
  | { type: 'SCORE'; score: number; tip: string }
  | { type: 'TRANSCRIPT'; text: string }
  | { type: 'ADD_SEGMENTS'; segments: TranscriptSegment[] }
  | { type: 'RESET' }

function metricsReducer(state: LiveMetrics, action: MetricsAction): LiveMetrics {
  switch (action.type) {
    case 'TICK':
      return {
        ...state,
        wpm: action.wpm,
        pace: action.pace,
        sessionDuration: action.duration,
      }
    case 'FILLERS':
      return { ...state, fillerCount: state.fillerCount + action.count }
    case 'SCORE':
      return { ...state, answerScore: action.score, answerTip: action.tip }
    case 'TRANSCRIPT':
      return { ...state, transcript: (state.transcript + ' ' + action.text).trim() }
    case 'ADD_SEGMENTS':
      return { ...state, segments: [...state.segments, ...action.segments] }
    case 'RESET':
      return initialMetrics
    default:
      return state
  }
}

// ──────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────

export function useSession() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<AudioRecorder | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionStartRef = useRef<number>(0)

  // Accumulated words for WPM
  const allWordsRef = useRef<WordTiming[]>([])
  // Buffer for answer scoring
  const scoreBufferRef = useRef<TranscriptSegment[]>([])
  const scoreBufferDurRef = useRef(0)
  const isScoring = useRef(false)

  const [isRecording, setIsRecording] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackData[]>([])
  const [metrics, dispatchMetrics] = useReducer(metricsReducer, initialMetrics)
  const [latestVideoBlob, setLatestVideoBlob] = useState<Blob | null>(null)
  
  const fullChunksRef = useRef<Blob[]>([])
  const fullRecorderRef = useRef<MediaRecorder | null>(null)
  const [isStopping, setIsStopping] = useState(false) // Gate for saving logic during stop process

  // ──────────────────────────────────────────
  // Score a buffered transcript against Ollama
  // ──────────────────────────────────────────
  const tryScore = useCallback(async (segments: TranscriptSegment[]) => {
    if (isScoring.current) return
    const wordCount = segments.reduce((n, s) => n + s.text.split(/\s+/).length, 0)
    if (wordCount < SCORE_MIN_WORDS) return

    isScoring.current = true
    const text = segments.map((s) => s.text).join(' ')

    try {
      const res = await fetch(`${API_BASE}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      })
      if (!res.ok) return

      const data: ScoreResult = await res.json()
      dispatchMetrics({ type: 'SCORE', score: data.score, tip: data.tip })
      setFeedback((prev) => [
        ...prev,
        {
          type: 'suggestion',
          message: `Score ${data.score}/10 — ${data.tip}`,
          timestamp: new Date(),
        },
      ])
    } catch (err) {
      console.warn('[useSession] /score request failed:', err)
    } finally {
      isScoring.current = false
    }
  }, [])

  // ──────────────────────────────────────────
  // Called each time the AudioRecorder completes a chunk
  // ──────────────────────────────────────────
  const handleSegments = useCallback(
    (segments: TranscriptSegment[]) => {
      // 1. Expand to word timings for WPM
      const words = segmentsToWords(segments)
      allWordsRef.current = [...allWordsRef.current, ...words]

      // 2. Filler detection
      const allText = segments.map((s) => s.text).join(' ')
      const fillers = detectFillers(allText)
      if (fillers.length > 0) {
        dispatchMetrics({ type: 'FILLERS', count: fillers.length })
        setFeedback((prev) => [
          ...prev,
          {
            type: 'filler',
            message: `Filler word${fillers.length > 1 ? 's' : ''} detected: ${fillers.map((f) => `"${f}"`).join(', ')}`,
            timestamp: new Date(),
          },
        ])
      }

      // 3. Accumulate transcript
      dispatchMetrics({ type: 'TRANSCRIPT', text: allText })
      dispatchMetrics({ type: 'ADD_SEGMENTS', segments })

      // 4. Buffer for answer scoring
      scoreBufferRef.current = [...scoreBufferRef.current, ...segments]
      const chunkDur = segments.reduce((s, seg) => s + (seg.end - seg.start), 0)
      scoreBufferDurRef.current += chunkDur

      if (scoreBufferDurRef.current >= SCORE_MIN_DURATION_S) {
        const toScore = [...scoreBufferRef.current]
        scoreBufferRef.current = []
        scoreBufferDurRef.current = 0
        tryScore(toScore)
      }
    },
    [tryScore],
  )

  // ──────────────────────────────────────────
  // Per-second tick: WPM + duration + eye contact
  // ──────────────────────────────────────────
  const tick = useCallback(() => {
    const currentSec = (Date.now() - sessionStartRef.current) / 1000
    const { wpm, pace } = computeWPM(allWordsRef.current, currentSec)

    dispatchMetrics({
      type: 'TICK',
      wpm,
      pace,
      duration: Math.round(currentSec),
    })
  }, [])

  // ──────────────────────────────────────────
  // Start session
  // ──────────────────────────────────────────
  const startSession = useCallback(async () => {
    // Reset state
    dispatchMetrics({ type: 'RESET' })
    setFeedback([])
    allWordsRef.current = []
    scoreBufferRef.current = []
    scoreBufferDurRef.current = 0

    // Get media stream
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      // Check if we actually got audio tracks (some privacy settings might block audio)
      if (stream.getAudioTracks().length === 0) {
        throw new Error('Microphone access was not granted or no audio device is available.')
      }

      sessionStartRef.current = Date.now()

      // Full Session Recorder for later review
      fullChunksRef.current = []
      const fullRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' })
      fullRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) fullChunksRef.current.push(e.data)
      }
      fullRecorderRef.current = fullRecorder
      fullRecorder.start(1000)

      // Give hardware a moment to "breath" and stabilize
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Start audio recording + transcription
      const recorder = new AudioRecorder(stream, handleSegments)
      recorderRef.current = recorder
      recorder.start()

      // Start 1-second tick
      timerRef.current = setInterval(tick, 1000)

      setIsRecording(true)
    } catch (err) {
      console.error('[useSession] Failed to start session:', err)
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          alert('Camera or microphone permission was denied or dismissed. Please allow access to start the session.')
        } else if (err.name === 'NotFoundError') {
          alert('No camera or microphone found on this device.')
        } else {
          alert(`Could not start session: ${err.message}`)
        }
      }
      setIsRecording(false)
    }
  }, [handleSegments, tick])

  // ──────────────────────────────────────────
  // Stop session
  // ──────────────────────────────────────────
  const stopSession = useCallback(async () => {
    if (isStopping || !isRecording) return
    setIsStopping(true)
    setIsRecording(false) 

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // Stop recording
    recorderRef.current?.stop()

    // Stop media tracks
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null

    // Score remaining buffer if substantial
    if (scoreBufferRef.current.length > 0) {
      await tryScore(scoreBufferRef.current)
    }

    // Capture the state at closure time
    const currentMetrics = { ...metrics }
    const currentFeedback = [...feedback]
    const currentId = sessionStartRef.current.toString()
    const startTime = sessionStartRef.current

    // Wait for MediaRecorder to stop and flush chunks
    const stopRecorder = () => new Promise<Blob>((resolve) => {
      if (!fullRecorderRef.current || fullRecorderRef.current.state === 'inactive') {
        resolve(new Blob(fullChunksRef.current, { type: 'video/webm' }))
        return
      }
      fullRecorderRef.current.onstop = () => {
        resolve(new Blob(fullChunksRef.current, { type: 'video/webm' }))
      }
      fullRecorderRef.current.stop()
    })

    try {
      const videoBlob = await stopRecorder()
      setLatestVideoBlob(videoBlob)

      // Persist to IndexedDB (METADATA ONLY)
        await saveSession({
          id: currentId,
          startTime: startTime,
          endTime: Date.now(),
          transcript: currentMetrics.transcript,
          segments: currentMetrics.segments,
          metrics: {
            fillerCount: currentMetrics.fillerCount,
            avgWpm: currentMetrics.wpm,
            finalScore: currentMetrics.answerScore,
          },
          feedback: currentFeedback.map((f) => ({
            type: f.type,
            message: f.message,
            timestamp: f.timestamp.getTime(),
          })),
        })
      console.log('[useSession] Session metadata persisted successfully')
    } catch (e) {
      console.error('[useSession] Final session save failed:', e)
    } finally {
      setIsStopping(false)
    }

    return sessionStartRef.current.toString()
  }, [feedback, metrics, tryScore, isStopping, isRecording])

  const saveVideo = useCallback(async () => {
    if (!latestVideoBlob || !sessionStartRef.current) {
      console.warn('[useSession] No video or ID to save')
      return false
    }
    
    const id = sessionStartRef.current.toString()
    try {
      const stored = await getSessionById(id)
      if (stored) {
        await saveSession({ ...stored, videoBlob: latestVideoBlob })
        console.log('[useSession] Video saved successfully to IndexedDB')
        return true
      } else {
        console.warn('[useSession] Could not find session metadata in IndexedDB for ID:', id)
      }
    } catch (err) {
      console.error('[useSession] Failed to save video:', err)
    }
    return false
  }, [latestVideoBlob])

  // ──────────────────────────────────────────
  // Lifecycle & Shortcuts
  // ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      // Force stop all tracks if unmounting
      streamRef.current?.getTracks().forEach((t) => t.stop())
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow stopping with Escape key
      if (e.key === 'Escape' && isRecording) {
        stopSession()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRecording, stopSession])

  return {
    isRecording,
    metrics,
    feedback,
    videoRef,
    latestVideoBlob,
    startSession,
    stopSession,
    saveVideo,
  }
}
