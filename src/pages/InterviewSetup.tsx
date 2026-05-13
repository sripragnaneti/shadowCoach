import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Briefcase, FileText, Play, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

export function InterviewSetup() {
  const navigate = useNavigate()
  
  const [difficulty, setDifficulty] = useState<'standard' | 'advanced'>('standard')
  const [role, setRole] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [focus, setFocus] = useState<'balanced' | 'resume' | 'domain'>('balanced')
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setIsParsing(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_BASE}/interview/parse-resume`, {
        method: 'POST',
        body: formData,
      })
      
      if (!res.ok) {
        let message = 'Failed to parse resume. Please try a different format.'
        try {
          const err = await res.json()
          if (err?.detail) message = err.detail
        } catch {
          // Ignore JSON parse errors; fall back to default message.
        }
        throw new Error(message)
      }

      const data = await res.json()
      if (data.text) {
        setResumeText(data.text)
      } else {
        throw new Error('No text content found in resume.')
      }
    } catch (err: any) {
      console.error('Parsing failed:', err)
      setError(err.message)
      setFileName(null)
    } finally {
      setIsParsing(false)
    }
  }

  const handleStart = () => {
    const config = {
      role: role || 'General Professional',
      resume: resumeText || 'No resume provided',
      questionCount: 5,
      focus: focus,
      difficulty: difficulty
    }
    sessionStorage.setItem('interview_config', JSON.stringify(config))
    navigate('/interview-live')
  }

  return (
    <div className="page-container setup-bg">
      <header className="main-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={18} />
          Back
        </button>
        <h1>Interview Setup</h1>
      </header>

      <main className="setup-content">
        <div className="setup-card">
          {/* Step 1: Role */}
          <div className="input-group">
            <label><Briefcase size={16} /> Step 1: Target Role / Job Title</label>
            <input 
              type="text" 
              placeholder="e.g. Software Engineer, Sales Executive..."
              value={role}
              onChange={(e) => setRole(e.target.value)}
              id="role-input"
            />
          </div>

          {/* Step 2: Resume */}
          <div className="input-group">
            <label id="upload-label"><FileText size={16} /> Step 2: Upload Resume (Optional)</label>
            <div 
              className={`upload-zone ${fileName ? 'has-file' : ''} ${error ? 'has-error' : ''}`}
            >
              <input 
                type="file" 
                onChange={handleFileUpload} 
                className="hidden-file-input"
                id="resume-upload"
                accept=".pdf,.docx,.txt"
              />
              {isParsing ? (
                <div className="upload-status"><Loader2 className="spin" /> Reading document...</div>
              ) : fileName ? (
                <div className="upload-status success"><CheckCircle size={20} /> {fileName}</div>
              ) : error ? (
                <div className="upload-status error"><AlertCircle size={20} /> {error}</div>
              ) : (
                <div className="upload-placeholder">
                  <Upload size={24} />
                  <span>Select Resume (PDF/DOCX/TXT)</span>
                </div>
              )}
            </div>
            <p className="helper-text">Providing a resume helps the AI tailor questions to your experience.</p>
          </div>

          <div className="grid-2-cols">
            <div className="input-group">
              <label>Step 3: Difficulty</label>
              <div className="toggle-selector">
                {[
                  { id: 'standard', label: 'Standard', sub: 'Foundational' },
                  { id: 'advanced', label: 'Advanced', sub: 'Technical Depth' }
                ].map((opt) => (
                  <button 
                    key={opt.id}
                    className={`toggle-btn ${difficulty === opt.id ? 'active' : ''}`}
                    onClick={() => setDifficulty(opt.id as any)}
                    type="button"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>Step 4: Focus</label>
              <div className="toggle-selector">
                {[
                  { id: 'balanced', label: 'Balanced' },
                  { id: 'resume', label: 'Resume' },
                  { id: 'domain', label: 'Domain' }
                ].map((opt) => (
                    <button 
                      key={opt.id}
                      className={`toggle-btn ${focus === opt.id ? 'active' : ''}`}
                      onClick={() => setFocus(opt.id as any)}
                      disabled={(opt.id === 'resume' || opt.id === 'balanced') && !resumeText}
                      type="button"
                    >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            className="btn btn-primary start-btn"
            onClick={handleStart}
            id="proceed-button"
            disabled={(!role && !resumeText) || isParsing}
          >
            <Play size={18} fill="currentColor" />
            Proceed to Interview
          </button>
        </div>
      </main>

      <style>{`
        .setup-bg { background: #0a0a0b; min-height: 100vh; color: white; }
        .setup-content { max-width: 600px; margin: 4rem auto; padding: 0 1rem; }
        .setup-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 2.5rem; backdrop-filter: blur(20px); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        
        .input-group { margin-bottom: 2rem; }
        .input-group label { display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; color: rgba(255,255,255,0.5); margin-bottom: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
        .input-group input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1rem; color: white; width: 100%; outline: none; transition: 0.2s; font-size: 1rem; }
        .input-group input:focus { border-color: #3b82f6; background: rgba(59, 130, 246, 0.05); }
        .helper-text { font-size: 0.75rem; color: rgba(255,255,255,0.3); margin-top: 0.5rem; }

        .upload-zone { border: 2px dashed rgba(255,255,255,0.1); border-radius: 12px; padding: 2rem; text-align: center; cursor: pointer; transition: 0.3s; background: rgba(255,255,255,0.02); position: relative; }
        .upload-zone:hover { border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.05); }
        .upload-zone.has-file { border-color: #10b981; border-style: solid; background: rgba(16, 185, 129, 0.03); }
        .upload-zone.has-error { border-color: #ef4444; border-style: solid; background: rgba(239, 68, 68, 0.03); }
        
        .hidden-file-input { opacity: 0; position: absolute; inset: 0; cursor: pointer; width: 100%; height: 100%; }
        .upload-placeholder { display: flex; flex-direction: column; align-items: center; gap: 1rem; color: rgba(255,255,255,0.4); }
        .upload-status { display: flex; align-items: center; justify-content: center; gap: 0.8rem; font-weight: 600; color: #3b82f6; }

        .grid-2-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .toggle-selector { display: flex; background: rgba(255,255,255,0.05); padding: 4px; border-radius: 10px; }
        .toggle-btn { flex: 1; padding: 0.6rem; border-radius: 8px; border: none; background: transparent; color: rgba(255,255,255,0.5); cursor: pointer; font-size: 0.85rem; font-weight: 600; }
        .toggle-btn.active { background: #3b82f6; color: white; }
        .toggle-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .start-btn { width: 100%; margin-top: 2rem; padding: 1.2rem !important; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 0.8rem; }
        .start-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
