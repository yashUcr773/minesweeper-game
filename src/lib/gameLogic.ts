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
 * Places mines on the grid with improved logic to minimize 50/50 guessing situations
 */
export function placeMines(
  grid: Cell[][],
  config: GameConfig,
  firstClickX: number,
  firstClickY: number
): Cell[][] {
  const { width, height, mines } = config;
  
  // Try multiple mine placements and pick the best one
  const maxAttempts = Math.min(50, mines * 2); // Limit attempts for performance
  let bestGrid: Cell[][] | null = null;
  let bestScore = -Infinity;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidateGrid = generateSingleMineLayout(grid, config, firstClickX, firstClickY);
    const score = evaluateMineLayout(candidateGrid, width, height);
    
    if (score > bestScore) {
      bestScore = score;
      bestGrid = candidateGrid;
    }
    
    // If we find a very good layout, use it early
    if (score >= 0.8 * mines) break;
  }
  
  return bestGrid || generateSingleMineLayout(grid, config, firstClickX, firstClickY);
}

/**
 * Generates a single mine layout using random placement
 */
function generateSingleMineLayout(
  grid: Cell[][],
  config: GameConfig,
  firstClickX: number,
  firstClickY: number
): Cell[][] {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell, isMine: false })));
  const { width, height, mines } = config;
  
  // Get all positions except the first click and its neighbors
  const availablePositions: { x: number; y: number }[] = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Skip first click position and its neighbors for a larger safe zone
      if (Math.abs(x - firstClickX) <= 1 && Math.abs(y - firstClickY) <= 1) {
        continue;
      }
      availablePositions.push({ x, y });
    }
  }
  
  // Use Fisher-Yates shuffle for better randomness
  for (let i = availablePositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availablePositions[i], availablePositions[j]] = [availablePositions[j], availablePositions[i]];
  }
  
  // Place mines
  const minesToPlace = Math.min(mines, availablePositions.length);
  for (let i = 0; i < minesToPlace; i++) {
    const { x, y } = availablePositions[i];
    newGrid[y][x].isMine = true;
  }
  
  // Calculate adjacent mine counts
  calculateAdjacentMineCounts(newGrid, width, height);
  
  return newGrid;
}

/**
 * Evaluates the quality of a mine layout to minimize guessing situations
 */
function evaluateMineLayout(grid: Cell[][], width: number, height: number): number {
  let score = 0;
  
  // Analyze each non-mine cell for potential problematic patterns
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!grid[y][x].isMine) {
        score += evaluateCellPattern(grid, x, y, width, height);
      }
    }
  }
  
  return score;
}

/**
 * Evaluates a specific cell's pattern to detect potential 50/50 situations
 */
function evaluateCellPattern(grid: Cell[][], x: number, y: number, width: number, height: number): number {
  const adjacentMines = grid[y][x].adjacentMines;
  let score = 0;
  
  // Bonus for cells with clear, unambiguous numbers
  if (adjacentMines === 1 || adjacentMines === 2) {
    score += 2;
  } else if (adjacentMines === 3 || adjacentMines === 4) {
    score += 1;
  }
  
  // Check for common 50/50 patterns and penalize them
  score -= detectFiftyFiftyPatterns(grid, x, y, width, height);
  
  // Bonus for cells that provide good information density
  score += calculateInformationValue(grid, x, y, width, height);
  
  return score;
}

/**
 * Detects common 50/50 guessing patterns
 */
function detectFiftyFiftyPatterns(grid: Cell[][], x: number, y: number, width: number, height: number): number {
  let penalty = 0;
  const cell = grid[y][x];
  
  // Check for adjacent cells that form potential 50/50 situations
  const neighbors = getNeighbors(x, y, width, height);
  
  // Pattern 1: Two adjacent cells with same number, creating ambiguity
  for (const neighbor of neighbors) {
    const neighborCell = grid[neighbor.y][neighbor.x];
    if (!neighborCell.isMine && neighborCell.adjacentMines === cell.adjacentMines && cell.adjacentMines > 0) {
      // Check if they share enough common neighbors to create ambiguity
      const commonNeighbors = getCommonNeighbors(x, y, neighbor.x, neighbor.y, width, height);
      if (commonNeighbors.length >= 2) {
        penalty += 3;
      }
    }
  }
  
  // Pattern 2: Corners and edges that often lead to guessing
  if (isCorner(x, y, width, height) && cell.adjacentMines >= 2) {
    penalty += 2;
  }
  
  // Pattern 3: Linear patterns that create cascading uncertainty
  if (detectLinearAmbiguity(grid, x, y, width, height)) {
    penalty += 4;
  }
  
  return penalty;
}

