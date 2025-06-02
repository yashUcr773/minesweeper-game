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
 * Advanced mine placement with constraint satisfaction and solvability analysis
 */
export function placeMinesAdvanced(
  grid: Cell[][],
  config: GameConfig,
  firstClickX: number,
  firstClickY: number
): Cell[][] {
  const { width, height, mines } = config;
  
  // Use different strategies based on board size and mine density
  const mineDensity = mines / (width * height);
  const strategy = selectOptimalStrategy(width, height, mineDensity);
  
  let bestGrid: Cell[][] | null = null;
  let bestScore = -Infinity;
  let attempts = 0;
  const maxAttempts = strategy.maxAttempts;
    // Try generating layouts until we find a good one or exhaust attempts
  while (attempts < maxAttempts && bestScore < strategy.targetScore) {
    let candidateGrid: Cell[][];
    
    switch (strategy.method) {
      case 'constraint-satisfaction':
        candidateGrid = generateConstraintSatisfiedLayout(grid, config, firstClickX, firstClickY);
        break;
      case 'weighted-zones':
        candidateGrid = generateWeightedZoneLayout(grid, config, firstClickX, firstClickY);
        break;
      case 'pattern-aware':
        candidateGrid = generatePatternAwareLayout(grid, config, firstClickX, firstClickY);
        break;
      default:
        candidateGrid = generateSingleMineLayout(grid, config, firstClickX, firstClickY);
    }
    
    const score = evaluateMineLayoutAdvanced(candidateGrid, width, height, strategy);
    
    if (score > bestScore) {
      bestScore = score;
      bestGrid = candidateGrid;
      
      // Early exit if we found an excellent layout
      if (score >= strategy.targetScore) {
        break;
      }
    }
    
    attempts++;
  }
  
  // Fallback to ensure we always return a valid grid
  return bestGrid || generateSingleMineLayout(grid, config, firstClickX, firstClickY);
}

/**
 * Selects optimal generation strategy based on board characteristics
 */
function selectOptimalStrategy(width: number, height: number, mineDensity: number): GenerationStrategy {
  const totalCells = width * height;
  
  // High-density boards need more sophisticated constraint satisfaction
  if (mineDensity > 0.2) {
    return {
      method: 'constraint-satisfaction',
      maxAttempts: Math.min(100, totalCells),
      targetScore: totalCells * 0.9,
      weights: { solvability: 0.6, symmetry: 0.2, distribution: 0.2 }
    };
  }
  
  // Medium boards benefit from weighted zone placement
  if (totalCells > 256 && mineDensity > 0.15) {
    return {
      method: 'weighted-zones',
      maxAttempts: 75,
      targetScore: totalCells * 0.8,
      weights: { solvability: 0.5, symmetry: 0.25, distribution: 0.25 }
    };
  }
  
  // Smaller boards use pattern-aware generation
  return {
    method: 'pattern-aware',
    maxAttempts: 50,
    targetScore: totalCells * 0.7,
    weights: { solvability: 0.7, symmetry: 0.15, distribution: 0.15 }
  };
}

/**
 * Generates layout using constraint satisfaction principles
 */
function generateConstraintSatisfiedLayout(
  grid: Cell[][],
  config: GameConfig,
  firstClickX: number,
  firstClickY: number
): Cell[][] {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell, isMine: false })));
  const { width, height, mines } = config;
  
  // Create zones with different mine placement probabilities
  const zones = createConstraintZones(width, height, firstClickX, firstClickY);
  const minesToPlace = Math.min(mines, zones.available.length);
  
  // Use weighted selection based on zone constraints
  const selectedPositions: { x: number; y: number }[] = [];
  const availablePositions = [...zones.available];
  
  for (let i = 0; i < minesToPlace; i++) {
    if (availablePositions.length === 0) break;
    
    // Calculate placement weights for remaining positions
    const weights = availablePositions.map(pos => 
      calculateConstraintWeight(pos, selectedPositions, zones, width, height)
    );
    
    // Select position using weighted random selection
    const selectedIndex = weightedRandomSelect(weights);
    const selectedPos = availablePositions[selectedIndex];
    
    selectedPositions.push(selectedPos);
    newGrid[selectedPos.y][selectedPos.x].isMine = true;
    
    // Remove selected position and update constraints
    availablePositions.splice(selectedIndex, 1);
    updateConstraints(selectedPos, availablePositions, zones);
  }
  
  calculateAdjacentMineCounts(newGrid, width, height);
  return newGrid;
}

