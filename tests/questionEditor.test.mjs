import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// ── 1. Question Validator Contract Tests ────────────────────────────────────

function validateQuestion(q) {
  if (!q.text || typeof q.text !== 'string' || !q.text.trim()) {
    return 'Question text cannot be empty';
  }
  if (!Array.isArray(q.options) || q.options.length < 2) {
    return 'Question must have at least 2 options';
  }
  if (q.options.some((opt) => !opt || typeof opt !== 'string' || !opt.trim())) {
    return 'All options must have non-empty text';
  }
  if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
    return 'A valid correct answer must be selected';
  }
  const timeLimit = q.timeLimit ?? 20;
  if (typeof timeLimit !== 'number' || timeLimit < 5 || timeLimit > 120) {
    return 'Time limit must be between 5 and 120 seconds';
  }
  return null;
}

test('validateQuestion: accepts well-formed question', () => {
  const q = {
    id: 'q1',
    text: 'What does AWS EC2 stand for?',
    options: ['Elastic Compute Cloud', 'Easy Cloud Cluster', 'Enterprise Core Cloud', 'Elastic Core Container'],
    correctIndex: 0,
    timeLimit: 20,
    explanation: 'EC2 stands for Amazon Elastic Compute Cloud.',
  };
  assert.equal(validateQuestion(q), null);
});

test('validateQuestion: rejects empty question text', () => {
  const q = {
    id: 'q1',
    text: '   ',
    options: ['Option A', 'Option B'],
    correctIndex: 0,
  };
  assert.equal(validateQuestion(q), 'Question text cannot be empty');
});

test('validateQuestion: rejects questions with fewer than 2 options', () => {
  const q = {
    id: 'q1',
    text: 'Valid Question?',
    options: ['Only one'],
    correctIndex: 0,
  };
  assert.equal(validateQuestion(q), 'Question must have at least 2 options');
});

test('validateQuestion: rejects out-of-bounds correctIndex', () => {
  const q = {
    id: 'q1',
    text: 'Valid Question?',
    options: ['Option A', 'Option B', 'Option C'],
    correctIndex: 5,
  };
  assert.equal(validateQuestion(q), 'A valid correct answer must be selected');

  const qNegative = {
    id: 'q1',
    text: 'Valid Question?',
    options: ['Option A', 'Option B'],
    correctIndex: -1,
  };
  assert.equal(validateQuestion(qNegative), 'A valid correct answer must be selected');
});

test('validateQuestion: rejects blank options', () => {
  const q = {
    id: 'q1',
    text: 'Valid Question?',
    options: ['Option A', '   ', 'Option C'],
    correctIndex: 0,
  };
  assert.equal(validateQuestion(q), 'All options must have non-empty text');
});

// ── 2. Server updateQuizQuestions Socket Implementation Verification ──────────

test('server/index.js implements updateQuizQuestions with LOBBY check and host validation', () => {
  const projectRoot = process.cwd();
  const serverCode = fs.readFileSync(path.join(projectRoot, 'server', 'index.js'), 'utf8');

  // Verify socket event registration
  assert.ok(
    serverCode.includes("socket.on('updateQuizQuestions'"),
    'Server must register updateQuizQuestions socket listener'
  );

  // Verify room.state === LOBBY enforcement
  assert.ok(
    serverCode.includes("room.state !== 'LOBBY'"),
    "Server must reject updates when room.state !== 'LOBBY'"
  );

  // Verify isHostAuthorized check
  assert.ok(
    serverCode.includes('isHostAuthorized(room, socket, hostToken'),
    'Server must authenticate host using isHostAuthorized'
  );

  // Verify questionsUpdated broadcast
  assert.ok(
    serverCode.includes("io.to(cleanPin).emit('questionsUpdated'"),
    'Server must emit questionsUpdated to room channel'
  );

  // Verify broadcastState call
  assert.ok(
    serverCode.includes('broadcastState(cleanPin)'),
    'Server must broadcast updated state after question modification'
  );
});

// ── 3. Client Hook and Component Wiring Verification ─────────────────────────

test('useQuizGame.ts exports updateSessionQuestions and hostWithQuestions', () => {
  const projectRoot = process.cwd();
  const hookCode = fs.readFileSync(path.join(projectRoot, 'src', 'hooks', 'useQuizGame.ts'), 'utf8');

  assert.ok(
    hookCode.includes('hostWithQuestions: (questions: Question[], topic?: string) => void;'),
    'UseQuizGameReturn must declare hostWithQuestions'
  );

  assert.ok(
    hookCode.includes('updateSessionQuestions: (questions: Question[]) => void;'),
    'UseQuizGameReturn must declare updateSessionQuestions'
  );

  assert.ok(
    hookCode.includes("emit('updateQuizQuestions'"),
    'updateSessionQuestions must emit updateQuizQuestions over WebSocket'
  );

  assert.ok(
    hookCode.includes("socket.on('questionsUpdated'"),
    'setupSocketListeners must listen for questionsUpdated'
  );
});

test('LobbyView.tsx includes Review Questions button and QuestionEditorModal', () => {
  const projectRoot = process.cwd();
  const lobbyCode = fs.readFileSync(path.join(projectRoot, 'src', 'components', 'LobbyView.tsx'), 'utf8');

  assert.ok(
    lobbyCode.includes('Review Questions'),
    'LobbyView must render Review Questions button'
  );

  assert.ok(
    lobbyCode.includes('<QuestionEditorModal'),
    'LobbyView must mount QuestionEditorModal'
  );
});

test('HomeView.tsx includes pre-launch review option and modal', () => {
  const projectRoot = process.cwd();
  const homeCode = fs.readFileSync(path.join(projectRoot, 'src', 'components', 'HomeView.tsx'), 'utf8');

  assert.ok(
    homeCode.includes('Review & edit questions before entering lobby'),
    'HomeView must provide review before entering lobby option'
  );

  assert.ok(
    homeCode.includes('<QuestionEditorModal'),
    'HomeView must mount QuestionEditorModal'
  );
});

test('AdminDashboard.tsx provides manual question editing for autonomous drafts', () => {
  const projectRoot = process.cwd();
  const adminCode = fs.readFileSync(path.join(projectRoot, 'src', 'components', 'AdminDashboard.tsx'), 'utf8');

  assert.ok(
    adminCode.includes('Edit Questions'),
    'AdminDashboard must provide Edit Questions button for pending syllabus drafts'
  );

  assert.ok(
    adminCode.includes('<QuestionEditorModal'),
    'AdminDashboard must mount QuestionEditorModal'
  );
});