/**
 * Calculates the information value of a cell (how much it helps solve the puzzle)
 */
function calculateInformationValue(grid: Cell[][], x: number, y: number, width: number, height: number): number {
  const cell = grid[y][x];
  let value = 0;
  
  // Cells with moderate numbers provide good information
  if (cell.adjacentMines >= 1 && cell.adjacentMines <= 3) {
    value += 1;
  }
  
  // Cells that break symmetry are valuable
  const neighbors = getNeighbors(x, y, width, height);
  const mineNeighbors = neighbors.filter(n => grid[n.y][n.x].isMine);
  
  // Asymmetric mine distribution is often more solvable
  if (mineNeighbors.length > 0) {
    const asymmetryBonus = calculateAsymmetryBonus(mineNeighbors, x, y);
    value += asymmetryBonus;
  }
  
  return value;
}

/**
 * Helper function to get valid neighbors of a cell
 */
function getNeighbors(x: number, y: number, width: number, height: number): { x: number; y: number }[] {
  const neighbors: { x: number; y: number }[] = [];
  
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      
      const newX = x + dx;
      const newY = y + dy;
      
      if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
        neighbors.push({ x: newX, y: newY });
      }
    }
  }
  
  return neighbors;
}

/**
 * Gets common neighbors between two cells
 */
function getCommonNeighbors(x1: number, y1: number, x2: number, y2: number, width: number, height: number): { x: number; y: number }[] {
  const neighbors1 = getNeighbors(x1, y1, width, height);
  const neighbors2 = getNeighbors(x2, y2, width, height);
  
  return neighbors1.filter(n1 => 
    neighbors2.some(n2 => n1.x === n2.x && n1.y === n2.y)
  );
}

/**
 * Checks if a cell is in a corner
 */
function isCorner(x: number, y: number, width: number, height: number): boolean {
  return (x === 0 || x === width - 1) && (y === 0 || y === height - 1);
}

/**
 * Detects linear patterns that can create ambiguity
 */
function detectLinearAmbiguity(grid: Cell[][], x: number, y: number, width: number, height: number): boolean {
  // Check for straight lines of similar numbers that can create uncertainty
  const directions = [
    [1, 0], [-1, 0], [0, 1], [0, -1], // horizontal and vertical
    [1, 1], [-1, -1], [1, -1], [-1, 1] // diagonal
  ];
  
  for (const [dx, dy] of directions) {
    let lineLength = 1;
    const currentNumber = grid[y][x].adjacentMines;
    
    // Check in positive direction
    let checkX = x + dx;
    let checkY = y + dy;
    while (checkX >= 0 && checkX < width && checkY >= 0 && checkY < height) {
      if (grid[checkY][checkX].isMine || grid[checkY][checkX].adjacentMines !== currentNumber) {
        break;
      }
      lineLength++;
      checkX += dx;
      checkY += dy;
    }
    
    // Check in negative direction
    checkX = x - dx;
    checkY = y - dy;
    while (checkX >= 0 && checkX < width && checkY >= 0 && checkY < height) {
      if (grid[checkY][checkX].isMine || grid[checkY][checkX].adjacentMines !== currentNumber) {
        break;
      }
      lineLength++;
      checkX -= dx;
      checkY -= dy;
    }
    
    // Lines of 3+ identical numbers can create ambiguity
    if (lineLength >= 3 && currentNumber > 0) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calculates bonus for asymmetric mine placement
 */
function calculateAsymmetryBonus(mineNeighbors: { x: number; y: number }[], centerX: number, centerY: number): number {
  if (mineNeighbors.length <= 1) return 0;
  
  // Calculate center of mass of mines
  let avgX = 0;
  let avgY = 0;
  for (const mine of mineNeighbors) {
    avgX += mine.x;
    avgY += mine.y;
  }
  avgX /= mineNeighbors.length;
  avgY /= mineNeighbors.length;
  
  // Distance from center indicates asymmetry
  const asymmetry = Math.sqrt((avgX - centerX) ** 2 + (avgY - centerY) ** 2);
  return Math.min(asymmetry, 1); // Cap the bonus
}

/**
 * Recalculates adjacent mine counts for all cells
 */
function calculateAdjacentMineCounts(grid: Cell[][], width: number, height: number): void {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!grid[y][x].isMine) {
        grid[y][x].adjacentMines = countAdjacentMines(grid, x, y);
      }
    }
  }
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

