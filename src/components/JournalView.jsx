import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { dateKey, today, parseKey, MONTH_NAMES } from '../utils/dateHelpers';

const todayKey = today();

// Original daily messages — rotate by date
const MESSAGES = [
  { type: '🔥 Discipline', text: 'Nobody is coming to save you. That is not bad news — it means the power was yours the whole time.' },
  { type: '🌌 Manifestation', text: 'What you focus on expands. Spend today watering the life you want, not the one you fear.' },
  { type: '🧘 Spiritual', text: 'You are not behind. You are exactly where the lesson is. Learn it and the path moves.' },
  { type: '⚡ Alpha Energy', text: 'Discipline is choosing what you want most over what you want now. Every checkbox is a vote for the person you are becoming.' },
  { type: '🌅 Motivation', text: 'The 5am version of you and the excuse-making version of you cannot exist in the same body. Pick one.' },
  { type: '🌌 Manifestation', text: 'Speak about your goals like they are already on the way. Your mind builds what your mouth repeats.' },
  { type: '🧘 Spiritual', text: 'Silence the noise long enough to hear yourself. The answers were never out there.' },
  { type: '⚡ Alpha Energy', text: 'Standards over feelings. You do not train because you feel like it — you train because you said you would.' },
  { type: '🔥 Discipline', text: 'Hard days build the resume your easy days get hired with.' },
  { type: '🌅 Motivation', text: 'One day or day one. The streak starts whenever you decide it does.' },
  { type: '🌌 Manifestation', text: 'Gratitude is the frequency of abundance. Count what you have and watch it multiply.' },
  { type: '🧘 Spiritual', text: 'Let go of the version of you that needed everyone to understand. Peace over approval.' },
  { type: '⚡ Alpha Energy', text: 'Your energy is a currency. Stop spending it on people and problems that pay you nothing back.' },
  { type: '🔥 Discipline', text: 'Motivation gets you started. Systems keep you going. That is why you track.' },
  { type: '🌅 Motivation', text: 'Six months from now you will wish you started today. So start today.' },
  { type: '🌌 Manifestation', text: 'Visualize the finished version — then reverse-engineer the morning that builds him.' },
  { type: '🧘 Spiritual', text: 'The body keeps the score, but the spirit sets the pace. Feed both.' },
  { type: '⚡ Alpha Energy', text: 'Comfort is a slow leak. Do one hard thing before noon and the day is already won.' },
  { type: '🔥 Discipline', text: 'You do not rise to the level of your goals. You fall to the level of your habits. Raise the floor.' },
  { type: '🌅 Motivation', text: 'Small daily wins compound into a life people call luck.' },
  { type: '🌌 Manifestation', text: 'Act as if. Dress, train, plan, and speak like the man who already made it — the universe catches up to consistency.' },
  { type: '🧘 Spiritual', text: 'Every sunrise is the universe handing you a blank page. Graveyard shift? Your sunrise is whenever you wake. Write anyway.' },
  { type: '⚡ Alpha Energy', text: 'Protect the morning routine like it is your kingdom, because it is.' },
  { type: '🔥 Discipline', text: 'The streak does not care how you feel. Show up average today instead of perfect never.' },
  { type: '🌅 Motivation', text: 'You have survived 100% of your worst days. Today is not the one that beats you.' },
  { type: '🌌 Manifestation', text: 'Write it down. A goal in your head is a wish; a goal on paper is a contract.' },
  { type: '🧘 Spiritual', text: 'Breathe in what you can control. Breathe out what you cannot. Repeat until it is true.' },
  { type: '⚡ Alpha Energy', text: 'Kings audit themselves. That is what this journal is — the mirror that does not lie.' },
  { type: '🔥 Discipline', text: 'No alcohol, cold water, heavy weights, early alarms. The price of the future is paid in discomfort today.' },
  { type: '🌅 Motivation', text: 'A year from now, this page is the proof you kept your word to yourself.' },
];

const PROMPTS = [
  'What are 3 things you are grateful for right now?',
  'What is the ONE thing that would make today a win?',
  'What did you do today that your future self will thank you for?',
  'What drained your energy today, and how do you cut it off?',
  'Describe your life 1 year from now as if it already happened.',
  'What almost broke your streak today, and what beat it?',
  'Who do you need to become to hit your current goal?',
  'What are you holding onto that you need to release?',
  'What was your biggest win this week, however small?',
  'What would the strongest version of you do tomorrow?',
];

