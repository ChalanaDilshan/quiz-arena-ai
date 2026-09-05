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
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

let serverProcess;

function startServer() {
  return new Promise((resolve, reject) => {
    let stderrOutput = '';
    serverProcess = spawn('node', [serverPath], {
      env: { ...process.env, PORT: String(TEST_PORT) },
      stdio: 'pipe',
    });

    serverProcess.stderr.on('data', (d) => {
      stderrOutput += d.toString();
    });

    serverProcess.on('exit', (code) => {
      if (code !== null && code !== 0) {
        reject(new Error(`Server process exited with code ${code}. Stderr: ${stderrOutput}`));
      }
    });

    serverProcess.on('error', reject);

    // Actively poll the health endpoint until responsive
    const startTime = Date.now();
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BASE_URL}/health`);
        if (res.ok) {
          clearInterval(interval);
          resolve();
        }
      } catch {
        if (Date.now() - startTime > 8000) {
          clearInterval(interval);
          reject(new Error(`Server failed to start within 8s. Stderr: ${stderrOutput}`));
        }
      }
    }, 150);
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
  }
}

function connectSocket() {
  return new Promise((resolve, reject) => {
    const socket = io(BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: 4000,
    });
    const timer = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Socket connection timed out'));
    }, 4000);

    socket.on('connect', () => {
      clearTimeout(timer);
      resolve(socket);
    });

    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      socket.disconnect();
      reject(err);
    });
  });
}

test('Gateway Test Suite', async (t) => {
  await startServer();

  t.after(() => {
    stopServer();
  });

  await t.test('GET /health returns 200 with service metadata', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'healthy');
    assert.equal(data.service, 'quiz-arena-gateway');
    assert.equal(data.aiFramework, 'Strands Agents SDK');
    assert.equal(data.modelProvider, 'Amazon Bedrock');
    assert.ok(typeof data.uptime === 'number');
    assert.ok(typeof data.activeRooms === 'number');
  });

  await t.test('GET /api/health responds with identical health contract', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'healthy');
    assert.equal(data.aiFramework, 'Strands Agents SDK');
    assert.equal(data.modelProvider, 'Amazon Bedrock');
  });

  await t.test('hostGame generates unique hostToken and establishes lobby', async () => {
    const socket = await connectSocket();

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
    const socket1 = await connectSocket();

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
    const socket2 = await connectSocket();
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
    const socket = await connectSocket();

    const errorPromise = new Promise((resolve) => {
      socket.on('error', resolve);
    });

    socket.emit('reconnectHost', { pin: '445566', hostToken: 'invalid-fake-token' });
    const err = await errorPromise;
    assert.ok(err.includes('Unauthorized') || err.includes('Invalid'));

    socket.disconnect();
  });
});
