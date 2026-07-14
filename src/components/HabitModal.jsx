import { useState, useEffect } from 'react';
import { EMOJIS, CATEGORIES, CATEGORY_COLORS } from '../utils/storage';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HabitModal({ habit, onSave, onClose }) {
  const [name, setName] = useState(habit?.name || '');
  const [emoji, setEmoji] = useState(habit?.emoji || '⭐');
  const [category, setCategory] = useState(habit?.category || 'Health');
  const [frequency, setFrequency] = useState(habit?.frequency || 'daily');
  const [customDays, setCustomDays] = useState(
    Array.isArray(habit?.frequency) ? habit.frequency : []
  );
  const [showEmoji, setShowEmoji] = useState(false);

  const freqValue = frequency === 'custom' ? customDays : frequency;

  function handleSave() {
    if (!name.trim()) return;
    onSave({
      id: habit?.id || `h${Date.now()}`,
      name: name.trim(),
      emoji,
      category,
      color: CATEGORY_COLORS[category],
      frequency: freqValue,
      archived: habit?.archived || false,
      order: habit?.order ?? 999,
    });
  }

  function toggleDay(d) {
    setCustomDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-[#1e293b] rounded-2xl p-6 w-full max-w-md shadow-2xl fade-in" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-5">{habit ? 'Edit Habit' : 'Add Habit'}</h2>

        {/* Emoji + Name */}
        <div className="flex gap-3 mb-4">
          <div className="relative">
            <button
              onClick={() => setShowEmoji(p => !p)}
              className="w-12 h-12 text-2xl bg-[#0f172a] rounded-xl flex items-center justify-center hover:bg-[#334155] transition"
            >{emoji}</button>
            {showEmoji && (
              <div className="absolute top-14 left-0 bg-[#0f172a] border border-[#334155] rounded-xl p-3 z-10 w-64 grid grid-cols-7 gap-1 shadow-xl fade-in">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => { setEmoji(e); setShowEmoji(false); }}
                    className="text-xl hover:bg-[#1e293b] rounded-lg p-1 transition">{e}</button>
                ))}
              </div>
            )}
          </div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Habit name..."
            className="flex-1 bg-[#0f172a] text-white rounded-xl px-4 py-2 outline-none border border-[#334155] focus:border-cyan-500 transition"
          />
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="text-sm text-slate-400 mb-2 block">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${category === c ? 'bg-cyan-500 text-white' : 'bg-[#0f172a] text-slate-300 hover:bg-[#334155]'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div className="mb-6">
          <label className="text-sm text-slate-400 mb-2 block">Frequency</label>
          <div className="flex gap-2 mb-3">
            {['daily', 'weekdays', 'custom'].map(f => (
              <button key={f} onClick={() => setFrequency(f)}
                className={`px-3 py-1 rounded-lg text-sm capitalize transition ${frequency === f ? 'bg-cyan-500 text-white' : 'bg-[#0f172a] text-slate-300 hover:bg-[#334155]'}`}>
                {f}
              </button>
            ))}
          </div>
          {frequency === 'custom' && (
            <div className="flex gap-2">
              {DAYS.map((d, i) => (
                <button key={d} onClick={() => toggleDay(i)}
                  className={`w-9 h-9 rounded-lg text-xs font-medium transition ${customDays.includes(i) ? 'bg-cyan-500 text-white' : 'bg-[#0f172a] text-slate-400 hover:bg-[#334155]'}`}>
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl bg-[#0f172a] text-slate-300 hover:bg-[#334155] transition">Cancel</button>
          <button onClick={handleSave} className="flex-1 py-2 rounded-xl bg-cyan-500 text-white font-semibold hover:bg-cyan-400 transition">Save</button>
        </div>
      </div>
    </div>
  );
}
