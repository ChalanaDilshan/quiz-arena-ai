import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// ── Transpile and load src/components/HomeView.tsx ──────────────────────────
const projectRoot = process.cwd();
const srcFile = path.join(projectRoot, 'src', 'components', 'HomeView.tsx');
const cacheDir = path.join(projectRoot, 'node_modules', '.cache-test');
const outJs = path.join(cacheDir, 'HomeView.mjs');

fs.mkdirSync(cacheDir, { recursive: true });
let tsxSource = fs.readFileSync(srcFile, 'utf8');

tsxSource = `import React from 'react';\n` + tsxSource;
tsxSource = tsxSource.replace(
  /import \{ useAuth \} from '\.\.\/context\/AuthContext';/,
  `const useAuth = () => ({ user: null, signInWithGoogle: () => {} });`
);
tsxSource = tsxSource.replace(
  /import \{ getSavedQuizzes[^}]*\} from '\.\.\/utils\/quizHistory';/,
  `const getSavedQuizzes = () => [];`
);
tsxSource = tsxSource.replace(
  /import \{ extractTextFromPdf \} from '\.\.\/utils\/pdfExtractor';/,
  `const extractTextFromPdf = async () => ({ text: '', wordCount: 0, numPages: 0 });`
);
tsxSource = tsxSource.replace(
  /import \{ LegalModal[^}]*\} from '\.\/LegalModal';/,
  `const LegalModal = () => null;`
);
tsxSource = tsxSource.replace(
  /import \{ QuizArenaLogo \} from '\.\/QuizArenaLogo';/,
  `const QuizArenaLogo = (props) => React.createElement('svg', props);`
);

const { outputText } = ts.transpileModule(tsxSource, {
  compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
fs.writeFileSync(outJs, outputText, 'utf8');

const { HomeView } = await import(`file://${outJs.replace(/\\/g, '/')}`);

test('HomeView: Join button shows normal state when isJoining is false', () => {
  const html = renderToStaticMarkup(
    React.createElement(HomeView, {
      onJoinGame: () => {},
      onHostGame: () => {},
      uploadProgress: 0,
      error: null,
      isJoining: false,
      initialPin: '123456',
    })
  );

  assert.ok(html.includes('Join Game'), 'Should display "Join Game" text');
  assert.ok(!html.includes('Joining…'), 'Should not display "Joining…" text');
});

test('HomeView: Join button shows loading state and spinner when isJoining is true', () => {
  const html = renderToStaticMarkup(
    React.createElement(HomeView, {
      onJoinGame: () => {},
      onHostGame: () => {},
      uploadProgress: 0,
      error: null,
      isJoining: true,
      initialPin: '123456',
    })
  );

  assert.ok(html.includes('Joining…'), 'Should display "Joining…" text');
  assert.ok(html.includes('animate-spin'), 'Should render spinner with animate-spin class');
  assert.ok(html.includes('aria-label="Joining game…"'), 'Should have accessible joining label');
  // Check that the button element has disabled attribute
  assert.ok(html.includes('disabled=""') || html.includes('disabled'), 'Button should be disabled when isJoining is true');
});

test('HomeView: Join button displays error message when error prop is provided', () => {
  const html = renderToStaticMarkup(
    React.createElement(HomeView, {
      onJoinGame: () => {},
      onHostGame: () => {},
      uploadProgress: 0,
      error: 'Room not found or game already started',
      isJoining: false,
      initialPin: '999999',
    })
  );

  assert.ok(html.includes('Room not found or game already started'), 'Should render the error message');
  assert.ok(html.includes('Join Game'), 'Button returns to Join Game after error');
  assert.ok(!html.includes('Joining…'), 'Should not display loading state when error is shown and isJoining is false');
});

test('useQuizGame: exports isJoining in interface and return contract', () => {
  const hookSource = fs.readFileSync(path.join(projectRoot, 'src', 'hooks', 'useQuizGame.ts'), 'utf8');
  assert.ok(hookSource.includes('isJoining: boolean;'), 'UseQuizGameReturn interface should define isJoining: boolean');
  assert.ok(hookSource.includes('const [isJoining, setIsJoining] = useState(false);'), 'useQuizGame should declare isJoining state');
  assert.ok(/return\s*\{[\s\S]*isJoining,[\s\S]*\}/.test(hookSource), 'Hook should export isJoining in return object');
});

test('useQuizGame: resets isJoining in all required failure and transition cases', () => {
  const hookSource = fs.readFileSync(path.join(projectRoot, 'src', 'hooks', 'useQuizGame.ts'), 'utf8');

  // Case 1: when server confirms join (gameState transitions to LOBBY)
  assert.ok(
    hookSource.includes("if (state.state === 'LOBBY')") && hookSource.includes("updateIsJoining(false)"),
    'Should reset isJoining to false when state transitions to LOBBY'
  );

  // Case 2: server-side error event arrives
  assert.ok(
    /socket\.on\('error',\s*\([^)]*\)\s*=>\s*\{[\s\S]*?updateIsJoining\(false\)/.test(hookSource),
    'Should reset isJoining to false when socket "error" event is received'
  );

  // Case 3: connect_error fires
  assert.ok(
    /socket\.on\('connect_error',\s*\([^)]*\)\s*=>\s*\{[\s\S]*?updateIsJoining\(false\)/.test(hookSource),
    'Should reset isJoining to false when socket "connect_error" event is received'
  );

  // Case 4: connection timeout fires
  assert.ok(
    /failTimerRef\.current\s*=\s*setTimeout\(\(\)\s*=>\s*\{[\s\S]*?updateIsJoining\(false\)/.test(hookSource),
    'Should reset isJoining to false when failTimer connection timeout fires'
  );

  // Re-entry guard
  assert.ok(
    hookSource.includes('if (isJoiningRef.current) return;'),
    'Should prevent re-entrant joins when join is already in flight'
  );
});

