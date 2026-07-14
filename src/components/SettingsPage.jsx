import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { exportJSON, importJSON } from '../utils/storage';

export default function SettingsPage() {
  const { data, updateSettings, resetData, restoreData } = useApp();
  const [confirmReset, setConfirmReset] = useState(null); // 'month' | 'full'
  const [importMsg, setImportMsg] = useState('');
  const fileRef = useRef();

  const s = data.settings || {};

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    importJSON(file, (imported) => {
      restoreData(imported);
      setImportMsg('Data restored successfully!');
      setTimeout(() => setImportMsg(''), 3000);
    }, (err) => {
      setImportMsg(`Error: ${err}`);
    });
  }

  return (
    <div className="h-full overflow-y-auto p-6 max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-white">Settings</h2>

      {/* Profile */}
      <section className="bg-[#1e293b] rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300">Profile</h3>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Your Name</label>
          <input
            value={s.userName || ''}
            onChange={e => updateSettings({ userName: e.target.value })}
            className="bg-[#0f172a] text-white rounded-xl px-4 py-2 outline-none border border-[#334155] focus:border-cyan-500 w-full"
            placeholder="Enter your name"
          />
        </div>
      </section>

      {/* Preferences */}
      <section className="bg-[#1e293b] rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300">Preferences</h3>
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Week Start Day</label>
          <div className="flex gap-3">
            {['sunday','monday'].map(d => (
              <button key={d} onClick={() => updateSettings({ weekStart: d })}
                className={`px-4 py-2 rounded-xl text-sm capitalize transition ${s.weekStart === d ? 'bg-cyan-500 text-white' : 'bg-[#0f172a] text-slate-300 hover:bg-[#334155]'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Reminder Time (display only)</label>
          <input
            type="time"
            value={s.reminderTime || '08:00'}
            onChange={e => updateSettings({ reminderTime: e.target.value })}
            className="bg-[#0f172a] text-white rounded-xl px-4 py-2 outline-none border border-[#334155] focus:border-cyan-500"
          />
        </div>
      </section>

      {/* Data management */}
      <section className="bg-[#1e293b] rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300">Data Management</h3>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => exportJSON(data)}
            className="px-4 py-2 bg-cyan-500/10 text-cyan-400 rounded-xl text-sm hover:bg-cyan-500/20 transition">
            📤 Export JSON Backup
          </button>
          <button onClick={() => fileRef.current.click()}
            className="px-4 py-2 bg-purple-500/10 text-purple-400 rounded-xl text-sm hover:bg-purple-500/20 transition">
            📥 Import JSON
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
        {importMsg && <div className={`text-sm px-3 py-2 rounded-lg ${importMsg.startsWith('Error') ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{importMsg}</div>}
      </section>

      {/* Danger zone */}
      <section className="bg-[#1e293b] rounded-2xl p-5 space-y-4 border border-red-500/20">
        <h3 className="text-sm font-semibold text-red-400">Danger Zone</h3>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setConfirmReset('month')}
            className="px-4 py-2 bg-red-500/10 text-red-400 rounded-xl text-sm hover:bg-red-500/20 transition">
            Reset Current Month Data
          </button>
          <button onClick={() => setConfirmReset('full')}
            className="px-4 py-2 bg-red-600/10 text-red-500 rounded-xl text-sm hover:bg-red-600/20 transition">
            Full Data Wipe
          </button>
        </div>
      </section>

      {/* Archived habits */}
      {data.habits.filter(h => h.archived).length > 0 && (
        <section className="bg-[#1e293b] rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">Archived Habits</h3>
          {data.habits.filter(h => h.archived).map(h => (
            <div key={h.id} className="flex items-center gap-3 text-sm text-slate-400">
              <span>{h.emoji}</span>
              <span className="flex-1">{h.name}</span>
              <button onClick={() => { /* unarchive */ }}
                className="text-xs text-cyan-400 hover:text-cyan-300">Restore</button>
            </div>
          ))}
        </section>
      )}

      {/* Confirm dialog */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setConfirmReset(null)}>
          <div className="bg-[#1e293b] rounded-2xl p-6 w-80 shadow-2xl fade-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">Confirm Reset</h3>
            <p className="text-sm text-slate-400 mb-6">
              {confirmReset === 'month'
                ? 'This will erase all habit records, mood, and sleep data for the current month. Habits will remain.'
                : 'This will erase ALL data and restore defaults. This cannot be undone.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmReset(null)} className="flex-1 py-2 rounded-xl bg-[#0f172a] text-slate-300 hover:bg-[#334155]">Cancel</button>
              <button onClick={() => { resetData(confirmReset === 'full'); setConfirmReset(null); }}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
