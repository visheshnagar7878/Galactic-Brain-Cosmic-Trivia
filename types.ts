export enum GameState {
  MENU = 'MENU',
  MAP = 'MAP',
  TRAVELING = 'TRAVELING',
  TRIVIA = 'TRIVIA',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export enum PlanetType {
  NATURE = 'NATURE',
  HISTORY = 'HISTORY',
  SCIENCE = 'SCIENCE',
  SPACE = 'SPACE',
  OCEAN = 'OCEAN',
  ART = 'ART'
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface PlanetData {
  id: PlanetType;
  name: string;
  color: string;
  icon: string;
  description: string;
  completed: boolean;
  position: { x: number; y: number }; // Percentage 0-100
}

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string; // Fun fact
}

export interface PlayerStats {
  name: string;
  fuel: number;
  score: number;
  badges: PlanetType[];
  difficulty: Difficulty;
}