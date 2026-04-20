import json
import re
import os
import httpx

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen3.5:397b-cloud")

SCORE_PROMPT = """/no_think
You are an expert interview coach. Evaluate the following interview answer excerpt.

TRANSCRIPT:
{transcript}

Respond with ONLY valid JSON — no extra text, no markdown:
{{
  "score": <integer 1-10>,
  "weakness": "<one concise sentence about the main weakness>",
  "tip": "<one actionable improvement tip>"
}}
"""


async def score_answer(transcript: str) -> dict:
    """Send a transcript excerpt to Ollama and return a score JSON."""
    prompt = SCORE_PROMPT.format(transcript=transcript.strip())

    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "format": "json",
            },
        )
        response.raise_for_status()
        data = response.json()
        raw = data.get("response", "{}")

    # Parse the JSON — Qwen3 may wrap in markdown, strip it
    raw = re.sub(r"```json\s*|\s*```", "", raw).strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError(f"Could not parse Ollama response: {raw[:200]}")
