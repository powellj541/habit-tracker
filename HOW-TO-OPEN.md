# How to Open the Habit Tracker

## Easiest way — desktop shortcut
Double-click the **Habit Tracker** shortcut on your Desktop. It starts the app and opens your browser automatically at http://localhost:5174.

(You can also double-click `Start Habit Tracker.bat` in this folder — the shortcut just points to it.)

The app opens on port **5174** because port 5173 is used by your trading journal. Both can run at the same time.

## Manual way (terminal)
```
cd "C:\Users\powel\Documents\Claude Code\habit-tracker"
npm run dev -- --port 5174
```
Then open http://localhost:5174 in your browser.

## Closing the app
Close the browser tab, then close the minimized "Habit Tracker Server" command window in your taskbar (or just leave it running — it uses almost no resources).

## Your data
- All data is saved in your browser's localStorage automatically — no save button needed.
- **Important:** data is tied to the browser you use. If you open it in Chrome one day and Edge the next, they won't share data. Stick to one browser.
- Back up occasionally: **Settings tab → Export JSON Backup**. Restore with **Import JSON**.

## Install as a real app (recommended)
With the server running, open http://localhost:5174 in Chrome or Edge, then click the **install icon** in the address bar (a small monitor/plus icon) or menu → "Install Habit Tracker". You get a proper app window with its own taskbar icon. Note: the server (desktop shortcut) still needs to be running for the app to load.

## Quick feature guide
- **Monthly** — the **Today's Check-in** panel at the top is the fastest way to log your day: one tap per habit. Below it, the full grid: click cells to check habits (colored by category). Click the grid then use **arrow keys** to move and **Space** to check. Future days are hidden by default — tick "Show future days" to see the whole month. Right-click a habit in the sidebar to edit/archive/delete; drag to reorder. Hover the mood row to pick an emoji; type sleep hours directly.
- **Stats** — daily/weekly charts, a **Mood & Sleep vs Completion** trend chart, a GitHub-style **year heatmap** (pick a single habit or all), leaderboard, and streaks.
- **Weekly** — current week focus: rings per day, tasks, weekly focus/affirmation/reward.
- **Settings** — your name, week start day, export/import, resets.

## Troubleshooting
- **"This site can't be reached"** — the server isn't running. Double-click the desktop shortcut again.
- **Page shows the trading journal** — you opened port 5173. Use **5174** for the habit tracker.
- **npm not recognized** — Node.js isn't on your PATH; the .bat file handles this automatically, so launch via the shortcut.
