import { GoogleGenAI, Type } from "@google/genai";
import { PlanetType, Difficulty, MissionData } from "../types";

// Helper to silence TS errors. 
// Vite replaces 'process.env.API_KEY' with the string value at build time.
declare const process: any;

// Subtopics to ensure variety (simulating a large database of 500+ questions)
const SUBTOPICS: Record<PlanetType, string[]> = {
  [PlanetType.NATURE]: ["Rainforest Animals", "Desert Survival", "Insects & Bugs", "Birds", "Mammals", "Reptiles", "Plant Life", "Endangered Species", "Camouflage", "Arctic Animals", "Baby Animals"],
  [PlanetType.SCIENCE]: ["Chemistry", "Physics", "The Human Body", "Microorganisms", "Robots & AI", "Famous Inventors", "Electricity", "Weather", "Simple Machines", "Atoms", "Magnets"],
  [PlanetType.HISTORY]: ["Ancient Egypt", "The Roman Empire", "Medieval Knights", "Vikings", "The Stone Age", "Dinosaurs & Prehistory", "World Explorers", "Ancient China", "Greek Mythology", "Pirates", "Castles"],
  [PlanetType.SPACE]: ["The Solar System", "Black Holes", "Constellations", "Space Travel", "The Moon", "Mars", "Asteroids & Comets", "Astronauts", "Galaxies", "The Sun", "Aliens (in movies)"],
  [PlanetType.OCEAN]: ["Sharks", "Whales & Dolphins", "Coral Reefs", "Deep Sea Creatures", "Shipwrecks", "Tides & Waves", "Jellyfish", "Seahorses", "Octopuses", "Crabs & Lobsters", "Penguins"],
  [PlanetType.ART]: ["Famous Painters", "Musical Instruments", "Classical Music", "Modern Art", "Sculpture", "Dance", "Colors", "Architecture", "Photography", "Pottery", "Movies"]
};

const getRandomSubtopic = (category: PlanetType): string => {
    const topics = SUBTOPICS[category] || ["General Knowledge"];
    return topics[Math.floor(Math.random() * topics.length)];
};

const getDifficultyInstruction = (difficulty: Difficulty): string => {
  switch (difficulty) {
    case 'hard':
      return "Difficulty: HARD (Age 10-12). Questions should be challenging details.";
    case 'medium':
      return "Difficulty: MEDIUM (Age 8-10). Questions should be moderately challenging.";
    case 'easy':
    default:
      return "Difficulty: EASY (Age 6-8). Questions should be simple and very well-known.";
  }
}

// Helper to safely get API key 
const getApiKey = (): string | undefined => {
  try {
    // Direct access allows Vite to perform the string replacement of 'process.env.API_KEY'
    // Do NOT check typeof process here, as it will fail in browser.
    return process.env.API_KEY; 
  } catch (e) {
    return undefined;
  }
};

// Generate a full mission with topic, fact, and questions
export const generateMission = async (category: PlanetType, difficulty: Difficulty, count: number): Promise<MissionData> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("API Key is missing. Please create a .env file with API_KEY=your_key and restart the server.");
  }

  // Initialize client only when needed
  const ai = new GoogleGenAI({ apiKey });

  const subtopic = getRandomSubtopic(category);
  const difficultyPrompt = getDifficultyInstruction(difficulty);
  
  const safeCount = Math.max(1, count || 3);

  const systemInstruction = `You are a friendly educational game host for children. 
  Create a mission about "${subtopic}" (Category: ${category}).
  ${difficultyPrompt}
  
  First, provide a "Mission Briefing" which is ONE interesting, educational fact about the topic that a child might not know.
  Then, generate exactly ${safeCount} multiple-choice trivia questions about the topic.
  Ensure each 'explanation' in the questions is a fun fact related to the answer.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a mission for ${subtopic}.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING, description: "The specific subtopic chosen" },
            fact: { type: Type.STRING, description: "A fun educational fact about the topic for the mission briefing" },
            questions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING, description: "The trivia question" },
                        options: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING },
                        description: "4 possible answers"
                        },
                        correctAnswerIndex: { type: Type.INTEGER },
                        explanation: { type: Type.STRING, description: "Fun fact explanation" }
                    },
                    required: ["question", "options", "correctAnswerIndex", "explanation"]
                }
            }
          },
          required: ["topic", "fact", "questions"]
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    const data = JSON.parse(jsonText) as MissionData;
    
    // Fallback if AI returns fewer than asked
    if (data.questions.length < safeCount) {
        while(data.questions.length < safeCount) {
            data.questions.push(data.questions[0]); 
        }
    }
    
    return data;

  } catch (error) {
    console.error("Error generating mission:", error);
    
    // Check if it's the specific API key error to re-throw
    if ((error as Error).message.includes("API Key")) {
        throw error;
    }

    // Enhanced Fallback for other errors (network, etc)
    return {
        topic: "Space Exploration",
        fact: "Did you know that space is completely silent because there is no air to carry sound waves?",
        questions: [
            {
            question: "Which planet is known as the Red Planet?",
            options: ["Earth", "Mars", "Jupiter", "Venus"],
            correctAnswerIndex: 1,
            explanation: "Mars looks red because of rusty iron in the ground!"
            },
            {
            question: "How many legs does a spider have?",
            options: ["Six", "Eight", "Ten", "Four"],
            correctAnswerIndex: 1,
            explanation: "Spiders are arachnids, so they always have 8 legs!"
            },
            {
            question: "What do bees make?",
            options: ["Milk", "Honey", "Jam", "Chocolate"],
            correctAnswerIndex: 1,
            explanation: "Bees make honey from the nectar of flowers!"
            }
        ].slice(0, safeCount)
    };
  }
};