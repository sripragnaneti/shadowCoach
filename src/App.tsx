import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LivePage } from '@pages/Live'
import { SessionsPage } from '@pages/Sessions'
import { ReportPage } from '@pages/Report'
import './App.css'

function App(): React.ReactNode {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LivePage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/report/:id" element={<ReportPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
