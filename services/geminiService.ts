import { GoogleGenAI, Type } from "@google/genai";
import { PlanetType, TriviaQuestion, Difficulty } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

// Generate a list of questions for a mission
export const generateTrivia = async (category: PlanetType, difficulty: Difficulty, count: number): Promise<TriviaQuestion[]> => {
  const subtopic = getRandomSubtopic(category);
  const difficultyPrompt = getDifficultyInstruction(difficulty);
  
  // Ensure count is at least 1, default to 3 if something goes wrong upstream
  const safeCount = Math.max(1, count || 3);

  const systemInstruction = `You are a friendly educational game host for children. 
  Generate exactly ${safeCount} distinct multiple-choice trivia questions about "${subtopic}" (Category: ${category}). 
  ${difficultyPrompt}
  The tone should be fun and energetic.
  Ensure each 'explanation' is a fun fact related to the answer.
  Avoid repeating common questions; try to find interesting, unique facts.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate exactly ${safeCount} trivia questions about ${subtopic}.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
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
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    const data = JSON.parse(jsonText);
    
    // Fallback if AI returns fewer than asked
    let questions = data.questions as TriviaQuestion[];
    if (questions.length < safeCount) {
        console.warn(`Gemini returned ${questions.length} questions, expected ${safeCount}. Filling with duplicates.`);
        while(questions.length < safeCount) {
            questions.push(questions[0]); 
        }
    }
    
    return questions;

  } catch (error) {
    console.error("Error generating trivia:", error);
    
    // Enhanced Fallback Pool
    const fallbackPool = [
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
        },
        {
            question: "Which animal is the tallest in the world?",
            options: ["Elephant", "Giraffe", "Zebra", "Lion"],
            correctAnswerIndex: 1,
            explanation: "Giraffes are the tallest land animals, thanks to their long necks!"
        },
        {
            question: "What freezes to become ice?",
            options: ["Water", "Sand", "Air", "Fire"],
            correctAnswerIndex: 0,
            explanation: "When water gets very cold (0°C), it turns into solid ice!"
        }
    ];
    
    // Return a random slice of fallback questions
    const shuffled = fallbackPool.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, safeCount);
  }
};