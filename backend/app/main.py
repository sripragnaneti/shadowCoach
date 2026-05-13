from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from app.parser import parse_resume_file
from app.interview import generate_interview_questions

app = FastAPI(title="ShadowCoach AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev, allow all. Restrict in prod.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuestionRequest(BaseModel):
    role: str
    resume: str
    count: int = 5
    focus: str = "balanced"
    difficulty: str = "standard"

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/interview/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    try:
        content = await file.read()
        text = parse_resume_file(content, file.filename)
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/interview/questions")
def get_questions(req: QuestionRequest):
    try:
        questions = generate_interview_questions(
            role=req.role,
            resume_text=req.resume,
            count=req.count,
            focus=req.focus,
            difficulty=req.difficulty
        )
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
