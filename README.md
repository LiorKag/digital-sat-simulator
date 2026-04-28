# 📚 Digital SAT Simulator

A high-fidelity, full-featured Digital SAT practice platform built with **React**, **Electron**, and **Tailwind CSS**. Designed to replicate the official College Board Bluebook testing interface — adaptive routing, timed modules, domain analytics, and a built-in Desmos graphing calculator included.

---

## ✨ Features

### 🧪 Full Practice Test Mode
- Mirrors the real Digital SAT adaptive structure: **R&W Module 1 → R&W Module 2 → Math Module 1 → Math Module 2**
- Adaptive routing: Module 2 difficulty (Easy/Hard) is determined by your Module 1 performance (65% threshold)
- Scaled score calculation (200–800 per section, 400–1600 total)
- Built-in 32-minute R&W and 35-minute Math countdowns with wall-clock accuracy

### 🎯 Custom Practice Drills
- Build a custom drill by selecting specific **subjects** (Reading & Writing, Math) and **domains**
- Set a custom question count
- Full post-drill review with domain-level accuracy and time-spent analytics
- Personalized improvement suggestions after every drill

### 📊 Score Dashboard & History
- Full test history with per-exam score breakdown (R&W, Math, Total, path taken)
- Domain-level accuracy bars across all historical tests
- Score progression chart
- Top 3 weakest domains highlighted from your most recent test
- Focus & Custom Drill history tab with accuracy trend indicators

### 🔁 Interactive Review Mode
- Review every question from any past test
- Correct and incorrect answers highlighted with full explanations
- Time-per-question display per question
- Navigate freely through all modules

### 💾 Session Persistence
- **Save & Exit** during a full test — resume exactly where you left off
- localStorage-backed with rolling 20-entry cap and quota guard

### 🖩 Desmos Graphing Calculator
- Integrated official Desmos Graphing Calculator API
- Draggable and freely resizable floating modal
- Toggled from the test header — always available on Math sections

### ⌨️ Keyboard Navigation
- `A` / `B` / `C` / `D` or `1` / `2` / `3` / `4` — select answers
- `←` / `→` Arrow keys — navigate between questions
- `M` / `F` — toggle Mark for Review flag

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 18 |
| Desktop Shell | Electron |
| Styling | Tailwind CSS v4 |
| Math Rendering | KaTeX |
| Graphing Calculator | Desmos API v1.11 |
| Drag & Resize | react-rnd |
| Build Tool | Vite |
| Question API | [PineSAT](https://pinesat.com/api/questions) (with offline fallback) |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- npm v9+

### Installation

```bash
# Clone the repository
git clone https://github.com/LiorKag/digital-sat-simulator.git
cd digital-sat-simulator

# Install dependencies
npm install
```

### Running in Development

```bash
npm run dev
```

This starts both the Vite dev server and the Electron window concurrently.

### Building for Production

```bash
npm run build
```

---

## 📁 Project Structure

```
digital-sat-simulator/
├── main.js                  # Electron main process
├── preload.js               # Electron preload / IPC bridge
├── index.html               # Root HTML (Desmos API script injected here)
├── src/
│   ├── App.jsx              # Root component, view routing, localStorage sync
│   ├── index.css            # Global styles, Tailwind theme, Desmos isolation
│   ├── index.jsx            # React entry point
│   └── components/
│       ├── TestEngine.jsx   # Core test engine (timer, adaptive routing, calculator)
│       ├── MainMenu.jsx     # Home screen and session management
│       ├── HistoryView.jsx  # Score dashboard and domain analytics
│       ├── DrillResults.jsx # Post-drill performance review
│       └── CustomTestBuilder.jsx  # Custom drill configuration UI
├── .gitignore
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 🔌 Question API

Questions are fetched at runtime from the [PineSAT public API](https://pinesat.com/api/questions):

```
GET https://pinesat.com/api/questions?section=english
GET https://pinesat.com/api/questions?section=math
```

If the API is unreachable, the app falls back to a built-in offline question set so testing is always possible.

---

## 📄 License

MIT — free to use, modify, and distribute.
