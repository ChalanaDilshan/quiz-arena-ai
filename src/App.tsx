import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './context/ThemeContext';
import { useQuizGame } from './hooks/useQuizGame';
import { LandingPage } from './components/LandingPage';
import { HomeView } from './components/HomeView';
import { LobbyView } from './components/LobbyView';
import { QuestionView } from './components/QuestionView';
import { LeaderboardView } from './components/LeaderboardView';
import { GameOverView } from './components/GameOverView';
import { AdminDashboard } from './components/AdminDashboard';
import { useCommentator } from './hooks/useCommentator';
import { CommentatorWidget } from './components/CommentatorWidget';

/** Smooth page-to-page transition */
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -10 },
};

/** Floating theme toggle shown during game (no landing page navbar) */
function FloatingThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileTap={{ scale: 0.88 }}
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 w-9 h-9 rounded-lg flex items-center justify-center card transition-colors"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <motion.div key={theme} initial={{ rotate: -20, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.2 }}>
        {theme === 'dark' ? <Sun className="w-4 h-4 text-smoke" /> : <Moon className="w-4 h-4 text-smoke" />}
      </motion.div>
    </motion.button>
  );
}

function App() {
  // Check URL parameters for instant QR code join
  const [initialPin, setInitialPin] = useState<string | undefined>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('pin') || params.get('join') || undefined;
    } catch {
      return undefined;
    }
  });

  // Controls whether we show the marketing landing page (skip if scanning QR with ?pin=...)
  const [showLanding, setShowLanding] = useState<boolean>(() => !initialPin);
  // Controls whether admin dashboard is shown
  const [showAdmin, setShowAdmin] = useState(false);
  // Tab to pre-select on HomeView ('join' or 'host')
  const [initialTab, setInitialTab] = useState<'join' | 'host'>(initialPin ? 'join' : 'join');
  // Track the PDF filename used for the current hosted quiz (for history)
  const [hostFileName, setHostFileName] = useState('');

  const game = useQuizGame(true); // true = mock mode; set false + VITE_WS_URL for live
  const commentator = useCommentator();

  // ── AI Commentator Triggers (Less Distracting) ────────────────────────────
  useEffect(() => {
    if (game.gameState === 'LEADERBOARD') {
      const players = game.players.filter(p => !p.isHost);
      
      // Only look at the human player to avoid spamming the API with bot streaks
      const humanPlayer = players.find(p => p.id === game.playerId);
      
      const hotPlayer = humanPlayer && humanPlayer.streak >= 2 ? humanPlayer : undefined;
      const coldPlayer = humanPlayer && (humanPlayer.wrongStreak ?? 0) >= 2 ? humanPlayer : undefined;

      if (hotPlayer) {
        commentator.triggerCommentary('HOT_STREAK', {
          nickname: hotPlayer.nickname,
          streak: hotPlayer.streak,
        }, game.isMockMode ? 'MOCK_TEST_ROOM' : (game.session?.roomPin || 'MOCK_TEST_ROOM'));
      } else if (coldPlayer) {
        commentator.triggerCommentary('COLD_STREAK', {
          nickname: coldPlayer.nickname,
          wrongStreak: coldPlayer.wrongStreak,
        }, game.isMockMode ? 'MOCK_TEST_ROOM' : (game.session?.roomPin || 'MOCK_TEST_ROOM'));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameState]);

  const goToGame = (tab: 'join' | 'host') => {
    setInitialTab(tab);
    setShowLanding(false);
  };

  const renderGameView = () => {
    switch (game.gameState) {
      case 'HOME':
        return (
          <HomeView
            initialTab={initialTab}
            initialPin={initialPin}
            onJoinGame={game.joinGame}
            onHostGame={(file, numQ, diff) => {
              setHostFileName(file.name);
              game.hostGame(file, numQ, diff);
            }}
            onHostSavedQuiz={(quiz) => {
              setHostFileName(quiz.topic);
              game.hostSavedQuiz(quiz);
            }}
            uploadProgress={game.uploadProgress}
            error={game.error}
          />
        );
      case 'LOBBY':
        return (
          <LobbyView
            roomPin={game.session?.roomPin ?? '------'}
            players={game.players}
            isHost={game.isHost}
            onStartGame={game.startGame}
          />
        );
      case 'QUESTION':
        return game.currentQuestion ? (
          <QuestionView
            question={game.currentQuestion}
            questionNumber={(game.session?.currentQuestionIndex ?? 0) + 1}
            totalQuestions={game.session?.questions.length ?? 0}
            timeRemaining={game.timeRemaining}
            selectedAnswer={game.selectedAnswer}
            isAnswerRevealed={game.isAnswerRevealed}
            streak={game.players.find(p => p.id === game.playerId)?.streak ?? 0}
            onSubmitAnswer={game.submitAnswer}
          />
        ) : null;
      case 'LEADERBOARD':
        return (
          <LeaderboardView
            players={game.players}
            currentQuestionIndex={game.session?.currentQuestionIndex ?? 0}
            totalQuestions={game.session?.questions.length ?? 0}
            isHost={game.isHost}
            playerId={game.playerId}
            onNextQuestion={game.nextQuestion}
          />
        );
      case 'GAME_OVER':
        return (
          <GameOverView
            players={game.players}
            playerId={game.playerId}
            session={game.session}
            isHost={game.isHost}
            isMockMode={game.isMockMode}
            hostFileName={hostFileName}
            onRestart={() => { game.resetGame(); setShowLanding(true); }}
          />
        );
    }
  };

  // Show admin dashboard
  if (showAdmin) {
    return <AdminDashboard onBack={() => setShowAdmin(false)} />;
  }

  return (
    <div className="min-h-screen bg-canvas">
      <AnimatePresence mode="wait">
        {showLanding ? (
          <motion.div key="landing" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
            <LandingPage
              onHost={() => goToGame('host')}
              onJoin={() => goToGame('join')}
              onOpenAdmin={() => setShowAdmin(true)}
            />
          </motion.div>
        ) : (
          <motion.div key={game.gameState} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
            <FloatingThemeToggle />
            {renderGameView()}
            <CommentatorWidget 
              comment={commentator.currentComment} 
              isVisible={commentator.isVisible} 
              isTyping={commentator.isTyping} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
