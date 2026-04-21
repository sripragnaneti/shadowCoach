import json
import re
import os
import httpx

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen3.5:397b-cloud")

QUESTION_PROMPT = """/no_think
You are an expert recruiter. Generate exactly {count} interview questions based on the following context.

ROLE: {role}
RESUME/CONTEXT: {resume}

The questions should be a mix of behavioral and technical, and should be professional and challenging.
Respond with ONLY valid JSON — an array of strings. No extra text, no markdown.

Example:
["Describe a time you handled a difficult stakeholder.", "How would you explain recursion to a non-technical manager?"]
"""

async def generate_interview_questions(role: str, resume: str, count: int = 5) -> list[str]:
    """Generates a list of interview questions tailored to role and resume."""
    prompt = QUESTION_PROMPT.format(role=role, resume=resume, count=count)

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
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
            raw = data.get("response", "[]")

        # Parse the JSON — handle markdown or raw text
        raw = re.sub(r"```json\s*|\s*```", "", raw).strip()
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            match = re.search(r"\[.*\]", raw, re.DOTALL)
            if match:
                return json.loads(match.group())
            return ["Tell me about your background.", "Why are you interested in this role?", "Describe a difficult challenge you solved.", "Where do you see yourself in 5 years?", "Do you have any questions for us?"]
    except Exception as e:
        print(f"[interview] Error generating questions: {e}")
        # Default fallback questions
        return [
            "Walk me through your most significant project.",
            "Tell me about a time you worked with a difficult teammate.",
            "How do you handle high-pressure deadlines?",
            "What is your greatest professional accomplishment?",
            "Why do you want to join our organization?"
        ]
