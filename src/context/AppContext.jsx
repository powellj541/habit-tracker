import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadData, saveData, createDefaultData } from '../utils/storage';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [data, setData] = useState(() => {
    const saved = loadData();
    return saved || createDefaultData();
  });

  const [activeTab, setActiveTab] = useState('monthly');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const update = useCallback((fn) => {
    setData(prev => {
      const next = fn(structuredClone(prev));
      return next;
    });
  }, []);

  const toggleHabit = useCallback((dateKey, habitId) => {
    update(d => {
      if (!d.records[dateKey]) d.records[dateKey] = {};
      d.records[dateKey][habitId] = !d.records[dateKey][habitId];
      return d;
    });
  }, [update]);

  const setMood = useCallback((dateKey, value) => {
    update(d => { d.mood[dateKey] = value; return d; });
  }, [update]);

  const setSleep = useCallback((dateKey, value) => {
    update(d => { d.sleep[dateKey] = value; return d; });
  }, [update]);

  const addHabit = useCallback((habit) => {
    update(d => { d.habits.push(habit); return d; });
  }, [update]);

  const editHabit = useCallback((id, changes) => {
    update(d => {
      const i = d.habits.findIndex(h => h.id === id);
      if (i !== -1) d.habits[i] = { ...d.habits[i], ...changes };
      return d;
    });
  }, [update]);

  const deleteHabit = useCallback((id) => {
    update(d => {
      d.habits = d.habits.filter(h => h.id !== id);
      return d;
    });
  }, [update]);

  const reorderHabits = useCallback((habits) => {
    update(d => { d.habits = habits; return d; });
  }, [update]);

  const setWeeklyFocus = useCallback((weekKey, text) => {
    update(d => { d.weeklyFocus[weekKey] = text; return d; });
  }, [update]);

  const setWeeklyAffirmation = useCallback((weekKey, text) => {
    update(d => { d.weeklyAffirmation[weekKey] = text; return d; });
  }, [update]);

  const setWeeklyReward = useCallback((weekKey, text) => {
    update(d => { d.weeklyReward[weekKey] = text; return d; });
  }, [update]);

  const addTask = useCallback((dateKey, task) => {
    update(d => {
      if (!d.tasks[dateKey]) d.tasks[dateKey] = [];
      d.tasks[dateKey].push(task);
      return d;
    });
  }, [update]);

  const toggleTask = useCallback((dateKey, taskId) => {
    update(d => {
      const tasks = d.tasks[dateKey] || [];
      const t = tasks.find(x => x.id === taskId);
      if (t) t.done = !t.done;
      return d;
    });
  }, [update]);

  const deleteTask = useCallback((dateKey, taskId) => {
    update(d => {
      if (d.tasks[dateKey]) d.tasks[dateKey] = d.tasks[dateKey].filter(t => t.id !== taskId);
      return d;
    });
  }, [update]);

  const updateSettings = useCallback((changes) => {
    update(d => { d.settings = { ...d.settings, ...changes }; return d; });
  }, [update]);

  const resetData = useCallback((full = false) => {
    if (full) {
      setData(createDefaultData());
    } else {
      update(d => {
        const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        for (const k of Object.keys(d.records)) {
          if (k.startsWith(prefix)) delete d.records[k];
        }
        for (const k of Object.keys(d.mood)) {
          if (k.startsWith(prefix)) delete d.mood[k];
        }
        for (const k of Object.keys(d.sleep)) {
          if (k.startsWith(prefix)) delete d.sleep[k];
        }
        return d;
      });
    }
  }, [update, currentYear, currentMonth]);

  const restoreData = useCallback((imported) => {
    setData(imported);
  }, []);

  return (
    <AppContext.Provider value={{
      data, activeTab, setActiveTab,
      currentYear, setCurrentYear,
      currentMonth, setCurrentMonth,
      toggleHabit, setMood, setSleep,
      addHabit, editHabit, deleteHabit, reorderHabits,
      setWeeklyFocus, setWeeklyAffirmation, setWeeklyReward,
      addTask, toggleTask, deleteTask,
      updateSettings, resetData, restoreData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
