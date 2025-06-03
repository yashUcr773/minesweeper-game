'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  GameState,
  Difficulty,
  DIFFICULTY_CONFIGS,
  GameStatus,
  CustomGameConfig,
  GameConfig,
} from '../types/game';
import {
  createInitialGameState,
  placeMines,
  revealCell,
  toggleFlag,
  checkWinCondition,
  revealAllMinesWithAnimation,
  getFlagsUsed,
  getCellsRevealed,
} from '../lib/gameLogic';
import { updateGameStats, getUserPreferences } from '../lib/storage';
import { soundManager } from '../lib/sounds';
import  { compareGenerationStrategies }  from '../lib/gameLogic';
import { useAuth } from './useAuth';
export const useGameState = (initialDifficulty: Difficulty = Difficulty.BEGINNER) => {
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(DIFFICULTY_CONFIGS[initialDifficulty])
  );
  const [timeElapsed, setTimeElapsed] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scoreSubmittedRef = useRef<boolean>(false); // Prevent duplicate submissions
  const gameSessionIdRef = useRef<string>(crypto.randomUUID()); // Unique session ID
  
  // Auth hook for score submission
  const { isAuthenticated, user } = useAuth();  // Function to submit score to leaderboard
  const submitScore = useCallback(async (gameWon: boolean, timeTaken: number, gameDifficulty: Difficulty, gameConfig: GameConfig) => {
    if (!isAuthenticated || !user || !gameWon || gameDifficulty === Difficulty.CUSTOM) {
      return; // Only submit scores for authenticated users on non-custom games when they win
    }

    // Prevent duplicate submissions for the same game
    if (scoreSubmittedRef.current) {
      console.log('Score already submitted for this game');
      return;
    }

    try {
      // Mark as submitted to prevent duplicates
      scoreSubmittedRef.current = true;

      // Calculate score (lower time = higher score)
      const maxTime = 999; // Maximum reasonable time in seconds
      const baseScore = Math.max(0, maxTime - timeTaken);
      
      // Difficulty multipliers
      const difficultyMultipliers = {
        [Difficulty.BEGINNER]: 1,
        [Difficulty.INTERMEDIATE]: 2,
        [Difficulty.EXPERT]: 3,
        [Difficulty.MASTER]: 4,
        [Difficulty.INSANE]: 5,
        [Difficulty.EXTREME]: 6,
      };
      
      const multiplier = difficultyMultipliers[gameDifficulty] || 1;
      const finalScore = Math.round(baseScore * multiplier);

      // Get auth token from cookies
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch('/api/leaderboard/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },        body: JSON.stringify({
          difficulty: gameDifficulty,
          timeElapsed: timeTaken,
          score: finalScore,
          config: gameConfig,
          gameSessionId: gameSessionIdRef.current,
        }),
      });      if (response.ok) {
        console.log('Score submitted successfully!');
      } else if (response.status === 409) {
        console.log('Score already submitted for this game');
      } else {
        console.error('Failed to submit score:', await response.text());
      }
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  }, [isAuthenticated, user]);

  // Initialize sound settings
  useEffect(() => {
    const preferences = getUserPreferences();
    soundManager.setEnabled(preferences.soundEnabled);
  }, []);

  // Timer effect
  useEffect(() => {
    if (gameState.status === GameStatus.PLAYING) {
      intervalRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [gameState.status]);  const restartGame = useCallback(() => {
    const config = DIFFICULTY_CONFIGS[difficulty];
    setGameState(createInitialGameState(config));
    setTimeElapsed(0);
    scoreSubmittedRef.current = false; // Reset submission flag
    gameSessionIdRef.current = crypto.randomUUID(); // Generate new session ID
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    soundManager.gameStart();
  }, [difficulty]);  const changeDifficulty = useCallback((newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    const config = DIFFICULTY_CONFIGS[newDifficulty];
    setGameState(createInitialGameState(config));
    setTimeElapsed(0);
    scoreSubmittedRef.current = false; // Reset submission flag
    gameSessionIdRef.current = crypto.randomUUID(); // Generate new session ID
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);  const startCustomGame = useCallback((customConfig: CustomGameConfig) => {
    setDifficulty(Difficulty.CUSTOM);
    setGameState(createInitialGameState(customConfig));
    setTimeElapsed(0);
    scoreSubmittedRef.current = false; // Reset submission flag
    gameSessionIdRef.current = crypto.randomUUID(); // Generate new session ID
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  const handleCellLeftClick = useCallback((x: number, y: number) => {
    setGameState(prevState => {
      if (prevState.status === GameStatus.WON || prevState.status === GameStatus.LOST) {
        return prevState;
      }

      let newGrid = prevState.grid;
      let newStatus: GameStatus = prevState.status;      // Handle first click - place mines and start the game
      if (prevState.firstClick) {
        newGrid = placeMines(prevState.grid, prevState.config, x, y);
        newStatus = GameStatus.PLAYING;
        
        // Development logging: compare generation strategies (only in dev mode)
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 New game started with improved mine generation!');
          
          // Check if detailed comparison is enabled
          const debugEnabled = typeof window !== 'undefined' && 
            localStorage.getItem('minesweeper-debug-comparison') === 'true';
          
          if (debugEnabled) {
            
            console.log('🔍 Running detailed mine generation comparison...');
            compareGenerationStrategies(prevState.grid, prevState.config, x, y, 5);
          } else {
            console.log('💡 Enable detailed comparison with: minesweeperDebug.enableComparison()');
          }
        }
      }

      // Reveal the cell
      newGrid = revealCell(newGrid, x, y);
      const clickedCell = newGrid[y][x];      // Check for game over conditions
      if (clickedCell.isMine) {
        newStatus = GameStatus.LOST;
        newGrid = revealAllMinesWithAnimation(newGrid, x, y, 150); // 150ms delay between explosions
        soundManager.gameLoss();
          // Update statistics for loss
        if (difficulty !== Difficulty.CUSTOM) {
          const difficultyKey = difficulty as 'beginner' | 'intermediate' | 'expert' | 'master' | 'insane' | 'extreme';
          updateGameStats(difficultyKey, false, timeElapsed);
        }      } else if (checkWinCondition(newGrid)) {
        newStatus = GameStatus.WON;
        soundManager.gameWin();
          // Update statistics for win
        if (difficulty !== Difficulty.CUSTOM) {
          const difficultyKey = difficulty as 'beginner' | 'intermediate' | 'expert' | 'master' | 'insane' | 'extreme';
          updateGameStats(difficultyKey, true, timeElapsed);
        }
        
        // Submit score to leaderboard
        submitScore(true, timeElapsed, difficulty, prevState.config);
      } else {
        // Regular cell reveal sound
        soundManager.cellReveal();
      }

      return {
        ...prevState,
        grid: newGrid,
        status: newStatus,
        firstClick: false,
        stats: {
          ...prevState.stats,
          timeElapsed: timeElapsed,
          flagsUsed: getFlagsUsed(newGrid),
          cellsRevealed: getCellsRevealed(newGrid),
        },      };
    });
  }, [timeElapsed, difficulty, submitScore]);
  const handleCellRightClick = useCallback((x: number, y: number) => {
    setGameState(prevState => {
      if (prevState.status === GameStatus.WON || prevState.status === GameStatus.LOST) {
        return prevState;
      }

      const newGrid = toggleFlag(prevState.grid, x, y);
      const cell = newGrid[y][x];
      
      // Play appropriate sound
      if (cell.isFlagged) {
        soundManager.cellFlag();
      } else {
        soundManager.cellUnflag();
      }

      return {
        ...prevState,
        grid: newGrid,
        stats: {
          ...prevState.stats,
          flagsUsed: getFlagsUsed(newGrid),
        },
      };
    });  }, []);
  // Function to update grid for animations
  const updateGrid = useCallback((newGridOrUpdater: import('../types/game').Cell[][] | ((prevGrid: import('../types/game').Cell[][]) => import('../types/game').Cell[][])) => {
    setGameState(prevState => ({
      ...prevState,
      grid: typeof newGridOrUpdater === 'function' ? newGridOrUpdater(prevState.grid) : newGridOrUpdater,
    }));
  }, []);

  return {
    gameState,
    difficulty,
    timeElapsed,
    restartGame,
    changeDifficulty,
    startCustomGame,
    handleCellLeftClick,
    handleCellRightClick,
    updateGrid,
  };
};