/**
 * Generates layout using weighted zone strategy
 */
function generateWeightedZoneLayout(
  grid: Cell[][],
  config: GameConfig,
  firstClickX: number,
  firstClickY: number
): Cell[][] {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell, isMine: false })));
  const { width, height, mines } = config;
  
  // Divide board into strategic zones
  const zones = {
    corners: getCornerPositions(width, height, firstClickX, firstClickY),
    edges: getEdgePositions(width, height, firstClickX, firstClickY),
    center: getCenterPositions(width, height, firstClickX, firstClickY),
    safe: getSafeZonePositions(width, height, firstClickX, firstClickY)
  };
  
  // Distribute mines across zones with optimal ratios
  const distribution = calculateOptimalDistribution(mines, zones);
  const placedMines: { x: number; y: number }[] = [];
  
  // Place mines in each zone
  Object.entries(distribution).forEach(([zoneName, count]) => {
    const zonePositions = zones[zoneName as keyof typeof zones];
    const shuffled = shuffleArray([...zonePositions]);
    
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      const pos = shuffled[i];
      if (!placedMines.some(p => p.x === pos.x && p.y === pos.y)) {
        newGrid[pos.y][pos.x].isMine = true;
        placedMines.push(pos);
      }
    }
  });
  
  calculateAdjacentMineCounts(newGrid, width, height);
  return newGrid;
}

/**
 * Generates layout with advanced pattern awareness
 */
function generatePatternAwareLayout(
  grid: Cell[][],
  config: GameConfig,
  firstClickX: number,
  firstClickY: number
): Cell[][] {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell, isMine: false })));
  const { width, height, mines } = config;
  
  // Get available positions excluding safe zone
  const availablePositions = getAvailablePositions(width, height, firstClickX, firstClickY);
  const minesToPlace = Math.min(mines, availablePositions.length);
  
  // Use iterative placement with pattern checking
  const placedMines: { x: number; y: number }[] = [];
  
  for (let i = 0; i < minesToPlace; i++) {
    const candidates = availablePositions.filter(pos => 
      !placedMines.some(mine => mine.x === pos.x && mine.y === pos.y)
    );
    
    if (candidates.length === 0) break;
    
    // Score each candidate position
    const scores = candidates.map(pos => {
      const tempGrid = cloneGrid(newGrid);
      tempGrid[pos.y][pos.x].isMine = true;
      calculateAdjacentMineCounts(tempGrid, width, height);
      
      return {
        position: pos,
        score: evaluatePatternScore(tempGrid, pos.x, pos.y, placedMines, width, height)
      };
    });
    
    // Select best position or use weighted random for diversity
    const bestCandidates = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(5, scores.length)); // Top 5 candidates
    
    const selectedCandidate = bestCandidates[Math.floor(Math.random() * bestCandidates.length)];
    const selectedPos = selectedCandidate.position;
    
    newGrid[selectedPos.y][selectedPos.x].isMine = true;
    placedMines.push(selectedPos);
  }
  
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
 * Advanced layout evaluation with multiple criteria
 */
function evaluateMineLayoutAdvanced(
  grid: Cell[][], 
  width: number, 
  height: number, 
  strategy: GenerationStrategy
): number {
  let totalScore = 0;
  const weights = strategy.weights;
  
  // 1. Solvability Analysis
  const solvabilityScore = analyzeSolvability(grid, width, height);
  totalScore += solvabilityScore * weights.solvability;
  
  // 2. Symmetry and Aesthetics
  const symmetryScore = analyzeSymmetry(grid, width, height);
  totalScore += symmetryScore * weights.symmetry;
  
  // 3. Mine Distribution Quality
  const distributionScore = analyzeMineDistribution(grid, width, height);
  totalScore += distributionScore * weights.distribution;
  
  // 4. Pattern Complexity (avoid trivial or impossible patterns)
  const complexityScore = analyzePatternComplexity(grid, width, height);
  totalScore += complexityScore * 0.1; // Lower weight as it's supplementary
  
  return totalScore;
}

