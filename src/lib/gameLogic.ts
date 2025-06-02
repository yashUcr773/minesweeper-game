import { Cell, GameConfig, GameState, GameStatus } from '../types/game';

/**
 * Creates an empty grid with the specified dimensions
 */
export function createEmptyGrid(width: number, height: number): Cell[][] {
  const grid: Cell[][] = [];
  
  for (let y = 0; y < height; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < width; x++) {
      row.push({
        id: `${x}-${y}`,
        x,
        y,
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0
      });
    }
    grid.push(row);
  }
  
  return grid;
}

/**
 * Places mines randomly on the grid, ensuring the first click is safe
 */
export function placeMines(
  grid: Cell[][],
  config: GameConfig,
  firstClickX: number,
  firstClickY: number
): Cell[][] {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
  const { width, height, mines } = config;
  
  // Get all positions except the first click and its neighbors
  const availablePositions: { x: number; y: number }[] = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Skip first click position and its neighbors
      if (Math.abs(x - firstClickX) <= 1 && Math.abs(y - firstClickY) <= 1) {
        continue;
      }
      availablePositions.push({ x, y });
    }
  }
  
  // Randomly select mine positions
  const minePositions = [];
  const shuffled = [...availablePositions].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < Math.min(mines, shuffled.length); i++) {
    minePositions.push(shuffled[i]);
  }
  
  // Place mines
  minePositions.forEach(({ x, y }) => {
    newGrid[y][x].isMine = true;
  });
  
  // Calculate adjacent mine counts
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!newGrid[y][x].isMine) {
        newGrid[y][x].adjacentMines = countAdjacentMines(newGrid, x, y);
      }
    }
  }
  
  return newGrid;
}

/**
 * Counts the number of mines adjacent to a cell
 */
export function countAdjacentMines(grid: Cell[][], x: number, y: number): number {
  let count = 0;
  const height = grid.length;
  const width = grid[0].length;
  
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      
      const newX = x + dx;
      const newY = y + dy;
      
      if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
        if (grid[newY][newX].isMine) {
          count++;
        }
      }
    }
  }
  
  return count;
}

/**
 * Reveals a cell and potentially cascades to reveal adjacent empty cells
 */
export function revealCell(grid: Cell[][], x: number, y: number): Cell[][] {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
  const height = grid.length;
  const width = grid[0].length;
  
  if (x < 0 || x >= width || y < 0 || y >= height) return newGrid;
  
  const cell = newGrid[y][x];
  
  if (cell.isRevealed || cell.isFlagged) return newGrid;
  
  cell.isRevealed = true;
  
  // If the cell has no adjacent mines, reveal all adjacent cells
  if (cell.adjacentMines === 0 && !cell.isMine) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        
        const newX = x + dx;
        const newY = y + dy;
        
        if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
          if (!newGrid[newY][newX].isRevealed && !newGrid[newY][newX].isFlagged) {
            const updatedGrid = revealCell(newGrid, newX, newY);
            // Copy the changes back
            for (let i = 0; i < height; i++) {
              for (let j = 0; j < width; j++) {
                newGrid[i][j] = updatedGrid[i][j];
              }
            }
          }
        }
      }
    }
  }
  
  return newGrid;
}

/**
 * Toggles the flag state of a cell
 */
export function toggleFlag(grid: Cell[][], x: number, y: number): Cell[][] {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
  const cell = newGrid[y][x];
  
  if (!cell.isRevealed) {
    cell.isFlagged = !cell.isFlagged;
  }
  
  return newGrid;
}

/**
 * Checks if the game is won (all non-mine cells revealed)
 */
export function checkWinCondition(grid: Cell[][]): boolean {
  for (const row of grid) {
    for (const cell of row) {
      if (!cell.isMine && !cell.isRevealed) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Reveals all mines (used when game is lost)
 */
export function revealAllMines(grid: Cell[][]): Cell[][] {
  return grid.map(row =>
    row.map(cell => ({
      ...cell,
      isRevealed: cell.isRevealed || cell.isMine
    }))
  );
}

/**
 * Gets the number of flags used
 */
export function getFlagsUsed(grid: Cell[][]): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.isFlagged) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Gets the number of cells revealed
 */
export function getCellsRevealed(grid: Cell[][]): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.isRevealed) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Creates initial game state
 */
export function createInitialGameState(config: GameConfig): GameState {
  return {
    grid: createEmptyGrid(config.width, config.height),
    config,
    status: GameStatus.READY,
    stats: {
      timeElapsed: 0,
      flagsUsed: 0,
      cellsRevealed: 0
    },
    firstClick: true
  };
}
