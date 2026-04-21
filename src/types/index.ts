// ──────────────────────────────────────────────
// Core domain types
// ──────────────────────────────────────────────

export type FeedbackType = 'filler' | 'pace' | 'suggestion'
export type PaceRating = 'slow' | 'ideal' | 'fast'

export interface FeedbackData {
  type: FeedbackType
  message: string
  timestamp: Date
  confidence?: number
}

export interface InterviewSession {
  id: string
  startTime: Date
  endTime: Date | null
}

// ──────────────────────────────────────────────
// Transcript / analysis types
// ──────────────────────────────────────────────

export interface TranscriptSegment {
  start: number
  end: number
  text: string
}

export interface WordTiming {
  word: string
  start: number
  end: number
}

// ──────────────────────────────────────────────
// Live metrics displayed on dashboard
// ──────────────────────────────────────────────

export interface LiveMetrics {
  fillerCount: number
  wpm: number
  pace: PaceRating
  answerScore: number | null
  answerTip: string | null
  sessionDuration: number
  transcript: string
  segments: TranscriptSegment[]
}

export const initialMetrics: LiveMetrics = {
  fillerCount: 0,
  wpm: 0,
  pace: 'ideal',
  answerScore: null,
  answerTip: null,
  sessionDuration: 0,
  transcript: '',
  segments: [],
}

// ──────────────────────────────────────────────
// Ollama scoring response
// ──────────────────────────────────────────────

export interface ScoreResult {
  score: number
  weakness: string
  tip: string
}

// ──────────────────────────────────────────────
// IndexedDB stored session
// ──────────────────────────────────────────────

export interface StoredFeedback {
  type: string
  message: string
  timestamp: number
}

export interface StoredSession {
  id: string
  startTime: number
  endTime: number
  transcript: string
  segments: TranscriptSegment[]
  videoBlob?: Blob
  metrics: {
    fillerCount: number
    avgWpm: number
    finalScore: number | null
  }
  feedback: StoredFeedback[]
}


// Legacy — kept for backwards compat
export interface AnalysisMetrics {
  fillerWordCount: number
  averagePace: number
  totalDuration: number
}
