import { useState, useRef, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { getDaysInMonth, dateKey, today, getWeekNumber, isHabitScheduled, computeStreak, MONTH_NAMES } from '../utils/dateHelpers';
import HabitModal from './HabitModal';

const MOOD_EMOJIS = ['😭','😢','😞','😕','😐','🙂','😊','😄','🤩','🥳'];
const todayKey = today();

/* ---------- Quick check-in: today's habits as big tap targets ---------- */
function QuickCheckIn({ habits, records, onToggle }) {
  const now = new Date();
  const scheduled = habits.filter(h => isHabitScheduled(h, now.getFullYear(), now.getMonth(), now.getDate()));
  const done = scheduled.filter(h => records[todayKey]?.[h.id]).length;
  const pct = scheduled.length ? Math.round((done / scheduled.length) * 100) : 0;

  if (!scheduled.length) return null;

  return (
    <div className="mx-4 mt-4 bg-[#1e293b] rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm font-semibold text-white">Today's Check-in</span>
        <div className="flex-1 bg-[#0f172a] rounded-full h-2 max-w-48">
          <div className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: pct === 100 ? '#10b981' : '#06b6d4' }} />
        </div>
        <span className={`text-sm font-bold ${pct === 100 ? 'text-emerald-400' : 'text-cyan-400'}`}>
          {done}/{scheduled.length}{pct === 100 ? ' 🎉' : ''}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {scheduled.map(h => {
          const checked = !!records[todayKey]?.[h.id];
          return (
            <button key={h.id}
              onClick={() => onToggle(todayKey, h.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                ${checked ? 'text-white scale-[0.98]' : 'bg-[#0f172a] text-slate-300 hover:bg-[#334155] hover:scale-[1.02]'}`}
              style={checked ? { background: h.color } : {}}
            >
              <span className="text-lg">{h.emoji}</span>
              <span>{h.name}</span>
              {checked && <span className="check-pop">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function MonthlyView() {
  const { data, currentYear, currentMonth, setCurrentYear, setCurrentMonth,
    toggleHabit, setMood, setSleep, addHabit, editHabit, deleteHabit, reorderHabits } = useApp();

  const [modal, setModal] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [hideFuture, setHideFuture] = useState(true);
  const [focusCell, setFocusCell] = useState(null); // { row, col } into activeHabits x visibleDays
  const scrollRef = useRef(null);
  const todayColRef = useRef(null);
  const gridRef = useRef(null);

  const activeHabits = data.habits.filter(h => !h.archived).sort((a, b) => a.order - b.order);
  const daysCount = getDaysInMonth(currentYear, currentMonth);

  const now = new Date();
  const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth();
  const allDays = Array.from({ length: daysCount }, (_, i) => i + 1);
  const visibleDays = (hideFuture && isCurrentMonth) ? allDays.filter(d => d <= now.getDate()) : allDays;

  // Week grouping over visible days
  const weeks = [];
  let wk = [];
  visibleDays.forEach(d => {
    const wn = getWeekNumber(currentYear, currentMonth, d);
    if (wk.length && getWeekNumber(currentYear, currentMonth, wk[0]) !== wn) {
      weeks.push(wk); wk = [];
    }
    wk.push(d);
  });
  if (wk.length) weeks.push(wk);

  // Auto-scroll today's column into view on mount / month change
  useEffect(() => {
    if (todayColRef.current) {
      todayColRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [currentMonth, currentYear, hideFuture]);

  function checkAllDoneToday() {
    const scheduled = activeHabits.filter(h => isHabitScheduled(h, now.getFullYear(), now.getMonth(), now.getDate()));
    return scheduled.length > 0 && scheduled.every(h => data.records[todayKey]?.[h.id]);
  }

  const handleToggle = useCallback((dk, habitId) => {
    const wasChecked = !!data.records[dk]?.[habitId];
    toggleHabit(dk, habitId);
    if (dk === todayKey && !wasChecked) {
      const scheduled = activeHabits.filter(h => isHabitScheduled(h, now.getFullYear(), now.getMonth(), now.getDate()));
      const doneAfter = scheduled.filter(h => h.id === habitId || data.records[todayKey]?.[h.id]).length;
      if (scheduled.length > 0 && doneAfter === scheduled.length) {
        confetti({ particleCount: 140, spread: 90, origin: { y: 0.5 }, colors: ['#06b6d4','#8b5cf6','#f59e0b','#10b981'] });
      }
    }
  }, [data.records, activeHabits, toggleHabit]);

  // Keyboard navigation: arrows move, Space toggles
  function handleGridKeyDown(e) {
    if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) return;
    e.preventDefault();
    const rows = activeHabits.length;
    const cols = visibleDays.length;
    if (!rows || !cols) return;

    let { row, col } = focusCell ?? {
      row: 0,
      col: isCurrentMonth ? visibleDays.indexOf(now.getDate()) : cols - 1,
    };
    if (col < 0) col = cols - 1;

    if (e.key === 'ArrowUp') row = Math.max(0, row - 1);
    if (e.key === 'ArrowDown') row = Math.min(rows - 1, row + 1);
    if (e.key === 'ArrowLeft') col = Math.max(0, col - 1);
    if (e.key === 'ArrowRight') col = Math.min(cols - 1, col + 1);

    if (e.key === ' ') {
      const habit = activeHabits[row];
      const d = visibleDays[col];
      const dk = dateKey(currentYear, currentMonth, d);
      if (dk <= todayKey && isHabitScheduled(habit, currentYear, currentMonth, d)) {
        handleToggle(dk, habit.id);
      }
    }
    setFocusCell({ row, col });
  }

  function handleDragEnd(result) {
    if (!result.destination) return;
    const items = Array.from(activeHabits);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    const reordered = items.map((h, i) => ({ ...h, order: i }));
    const archived = data.habits.filter(h => h.archived);
    reorderHabits([...reordered, ...archived]);
  }

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  return (
    <div className="flex h-full min-h-0">
      {/* Sidebar */}
      <div className="w-56 shrink-0 bg-[#1e293b] border-r border-[#334155] flex flex-col">
        <div className="p-4 border-b border-[#334155]">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Habits</div>
          <button onClick={() => setModal('add')}
            className="w-full py-2 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-sm font-medium transition">
            + Add Habit
          </button>
        </div>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="habits">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="flex-1 overflow-y-auto p-2">
                {activeHabits.map((habit, index) => {
                  const { current } = computeStreak(habit.id, data.records, todayKey);
                  return (
                    <Draggable key={habit.id} draggableId={habit.id} index={index}>
                      {(prov, snap) => (
                        <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-1 cursor-grab group transition
                            ${snap.isDragging ? 'bg-[#334155] shadow-lg' : 'hover:bg-[#334155]/50'}`}
                          onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, habit }); }}
                        >
                          <span className="w-1.5 h-5 rounded-full shrink-0" style={{ background: habit.color }} />
                          <span className="text-lg">{habit.emoji}</span>
                          <span className="text-sm text-slate-200 flex-1 truncate">{habit.name}</span>
                          {current >= 7 && <span className="streak-fire text-base">🔥</span>}
                          <button
                            onClick={e => { e.stopPropagation(); setModal(habit); }}
                            title="Edit habit"
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-cyan-400 transition text-sm shrink-0"
                          >✏️</button>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <div className="p-3 border-t border-[#334155] text-[10px] text-slate-500 leading-relaxed">
          Click grid, then use <span className="text-slate-300">↑↓←→</span> to move and <span className="text-slate-300">Space</span> to check.
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-auto min-w-0" ref={scrollRef}>
        {/* Month selector */}
        <div className="sticky top-0 z-10 bg-[#0f172a] border-b border-[#334155] px-4 py-3 flex items-center gap-3 flex-wrap">
          <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-slate-300 flex items-center justify-center transition">‹</button>
          <span className="font-bold text-white text-lg min-w-[180px] text-center">{MONTH_NAMES[currentMonth]} {currentYear}</span>
          <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-slate-300 flex items-center justify-center transition">›</button>
          <div className="flex gap-1 ml-2 flex-wrap">
            {MONTH_NAMES.map((m, i) => (
              <button key={m} onClick={() => setCurrentMonth(i)}
                className={`px-2 py-0.5 rounded text-xs transition ${currentMonth === i ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                {m.slice(0,3)}
              </button>
            ))}
          </div>
          {isCurrentMonth && (
            <label className="ml-auto flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
              <input type="checkbox" checked={!hideFuture} onChange={e => setHideFuture(!e.target.checked)}
                className="accent-cyan-500" />
              Show future days
            </label>
          )}
        </div>

        {/* Quick check-in (only when viewing the current month) */}
        {isCurrentMonth && (
          <QuickCheckIn habits={activeHabits} records={data.records} onToggle={handleToggle} />
        )}

        {/* Grid */}
        <div className="p-4">
          <table
            ref={gridRef}
            tabIndex={0}
            onKeyDown={handleGridKeyDown}
            onBlur={() => setFocusCell(null)}
            className="w-full border-collapse text-xs outline-none focus:ring-1 focus:ring-cyan-500/30 rounded-lg"
          >
            <thead>
              <tr>
                <th className="text-left text-slate-400 font-medium px-2 py-2 w-40 sticky left-0 bg-[#0f172a]">Habit</th>
                {weeks.map((wkDays, wi) => (
                  wkDays.map((d, di) => {
                    const dk = dateKey(currentYear, currentMonth, d);
                    const isT = dk === todayKey;
                    const dow = new Date(currentYear, currentMonth, d).toLocaleDateString('en-US',{weekday:'short'}).slice(0,1);
                    return (
                      <th key={dk} ref={isT ? todayColRef : null}
                        className={`text-center font-medium pb-1 ${wi > 0 && di === 0 ? 'border-l-2 border-[#334155]' : ''}`}>
                        <div className={`text-[10px] mb-1 ${di === 0 ? 'text-cyan-400' : 'invisible'}`}>W{wi+1}</div>
                        <div className={`w-7 h-7 rounded-full mx-auto flex items-center justify-center font-bold
                          ${isT ? 'bg-cyan-500 text-white' : 'text-slate-400'}`}>
                          {d}
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5">{dow}</div>
                      </th>
                    );
                  })
                ))}
              </tr>
            </thead>
            <tbody>
              {activeHabits.map((habit, rowIdx) => (
                <tr key={habit.id} className="border-t border-[#1e293b] group">
                  <td className="sticky left-0 bg-[#0f172a] group-hover:bg-[#0f1f38] px-2 py-1">
                    <div className="flex items-center gap-2">
                      <span>{habit.emoji}</span>
                      <span className="text-slate-200 truncate">{habit.name}</span>
                    </div>
                  </td>
                  {weeks.map((wkDays, wi) =>
                    wkDays.map((d, di) => {
                      const dk = dateKey(currentYear, currentMonth, d);
                      const colIdx = visibleDays.indexOf(d);
                      const isT = dk === todayKey;
                      const isFuture = dk > todayKey;
                      const scheduled = isHabitScheduled(habit, currentYear, currentMonth, d);
                      const checked = !!data.records[dk]?.[habit.id];
                      const isFocused = focusCell && focusCell.row === rowIdx && focusCell.col === colIdx;
                      return (
                        <td key={dk} className={`text-center p-0.5 ${wi > 0 && di === 0 ? 'border-l-2 border-[#334155]' : ''} ${isT ? 'bg-cyan-500/5' : ''}`}>
                          {scheduled ? (
                            <button
                              tabIndex={-1}
                              onClick={() => { setFocusCell({ row: rowIdx, col: colIdx }); gridRef.current?.focus(); !isFuture && handleToggle(dk, habit.id); }}
                              className={`w-7 h-7 rounded-md mx-auto flex items-center justify-center transition-all
                                ${isFuture ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
                                ${checked ? 'text-white check-pop' : 'bg-[#334155] text-slate-500 hover:bg-[#475569]'}
                                ${isFocused ? 'ring-2 ring-cyan-400' : ''}
                              `}
                              style={checked ? { background: habit.color } : {}}
                            >
                              {checked ? '✓' : ''}
                            </button>
                          ) : (
                            <div className={`w-7 h-7 mx-auto flex items-center justify-center text-slate-700 rounded-md ${isFocused ? 'ring-2 ring-cyan-400/40' : ''}`}>—</div>
                          )}
                        </td>
                      );
                    })
                  )}
                </tr>
              ))}

              {/* Mood row */}
              <tr className="border-t-2 border-[#334155]">
                <td className="sticky left-0 bg-[#0f172a] px-2 py-1">
                  <div className="flex items-center gap-2">
                    <span>😊</span>
                    <span className="text-slate-400 text-xs">Mood (1-10)</span>
                  </div>
                </td>
                {weeks.map((wkDays, wi) =>
                  wkDays.map((d, di) => {
                    const dk = dateKey(currentYear, currentMonth, d);
                    const isT = dk === todayKey;
                    const isFuture = dk > todayKey;
                    const val = data.mood[dk];
                    return (
                      <td key={dk} className={`text-center p-0.5 ${wi > 0 && di === 0 ? 'border-l-2 border-[#334155]' : ''} ${isT ? 'bg-cyan-500/5' : ''}`}>
                        {isFuture ? (
                          <div className="w-7 h-7 mx-auto flex items-center justify-center text-slate-700 text-xs">—</div>
                        ) : (
                          <div className="relative group/mood">
                            <div className="w-7 h-7 mx-auto rounded-md flex items-center justify-center text-sm cursor-pointer bg-[#1e293b] hover:bg-[#334155]"
                              title={val ? MOOD_EMOJIS[val-1] : 'Set mood'}>
                              {val ? <span className="text-base">{MOOD_EMOJIS[val-1]}</span> : <span className="text-slate-600 text-xs">+</span>}
                            </div>
                            <div className="absolute top-8 left-1/2 -translate-x-1/2 hidden group-hover/mood:flex z-20 bg-[#0f172a] border border-[#334155] rounded-xl p-2 gap-1 shadow-xl">
                              {MOOD_EMOJIS.map((e, i) => (
                                <button key={i} onClick={() => setMood(dk, i+1)}
                                  className={`text-lg hover:scale-125 transition ${val === i+1 ? 'scale-125' : ''}`}>{e}</button>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })
                )}
              </tr>

              {/* Sleep row */}
              <tr className="border-t border-[#334155]">
                <td className="sticky left-0 bg-[#0f172a] px-2 py-1">
                  <div className="flex items-center gap-2">
                    <span>🛌</span>
                    <span className="text-slate-400 text-xs">Sleep (hrs)</span>
                  </div>
                </td>
                {weeks.map((wkDays, wi) =>
                  wkDays.map((d, di) => {
                    const dk = dateKey(currentYear, currentMonth, d);
                    const isT = dk === todayKey;
                    const isFuture = dk > todayKey;
                    return (
                      <td key={dk} className={`text-center p-0.5 ${wi > 0 && di === 0 ? 'border-l-2 border-[#334155]' : ''} ${isT ? 'bg-cyan-500/5' : ''}`}>
                        {isFuture ? (
                          <div className="w-7 h-7 mx-auto flex items-center justify-center text-slate-700 text-xs">—</div>
                        ) : (
                          <input
                            type="number" min="0" max="24" step="0.5"
                            value={data.sleep[dk] ?? ''}
                            onChange={e => setSleep(dk, e.target.value ? parseFloat(e.target.value) : null)}
                            className="w-8 h-7 bg-[#1e293b] text-slate-300 text-xs text-center rounded-md border-none outline-none focus:ring-1 focus:ring-cyan-500"
                            placeholder="—"
                          />
                        )}
                      </td>
                    );
                  })
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-[#1e293b] border border-[#334155] rounded-xl shadow-2xl py-1 fade-in"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button onClick={() => { setModal(contextMenu.habit); setContextMenu(null); }}
            className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-[#334155] transition">Edit</button>
          <button onClick={() => { editHabit(contextMenu.habit.id, { archived: true }); setContextMenu(null); }}
            className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:bg-[#334155] transition">Archive</button>
          <button onClick={() => { deleteHabit(contextMenu.habit.id); setContextMenu(null); }}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#334155] transition">Delete</button>
        </div>
      )}

      {modal && (
        <HabitModal
          habit={modal === 'add' ? null : modal}
          onSave={(h) => { modal === 'add' ? addHabit(h) : editHabit(h.id, h); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
