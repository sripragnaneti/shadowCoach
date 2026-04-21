import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LandingPage } from '@pages/Landing'
import { LivePage } from '@pages/Live'
import { SessionsPage } from '@pages/Sessions'
import { ReportPage } from '@pages/Report'
import { InterviewSetup } from '@pages/InterviewSetup'
import { InterviewLive } from '@pages/InterviewLive'
import './App.css'

function App(): React.ReactNode {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/practice" element={<LivePage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/report/:id" element={<ReportPage />} />
        <Route path="/interview-setup" element={<InterviewSetup />} />
        <Route path="/interview-live" element={<InterviewLive />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