/**
 * Analyzes board solvability using constraint propagation
 */
function analyzeSolvability(grid: Cell[][], width: number, height: number): number {
  let score = 0;
  const problematicPatterns = [];
  
  // Simulate basic constraint propagation
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!grid[y][x].isMine) {
        const cellScore = evaluateCellSolvability(grid, x, y, width, height);
        score += cellScore;
        
        if (cellScore < -5) {
          problematicPatterns.push({ x, y, score: cellScore });
        }
      }
    }
  }
  
  // Heavy penalty for too many problematic patterns
  if (problematicPatterns.length > Math.max(2, (width * height) / 50)) {
    score -= problematicPatterns.length * 10;
  }
  
  return score;
}

/**
 * Evaluates individual cell solvability
 */
function evaluateCellSolvability(grid: Cell[][], x: number, y: number, width: number, height: number): number {
  const cell = grid[y][x];
  const neighbors = getNeighbors(x, y, width, height);
  const mineNeighbors = neighbors.filter(n => grid[n.y][n.x].isMine);
  
  let score = 0;
  
  // Basic constraint satisfaction check
  if (cell.adjacentMines === mineNeighbors.length) {
    score += 5; // Clear constraint
  } else if (cell.adjacentMines > 0) {
    // Check for deducible information
    const unknownNeighbors = neighbors.filter(n => !grid[n.y][n.x].isMine);
    const remainingMines = cell.adjacentMines - mineNeighbors.length;
    
    if (remainingMines === 0) {
      score += 3; // All remaining neighbors are safe
    } else if (remainingMines === unknownNeighbors.length) {
      score += 3; // All remaining neighbors are mines
    } else if (remainingMines === 1 && unknownNeighbors.length === 2) {
      score -= 8; // Potential 50/50 situation
    } else {
      score += 1; // Provides partial information
    }
  }
  
  // Advanced pattern detection
  score -= detectAdvancedProblematicPatterns(grid, x, y, width, height);
  
  return score;
}

/**
 * Detects advanced problematic patterns
 */
function detectAdvancedProblematicPatterns(grid: Cell[][], x: number, y: number, width: number, height: number): number {
  let penalty = 0;
  
  // Tank pattern detection (1-2-1 or 1-2-2-1 patterns)
  penalty += detectTankPatterns(grid, x, y, width, height) * 5;
  
  // Island pattern detection (isolated constraint groups)
  penalty += detectIslandPatterns(grid, x, y, width, height) * 3;
  
  // Density clustering (too many mines in one area)
  penalty += detectDensityClustering(grid, x, y, width, height) * 2;
  
  return penalty;
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

// Helper function interfaces and types
interface GenerationStrategy {
  method: 'constraint-satisfaction' | 'weighted-zones' | 'pattern-aware';
  maxAttempts: number;
  targetScore: number;
  weights: {
    solvability: number;
    symmetry: number;
    distribution: number;
  };
}

interface ConstraintZones {
  available: { x: number; y: number }[];
  forbidden: { x: number; y: number }[];
  preferred: { x: number; y: number }[];
  weights: Map<string, number>;
}

/**
 * Helper function to shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Gets neighbors of a cell within the grid bounds
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
 * Checks if a position is in a corner of the board
 */
function isCorner(x: number, y: number, width: number, height: number): boolean {
  return (x === 0 || x === width - 1) && (y === 0 || y === height - 1);
}

/**
 * Calculates adjacent mine counts for all cells in the grid
 */
function calculateAdjacentMineCounts(grid: Cell[][], width: number, height: number): void {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!grid[y][x].isMine) {
        const neighbors = getNeighbors(x, y, width, height);
        grid[y][x].adjacentMines = neighbors.filter(n => grid[n.y][n.x].isMine).length;
      }
    }
  }
}

/**
 * Simple single mine layout generation (original algorithm)
 */
function generateSingleMineLayout(
  grid: Cell[][],
  config: GameConfig,
  firstClickX: number,
  firstClickY: number
): Cell[][] {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell, isMine: false })));
  const { width, height, mines } = config;
  
  const availablePositions = getAvailablePositions(width, height, firstClickX, firstClickY);
  const minesToPlace = Math.min(mines, availablePositions.length);
  
  const shuffledPositions = shuffleArray(availablePositions);
  
  for (let i = 0; i < minesToPlace; i++) {
    const pos = shuffledPositions[i];
    newGrid[pos.y][pos.x].isMine = true;
  }
  
  calculateAdjacentMineCounts(newGrid, width, height);
  return newGrid;
}

