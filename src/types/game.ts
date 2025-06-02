export interface Cell {
  id: string;
  x: number;
  y: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
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