/**
 * Debug function to analyze and log mine layout quality (development only)
 */
export function analyzeMineLayout(grid: Cell[][], width: number, height: number): {
  score: number;
  fiftyFiftyCount: number;
  informationDensity: number;
} {
  const score = evaluateMineLayout(grid, width, height);
  let fiftyFiftyCount = 0;
  let totalInformation = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!grid[y][x].isMine) {
        const penalty = detectFiftyFiftyPatterns(grid, x, y, width, height);
        if (penalty > 2) fiftyFiftyCount++;
        
        const info = calculateInformationValue(grid, x, y, width, height);
        totalInformation += info;
      }
    }
  }
  
  return {
    score,
    fiftyFiftyCount,
    informationDensity: totalInformation / (width * height)
  };
}

/**
 * Export helper function for testing different mine generation strategies
 */
export function compareGenerationStrategies(
  grid: Cell[][],
  config: GameConfig,
  firstClickX: number,
  firstClickY: number,
  attempts: number = 10
): void {
  console.log('🧪 Mine Generation Strategy Comparison:');
  
  let totalOldFiftyFifty = 0;
  let totalNewFiftyFifty = 0;
  let totalOldScore = 0;
  let totalNewScore = 0;
  
  for (let i = 0; i < attempts; i++) {
    // Test old strategy (single random generation)
    const oldGrid = generateSingleMineLayout(grid, config, firstClickX, firstClickY);
    const oldAnalysis = analyzeMineLayout(oldGrid, config.width, config.height);
    
    // Test new strategy (multiple attempts with scoring)
    const newGrid = placeMines(grid, config, firstClickX, firstClickY);
    const newAnalysis = analyzeMineLayout(newGrid, config.width, config.height);
    
    totalOldFiftyFifty += oldAnalysis.fiftyFiftyCount;
    totalNewFiftyFifty += newAnalysis.fiftyFiftyCount;
    totalOldScore += oldAnalysis.score;
    totalNewScore += newAnalysis.score;
  }
  
  console.log(`📊 Results over ${attempts} generations:`);
  console.log(`   Old Strategy - Avg 50/50 situations: ${(totalOldFiftyFifty / attempts).toFixed(1)}`);
  console.log(`   New Strategy - Avg 50/50 situations: ${(totalNewFiftyFifty / attempts).toFixed(1)}`);
  console.log(`   Old Strategy - Avg Score: ${(totalOldScore / attempts).toFixed(1)}`);
  console.log(`   New Strategy - Avg Score: ${(totalNewScore / attempts).toFixed(1)}`);
  console.log(`   Improvement: ${(((totalOldFiftyFifty - totalNewFiftyFifty) / totalOldFiftyFifty) * 100).toFixed(1)}% fewer 50/50 situations`);
}

// Development utilities - accessible from browser console
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).minesweeperDebug = {
    enableComparison: () => {
      localStorage.setItem('minesweeper-debug-comparison', 'true');
      console.log('🔧 Mine generation comparison enabled for next game start');
    },
    disableComparison: () => {
      localStorage.removeItem('minesweeper-debug-comparison');
      console.log('🔧 Mine generation comparison disabled');
    },
    testGenerationQuality: (attempts = 10) => {
      console.log(`🧪 Testing mine generation quality with ${attempts} attempts...`);
      // This would need to be called with actual game parameters
      console.log('Use this in a real game context for meaningful results');
    }
  };
}