/**
 * Evaluates cell pattern for problematic configurations
 */
function evaluateCellPattern(grid: Cell[][], x: number, y: number, width: number, height: number): number {
  const cell = grid[y][x];
  if (cell.isMine) return 0;
  
  let score = 0;
  
  // Check for specific problematic patterns
  if (cell.adjacentMines > 0) {
    const penalty = detectFiftyFiftyPatterns(grid, x, y, width, height);
    score -= penalty;
    
    const info = calculateInformationValue(grid, x, y, width, height);
    score += info;
  }
  
  return score;
}

/**
 * Detects 50/50 guessing patterns around a cell
 */
function detectFiftyFiftyPatterns(grid: Cell[][], x: number, y: number, width: number, height: number): number {
  const cell = grid[y][x];
  if (cell.isMine || cell.adjacentMines === 0) return 0;
  
  let penalty = 0;
  const neighbors = getNeighbors(x, y, width, height);
  
  // Check for adjacent cells with same numbers that could create ambiguity
  for (const neighbor of neighbors) {
    const neighborCell = grid[neighbor.y][neighbor.x];
    if (!neighborCell.isMine && neighborCell.adjacentMines === cell.adjacentMines) {
      penalty += 1;
    }
  }
  
  // Check for corner traps
  if (isCorner(x, y, width, height) && cell.adjacentMines <= 2) {
    penalty += 2;
  }
  
  return penalty;
}

/**
 * Calculates information value of a cell for solving
 */
function calculateInformationValue(grid: Cell[][], x: number, y: number, width: number, height: number): number {
  const cell = grid[y][x];
  if (cell.isMine) return 0;
  
  let value = 0;
  
  // Higher value for moderate numbers (1-3) which provide good constraints
  if (cell.adjacentMines >= 1 && cell.adjacentMines <= 3) {
    value = cell.adjacentMines;
  } else if (cell.adjacentMines === 0) {
    value = 0.5; // Empty cells help with revealing
  } else {
    value = Math.max(0, 4 - cell.adjacentMines); // Diminishing value for high numbers
  }
  
  // Bonus for cells that provide asymmetric information
  const neighbors = getNeighbors(x, y, width, height);
  const informativeNeighbors = neighbors.filter(n => 
    !grid[n.y][n.x].isMine && grid[n.y][n.x].adjacentMines > 0
  );
  
  if (informativeNeighbors.length > 2) {
    value += 0.5; // Bonus for cells that interact with multiple clues
  }
    return value;
}

/**
 * Creates constraint zones for strategic mine placement
 */
function createConstraintZones(width: number, height: number, firstClickX: number, firstClickY: number): {
  available: { x: number; y: number }[];
  corners: { x: number; y: number }[];
  edges: { x: number; y: number }[];
  center: { x: number; y: number }[];
} {
  const available: { x: number; y: number }[] = [];
  const corners: { x: number; y: number }[] = [];
  const edges: { x: number; y: number }[] = [];
  const center: { x: number; y: number }[] = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Skip safe zone around first click
      if (Math.abs(x - firstClickX) <= 1 && Math.abs(y - firstClickY) <= 1) {
        continue;
      }
      
      const pos = { x, y };
      available.push(pos);
      
      if (isCorner(x, y, width, height)) {
        corners.push(pos);
      } else if (isEdge(x, y, width, height)) {
        edges.push(pos);
      } else {
        center.push(pos);
      }
    }
  }
  
  return { available, corners, edges, center };
}

/**
 * Calculates constraint weight for mine placement
 */
function calculateConstraintWeight(
  pos: { x: number; y: number },
  selectedPositions: { x: number; y: number }[],
  zones: any,
  width: number,
  height: number
): number {
  let weight = 1;
  
  // Reduce weight if too close to other mines
  for (const selected of selectedPositions) {
    const distance = Math.abs(pos.x - selected.x) + Math.abs(pos.y - selected.y);
    if (distance < 2) {
      weight *= 0.5;
    }
  }
  
  // Adjust weight based on zone type
  if (isCorner(pos.x, pos.y, width, height)) {
    weight *= 0.7; // Slightly discourage corners
  } else if (isEdge(pos.x, pos.y, width, height)) {
    weight *= 0.9; // Slightly discourage edges
  } else {
    weight *= 1.2; // Encourage center positions
  }
  
  return weight;
}

