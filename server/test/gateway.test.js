import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'child_process';
import { io } from 'socket.io-client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverPath = path.resolve(__dirname, '../index.js');

const TEST_PORT = 3105;

let serverProcess;

function startServer() {
  return new Promise((resolve, reject) => {
    serverProcess = spawn('node', [serverPath], {
      env: { ...process.env, PORT: String(TEST_PORT) },
      stdio: 'pipe',
    });

    serverProcess.stdout.on('data', (d) => {
      if (d.toString().includes('Quiz Arena API gateway running')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (d) => {
      // Ignore warnings
    });

    serverProcess.on('error', reject);
    setTimeout(resolve, 2000); // Fallback timeout
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
  }
}

test('Gateway Test Suite', async (t) => {
  await startServer();

  t.after(() => {
    stopServer();
  });

  await t.test('GET /health returns 200 with service metadata', async () => {
    const res = await fetch(`http://localhost:${TEST_PORT}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'healthy');
    assert.equal(data.service, 'quiz-arena-gateway');
    assert.ok(typeof data.uptime === 'number');
    assert.ok(typeof data.activeRooms === 'number');
  });

  await t.test('GET /api/health responds with identical health contract', async () => {
    const res = await fetch(`http://localhost:${TEST_PORT}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'healthy');
  });

  await t.test('hostGame generates unique hostToken and establishes lobby', async () => {
    const socket = io(`http://localhost:${TEST_PORT}`);
    await new Promise((r) => socket.on('connect', r));

    const pin = '112233';
    const mockQuiz = {
      topic: 'Automated Test Quiz',
      questions: [
        { id: '1', text: 'Q1', options: ['A', 'B'], correctIndex: 0, timeLimit: 20 },
        { id: '2', text: 'Q2', options: ['C', 'D'], correctIndex: 1, timeLimit: 20 },
      ],
    };

    const hostCreatedPromise = new Promise((resolve) => {
      socket.on('hostCreated', resolve);
    });

    socket.emit('hostGame', { pin, quizData: mockQuiz, hostId: 'test-host-id' });
    const creds = await hostCreatedPromise;

    assert.equal(creds.pin, pin);
    assert.ok(creds.hostToken, 'hostToken must be generated and non-empty');
    assert.ok(creds.hostToken.length >= 16, 'hostToken should be a cryptographically secure UUID');

    socket.disconnect();
  });

  await t.test('reconnectHost restores host socket binding and cancels cleanup', async () => {
    const socket1 = io(`http://localhost:${TEST_PORT}`);
    await new Promise((r) => socket1.on('connect', r));

    const pin = '445566';
    const mockQuiz = {
      topic: 'Reconnect Test Quiz',
      questions: [
        { id: '1', text: 'What is 2+2?', options: ['3', '4'], correctIndex: 1, timeLimit: 20 },
      ],
    };

    const hostCreatedPromise = new Promise((resolve) => {
      socket1.on('hostCreated', resolve);
    });

    socket1.emit('hostGame', { pin, quizData: mockQuiz, hostId: 'host-persist-1' });
    const { hostToken } = await hostCreatedPromise;

    // Simulate page reload: disconnect socket1
    socket1.disconnect();

    // New socket connecting after page refresh
    const socket2 = io(`http://localhost:${TEST_PORT}`);
    await new Promise((r) => socket2.on('connect', r));
    assert.notEqual(socket2.id, socket1.id, 'New socket must have distinct socket ID');

    const reconnectedPromise = new Promise((resolve) => {
      socket2.on('hostReconnected', resolve);
    });

    socket2.emit('reconnectHost', { pin, hostToken, hostId: 'host-persist-1' });
    const state = await reconnectedPromise;

    assert.equal(state.pin, pin);
    assert.equal(state.state, 'LOBBY');
    assert.equal(state.questions.length, 1);

    // Verify reconnected socket can perform host actions (startGame)
    const gameStartedPromise = new Promise((resolve) => {
      socket2.on('gameStateUpdate', (s) => {
        if (s.state === 'QUESTION') resolve(s);
      });
    });

    socket2.emit('startGame', { pin, hostToken });
    const questionState = await gameStartedPromise;
    assert.equal(questionState.state, 'QUESTION');

    // Verify anti-cheat: correctIndex stripped during QUESTION phase
    assert.equal(questionState.currentQuestion.correctIndex, undefined, 'correctIndex must be hidden in QUESTION phase');

    socket2.disconnect();
  });

  await t.test('reconnectHost rejects invalid host tokens', async () => {
    const socket = io(`http://localhost:${TEST_PORT}`);
    await new Promise((r) => socket.on('connect', r));

    const errorPromise = new Promise((resolve) => {
      socket.on('error', resolve);
    });

    socket.emit('reconnectHost', { pin: '445566', hostToken: 'invalid-fake-token' });
    const err = await errorPromise;
    assert.ok(err.includes('Unauthorized') || err.includes('Invalid'));

    socket.disconnect();
  });
});
