import type { DashboardView } from '../App'
import AnalysisView from './AnalysisView'
import SettingsView from './SettingsView'
import SupportView from './SupportView'
import ResultsView from './ResultsView'

interface Props {
  view: DashboardView
  selectedAnalysisId: string | null
  onViewChange: (v: DashboardView) => void
  onShowResults: (id: string) => void
  onBackToAnalysis: () => void
}

const navItems: { id: DashboardView; label: string; icon: React.ReactNode }[] = [
  {
    id: 'analysis',
    label: 'Análisis de Cacao',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <ellipse cx="9" cy="10" rx="4.5" ry="5.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 4.5 C9 4.5 7.5 2.5 9 1.5 C10.5 2.5 9 4.5 9 4.5Z" fill="currentColor" />
        <line x1="9" y1="4.5" x2="9" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="6" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Configuración de Usuario',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 15c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'support',
    label: 'Soporte / Contacto',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 10.5V9a2 2 0 10-2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9" cy="13" r="0.75" fill="currentColor" />
      </svg>
    ),
  },
]

export default function DashboardLayout({ view, selectedAnalysisId, onViewChange, onShowResults, onBackToAnalysis }: Props) {
  const activeNav = view === 'results' ? 'analysis' : view

  return (
    <div className="flex h-screen bg-stone-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-cacao-800 flex flex-col" style={{ boxShadow: '2px 0 12px rgba(26,14,3,0.2)' }}>
        {/* Brand */}
        <div className="px-5 py-5 border-b border-cacao-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cacao-600 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <ellipse cx="9" cy="10.5" rx="4" ry="5" fill="#c0844a" />
                <path d="M9 5.5 C9 5.5 7.5 3.5 9 2.5 C10.5 3.5 9 5.5 9 5.5Z" fill="#6d9f48" />
                <line x1="9" y1="5.5" x2="9" y2="9.5" stroke="#4d7a2e" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-cacao-50 tracking-tight">Cacao Analysis</div>
              <div className="text-xs text-cacao-400">IA Agrícola</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left ${
                activeNav === item.id
                  ? 'bg-cacao-600 text-cacao-50 shadow-sm'
                  : 'text-cacao-300 hover:bg-cacao-700/60 hover:text-cacao-100'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="leading-snug">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User badge */}
        <div className="px-4 py-4 border-t border-cacao-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-cacao-500 flex items-center justify-center text-xs font-bold text-cacao-50">
              JR
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-cacao-100 truncate">Jorge Ramírez</div>
              <div className="text-xs text-cacao-500 truncate">Agrónomo Senior</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {view === 'analysis' && <AnalysisView onShowResults={onShowResults} />}
        {view === 'settings' && <SettingsView />}
        {view === 'support' && <SupportView />}
        {view === 'results' && (
          <ResultsView
            analysisId={selectedAnalysisId ?? ''}
            onBack={onBackToAnalysis}
          />
        )}
      </main>
    </div>
  )
}
