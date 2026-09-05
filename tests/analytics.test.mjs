import test from 'node:test';
import assert from 'node:assert/strict';

// ── 1. Dynamic Hardest Question & Accuracy Calculation ───────────────────────

function calculateHardestQuestion(questions) {
  if (!questions || questions.length === 0) {
    return { hardestQuestion: null, hardestAccuracy: 0 };
  }

  const questionsWithAccuracy = questions.map((q, idx) => {
    let accuracy = 0;
    if (q.attempts && q.attempts > 0) {
      accuracy = Math.round(((q.correctAnswersCount ?? 0) / q.attempts) * 100);
    } else {
      accuracy = 50;
    }
    return { question: q, index: idx, accuracy };
  });

  const hardestStat = [...questionsWithAccuracy].sort((a, b) => a.accuracy - b.accuracy)[0];
  return {
    hardestQuestion: hardestStat.question,
    hardestAccuracy: hardestStat.accuracy
  };
}

test('dynamically identifies hardest question with lowest accuracy rate', () => {
  const mockQuestions = [
    { id: 'q1', text: 'Easy question', attempts: 10, correctAnswersCount: 9 }, // 90%
    { id: 'q2', text: 'Tough question', attempts: 12, correctAnswersCount: 3 }, // 25%
    { id: 'q3', text: 'Medium question', attempts: 10, correctAnswersCount: 6 }, // 60%
  ];

  const result = calculateHardestQuestion(mockQuestions);
  assert.equal(result.hardestQuestion.id, 'q2');
  assert.equal(result.hardestAccuracy, 25);
  assert.notEqual(result.hardestAccuracy, 33, 'Must NOT be a hardcoded 33 constant');
});

test('handles empty question lists gracefully', () => {
  const result = calculateHardestQuestion([]);
  assert.equal(result.hardestQuestion, null);
  assert.equal(result.hardestAccuracy, 0);
});

// ── 2. CSV Formula Injection Sanitization (CWE-1236) ─────────────────────────

function sanitizeCsvCell(text) {
  let str = String(text).replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str}"`;
}

test('sanitizes Excel formula injection characters', () => {
  assert.equal(sanitizeCsvCell('=SUM(A1:A10)'), '"\'=SUM(A1:A10)"');
  assert.equal(sanitizeCsvCell('+cmd|/C calc'), '"\'+cmd|/C calc"');
  assert.equal(sanitizeCsvCell('-1+1'), '"\'-1+1"');
  assert.equal(sanitizeCsvCell('@exploit'), '"\'@exploit"');
  assert.equal(sanitizeCsvCell('\tmalicious'), '"\'\tmalicious"');
});

test('leaves benign text unmodified while wrapping in quotes', () => {
  assert.equal(sanitizeCsvCell('PlayerOne'), '"PlayerOne"');
  assert.equal(sanitizeCsvCell('1000 pts'), '"1000 pts"');
  assert.equal(sanitizeCsvCell('Hello "World"'), '"Hello ""World"""');
});

// ── 3. Score Calculation & Streak Multiplier ─────────────────────────────────

function calculateScore(correct, timeLeft, currentStreak) {
  if (!correct) return 0;
  const base = 1000;
  const timeBonus = timeLeft * 50;
  const streakMult = Math.min(1 + currentStreak * 0.1, 2.0); // Cap at 2×
  return Math.round((base + timeBonus) * streakMult);
}

test('calculates correct score with speed and streak bonuses', () => {
  // Correct answer with 10s remaining, 0 streak: (1000 + 500) * 1.0 = 1500
  assert.equal(calculateScore(true, 10, 0), 1500);

  // Correct answer with 20s remaining, 5 streak: (1000 + 1000) * 1.5 = 3000
  assert.equal(calculateScore(true, 20, 5), 3000);

  // Streak multiplier caps at 2.0x (streak >= 10)
  assert.equal(calculateScore(true, 0, 15), 2000);

  // Wrong answer always yields 0
  assert.equal(calculateScore(false, 20, 10), 0);
});

// ── 4. Accessibility & Shape Pad Mapping ─────────────────────────────────────

const SHAPES = [
  { shape: 'triangle', symbol: '▲', key: '1', altKey: 'A' },
  { shape: 'diamond',  symbol: '◆', key: '2', altKey: 'B' },
  { shape: 'circle',   symbol: '●', key: '3', altKey: 'C' },
  { shape: 'square',   symbol: '■', key: '4', altKey: 'D' },
];

test('provides distinct shapes and dual keyboard shortcuts for all 4 pads', () => {
  assert.equal(SHAPES.length, 4);
  const symbols = new Set(SHAPES.map(s => s.symbol));
  assert.equal(symbols.size, 4, 'Each pad must have a unique visual shape symbol');

  SHAPES.forEach((pad, index) => {
    assert.equal(pad.key, String(index + 1));
    assert.ok(pad.altKey);
  });
});
