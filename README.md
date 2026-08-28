# ⚡ Quiz Arena — AI-Powered Real-Time Quiz Competition Platform

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-11.3-black?logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Turn any PDF into a live, interactive multiplayer quiz competition with real-time countdowns, dynamic leaderboards, QR code join, and teacher analytics.**

---

## 🌟 Key Features

- 🧠 **AI-Powered Question Generation:** Upload lecture notes, study guides, or research papers as PDF documents to automatically extract core concepts and construct 4-choice questions with verified distractors.
- 📱 **QR Code One-Tap Mobile Join:** Display a live SVG QR Code or enlarged projector modal in the lobby. Players scan with their phone camera to instantly enter the room with the PIN pre-filled.
- 🎮 **Interactive Hero Demo:** Test answering sample questions with dynamic score calculation, speed multipliers, and real-time leaderboard re-ranking right from the landing page.
- 🏆 **Live Real-Time Leaderboards:** Synchronized gameplay with spring layout animations, streak multipliers (up to $2\times$), and round-by-round score deltas.
- 📊 **Teacher / Host Summary Reports:**
  - ⚠️ **Hardest Question Spotlight:** Highlights concepts with the lowest accuracy rate and explanations.
  - 📈 **Classroom Analytics:** Average score, overall room accuracy %, and total attendance.
  - 📥 **One-Click CSV Export:** Generates structured `.csv` reports for Excel, Google Sheets, or LMS.
  - 📄 **Printable Match Report Modal:** Formatted print view with executive tables and `window.print()` trigger.
- 🌓 **Tactile Modern Dark & Light Themes:**
  - **Obsidian Dark Mode:** `#0C0D0E` canvas, `#141618` elevated surfaces, `#23272C` crisp borders, and `#E07A5F` terracotta accents.
  - **Warm Linen Light Mode:** `#F8F6F0` canvas and `#FFFFFF` crisp cards.
  - Persistent theme switching via `localStorage`.

---

## 🏗️ Project Architecture

```
d:/aws project/
├── src/
│   ├── components/
│   │   ├── LandingPage.tsx          # Marketing home page with workflow tabs & FAQ
│   │   ├── InteractiveHeroDemo.tsx  # Playable hero sample quiz widget
│   │   ├── HomeView.tsx             # 2-step host PDF configuration & PIN join portal
│   │   ├── LobbyView.tsx            # Live room lobby with SVG QR Code generator
│   │   ├── QuestionView.tsx         # Countdown timer, 2×2 answer pads & streak indicator
│   │   ├── LeaderboardView.tsx      # Ranked standings with Framer Motion layout springs
│   │   └── GameOverView.tsx         # 3-tier podium, confetti, and CSV/PDF report exporter
│   ├── context/
│   │   └── ThemeContext.tsx         # Dark/light theme state & localStorage sync
│   ├── hooks/
│   │   └── useQuizGame.ts           # Central state machine, scoring, mock data & WS interface
│   ├── types.ts                     # TypeScript data models & WebSocket envelopes
│   ├── App.tsx                      # Root orchestration & transition manager
│   ├── main.tsx                     # React root wrapped in ThemeProvider
│   └── index.css                    # Design token CSS variables & utility classes
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** 18+ installed on your machine.
- **npm** or **pnpm** package manager.

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/quiz-arena.git

# Navigate into the project folder
cd quiz-arena

# Install dependencies
npm install
```

### 3. Running Locally
```bash
# Start the local Vite development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port shown in your terminal) in your browser.

### 4. Production Build
```bash
# Type check and build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## ⚙️ Configuration (Mock vs AWS Live Mode)

Quiz Arena includes a built-in **Mock Mode** enabling complete standalone testing without backend dependencies.

To connect to a live AWS API Gateway WebSocket backend:

1. Create a `.env` file in the project root:
   ```env
   VITE_WS_URL=wss://your-api-id.execute-api.us-east-1.amazonaws.com/production
   ```
2. In `src/App.tsx`, toggle mock mode to `false`:
   ```tsx
   const game = useQuizGame(false);
   ```

---

## 👨‍💻 Author

**Created by Chalana Dilshan**

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
