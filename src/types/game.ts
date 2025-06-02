export interface Cell {
  id: string;
  x: number;
  y: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  isFalseFlag: boolean; // Changed from optional to required
  adjacentMines: number;  isExploding?: boolean; // Animation state for bomb explosions
  explosionDelay?: number; // Delay before this bomb explodes (in ms)
  isTriggeredMine?: boolean; // True if this is the mine that was initially clicked
}

export interface GameConfig {
  width: number;
  height: number;
  mines: number;
}

export enum GameStatus {
  READY = 'ready',
  PLAYING = 'playing',
  WON = 'won',
  LOST = 'lost'
}

export enum Difficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  EXPERT = 'expert',
  MASTER = 'master',
  INSANE = 'insane',
  EXTREME = 'extreme',
  CUSTOM = 'custom'
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, GameConfig> = {
  [Difficulty.BEGINNER]: { width: 9, height: 9, mines: 10 },
  [Difficulty.INTERMEDIATE]: { width: 16, height: 16, mines: 40 },
  [Difficulty.EXPERT]: { width: 30, height: 16, mines: 99 },
  [Difficulty.MASTER]: { width: 40, height: 20, mines: 200 },
  [Difficulty.INSANE]: { width: 50, height: 25, mines: 400 },
  [Difficulty.EXTREME]: { width: 60, height: 30, mines: 650 },
  [Difficulty.CUSTOM]: { width: 9, height: 9, mines: 10 }
};

export interface GameStats {
  timeElapsed: number;
  flagsUsed: number;
  cellsRevealed: number;
}

export interface GameState {
  grid: Cell[][];
  config: GameConfig;
  status: GameStatus;
  stats: GameStats;
  firstClick: boolean;
}

export interface CustomGameConfig {
  width: number;
  height: number;
  mines: number;
}

export interface CustomGameConstraints {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  minMines: number;
  maxMinePercentage: number;
}

export const CUSTOM_GAME_CONSTRAINTS: CustomGameConstraints = {
  minWidth: 5,
  maxWidth: 99,
  minHeight: 5,
  maxHeight: 99,
  minMines: 1,
  maxMinePercentage: 80 // Maximum 80% of cells can be mines
};

// User Authentication Types
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  lastActive: string;
}

export interface AuthUser extends User {
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  username: string;
  email: string;
  password: string;
}

// Leaderboard Types
export interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  difficulty: Difficulty;
  timeElapsed: number;
  score: number;
  completedAt: string;
  config: GameConfig;
}

export interface LeaderboardFilters {
  difficulty?: Difficulty;
  timeRange?: 'day' | 'week' | 'month' | 'all';
  limit?: number;
}

export interface LeaderboardStats {
  totalGames: number;
  bestTime: number;
  averageTime: number;
  winRate: number;
  favoriteDifficulty: Difficulty;
}
