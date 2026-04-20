import os
import tempfile
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel

from .transcribe import transcribe_audio_file_path, stream_transcription
from .score import score_answer

app = FastAPI(
    title="ShadowCoach API",
    version="0.2.0",
    description="FastAPI backend for real-time Whisper transcription and scoring.",
)

# Allow all localhost dev ports
_raw_origins = os.environ.get(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://localhost:5175",
)
allowed_origins = [o.strip() for o in _raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# Transcription endpoints
# ──────────────────────────────────────────────

ALLOWED_AUDIO_TYPES = {
    "audio/wav",
    "audio/mpeg",
    "audio/mp3",
    "audio/x-wav",
    "audio/webm",
    "audio/ogg",
    "audio/webm;codecs=opus",
}


@app.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Transcribe an audio chunk and return full text + timestamped segments."""
    content_type = (audio.content_type or "").split(";")[0].strip()
    if content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported audio format: {audio.content_type}")

    suffix = os.path.splitext(audio.filename or "chunk.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        result = await transcribe_audio_file_path(tmp_path)
        return JSONResponse(result)
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.post("/transcribe/stream")
async def transcribe_audio_stream(audio: UploadFile = File(...)):
    """Stream back word segments as SSE events while transcribing."""
    content_type = (audio.content_type or "").split(";")[0].strip()
    if content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported audio format: {audio.content_type}")

    suffix = os.path.splitext(audio.filename or "chunk.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    async def stream_and_cleanup():
        try:
            async for chunk in stream_transcription(tmp_path):
                yield chunk
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    return StreamingResponse(stream_and_cleanup(), media_type="text/event-stream")


# ──────────────────────────────────────────────
# Scoring endpoint
# ──────────────────────────────────────────────

class ScoreRequest(BaseModel):
    transcript: str


@app.post("/score")
async def score_interview_answer(body: ScoreRequest):
    """Send a transcript excerpt to Ollama and return score + weakness + tip."""
    if not body.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript is empty")
    if len(body.transcript.split()) < 5: # Lowered threshold for Groq speed
        raise HTTPException(status_code=422, detail="Transcript too short to score")

    try:
        result = await score_answer(body.transcript)
        return JSONResponse(result)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Scoring error: {str(exc)}")


@app.get("/")
async def index():
    return {
        "message": "ShadowCoach API is running",
        "docs": "/docs",
        "health": "/health"
    }


# ──────────────────────────────────────────────
# Health
# ──────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {"status": "ok"}
