'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  GameState,
  GameConfig,
  Difficulty,
  DIFFICULTY_CONFIGS,
  GameStatus,
  CustomGameConfig,
} from '../types/game';
import {
  createInitialGameState,
  placeMines,
  revealCell,
  toggleFlag,
  checkWinCondition,
  revealAllMines,
  getFlagsUsed,
  getCellsRevealed,
} from '../lib/gameLogic';
import { updateGameStats, getUserPreferences } from '../lib/storage';
import { soundManager } from '../lib/sounds';

export const useGameState = (initialDifficulty: Difficulty = Difficulty.BEGINNER) => {
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(DIFFICULTY_CONFIGS[initialDifficulty])
  );
  const [timeElapsed, setTimeElapsed] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
  }, [gameState.status]);
  const restartGame = useCallback(() => {
    const config = DIFFICULTY_CONFIGS[difficulty];
    setGameState(createInitialGameState(config));
    setTimeElapsed(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    soundManager.gameStart();
  }, [difficulty]);
  const changeDifficulty = useCallback((newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    const config = DIFFICULTY_CONFIGS[newDifficulty];
    setGameState(createInitialGameState(config));
    setTimeElapsed(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startCustomGame = useCallback((customConfig: CustomGameConfig) => {
    setDifficulty(Difficulty.CUSTOM);
    setGameState(createInitialGameState(customConfig));
    setTimeElapsed(0);
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
            const { compareGenerationStrategies } = require('../lib/gameLogic');
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
        newGrid = revealAllMines(newGrid);
        soundManager.gameLoss();
          // Update statistics for loss
        if (difficulty !== Difficulty.CUSTOM) {
          const difficultyKey = difficulty as 'beginner' | 'intermediate' | 'expert' | 'master' | 'insane' | 'extreme';
          updateGameStats(difficultyKey, false, timeElapsed);
        }
      } else if (checkWinCondition(newGrid)) {
        newStatus = GameStatus.WON;
        soundManager.gameWin();
          // Update statistics for win
        if (difficulty !== Difficulty.CUSTOM) {
          const difficultyKey = difficulty as 'beginner' | 'intermediate' | 'expert' | 'master' | 'insane' | 'extreme';
          updateGameStats(difficultyKey, true, timeElapsed);
        }
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
        },
      };
    });
  }, [timeElapsed, difficulty]);
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
    });
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
  };
};
