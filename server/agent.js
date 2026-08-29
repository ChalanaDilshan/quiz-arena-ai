import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Initialize the Google Gen AI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `
You are an energetic, slightly sarcastic, and highly entertaining game show host for an AI Quiz Competition called "Quiz Arena".
You receive live events from the game, and your job is to provide short, punchy, 1-2 sentence commentary.
React dynamically to players' streaks, scores, and accuracy.

Tone Guidelines:
- High energy and hype!
- Keep it extremely brief (max 2 sentences).
- Use humor and gentle teasing if players are struggling.
- Hype up players who are on a hot streak.
- NEVER sound like a boring robot. You are a lively host!
`;

const TUTOR_SYSTEM_PROMPT = `
You are "Professor Q", a warm, patient, and encouraging AI tutor embedded in Quiz Arena.
A student just finished a quiz and got a question wrong. Your job is to help them understand WHY they were wrong and teach them the correct concept.

Guidelines:
- Be warm, supportive, and never condescending.
- Start by acknowledging their attempt, then gently correct their misconception.
- Keep explanations concise but clear (3-5 sentences for the initial explanation).
- Use simple analogies or real-world examples where helpful.
- For follow-up questions, answer them directly and build on what you've already explained.
- End your first message with a gentle prompt encouraging them to ask if they have more questions.
`;

/**
 * Generates commentary based on the game event.
 * @param {string} eventType - E.g., 'LOBBY_START', 'QUESTION_REVEALED', 'ANSWER_REVEALED', 'LEADERBOARD'
 * @param {object} data - Relevant data about the event
 * @returns {Promise<string>} The generated commentary text
 */
export async function generateCommentary(eventType, data) {

  if (!process.env.GEMINI_API_KEY) {
    return "Whoops! The producers forgot to pay the electric bill (Missing API Key).";
  }

  // Basic Prompt Injection Defense
  const sanitize = (str) => String(str).replace(/instruction|system|ignore|bypass/gi, '***');
  const safeNickname = data.nickname ? sanitize(data.nickname) : 'Unknown';

  let eventContext = '';

  switch (eventType) {
    case 'HOT_STREAK':
      eventContext = `Player ${safeNickname} is on fire with a ${data.streak}-question correct streak! Hype them up!`;
      break;
    case 'COLD_STREAK':
      eventContext = `Player ${safeNickname} has gotten ${data.wrongStreak} questions wrong in a row. Give them some gentle, humorous encouragement (or light teasing).`;
      break;
    default:
      // Strip out the raw JSON stringify to prevent complex injections
      eventContext = `A generic event occurred for player ${safeNickname}.`;
  }

  const userPrompt = `Event Type: ${eventType}\nContext: ${eventContext}\n\nGenerate your host commentary now:`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.8,
      }
    });
    
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Oof, I seem to have lost my voice! (AI Error)";
  }
}

/**
 * Autonomous Background Agent Task
 * Reads the syllabus and generates a JSON array of questions for the upcoming week.
 */
export async function generateSyllabusQuiz() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing API Key");
  }

  const syllabusText = fs.readFileSync('sample_syllabus.txt', 'utf-8');

  const SYLLABUS_PROMPT = `
You are an autonomous teacher's assistant agent.
Read the following syllabus. Identify the topic for the "UPCOMING" week.
Generate a 5-question multiple-choice quiz about that topic.
Return EXACTLY a JSON array of question objects.
Syllabus:
${syllabusText}
  `;

  // Define the required JSON schema for the output
  const questionSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        text: { type: Type.STRING },
        options: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING } 
        },
        correctIndex: { type: Type.INTEGER },
        timeLimit: { type: Type.INTEGER },
        explanation: { type: Type.STRING }
      },
      required: ["id", "text", "options", "correctIndex", "timeLimit", "explanation"],
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: SYLLABUS_PROMPT,
      config: {
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        temperature: 0.2,
      }
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Failed to generate syllabus quiz:", error);
    throw error;
  }
}

/**
 * Post-Game Tutor Agent
 * Explains why a player's answer was wrong using a multi-turn conversation.
 * @param {string} questionText - The question that was asked
 * @param {string} playerAnswer - What the player answered
 * @param {string} correctAnswer - The correct answer
 * @param {Array} history - Previous messages [{role: 'user'|'model', parts: [{text}]}]
 * @returns {Promise<string>} The tutor's explanation
 */
export async function generateTutorResponse(questionText, playerAnswer, correctAnswer, history = []) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing API Key");
  }

  // Build the initial user message if history is empty (first call)
  let contents = history.length > 0
    ? history
    : [{
        role: 'user',
        parts: [{
          text: `I just answered a quiz question wrong. Here are the details:
Question: "${questionText}"
My answer: "${playerAnswer}"
Correct answer: "${correctAnswer}"

Please explain why my answer was wrong and help me understand the correct concept.`
        }]
      }];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: TUTOR_SYSTEM_PROMPT,
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Tutor Agent Error:", error);
    throw error;
  }
}
