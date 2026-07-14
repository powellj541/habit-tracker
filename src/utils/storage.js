const KEY = 'habitTracker_v1';

export function loadData() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveData(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function exportJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `habit-tracker-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importJSON(file, onSuccess, onError) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      onSuccess(data);
    } catch { onError('Invalid JSON file'); }
  };
  reader.readAsText(file);
}

export const DEFAULT_HABITS = [
  { id: 'h1', name: 'Wake up at 05:00', emoji: '⏰', category: 'Health', color: '#06b6d4', frequency: 'daily', archived: false, order: 0 },
  { id: 'h2', name: 'Gym', emoji: '💪', category: 'Health', color: '#10b981', frequency: 'daily', archived: false, order: 1 },
  { id: 'h3', name: 'Reading / Learning', emoji: '📚', category: 'Mindset', color: '#8b5cf6', frequency: 'daily', archived: false, order: 2 },
  { id: 'h4', name: 'Day Planning', emoji: '📋', category: 'Work', color: '#f59e0b', frequency: 'daily', archived: false, order: 3 },
  { id: 'h5', name: 'No Alcohol', emoji: '🚫', category: 'Health', color: '#ef4444', frequency: 'daily', archived: false, order: 4 },
  { id: 'h6', name: 'Cold Shower', emoji: '🚿', category: 'Health', color: '#0ea5e9', frequency: 'daily', archived: false, order: 5 },
  { id: 'h7', name: '10k Steps', emoji: '🚶', category: 'Health', color: '#22c55e', frequency: 'daily', archived: false, order: 6 },
  { id: 'h8', name: 'Journaling', emoji: '✍️', category: 'Mindset', color: '#ec4899', frequency: 'daily', archived: false, order: 7 },
  { id: 'h9', name: 'Project Work', emoji: '💻', category: 'Work', color: '#f97316', frequency: 'daily', archived: false, order: 8 },
  { id: 'h10', name: 'Meditation', emoji: '🧘', category: 'Mindset', color: '#a78bfa', frequency: 'daily', archived: false, order: 9 },
];

export const CATEGORIES = ['Health', 'Mindset', 'Work', 'Social', 'Other'];
export const CATEGORY_COLORS = {
  Health: '#06b6d4', Mindset: '#8b5cf6', Work: '#f59e0b', Social: '#ec4899', Other: '#94a3b8',
};

export const EMOJIS = ['⏰','💪','📚','📋','🚫','🚿','🚶','✍️','💻','🧘','🏃','🥗','💊','🧹','🎯','📖','🎵','🎨','🌅','💧','🍎','🛏️','🤸','🧠','💡','🌿','🏋️','🎸','🏊','🚴'];

export function createDefaultData() {
  return {
    habits: DEFAULT_HABITS,
    records: {},      // { 'YYYY-MM-DD': { habitId: true/false } }
    mood: {},         // { 'YYYY-MM-DD': 1-10 }
    sleep: {},        // { 'YYYY-MM-DD': hours }
    weeklyFocus: {},  // { 'YYYY-Www': string }
    weeklyAffirmation: {}, // { 'YYYY-Www': string }
    weeklyReward: {},
    tasks: {},        // { 'YYYY-MM-DD': [{id, text, done}] }
    settings: {
      userName: 'Joseph',
      weekStart: 'sunday',
      reminderTime: '08:00',
    },
  };
}
