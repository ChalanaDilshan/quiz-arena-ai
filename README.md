# Quiz Arena AI

Quiz Arena AI is a real-time, competitive quiz platform built for the "Agents for Humans" Hackathon. It leverages autonomous AI agents running in the background to handle repetitive tasks for educators, while maintaining human-in-the-loop oversight.

## The Problem

Educators spend hours every week reading through syllabuses and manually writing quiz questions to test student comprehension. Additionally, hosting these quizzes often lacks the engaging, dynamic feel of a real game show, leading to lower student participation.

## The Solution (Agents for Humans)

Quiz Arena AI implements the core philosophy of the Strands Agents SDK by deploying AI that operates autonomously in the background and only surfaces when a human decision is required.

### 1. Auto-Pilot Syllabus Agent
- **Background Autonomy:** A Node.js backend agent periodically scans the teacher's uploaded course syllabus using the Gemini API.
- **Human-in-the-Loop:** When a new topic is detected, the agent autonomously generates a structured 5-question quiz. It then securely pauses and surfaces a notification on the teacher's Admin Dashboard asking for review.
- **Action:** The teacher reviews the generated quiz and clicks "Approve", instantly publishing it to their Saved Quizzes library without writing a single question themselves.

### 2. AI Game Commentator
- **Event-Driven AI:** During a live match, a background agent processes a real-time event stream (e.g., player streaks, correct/incorrect answers).
- **Dynamic Output:** The agent acts as a virtual game show host, injecting dynamic, context-aware commentary into the game lobby to hype up the players, creating a highly engaging experience.

## Features

- **Real-Time Multiplayer:** Built with WebSockets to support live, synchronized gameplay across multiple clients.
- **Admin Dashboard:** Centralized hub for teachers to view agent notifications and manage their saved quizzes.
- **Dynamic UI:** Smooth, hardware-accelerated animations using Framer Motion and a modern, glassmorphic aesthetic.
- **Synthesized Audio:** Custom Web Audio API integration for immediate, asset-free sound effects (correct, incorrect, and game over arpeggios).
- **Local Persistence:** Quiz history and player data are saved locally, ensuring seamless progression.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend:** Node.js, Express, Google Gen AI SDK (Gemini API).
- **State & Storage:** React Context API, LocalStorage.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A Google Gemini API Key

### Installation

1. Clone the repository
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

### Configuration

1. In the `server` directory, create a `.env` file and add your Gemini API Key:
   ```
   GEMINI_API_KEY=your_api_key_here
   PORT=3001
   ```
2. In the root directory, create a `.env` file for the frontend:
   ```
   VITE_WS_URL=ws://localhost:3001
   ```

### Running the Application

1. Start the Node.js Agent Backend:
   ```bash
   cd server
   node index.js
   ```
2. In a separate terminal, start the Vite Frontend:
   ```bash
   npm run dev
   ```
3. Open your browser to the URL provided by Vite (typically http://localhost:5174).

## Usage for Judging

To simulate the autonomous background agent for a demo:
1. Navigate to the Admin Dashboard in the web app.
2. Click the "Simulate Agent" button in the top right.
3. Wait approximately 5 seconds for the Gemini API to parse the sample syllabus.
4. Observe the AI Notification Card surface autonomously, requesting human approval.
5. Approve the quiz, navigate to "Host Game", and select the newly generated quiz from your library.
