/**
 * analysis.ts — Filler word detection and speech pace calculation.
 */

import type { TranscriptSegment, WordTiming, PaceRating } from 'types/index'

// ──────────────────────────────────────────────
// Filler word detection
// ──────────────────────────────────────────────

const FILLER_PATTERN =
  /\b(um+|uh+|er+|ah+|like|you know|i mean|basically|literally|actually|sort of|kind of|right\?|so+)\b/gi

export function detectFillers(text: string): string[] {
  return text.match(FILLER_PATTERN) ?? []
}

// ──────────────────────────────────────────────
// Segment → word timings expansion
// ──────────────────────────────────────────────

export function segmentsToWords(segments: TranscriptSegment[]): WordTiming[] {
  return segments.flatMap((seg) => {
    const words = seg.text.split(/\s+/)
    const dur = seg.end - seg.start
    const wordDur = dur / words.length
    return words.map((word: string, i: number) => ({
      word,
      start: seg.start + i * wordDur,
      end: seg.start + (i + 1) * wordDur,
    }))
  })
}

// ──────────────────────────────────────────────
// WPM — sliding 10-second window
// ──────────────────────────────────────────────

const WPM_WINDOW_S = 10

export function computeWPM(
  words: WordTiming[],
  currentTimeSec: number,
): { wpm: number; pace: PaceRating } {
  const windowStart = currentTimeSec - WPM_WINDOW_S
  const inWindow = words.filter((w) => w.end >= windowStart && w.start <= currentTimeSec)
  const wpm = Math.round((inWindow.length / WPM_WINDOW_S) * 60)
  const pace: PaceRating = wpm < 100 ? 'slow' : wpm > 160 ? 'fast' : 'ideal'
  return { wpm, pace }
}
