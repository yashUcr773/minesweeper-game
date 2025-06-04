// Seeded random number generator for deterministic puzzle generation
export class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    this.seed = this.hashCode(seed);
  }

  private hashCode(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Linear congruential generator
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 0x100000000;
    return this.seed / 0x100000000;
  }

  // Generate integer between min (inclusive) and max (exclusive)
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }
}

export interface PuzzleConfig {
  width: number;
  height: number;
  mines: number;
  seed: string;
}

export interface PuzzleData {
  mines: boolean[][];
  revealed: boolean[][];
  flagged: boolean[][];
  gameStarted: boolean;
  gameEnded: boolean;
  gameWon: boolean;
  firstClick: boolean;
}

export function generateDeterministicPuzzle(config: PuzzleConfig): PuzzleData {
  const { width, height, mines: mineCount, seed } = config;
  const rng = new SeededRandom(seed);

  // Initialize empty board
  const mines: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));
  const revealed: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));
  const flagged: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));

  // Place mines randomly using seeded RNG
  let placedMines = 0;
  while (placedMines < mineCount) {
    const row = rng.nextInt(0, height);
    const col = rng.nextInt(0, width);

    if (!mines[row][col]) {
      mines[row][col] = true;
      placedMines++;
    }
  }

  return {
    mines,
    revealed,
    flagged,
    gameStarted: false,
    gameEnded: false,
    gameWon: false,
    firstClick: true
  };
}

// Generate mine counts for display
export function generateMineCounts(mines: boolean[][], width: number, height: number): number[][] {
  const counts: number[][] = Array(height).fill(null).map(() => Array(width).fill(0));

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (!mines[row][col]) {
        let count = 0;
        // Check all 8 surrounding cells
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < height && newCol >= 0 && newCol < width) {
              if (mines[newRow][newCol]) {
                count++;
              }
            }
          }
        }
        counts[row][col] = count;
      }
    }
  }

  return counts;
}
