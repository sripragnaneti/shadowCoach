/**
 * analysis.ts — Filler word detection and speech pace calculation.
 */

import type { TranscriptSegment, WordTiming, PaceRating } from '@types/index'

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
  const words: WordTiming[] = []
  for (const seg of segments) {
    const segWords = seg.text.trim().split(/\s+/).filter(Boolean)
    if (segWords.length === 0) continue
    const wDuration = (seg.end - seg.start) / segWords.length
    segWords.forEach((word, i) => {
      words.push({
        word,
        start: seg.start + i * wDuration,
        end: seg.start + (i + 1) * wDuration,
      })
    })
  }
  return words
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