/**
 * Weighted random selection from array
 */
function weightedRandomSelect(weights: number[]): number {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return i;
    }
  }
  
  return weights.length - 1; // Fallback
}

/**
 * Updates constraints after placing a mine
 */
function updateConstraints(
  selectedPos: { x: number; y: number },
  availablePositions: { x: number; y: number }[],
  zones: any
): void {
  // Remove positions too close to the newly placed mine
  for (let i = availablePositions.length - 1; i >= 0; i--) {
    const pos = availablePositions[i];
    const distance = Math.abs(pos.x - selectedPos.x) + Math.abs(pos.y - selectedPos.y);
    
    // Optional: Remove very close positions to prevent clustering
    if (distance === 1 && Math.random() < 0.3) {
      availablePositions.splice(i, 1);
    }
  }
}

/**
 * Gets corner positions excluding safe zone
 */
function getCornerPositions(width: number, height: number, firstClickX: number, firstClickY: number): { x: number; y: number }[] {
  const corners = [
    { x: 0, y: 0 },
    { x: width - 1, y: 0 },
    { x: 0, y: height - 1 },
    { x: width - 1, y: height - 1 }
  ];
  
  return corners.filter(pos => 
    Math.abs(pos.x - firstClickX) > 1 || Math.abs(pos.y - firstClickY) > 1
  );
}

/**
 * Gets edge positions excluding corners and safe zone
 */
function getEdgePositions(width: number, height: number, firstClickX: number, firstClickY: number): { x: number; y: number }[] {
  const edges: { x: number; y: number }[] = [];
  
  // Top and bottom edges
  for (let x = 1; x < width - 1; x++) {
    edges.push({ x, y: 0 });
    edges.push({ x, y: height - 1 });
  }
  
  // Left and right edges
  for (let y = 1; y < height - 1; y++) {
    edges.push({ x: 0, y });
    edges.push({ x: width - 1, y });
  }
  
  return edges.filter(pos => 
    Math.abs(pos.x - firstClickX) > 1 || Math.abs(pos.y - firstClickY) > 1
  );
}

/**
 * Gets center positions excluding safe zone
 */
function getCenterPositions(width: number, height: number, firstClickX: number, firstClickY: number): { x: number; y: number }[] {
  const center: { x: number; y: number }[] = [];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      center.push({ x, y });
    }
  }
  
  return center.filter(pos => 
    Math.abs(pos.x - firstClickX) > 1 || Math.abs(pos.y - firstClickY) > 1
  );
}

/**
 * Gets safe zone positions around first click
 */
function getSafeZonePositions(width: number, height: number, firstClickX: number, firstClickY: number): { x: number; y: number }[] {
  const safeZone: { x: number; y: number }[] = [];
  
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = firstClickX + dx;
      const y = firstClickY + dy;
      
      if (x >= 0 && x < width && y >= 0 && y < height) {
        safeZone.push({ x, y });
      }
    }
  }
  
  return safeZone;
}

/**
 * Calculates optimal mine distribution across zones
 */
function calculateOptimalDistribution(totalMines: number, zones: any): { [key: string]: number } {
  const distribution: { [key: string]: number } = {
    corners: 0,
    edges: 0,
    center: 0,
    safe: 0
  };
  
  // Distribute mines with preference for center, then edges, then corners
  const centerRatio = 0.5;
  const edgeRatio = 0.35;
  const cornerRatio = 0.15;
  
  distribution.center = Math.floor(totalMines * centerRatio);
  distribution.edges = Math.floor(totalMines * edgeRatio);
  distribution.corners = totalMines - distribution.center - distribution.edges;
  
  return distribution;
}

/**
 * Creates a deep clone of the grid
 */
function cloneGrid(grid: Cell[][]): Cell[][] {
  return grid.map(row => row.map(cell => ({ ...cell })));
}

/**
 * Gets available positions excluding the safe zone around first click
 */
