import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { getDaysInMonth, dateKey, today, isHabitScheduled, computeStreak, MONTH_NAMES } from '../utils/dateHelpers';

const todayKey = today();
const COLORS = ['#06b6d4', '#334155', '#8b5cf6'];

/* GitHub-style year heatmap for one habit (or all habits combined) */
function YearHeatmap({ year, habits, records }) {
  const [selected, setSelected] = useState('all');
  const habit = habits.find(h => h.id === selected);

  // Build day cells for the whole year
  const start = new Date(year, 0, 1);
  const cells = [];
  const d = new Date(start);
  while (d.getFullYear() === year) {
    const dk = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
    let level = 0;
    if (dk <= todayKey) {
      if (habit) {
        level = records[dk]?.[habit.id] ? 4 : (isHabitScheduled(habit, d.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
      } else {
        const scheduled = habits.filter(h => isHabitScheduled(h, d.getFullYear(), d.getMonth(), d.getDate()));
        const done = scheduled.filter(h => records[dk]?.[h.id]).length;
        const pct = scheduled.length ? done / scheduled.length : 0;
        level = pct === 0 ? 1 : pct < 0.34 ? 2 : pct < 0.67 ? 3 : pct < 1 ? 4 : 5;
        if (scheduled.length === 0) level = 0;
      }
    }
    cells.push({ dk, dow: d.getDay(), level, month: d.getMonth(), date: d.getDate(), future: dk > todayKey });
    d.setDate(d.getDate() + 1);
  }

  // Group into columns (weeks), Sunday-start
  const columns = [];
  let col = new Array(cells[0].dow).fill(null);
  for (const c of cells) {
    col.push(c);
    if (c.dow === 6) { columns.push(col); col = []; }
  }
  if (col.length) columns.push(col);

  const shades = habit
    ? ['#1e293b', '#1e293b', '', '', habit.color]
    : ['#1e293b', '#1e293b', '#164e63', '#0e7490', '#06b6d4', '#22d3ee'];

  function cellColor(c) {
    if (!c || c.future) return '#16213a';
    if (habit) return c.level === 4 ? habit.color : '#1e293b';
    return shades[c.level];
  }

  // Month labels: index of first column containing day 1 of each month
  const monthLabels = [];
  columns.forEach((colCells, ci) => {
    const firstReal = colCells.find(Boolean);
    if (firstReal && firstReal.date <= 7 && !monthLabels.some(m => m.month === firstReal.month)) {
      monthLabels.push({ month: firstReal.month, col: ci });
    }
  });

  return (
    <div className="bg-[#1e293b] rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <div className="text-sm font-semibold text-slate-300">Year Heatmap — {year}</div>
        <select value={selected} onChange={e => setSelected(e.target.value)}
          className="ml-auto bg-[#0f172a] text-slate-300 text-xs rounded-lg px-2 py-1 border border-[#334155] outline-none">
          <option value="all">All habits (completion %)</option>
          {habits.map(h => <option key={h.id} value={h.id}>{h.emoji} {h.name}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="relative" style={{ width: columns.length * 13 }}>
          <div className="flex h-4 text-[9px] text-slate-500">
            {monthLabels.map(m => (
              <span key={m.month} className="absolute" style={{ left: m.col * 13 }}>{MONTH_NAMES[m.month].slice(0,3)}</span>
            ))}
          </div>
          <div className="flex gap-[3px] mt-1">
            {columns.map((colCells, ci) => (
              <div key={ci} className="flex flex-col gap-[3px]">
                {Array.from({ length: 7 }, (_, ri) => {
                  const c = colCells[ri];
                  return (
                    <div key={ri} title={c ? `${c.dk}` : ''}
                      className="w-[10px] h-[10px] rounded-[2px]"
                      style={{ background: c ? cellColor(c) : 'transparent' }} />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500">
        <span>Less</span>
        {(habit ? ['#1e293b', habit.color] : shades.slice(1)).map((s, i) => (
          <div key={i} className="w-[10px] h-[10px] rounded-[2px]" style={{ background: s }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

export default function StatsPanel() {
  const { data, currentYear, currentMonth } = useApp();
  const daysCount = getDaysInMonth(currentYear, currentMonth);
  const activeHabits = data.habits.filter(h => !h.archived);
  const now = new Date();
  const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth();
  const daysElapsed = isCurrentMonth ? now.getDate() : daysCount;

  // Daily progress
  const dailyData = [];
  for (let d = 1; d <= daysCount; d++) {
    const dk = dateKey(currentYear, currentMonth, d);
    if (dk > todayKey) break;
    const scheduled = activeHabits.filter(h => isHabitScheduled(h, currentYear, currentMonth, d));
    const done = scheduled.filter(h => data.records[dk]?.[h.id]).length;
    const pct = scheduled.length ? Math.round((done / scheduled.length) * 100) : 0;
    dailyData.push({ day: d, pct });
  }

  // Weekly progress
  const weeklyMap = {};
  for (let d = 1; d <= daysCount; d++) {
    const dk = dateKey(currentYear, currentMonth, d);
    if (dk > todayKey) break;
    const dow = new Date(currentYear, currentMonth, d).getDay();
    const wk = Math.ceil((d + new Date(currentYear, currentMonth, 1).getDay()) / 7);
    if (!weeklyMap[wk]) weeklyMap[wk] = { total: 0, done: 0 };
    const scheduled = activeHabits.filter(h => isHabitScheduled(h, currentYear, currentMonth, d));
    weeklyMap[wk].total += scheduled.length;
    weeklyMap[wk].done += scheduled.filter(h => data.records[dk]?.[h.id]).length;
  }
  const weeklyData = Object.entries(weeklyMap).map(([wk, v]) => ({
    week: `W${wk}`,
    pct: v.total ? Math.round((v.done / v.total) * 100) : 0,
  }));

  // Overall donut
  let totalGoal = 0, totalDone = 0;
  for (let d = 1; d <= daysElapsed; d++) {
    const dk = dateKey(currentYear, currentMonth, d);
    const scheduled = activeHabits.filter(h => isHabitScheduled(h, currentYear, currentMonth, d));
    totalGoal += scheduled.length;
    totalDone += scheduled.filter(h => data.records[dk]?.[h.id]).length;
  }
  const totalLeft = totalGoal - totalDone;
  const donutData = [
    { name: 'Completed', value: totalDone },
    { name: 'Remaining', value: Math.max(0, totalLeft) },
  ];

  // Per-habit table
  const habitStats = activeHabits.map(habit => {
    let goal = 0, actual = 0;
    for (let d = 1; d <= daysElapsed; d++) {
      const dk = dateKey(currentYear, currentMonth, d);
      if (isHabitScheduled(habit, currentYear, currentMonth, d)) {
        goal++;
        if (data.records[dk]?.[habit.id]) actual++;
      }
    }
    const { current, longest } = computeStreak(habit.id, data.records, todayKey);
    return { ...habit, goal, actual, left: goal - actual, pct: goal ? Math.round((actual / goal) * 100) : 0, current, longest };
  }).sort((a, b) => b.pct - a.pct);

  // Mood & sleep averages
  const moodVals = [], sleepVals = [];
  for (let d = 1; d <= daysElapsed; d++) {
    const dk = dateKey(currentYear, currentMonth, d);
    if (data.mood[dk]) moodVals.push(data.mood[dk]);
    if (data.sleep[dk] != null) sleepVals.push(data.sleep[dk]);
  }
  const avgMood = moodVals.length ? (moodVals.reduce((a,b) => a+b,0) / moodVals.length).toFixed(1) : '—';
  const avgSleep = sleepVals.length ? (sleepVals.reduce((a,b) => a+b,0) / sleepVals.length).toFixed(1) : '—';

  // Mood / sleep / completion trend
  const trendData = dailyData.map(({ day, pct }) => {
    const dk = dateKey(currentYear, currentMonth, day);
    return {
      day,
      pct,
      mood: data.mood[dk] != null ? data.mood[dk] * 10 : null,   // scale 1-10 → 10-100
      sleep: data.sleep[dk] != null ? data.sleep[dk] * 10 : null, // scale hrs → ~0-100
      moodRaw: data.mood[dk],
      sleepRaw: data.sleep[dk],
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-sm">
        <div className="text-slate-300">{label}</div>
        <div className="text-cyan-400 font-bold">{payload[0].value}%</div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <h2 className="text-xl font-bold text-white">{MONTH_NAMES[currentMonth]} {currentYear} — Stats</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Goal', value: totalGoal, color: 'text-slate-300' },
          { label: 'Completed', value: totalDone, color: 'text-cyan-400' },
          { label: 'Remaining', value: Math.max(0, totalLeft), color: 'text-slate-400' },
          { label: 'Completion %', value: totalGoal ? `${Math.round((totalDone/totalGoal)*100)}%` : '—', color: 'text-emerald-400' },
        ].map(c => (
          <div key={c.label} className="bg-[#1e293b] rounded-2xl p-4">
            <div className="text-xs text-slate-500 mb-1">{c.label}</div>
            <div className={`text-3xl font-bold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Mood / Sleep */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1e293b] rounded-2xl p-4 flex items-center gap-4">
          <span className="text-3xl">😊</span>
          <div>
            <div className="text-xs text-slate-500">Avg Mood</div>
            <div className="text-2xl font-bold text-cyan-400">{avgMood}<span className="text-sm text-slate-400">/10</span></div>
          </div>
        </div>
        <div className="bg-[#1e293b] rounded-2xl p-4 flex items-center gap-4">
          <span className="text-3xl">🛌</span>
          <div>
            <div className="text-xs text-slate-500">Avg Sleep</div>
            <div className="text-2xl font-bold text-cyan-400">{avgSleep}<span className="text-sm text-slate-400">hrs</span></div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Daily bar */}
        <div className="col-span-2 bg-[#1e293b] rounded-2xl p-4">
          <div className="text-sm font-semibold text-slate-300 mb-3">Daily Completion %</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={dailyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0,100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pct" fill="#06b6d4" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut */}
        <div className="bg-[#1e293b] rounded-2xl p-4">
          <div className="text-sm font-semibold text-slate-300 mb-3">Overall</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" paddingAngle={3}>
                <Cell fill="#06b6d4" />
                <Cell fill="#334155" />
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center text-2xl font-bold text-cyan-400 -mt-2">
            {totalGoal ? `${Math.round((totalDone/totalGoal)*100)}%` : '—'}
          </div>
        </div>
      </div>

      {/* Weekly bar */}
      <div className="bg-[#1e293b] rounded-2xl p-4">
        <div className="text-sm font-semibold text-slate-300 mb-3">Weekly Completion %</div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={weeklyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0,100]} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="pct" fill="#8b5cf6" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Mood / sleep / completion trend */}
      <div className="bg-[#1e293b] rounded-2xl p-4">
        <div className="flex items-center gap-4 mb-3">
          <div className="text-sm font-semibold text-slate-300">Mood &amp; Sleep vs Completion</div>
          <div className="flex gap-3 text-[10px] ml-auto">
            <span className="flex items-center gap-1 text-slate-400"><span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 inline-block" /> Completion %</span>
            <span className="flex items-center gap-1 text-slate-400"><span className="w-2.5 h-0.5 bg-amber-400 inline-block" /> Mood</span>
            <span className="flex items-center gap-1 text-slate-400"><span className="w-2.5 h-0.5 bg-purple-400 inline-block" /> Sleep</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={trendData} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 100]} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0]?.payload;
                return (
                  <div className="bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs space-y-0.5">
                    <div className="text-slate-300 font-semibold">Day {label}</div>
                    <div className="text-cyan-400">Completion: {p.pct}%</div>
                    {p.moodRaw != null && <div className="text-amber-400">Mood: {p.moodRaw}/10</div>}
                    {p.sleepRaw != null && <div className="text-purple-400">Sleep: {p.sleepRaw}h</div>}
                  </div>
                );
              }}
            />
            <Bar dataKey="pct" fill="#06b6d4" fillOpacity={0.35} radius={[3,3,0,0]} />
            <Line type="monotone" dataKey="mood" stroke="#fbbf24" strokeWidth={2} dot={{ r: 2 }} connectNulls />
            <Line type="monotone" dataKey="sleep" stroke="#c084fc" strokeWidth={2} dot={{ r: 2 }} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Year heatmap */}
      <YearHeatmap year={currentYear} habits={activeHabits} records={data.records} />

      {/* Per-habit leaderboard */}
      <div className="bg-[#1e293b] rounded-2xl p-4">
        <div className="text-sm font-semibold text-slate-300 mb-3">Habit Leaderboard</div>
        <div className="space-y-3">
          {habitStats.map((h, i) => (
            <div key={h.id} className="grid grid-cols-[2rem_1fr_4rem_4rem_4rem_8rem_4rem] items-center gap-3 text-sm">
              <span className="text-slate-500 font-mono text-xs text-center">{i+1}</span>
              <div className="flex items-center gap-2 min-w-0">
                <span>{h.emoji}</span>
                <span className="text-slate-200 truncate">{h.name}</span>
                {h.current >= 7 && <span className="streak-fire">🔥</span>}
              </div>
              <span className="text-slate-400 text-center text-xs">{h.goal}</span>
              <span className="text-cyan-400 text-center text-xs font-semibold">{h.actual}</span>
              <span className="text-slate-500 text-center text-xs">{h.left}</span>
              <div className="bg-[#0f172a] rounded-full h-2">
                <div className="bg-cyan-500 h-2 rounded-full transition-all" style={{ width: `${h.pct}%` }} />
              </div>
              <span className="text-xs font-semibold text-right" style={{ color: h.pct >= 80 ? '#06b6d4' : h.pct >= 50 ? '#f59e0b' : '#ef4444' }}>{h.pct}%</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[2rem_1fr_4rem_4rem_4rem_8rem_4rem] gap-3 mt-2 text-[10px] text-slate-600 border-t border-[#334155] pt-2">
          <span/>
          <span/>
          <span className="text-center">Goal</span>
          <span className="text-center">Done</span>
          <span className="text-center">Left</span>
          <span/>
          <span className="text-right">%</span>
        </div>
      </div>

      {/* Streak table */}
      <div className="bg-[#1e293b] rounded-2xl p-4">
        <div className="text-sm font-semibold text-slate-300 mb-3">Streaks</div>
        <div className="grid grid-cols-3 gap-3">
          {habitStats.map(h => (
            <div key={h.id} className="bg-[#0f172a] rounded-xl p-3 flex items-center gap-3">
              <span className="text-xl">{h.emoji}</span>
              <div className="min-w-0">
                <div className="text-xs text-slate-400 truncate">{h.name}</div>
                <div className="flex gap-3 mt-1">
                  <span className="text-xs"><span className="text-cyan-400 font-bold">{h.current}</span> <span className="text-slate-600">cur</span></span>
                  <span className="text-xs"><span className="text-purple-400 font-bold">{h.longest}</span> <span className="text-slate-600">best</span></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
