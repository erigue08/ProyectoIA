import { useState } from 'react'
import LoginScreen from './screens/LoginScreen'
import DashboardLayout from './screens/DashboardLayout'

export type Screen = 'login' | 'dashboard'
export type DashboardView = 'analysis' | 'settings' | 'support' | 'results'

export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [dashboardView, setDashboardView] = useState<DashboardView>('analysis')
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null)

  if (screen === 'login') {
    return <LoginScreen onLogin={() => setScreen('dashboard')} />
  }

  return (
    <DashboardLayout
      view={dashboardView}
      selectedAnalysisId={selectedAnalysisId}
      onViewChange={(v) => {
        setDashboardView(v)
        if (v !== 'results') setSelectedAnalysisId(null)
      }}
      onShowResults={(id) => {
        setSelectedAnalysisId(id)
        setDashboardView('results')
      }}
      onBackToAnalysis={() => {
        setDashboardView('analysis')
        setSelectedAnalysisId(null)
      }}
    />
  )
}