function getAvailablePositions(width: number, height: number, firstClickX: number, firstClickY: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Skip first click position and its neighbors for a larger safe zone
      if (Math.abs(x - firstClickX) <= 1 && Math.abs(y - firstClickY) <= 1) {
        continue;
      }
      positions.push({ x, y });
    }
  }
  
  return positions;
}

/**
 * Evaluates the pattern score for a specific mine placement
 */
function evaluatePatternScore(
  grid: Cell[][], 
  x: number, 
  y: number, 
  placedMines: { x: number; y: number }[], 
  width: number, 
  height: number
): number {
  let score = 0;
  
  // Check distance from other mines (avoid clustering)
  const minDistance = Math.min(...placedMines.map(mine => 
    Math.abs(mine.x - x) + Math.abs(mine.y - y)
  ));
  
  if (minDistance >= 3) score += 3;
  else if (minDistance >= 2) score += 1;
  else if (minDistance === 1) score -= 2;
  
  // Prefer positions that create good number patterns
  const neighbors = getNeighbors(x, y, width, height);
  const nonMineNeighbors = neighbors.filter(n => !grid[n.y][n.x].isMine);
  
  // Calculate what numbers this mine placement would create
  for (const neighbor of nonMineNeighbors) {
    const currentMines = grid[neighbor.y][neighbor.x].adjacentMines;
    const newMines = currentMines + 1;
    
    // Prefer moderate numbers (2-4)
    if (newMines >= 2 && newMines <= 4) {
      score += 2;
    } else if (newMines === 1 || newMines === 5) {
      score += 1;
    } else if (newMines >= 6) {
      score -= 3; // Avoid very high numbers
    }
  }
  
  // Avoid corner and edge placements when possible (they create constraints)
  if (isCorner(x, y, width, height)) {
    score -= 1;
  } else if (isEdge(x, y, width, height)) {
    score -= 0.5;
  }
  
  return score;
}

/**
 * Checks if a position is on the edge of the board
 */
function isEdge(x: number, y: number, width: number, height: number): boolean {
  return x === 0 || x === width - 1 || y === 0 || y === height - 1;
}

/**
 * Analyzes symmetry of mine distribution
 */
function analyzeSymmetry(grid: Cell[][], width: number, height: number): number {
  let score = 0;
  const mines: { x: number; y: number }[] = [];
  
  // Collect all mine positions
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x].isMine) {
        mines.push({ x, y });
      }
    }
  }
  
  // Calculate center of mass
  const centerX = mines.reduce((sum, mine) => sum + mine.x, 0) / mines.length;
  const centerY = mines.reduce((sum, mine) => sum + mine.y, 0) / mines.length;
  
  const boardCenterX = (width - 1) / 2;
  const boardCenterY = (height - 1) / 2;
  
  // Bonus for mine distribution centered on board
  const centerDistance = Math.sqrt(
    Math.pow(centerX - boardCenterX, 2) + Math.pow(centerY - boardCenterY, 2)
  );
  score += Math.max(0, 5 - centerDistance);
  
  // Check for balanced quadrant distribution
  const quadrants = [0, 0, 0, 0];
  mines.forEach(mine => {
    const quadrant = (mine.x < boardCenterX ? 0 : 1) + (mine.y < boardCenterY ? 0 : 2);
    quadrants[quadrant]++;
  });
  
  // Bonus for even distribution across quadrants
  const maxQuadrant = Math.max(...quadrants);
  const minQuadrant = Math.min(...quadrants);
  const quadrantBalance = maxQuadrant - minQuadrant;
  score += Math.max(0, 3 - quadrantBalance);
  
  return score;
}

/**
 * Analyzes mine distribution quality
 */
function analyzeMineDistribution(grid: Cell[][], width: number, height: number): number {
  let score = 0;
  const mines: { x: number; y: number }[] = [];
  
  // Collect mine positions
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x].isMine) {
        mines.push({ x, y });
      }
    }
  }
  
  // Check for clustering
  let totalDistance = 0;
  let pairCount = 0;
  
  for (let i = 0; i < mines.length; i++) {
    for (let j = i + 1; j < mines.length; j++) {
      const distance = Math.sqrt(
        Math.pow(mines[i].x - mines[j].x, 2) + Math.pow(mines[i].y - mines[j].y, 2)
      );
      totalDistance += distance;
      pairCount++;
      
      // Penalty for mines too close together
      if (distance < 1.5) {
        score -= 2;
      }
    }
  }
  
  // Bonus for good average spacing
  if (pairCount > 0) {
    const averageDistance = totalDistance / pairCount;
    const idealDistance = Math.sqrt((width * height) / mines.length) * 0.8;
    const distanceScore = Math.max(0, 5 - Math.abs(averageDistance - idealDistance));
    score += distanceScore;
  }
  
  return score;
}

