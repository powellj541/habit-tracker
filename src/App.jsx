import { AppProvider, useApp } from './context/AppContext';
import MonthlyView from './components/MonthlyView';
import StatsPanel from './components/StatsPanel';
import WeeklyView from './components/WeeklyView';
import SettingsPage from './components/SettingsPage';
import { useState } from 'react';
import './index.css';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const TABS = [
  { id: 'monthly', label: '📅 Monthly' },
  { id: 'stats', label: '📊 Stats' },
  { id: 'weekly', label: '🗓 Weekly' },
  { id: 'settings', label: '⚙️ Settings' },
];

function Layout() {
  const { data, activeTab, setActiveTab } = useApp();
  const name = data.settings?.userName || 'there';
  const [showStats, setShowStats] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f172a', color: 'white', overflow: 'hidden' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.5rem', background: '#1e293b', borderBottom: '1px solid #334155', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🔥</span>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{getGreeting()},</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2 }}>{name}</div>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '0.25rem', marginLeft: '2rem' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{
                padding: '0.375rem 1rem', borderRadius: '0.75rem', fontSize: '0.875rem',
                fontWeight: 500, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: activeTab === t.id ? '#06b6d4' : 'transparent',
                color: activeTab === t.id ? 'white' : '#94a3b8',
              }}
              onMouseEnter={e => { if (activeTab !== t.id) { e.target.style.background = '#334155'; e.target.style.color = 'white'; } }}
              onMouseLeave={e => { if (activeTab !== t.id) { e.target.style.background = 'transparent'; e.target.style.color = '#94a3b8'; } }}
            >{t.label}</button>
          ))}
        </nav>

        {activeTab === 'monthly' && (
          <button onClick={() => setShowStats(s => !s)}
            style={{
              marginLeft: 'auto', padding: '0.375rem 1rem', borderRadius: '0.75rem',
              fontSize: '0.875rem', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: showStats ? '#8b5cf6' : '#334155',
              color: 'white',
            }}>
            {showStats ? 'Hide Stats ▶' : '◀ Stats'}
          </button>
        )}
      </header>

      {/* Content */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {activeTab === 'monthly' && (
          <>
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <MonthlyView />
            </div>
            {showStats && (
              <div style={{ width: '480px', flexShrink: 0, borderLeft: '1px solid #334155', overflow: 'hidden' }}>
                <StatsPanel />
              </div>
            )}
          </>
        )}
        {activeTab === 'stats' && <div style={{ flex: 1, overflow: 'hidden' }}><StatsPanel /></div>}
        {activeTab === 'weekly' && <div style={{ flex: 1, overflow: 'hidden' }}><WeeklyView /></div>}
        {activeTab === 'settings' && <div style={{ flex: 1, overflow: 'hidden' }}><SettingsPage /></div>}
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
