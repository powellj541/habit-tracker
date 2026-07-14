import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext';
import { getCurrentWeekDays, dateKey, today, isHabitScheduled, getWeekKey } from '../utils/dateHelpers';

const todayKey = today();

function DayRing({ done, total, label, dateStr, isToday }) {
  const pct = total ? done / total : 0;
  const r = 28, circ = 2 * Math.PI * r;
  const dash = pct * circ;
  return (
    <div className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition ${isToday ? 'bg-cyan-500/10 ring-1 ring-cyan-500/40' : 'bg-[#1e293b]'}`}>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="relative w-16 h-16">
        <svg width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#334155" strokeWidth="6" />
          <circle cx="32" cy="32" r={r} fill="none" stroke={isToday ? '#06b6d4' : '#8b5cf6'}
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            strokeDashoffset={circ / 4}
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
          {total ? `${done}/${total}` : '—'}
        </div>
      </div>
      <div className="text-[10px] text-slate-500">{dateStr}</div>
    </div>
  );
}

function TaskList({ dateKey: dk }) {
  const { data, addTask, toggleTask, deleteTask } = useApp();
  const [input, setInput] = useState('');
  const tasks = data.tasks[dk] || [];
  const done = tasks.filter(t => t.done).length;

  function handleAdd() {
    if (!input.trim()) return;
    addTask(dk, { id: `t${Date.now()}`, text: input.trim(), done: false });
    setInput('');
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="text-xs text-slate-400 flex-1">Tasks</div>
        <span className="text-xs text-cyan-400">{done} done</span>
        <span className="text-xs text-slate-500">/ {tasks.length - done} left</span>
      </div>
      <div className="space-y-1 max-h-32 overflow-y-auto mb-2">
        {tasks.map(t => (
          <div key={t.id} className="flex items-center gap-2 group">
            <button onClick={() => toggleTask(dk, t.id)}
              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition text-xs
                ${t.done ? 'bg-cyan-500 text-white' : 'bg-[#334155] hover:bg-[#475569]'}`}>
              {t.done ? '✓' : ''}
            </button>
            <span className={`text-xs flex-1 ${t.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>{t.text}</span>
            <button onClick={() => deleteTask(dk, t.id)} className="opacity-0 group-hover:opacity-100 text-red-400 text-xs">×</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Add task..."
          className="flex-1 bg-[#0f172a] text-white text-xs rounded-lg px-2 py-1.5 outline-none border border-[#334155] focus:border-cyan-500"
        />
        <button onClick={handleAdd} className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs hover:bg-cyan-500/30 transition">+</button>
      </div>
    </div>
  );
}

export default function WeeklyView() {
  const { data, toggleHabit, setWeeklyFocus, setWeeklyAffirmation, setWeeklyReward } = useApp();
  const weekStart = data.settings?.weekStart || 'sunday';
  const weekDays = getCurrentWeekDays(weekStart);
  const weekKey = weekDays[0] ? getWeekKey(weekDays[0].year, weekDays[0].month, weekDays[0].day) : '';
  const activeHabits = data.habits.filter(h => !h.archived);

  function getDayStats(dayObj) {
    const dk = dayObj.key;
    const scheduled = activeHabits.filter(h => isHabitScheduled(h, dayObj.year, dayObj.month, dayObj.day));
    const done = scheduled.filter(h => data.records[dk]?.[h.id]).length;
    return { done, total: scheduled.length, scheduled };
  }

  const focus = data.weeklyFocus?.[weekKey] || '';
  const affirmation = data.weeklyAffirmation?.[weekKey] || '';
  const reward = data.weeklyReward?.[weekKey] || '';

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-white">Weekly View</h2>
        <span className="text-slate-400 text-sm">{weekDays[0]?.key} — {weekDays[6]?.key}</span>
      </div>

      {/* Weekly intention fields */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1e293b] rounded-2xl p-4">
          <div className="text-xs text-cyan-400 font-semibold mb-2">🎯 Weekly Focus</div>
          <textarea
            value={focus}
            onChange={e => setWeeklyFocus(weekKey, e.target.value)}
            placeholder="What's your focus this week?"
            rows={3}
            className="w-full bg-[#0f172a] text-white text-sm rounded-xl px-3 py-2 outline-none border border-[#334155] focus:border-cyan-500 resize-none"
          />
        </div>
        <div className="bg-[#1e293b] rounded-2xl p-4">
          <div className="text-xs text-purple-400 font-semibold mb-2">✨ Daily Affirmation</div>
          <textarea
            value={affirmation}
            onChange={e => setWeeklyAffirmation(weekKey, e.target.value)}
            placeholder="Write a positive affirmation..."
            rows={3}
            className="w-full bg-[#0f172a] text-white text-sm rounded-xl px-3 py-2 outline-none border border-[#334155] focus:border-purple-500 resize-none"
          />
        </div>
        <div className="bg-[#1e293b] rounded-2xl p-4">
          <div className="text-xs text-amber-400 font-semibold mb-2">🏆 Weekly Reward</div>
          <textarea
            value={reward}
            onChange={e => setWeeklyReward(weekKey, e.target.value)}
            placeholder="What will you reward yourself with?"
            rows={3}
            className="w-full bg-[#0f172a] text-white text-sm rounded-xl px-3 py-2 outline-none border border-[#334155] focus:border-amber-500 resize-none"
          />
        </div>
      </div>

      {/* Day rings */}
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map(day => {
          const { done, total } = getDayStats(day);
          const isToday = day.key === todayKey;
          return (
            <DayRing key={day.key} done={done} total={total} label={day.label}
              dateStr={`${day.month+1}/${day.day}`} isToday={isToday} />
          );
        })}
      </div>

      {/* Day columns with habits + tasks */}
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map(day => {
          const dk = day.key;
          const isToday = dk === todayKey;
          const isFuture = dk > todayKey;
          const { scheduled } = getDayStats(day);

          return (
            <div key={dk} className={`bg-[#1e293b] rounded-2xl p-3 space-y-3 ${isToday ? 'ring-1 ring-cyan-500/40' : ''}`}>
              <div className={`text-xs font-semibold ${isToday ? 'text-cyan-400' : 'text-slate-400'}`}>{day.label} {day.day}</div>

              {/* Habits */}
              <div className="space-y-1">
                {scheduled.map(habit => {
                  const checked = !!data.records[dk]?.[habit.id];
                  return (
                    <button key={habit.id}
                      onClick={() => !isFuture && toggleHabit(dk, habit.id)}
                      disabled={isFuture}
                      className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-xs transition
                        ${checked ? 'bg-cyan-500/20 text-cyan-300' : 'bg-[#0f172a] text-slate-400 hover:bg-[#334155]'}
                        ${isFuture ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <span className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 text-[10px]
                        ${checked ? 'bg-cyan-500 text-white' : 'bg-[#334155]'}`}>
                        {checked ? '✓' : ''}
                      </span>
                      <span>{habit.emoji}</span>
                      <span className="truncate">{habit.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tasks */}
              <div className="border-t border-[#334155] pt-2">
                <TaskList dateKey={dk} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
