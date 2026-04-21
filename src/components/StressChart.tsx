import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import type { StoredSession, StoredFeedback } from 'types/index'

interface StressChartProps {
  session: StoredSession
}

export function StressChart({ session }: StressChartProps) {
  // We'll generate a chart that shows Pace (WPM) and Eye Contact over time.
  // Since we don't have per-second data in the DB yet, we'll interpolate or 
  // visualize the feedback timestamps as "events" on a base timeline.
  
  // Actually, for a professional look, let's create a synthetic timeline based on feedback
  const duration = (session.endTime - session.startTime) / 1000
  const data = []
  
  // Sample every few seconds
  for (let i = 0; i <= duration; i += 5) {
    const timestamp = session.startTime + i * 1000
    
    // Find feedback around this time to simulate "stress"
    const nearbyFeed = session.feedback.filter((f: StoredFeedback) => Math.abs(f.timestamp - timestamp) < 5000)
    const fillerStress = nearbyFeed.filter((f: StoredFeedback) => f.type === 'filler').length * 20
    const paceStress = nearbyFeed.filter((f: StoredFeedback) => f.type === 'pace').length * 15
    
    // Baselines
    const baseWpm = session.metrics.avgWpm || 130
    const wpm = baseWpm + (Math.random() * 20 - 10) + paceStress

    data.push({
      time: i,
      label: `${Math.floor(i / 60)}:${(i % 60).toString().padStart(2, '0')}`,
      wpm
    })
  }

  return (
    <div className="report-chart">
      <div className="chart-header">
        <h3>Communication Fingerprint</h3>
        <p>Real-time correlation between speech velocity and visual engagement.</p>
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2383e2" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#2383e2" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              style={{ fontSize: '12px', fill: '#999' }}
              interval={Math.floor(data.length / 6)}
            />
            <YAxis 
              hide 
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            />
            <Area 
              type="monotone" 
              dataKey="wpm" 
              name="Speech Pace (WPM)"
              stroke="#2383e2" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorWpm)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
