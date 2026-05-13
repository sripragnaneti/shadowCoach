import io
import PyPDF2
import docx

def parse_resume_file(file_content: bytes, filename: str) -> str:
    """Parses a resume file (PDF or DOCX) and returns the text content."""
    text = ""
    try:
        if filename.lower().endswith('.pdf'):
            pdf_file = io.BytesIO(file_content)
            reader = PyPDF2.PdfReader(pdf_file)
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        elif filename.lower().endswith('.docx'):
            doc_file = io.BytesIO(file_content)
            doc = docx.Document(doc_file)
            for para in doc.paragraphs:
                text += para.text + "\n"
        elif filename.lower().endswith('.txt'):
            text = file_content.decode('utf-8')
        else:
            raise ValueError("Unsupported file format. Please upload PDF, DOCX, or TXT.")
    except Exception as e:
        raise ValueError(f"Failed to parse resume: {str(e)}")
    
    return text.strip()
