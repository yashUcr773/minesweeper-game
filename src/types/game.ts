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
  CUSTOM = 'custom'
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, GameConfig> = {
  [Difficulty.BEGINNER]: { width: 9, height: 9, mines: 10 },
  [Difficulty.INTERMEDIATE]: { width: 16, height: 16, mines: 40 },
  [Difficulty.EXPERT]: { width: 30, height: 16, mines: 99 },
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
