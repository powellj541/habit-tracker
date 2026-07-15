import { AppProvider, useApp } from './context/AppContext';
import MonthlyView from './components/MonthlyView';
import StatsPanel from './components/StatsPanel';
import WeeklyView from './components/WeeklyView';
import SettingsPage from './components/SettingsPage';
import JournalView from './components/JournalView';
import { useState } from 'react';
import './index.css';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const TABS = [
  { id: 'monthly', emoji: '📅', label: 'Monthly' },
  { id: 'stats', emoji: '📊', label: 'Stats' },
  { id: 'weekly', emoji: '🗓', label: 'Weekly' },
  { id: 'journal', emoji: '📓', label: 'Journal' },
  { id: 'settings', emoji: '⚙️', label: 'Settings' },
];

function Layout() {
  const { data, activeTab, setActiveTab } = useApp();
  const name = data.settings?.userName || 'there';
  const [showStats, setShowStats] = useState(false);

  return (
    <div className="flex flex-col h-dvh bg-[#0f172a] text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-3 bg-[#1e293b] border-b border-[#334155] shrink-0">
        <div className="hidden sm:flex items-center gap-3 min-w-0">
          <span className="text-2xl">🔥</span>
          <div className="min-w-0">
            <div className="text-xs text-slate-400 truncate">{getGreeting()},</div>
            <div className="text-lg font-bold leading-tight truncate">{name}</div>
          </div>
        </div>
        <span className="sm:hidden text-xl">🔥</span>

        <nav className="flex gap-1 sm:ml-6 flex-1 justify-center sm:justify-start">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-sm font-medium transition whitespace-nowrap
                ${activeTab === t.id ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white hover:bg-[#334155]'}`}>
              <span>{t.emoji}</span>
              <span className="hidden sm:inline ml-1.5">{t.label}</span>
            </button>
          ))}
        </nav>

        {activeTab === 'monthly' && (
          <button onClick={() => setShowStats(s => !s)}
            className={`hidden lg:block ml-auto px-4 py-1.5 rounded-xl text-sm transition
              ${showStats ? 'bg-purple-500 text-white' : 'bg-[#334155] text-slate-300 hover:text-white'}`}>
            {showStats ? 'Hide Stats ▶' : '◀ Stats'}
          </button>
        )}
      </header>

      {/* Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {activeTab === 'monthly' && (
          <>
            <div className="flex-1 min-w-0 overflow-hidden">
              <MonthlyView />
            </div>
            {showStats && (
              <div className="hidden lg:block w-[480px] shrink-0 border-l border-[#334155] overflow-hidden">
                <StatsPanel />
              </div>
            )}
          </>
        )}
        {activeTab === 'stats' && <div className="flex-1 min-w-0 overflow-hidden"><StatsPanel /></div>}
        {activeTab === 'weekly' && <div className="flex-1 min-w-0 overflow-hidden"><WeeklyView /></div>}
        {activeTab === 'journal' && <div className="flex-1 min-w-0 overflow-hidden"><JournalView /></div>}
        {activeTab === 'settings' && <div className="flex-1 min-w-0 overflow-hidden"><SettingsPage /></div>}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
}
