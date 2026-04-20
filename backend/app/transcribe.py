import os
import json
import asyncio
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Initialize Groq client
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

async def transcribe_audio_file_path(file_path: str) -> dict:
    """
    Transcribes an audio file from a path using Groq's Whisper API.
    Returns segments (start, end, text) and full text.
    """
    try:
        # Run the synchronous Groq call in a thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        def call_groq():
            with open(file_path, "rb") as audio_file:
                return client.audio.transcriptions.create(
                    file=(os.path.basename(file_path), audio_file.read()),
                    model="whisper-large-v3",
                    response_format="verbose_json",
                    language="en",
                )
        
        # Groq verbose_json response includes 'segments' and 'text'
        response = await loop.run_in_executor(None, call_groq)
        
        # Adapt Groq response to our expected format
        segments = []
        raw_segments = getattr(response, 'segments', [])
        if isinstance(raw_segments, list):
            for s in raw_segments:
                # Handle both dicts and objects
                text = s.get('text', "") if isinstance(s, dict) else getattr(s, 'text', "")
                start = s.get('start', 0) if isinstance(s, dict) else getattr(s, 'start', 0)
                end = s.get('end', 0) if isinstance(s, dict) else getattr(s, 'end', 0)
                
                segments.append({
                    "start": start,
                    "end": end,
                    "text": text.strip()
                })

        
        return {
            "segments": segments,
            "text": getattr(response, 'text', "").strip(),
            "language": getattr(response, 'language', "en"),
            "duration": getattr(response, 'duration', 0)
        }

    except Exception as e:
        print(f"[Transcribe] Groq Error: {e}")
        return {"segments": [], "text": "", "error": str(e)}

async def stream_transcription(file_path: str):
    """
    Yields the transcription result as a single SSE event.
    """
    result = await transcribe_audio_file_path(file_path)
    yield f"data: {json.dumps(result)}\n\n"

