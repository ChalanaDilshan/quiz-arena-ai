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

  let eventContext = '';

  switch (eventType) {
    case 'HOT_STREAK':
      eventContext = `Player ${data.nickname} is on fire with a ${data.streak}-question correct streak! Hype them up!`;
      break;
    case 'COLD_STREAK':
      eventContext = `Player ${data.nickname} has gotten ${data.wrongStreak} questions wrong in a row. Give them some gentle, humorous encouragement (or light teasing).`;
      break;
    default:
      eventContext = `A generic event occurred: ${JSON.stringify(data)}`;
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