/**
 * Analyzes pattern complexity
 */
function analyzePatternComplexity(grid: Cell[][], width: number, height: number): number {
  let score = 0;
  const numberCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0]; // Index = number of adjacent mines
  
  // Count frequency of each number
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!grid[y][x].isMine) {
        const count = grid[y][x].adjacentMines;
        if (count < numberCounts.length) {
          numberCounts[count]++;
        }
      }
    }
  }
  
  // Prefer diverse number distribution
  const totalNumbers = numberCounts.reduce((sum, count) => sum + count, 0);
  if (totalNumbers > 0) {
    // Calculate entropy (higher entropy = more diverse)
    let entropy = 0;
    for (const count of numberCounts) {
      if (count > 0) {
        const probability = count / totalNumbers;
        entropy -= probability * Math.log2(probability);
      }
    }
    score += entropy;
  }
  
  // Bonus for moderate number prevalence (2s and 3s are most useful)
  score += (numberCounts[2] + numberCounts[3]) * 0.1;
  
  // Penalty for too many 0s (makes game too easy) or high numbers (too hard)
  score -= numberCounts[0] * 0.05;
  score -= (numberCounts[6] + numberCounts[7] + numberCounts[8]) * 0.2;
  
  return score;
}

/**
 * Detects tank patterns (specific problematic configurations)
 */
function detectTankPatterns(grid: Cell[][], x: number, y: number, width: number, height: number): number {
  let tankCount = 0;
  
  // Check for classic 1-2-1 tank pattern horizontally
  if (x >= 1 && x < width - 1) {
    const left = grid[y][x - 1];
    const center = grid[y][x];
    const right = grid[y][x + 1];
    
    if (!left.isMine && !center.isMine && !right.isMine &&
        left.adjacentMines === 1 && center.adjacentMines === 2 && right.adjacentMines === 1) {
      tankCount++;
    }
  }
  
  // Check for classic 1-2-1 tank pattern vertically
  if (y >= 1 && y < height - 1) {
    const top = grid[y - 1][x];
    const center = grid[y][x];
    const bottom = grid[y + 1][x];
    
    if (!top.isMine && !center.isMine && !bottom.isMine &&
        top.adjacentMines === 1 && center.adjacentMines === 2 && bottom.adjacentMines === 1) {
      tankCount++;
    }
  }
  
  return tankCount;
}

/**
 * Detects island patterns (isolated constraint groups)
 */
function detectIslandPatterns(grid: Cell[][], x: number, y: number, width: number, height: number): number {
  // This is a simplified version - a full implementation would use connectivity analysis
  let isolation = 0;
  
  const neighbors = getNeighbors(x, y, width, height);
  const informativeNeighbors = neighbors.filter(n => 
    !grid[n.y][n.x].isMine && grid[n.y][n.x].adjacentMines > 0
  );
  
  // If a cell has very few informative neighbors, it might be isolated
  if (informativeNeighbors.length <= 1 && grid[y][x].adjacentMines > 0) {
    isolation = 1;
  }
  
  return isolation;
}

/**
 * Detects density clustering problems
 */
function detectDensityClustering(grid: Cell[][], x: number, y: number, width: number, height: number): number {
  let clustering = 0;
  
  // Check 3x3 area around the cell for mine density
  let mineCount = 0;
  let cellCount = 0;
  
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const newX = x + dx;
      const newY = y + dy;
      
      if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
        cellCount++;
        if (grid[newY][newX].isMine) {
          mineCount++;
        }
      }
    }
  }
  
  // If more than 50% of the area are mines, it's too dense
  if (cellCount > 0 && mineCount / cellCount > 0.5) {
    clustering = 1;
  }
  
  return clustering;
}
