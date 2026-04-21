/**
 * AudioRecorder — captures audio in fixed-length chunks and posts each
 * to the backend /transcribe endpoint, calling onSegments with the result.
 */

import type { TranscriptSegment } from 'types/index'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'
const CHUNK_INTERVAL_MS = 4_000

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private readonly onSegments: (segs: TranscriptSegment[]) => void
  private chunkOffset = 0
  private audioStream: MediaStream
  private mimeType: string
  private isActive = false
  private timerId: number | null = null

  constructor(stream: MediaStream, onSegments: (segs: TranscriptSegment[]) => void) {
    this.onSegments = onSegments
    
    // Crucial: Create an audio-only stream to avoid MediaRecorder conflicts
    this.audioStream = new MediaStream(stream.getAudioTracks())
    
    this.mimeType = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
    ].find((m) => MediaRecorder.isTypeSupported(m)) ?? ''
  }

  private startNextChunk() {
    if (!this.isActive) return

    try {
      this.mediaRecorder = new MediaRecorder(this.audioStream, this.mimeType ? { mimeType: this.mimeType } : undefined)
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.isActive) {
          const offset = this.chunkOffset
          this.sendChunk(event.data, offset)
          this.chunkOffset += CHUNK_INTERVAL_MS / 1000
        }
      }

      this.mediaRecorder.onstop = () => {
        // Only start next if we are still active
        if (this.isActive) {
          this.startNextChunk()
        }
      }

      this.mediaRecorder.start()

      // Set timeout to stop this chunk and trigger the next one
      this.timerId = window.setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop()
        }
      }, CHUNK_INTERVAL_MS)

    } catch (err) {
      console.error('[AudioRecorder] Error in chunk cycle:', err)
      // Attempt to recover after a short delay
      if (this.isActive) setTimeout(() => this.startNextChunk(), 1000)
    }
  }

  start() {
    this.isActive = true
    this.chunkOffset = 0
    this.startNextChunk()
  }

  stop() {
    this.isActive = false
    if (this.timerId) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }
  }

  private async sendChunk(blob: Blob, offset: number) {
    const formData = new FormData()
    formData.append('audio', new File([blob], `chunk_${Date.now()}.webm`, { type: blob.type }))

    try {
      const res = await fetch(`${API_BASE}/transcribe`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) return

      const data = await res.json()
      const segments: TranscriptSegment[] = (data.segments ?? []).map(
        (s: TranscriptSegment) => ({
          start: s.start + offset,
          end: s.end + offset,
          text: s.text,
        }),
      )
      
      if (segments.length > 0) {
        this.onSegments(segments)
      } else if (data.text && data.text.length > 1) {
        this.onSegments([{
          start: offset,
          end: offset + (CHUNK_INTERVAL_MS / 1000),
          text: data.text
        }])
      }
    } catch (err) {
      console.warn('[AudioRecorder] transcription request failed:', err)
    }
  }
}


