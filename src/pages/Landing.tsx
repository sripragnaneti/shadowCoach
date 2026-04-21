import { useNavigate } from 'react-router-dom'
import { Mic, UserCheck, Rocket, ArrowRight, Shield } from 'lucide-react'

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="landing-container">
      <div className="landing-glow" />
      
      <header className="landing-header">
        <div className="brand">
          <div className="brand-dot pulse" />
          <h1>ShadowCoach</h1>
        </div>
        <div className="header-meta">
          <Shield size={16} />
          <span>Biometric Secure Training Environment</span>
        </div>
      </header>

      <main className="landing-main">
        <section className="hero-section">
          <div className="badge">
            <Rocket size={14} />
            <span>Next-Gen Interview Intelligence</span>
          </div>
          <h2 className="hero-title">
            Master the High-Stakes <br />
            <span>Conversation.</span>
          </h2>
          <p className="hero-subtitle">
            ShadowCoach uses real-time AI to analyze your presence, pacing, and precision. 
            Train with the same tech used by elite communicators.
          </p>
        </section>

        <section className="options-grid">
          <div className="option-card group red" onClick={() => navigate('/practice')}>
            <div className="card-flare" />
            <div className="icon-wrapper">
              <Mic size={32} />
            </div>
            <h3>Free-Form Practice</h3>
            <p>
              Open-ended recording with live analysis. Perfect for rehearsing 
              elevator pitches, presentations, or general speech patterns.
            </p>
            <div className="card-footer">
              <span className="cta">Start Studio</span>
              <ArrowRight size={18} className="arrow" />
            </div>
          </div>

          <div className="option-card group blue" onClick={() => navigate('/interview-setup')}>
            <div className="card-flare" />
            <div className="icon-wrapper">
              <UserCheck size={32} />
            </div>
            <h3>Guided Interview</h3>
            <p>
              AI-simulated interviews tailored to your resume and industry. 
              Get challenged with contextual questions in a timed environment.
            </p>
            <div className="card-footer">
              <span className="cta">Launch Simulation</span>
              <ArrowRight size={18} className="arrow" />
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>© 2024 ShadowCoach Intelligence • Professional Grade Interactive Analytics</p>
      </footer>

      <style>{`
        .landing-container {
          width: 100%;
          height: 100vh;
          background: #050505;
          color: white;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 2rem 4rem;
        }

        .landing-glow {
          position: absolute;
          top: -20%;
          left: 10%;
          width: 80%;
          height: 100%;
          background: radial-gradient(circle at 50% 50%, rgba(35, 131, 226, 0.15) 0%, transparent 60%);
          pointer-events: none;
        }

        .landing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6rem;
          z-index: 10;
        }

        .header-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .hero-section {
          max-width: 800px;
          margin-bottom: 5rem;
          z-index: 10;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 0.5rem 1rem;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--primary);
          margin-bottom: 2rem;
        }

        .hero-title {
          font-size: 5rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          letter-spacing: -0.02em;
        }

        .hero-title span {
          background: linear-gradient(90deg, #2383e2 0%, #0f7b6c 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 1.15rem;
          color: rgba(255,255,255,0.6);
          max-width: 500px;
          line-height: 1.6;
        }

        .options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          max-width: 1100px;
          z-index: 10;
        }

        .option-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 3rem;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .card-flare {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .option-card:hover {
          background: rgba(255,255,255,0.05);
          transform: translateY(-8px);
          border-color: rgba(255,255,255,0.15);
        }

        .option-card:hover .card-flare {
          opacity: 1;
        }

        .icon-wrapper {
          width: 64px;
          height: 64px;
          background: rgba(255,255,255,0.05);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
          color: white;
          transition: transform 0.3s ease;
        }

        .option-card:hover .icon-wrapper {
          transform: scale(1.1) rotate(-5deg);
        }

        .option-card.blue .icon-wrapper { color: #2383e2; }
        .option-card.red .icon-wrapper { color: #ef4444; }

        .option-card h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .option-card p {
          color: rgba(255,255,255,0.5);
          line-height: 1.5;
          margin-bottom: 3rem;
          font-size: 0.95rem;
        }

        .card-footer {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
          font-weight: 600;
        }

        .cta {
          font-size: 0.9rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .arrow {
          transition: transform 0.3s ease;
        }

        .option-card:hover .arrow {
          transform: translateX(5px);
        }

        .landing-footer {
          margin-top: auto;
          color: rgba(255,255,255,0.3);
          font-size: 0.8rem;
        }

        .brand-dot.pulse {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(35, 131, 226, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(35, 131, 226, 0); }
          100% { box-shadow: 0 0 0 0 rgba(35, 131, 226, 0); }
        }
      `}</style>
    </div>
  )
}
