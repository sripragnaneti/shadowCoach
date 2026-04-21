import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, ArrowLeft, Target, Briefcase, FileText, Play } from 'lucide-react'

export function InterviewSetup() {
  const navigate = useNavigate()
  const [role, setRole] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const handleStart = () => {
    // Generate session config
    const config = {
      role: role || 'General Professional',
      resume: resumeText || 'No resume provided',
      questionCount: 5,
      timePerQuestion: 60 // seconds
    }
    
    // Store in session storage for the live page to pick up
    sessionStorage.setItem('interview_config', JSON.stringify(config))
    navigate('/interview-live')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const reader = new FileReader()
    reader.onload = (event) => {
      setResumeText(event.target?.result as string)
      setIsUploading(false)
    }
    reader.readAsText(file) // Simple text reading for MVP
  }

  return (
    <div className="page-container setup-bg">
      <header className="main-header transparent">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={18} />
          </button>
          <h1>Interview Configuration</h1>
        </div>
      </header>

      <main className="setup-content">
        <section className="setup-hero">
          <h2>Tailor Your Experience</h2>
          <p>Provide your background to generate high-fidelity AI questions.</p>
        </section>

        <div className="setup-grid">
          <div className="setup-card">
            <div className="card-icon blue"><Briefcase size={24} /></div>
            <h3>Role & Domain</h3>
            <p>What position are you interviewing for?</p>
            <input 
              type="text" 
              placeholder="e.g. Senior Software Engineer at Google"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="setup-input"
            />
            
            <div className="domain-hints">
              <span>Software</span>
              <span>Finance</span>
              <span>Design</span>
              <span>Product Management</span>
            </div>
          </div>

          <div className="setup-card">
            <div className="card-icon red"><FileText size={24} /></div>
            <h3>Experience Context</h3>
            <p>Upload your resume or paste experience highlights.</p>
            
            <div className="upload-zone">
              <input 
                type="file" 
                id="resume-upload" 
                hidden 
                accept=".txt,.md"
                onChange={handleFileUpload}
              />
              <label htmlFor="resume-upload" className="upload-label">
                {isUploading ? (
                  <span>Extracting...</span>
                ) : resumeText ? (
                  <span className="success-text">Context Loaded ✓</span>
                ) : (
                  <>
                    <Upload size={20} />
                    <span>Upload .txt Resume</span>
                  </>
                )}
              </label>
            </div>
            
            <textarea 
              placeholder="Or paste highlights here..."
              className="setup-textarea"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          </div>
        </div>

        <div className="setup-footer">
          <button 
            className="btn btn-primary start-interview-btn"
            onClick={handleStart}
            disabled={!role && !resumeText}
          >
            <Play size={18} fill="currentColor" />
            Initialize Simulation
          </button>
          <div className="security-note">
            <Target size={14} />
            AI will generate 5 custom behavioral and technical questions based on your input.
          </div>
        </div>
      </main>

      <style>{`
        .setup-bg {
          background: #0a0a0b;
          color: white;
          min-height: 100vh;
          overflow-y: auto !important;
        }

        .transparent {
          background: transparent !important;
          border-bottom: 1px solid rgba(255,255,255,0.05) !important;
        }

        .setup-content {
          max-width: 1000px;
          margin: 4rem auto;
          padding: 0 2rem;
        }

        .setup-hero {
          text-align: center;
          margin-bottom: 4rem;
        }

        .setup-hero h2 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 1rem;
        }

        .setup-hero p {
          color: rgba(255,255,255,0.5);
          font-size: 1.1rem;
        }

        .setup-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 4rem;
        }

        .setup-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
        }

        .card-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .card-icon.blue { background: rgba(35, 131, 226, 0.1); color: var(--primary); }
        .card-icon.red { background: rgba(224, 62, 62, 0.1); color: var(--danger); }

        .setup-card h3 {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
        }

        .setup-card p {
          color: rgba(255,255,255,0.4);
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
        }

        .setup-input {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 1rem;
          color: white;
          font-size: 1rem;
          width: 100%;
          outline: none;
          transition: border-color 0.2s;
        }

        .setup-input:focus {
          border-color: var(--primary);
        }

        .domain-hints {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .domain-hints span {
          font-size: 0.75rem;
          background: rgba(255,255,255,0.05);
          padding: 0.25rem 0.75rem;
          border-radius: 100px;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
        }

        .upload-zone {
          margin-bottom: 1rem;
        }

        .upload-label {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: rgba(255,255,255,0.05);
          border: 2px dashed rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .upload-label:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.2);
        }

        .success-text {
          color: var(--success);
          font-weight: 600;
        }

        .setup-textarea {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 1rem;
          color: white;
          font-size: 0.9rem;
          width: 100%;
          height: 120px;
          outline: none;
          resize: none;
        }

        .setup-footer {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .start-interview-btn {
          width: auto !important;
          padding: 1rem 3rem !important;
          font-size: 1.1rem !important;
          font-weight: 700 !important;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .security-note {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.3);
        }
      `}</style>
    </div>
  )
}
