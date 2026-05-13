import os
import json
from anthropic import Anthropic
from dotenv import load_dotenv

# Load environment variables from .env file if available
load_dotenv()

def generate_interview_questions(role: str, resume_text: str, count: int = 5, focus: str = "balanced", difficulty: str = "standard") -> list[str]:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    
    # If API isn't available, we use tailored student/technical fallbacks instead of corporate ones.
    student_fallback_questions = [
        f"Can you explain the core technical stack you used in the main project mentioned on your profile for this {role} path?",
        "Walk me through the problem-solving approach you take when starting a new coding assignment or technical implementation.",
        "Describe an instance where your initial code or design failed during testing, and how you debugged it.",
        "Which specific technical concept relevant to this field did you find most challenging to learn recently?",
        "If you had one additional week to improve your best academic project, what scalability or feature upgrades would you make?"
    ]

    if not api_key:
        # Warn the developer about missing API Key in terminal
        print("WARNING: ANTHROPIC_API_KEY is not set. Defaulting to static student-friendly fallback questions.")
        return student_fallback_questions[:count]

    client = Anthropic(api_key=api_key)
    
    # Construct distinct instruction paths based on Focus
    if focus == "resume":
        focus_instruction = """
        CRITICAL INSTRUCTION: You MUST base ALL questions heavily and specifically on the candidate's provided resume text. 
        Do NOT ask generic interview questions. 
        Look for specific projects, technologies mentioned, internships, roles, or certifications listed in the resume. 
        Ask detailed questions about the implementation details of their projects, the impact of their contributions, specific technologies they claimed to use, or scenario questions directly tied to their listed past experiences.
        """
    elif focus == "domain":
        focus_instruction = """
        CRITICAL INSTRUCTION: Focus your questions on the general DOMAIN and INDUSTRY KNOWLEDGE for the target role. 
        Ask fundamental concepts, best practices, system design, or theoretical questions that any qualified person in this field should know, tailored to the difficulty level. 
        You do not need to refer heavily to the specific projects on their resume, though you should still ensure they fit the overall context of the applicant.
        """
    else:  # balanced
        focus_instruction = """
        Provide a balanced mix of conceptual domain questions and specific questions derived from the projects and experiences found in the resume.
        """

    prompt = f"""
    You are an expert technical interviewer hiring for a {role} role.
    The difficulty level of the interview is {difficulty}.
    
    {focus_instruction}

    Here is the candidate's resume:
    <resume>
    {resume_text}
    </resume>

    Please generate exactly {count} tailored interview questions.
    Return ONLY a valid JSON array of strings containing the questions. Do not include any other text or code block markers.
    """

    try:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1000,
            temperature=0.7,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        content = response.content[0].text.strip()
        # Clean up in case the LLM wrapped it in markdown code blocks
        if content.startswith("```json"):
            content = content[7:-3]
        elif content.startswith("```"):
            content = content[3:-3]
            
        questions = json.loads(content)
        if isinstance(questions, list):
            return questions
        return [str(q) for q in questions]
    except Exception as e:
        print(f"Failed to generate questions via Anthropic: {e}")
        return student_fallback_questions[:count]