function dayOffset(key, offset) {
  const { year, month, day } = parseKey(key);
  const d = new Date(year, month, day + offset);
  return dateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDate(key) {
  const { year, month, day } = parseKey(key);
  const d = new Date(year, month, day);
  return `${d.toLocaleDateString('en-US', { weekday: 'long' })}, ${MONTH_NAMES[month]} ${day}, ${year}`;
}

function messageForDate(key, shuffle = 0) {
  const { year, month, day } = parseKey(key);
  const idx = (year * 372 + month * 31 + day + shuffle * 7) % MESSAGES.length;
  return MESSAGES[idx];
}

export default function JournalView() {
  const { data, setJournal } = useApp();
  const [viewDate, setViewDate] = useState(todayKey);
  const [shuffle, setShuffle] = useState(0);
  const [promptIdx, setPromptIdx] = useState(null);

  const entry = data.journal?.[viewDate] || {};
  const msg = messageForDate(viewDate, shuffle);
  const isToday = viewDate === todayKey;

  // Past entries with content, newest first
  const pastEntries = Object.entries(data.journal || {})
    .filter(([k, v]) => k !== viewDate && (v.text || v.gratitude || v.manifestation))
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 15);

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-5 max-w-3xl mx-auto">
      {/* Date nav */}
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-xl font-bold text-white mr-auto">Journal</h2>
        <button onClick={() => setViewDate(dayOffset(viewDate, -1))}
          className="w-8 h-8 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-slate-300">‹</button>
        <span className="text-sm text-slate-300 min-w-[180px] text-center">{formatDate(viewDate)}</span>
        <button onClick={() => setViewDate(dayOffset(viewDate, 1))}
          disabled={isToday}
          className={`w-8 h-8 rounded-lg bg-[#1e293b] text-slate-300 ${isToday ? 'opacity-30' : 'hover:bg-[#334155]'}`}>›</button>
        {!isToday && (
          <button onClick={() => setViewDate(todayKey)}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs hover:bg-cyan-500/20">Today</button>
        )}
      </div>

      {/* Daily message */}
      <div className="bg-gradient-to-br from-[#1e293b] to-[#172554] rounded-2xl p-5 border border-cyan-500/20 relative">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">{msg.type}</span>
          <button onClick={() => setShuffle(s => s + 1)} title="Another message"
            className="ml-auto text-slate-500 hover:text-cyan-400 transition text-sm">🔄</button>
        </div>
        <p className="text-slate-100 text-base sm:text-lg leading-relaxed italic">"{msg.text}"</p>
      </div>

      {/* Gratitude */}
      <div className="bg-[#1e293b] rounded-2xl p-4">
        <div className="text-xs text-amber-400 font-semibold mb-2">🙏 Gratitude — what are you thankful for?</div>
        <textarea
          value={entry.gratitude || ''}
          onChange={e => setJournal(viewDate, { gratitude: e.target.value })}
          placeholder="I'm grateful for..."
          rows={2}
          className="w-full bg-[#0f172a] text-white text-sm rounded-xl px-3 py-2 outline-none border border-[#334155] focus:border-amber-500 resize-none"
        />
      </div>

      {/* Manifestation */}
      <div className="bg-[#1e293b] rounded-2xl p-4">
        <div className="text-xs text-purple-400 font-semibold mb-2">🌌 Manifestation — speak it into existence</div>
        <textarea
          value={entry.manifestation || ''}
          onChange={e => setJournal(viewDate, { manifestation: e.target.value })}
          placeholder="I am building... I will... I attract..."
          rows={2}
          className="w-full bg-[#0f172a] text-white text-sm rounded-xl px-3 py-2 outline-none border border-[#334155] focus:border-purple-500 resize-none"
        />
      </div>

      {/* Free journal */}
      <div className="bg-[#1e293b] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <div className="text-xs text-cyan-400 font-semibold">✍️ Journal entry</div>
          <button
            onClick={() => setPromptIdx(promptIdx === null ? Math.floor(Math.random() * PROMPTS.length) : (promptIdx + 1) % PROMPTS.length)}
            className="ml-auto px-3 py-1 rounded-lg bg-[#0f172a] text-slate-400 text-xs hover:text-cyan-400 transition">
            💡 Need a prompt?
          </button>
        </div>
        {promptIdx !== null && (
          <div className="text-sm text-slate-400 italic mb-2 fade-in">{PROMPTS[promptIdx]}</div>
        )}
        <textarea
          value={entry.text || ''}
          onChange={e => setJournal(viewDate, { text: e.target.value })}
          placeholder="How did today go? Wins, struggles, thoughts..."
          rows={8}
          className="w-full bg-[#0f172a] text-white text-sm rounded-xl px-3 py-2 outline-none border border-[#334155] focus:border-cyan-500 resize-y leading-relaxed"
        />
        <div className="text-[10px] text-slate-600 mt-1 text-right">Saves automatically as you type</div>
      </div>

      {/* Past entries */}
      {pastEntries.length > 0 && (
        <div className="pt-2">
          <div className="text-sm font-semibold text-slate-400 mb-3">Past Entries</div>
          <div className="space-y-2">
            {pastEntries.map(([k, v]) => (
              <button key={k} onClick={() => setViewDate(k)}
                className="w-full text-left bg-[#1e293b] hover:bg-[#273449] rounded-xl p-3 transition">
                <div className="text-xs text-cyan-400 mb-1">{formatDate(k)}</div>
                <div className="text-sm text-slate-300 line-clamp-2">
                  {v.text || v.gratitude || v.manifestation}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
