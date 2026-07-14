export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

export function today() {
  const d = new Date();
  return dateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

export function getWeekNumber(year, month, day) {
  const d = new Date(year, month, day);
  const firstDay = new Date(year, month, 1).getDay();
  return Math.ceil((day + firstDay) / 7);
}

export function getWeekKey(year, month, day) {
  const d = new Date(year, month, day);
  const startOfYear = new Date(year, 0, 1);
  const weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

export function getCurrentWeekDays(weekStart = 'sunday') {
  const now = new Date();
  const day = now.getDay();
  const startOffset = weekStart === 'monday' ? (day === 0 ? -6 : 1 - day) : -day;
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + startOffset + i);
    days.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
      key: dateKey(d.getFullYear(), d.getMonth(), d.getDate()),
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
    });
  }
  return days;
}

export function isHabitScheduled(habit, year, month, day) {
  if (habit.archived) return false;
  if (habit.frequency === 'daily') return true;
  const d = new Date(year, month, day);
  const dow = d.getDay(); // 0=Sun
  if (habit.frequency === 'weekdays') return dow >= 1 && dow <= 5;
  if (Array.isArray(habit.frequency)) return habit.frequency.includes(dow);
  return true;
}

export function computeStreak(habitId, records, today) {
  const { year: ty, month: tm, day: td } = parseKey(today);
  let current = 0;
  let longest = 0;
  let running = 0;
  const allKeys = Object.keys(records).sort();

  // current streak: go backwards from today
  let d = new Date(ty, tm, td);
  while (true) {
    const k = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
    if (records[k]?.[habitId]) {
      current++;
    } else {
      break;
    }
    d.setDate(d.getDate() - 1);
    if (current > 500) break; // safety
  }

  // longest streak
  for (const k of allKeys) {
    if (records[k]?.[habitId]) {
      running++;
      if (running > longest) longest = running;
    } else {
      running = 0;
    }
  }

  return { current, longest };
}

export const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
