import { useEffect, useCallback, useRef } from 'react';
import { Cell } from '../types/game';
import { soundManager } from '../lib/sounds';

export const useBombAnimation = (
  grid: Cell[][],
  gameStatus: 'ready' | 'playing' | 'won' | 'lost',
  onGridUpdate: (newGridOrUpdater: Cell[][] | ((prevGrid: Cell[][]) => Cell[][])) => void
) => {
  const animationTimeouts = useRef<NodeJS.Timeout[]>([]);
  const animationStarted = useRef<boolean>(false);

  // Clear any existing timeouts
  const clearAnimations = useCallback(() => {
    animationTimeouts.current.forEach(timeout => clearTimeout(timeout));
    animationTimeouts.current = [];
    animationStarted.current = false;
  }, []);
  // Start bomb animation sequence
  const startBombAnimation = useCallback((initialGrid: Cell[][]) => {
    if (gameStatus !== 'lost' || animationStarted.current) return;
    
    // Mark animation as started to prevent multiple triggers
    animationStarted.current = true;

    // Find all mines with explosion delays
    const minesWithDelays: { cell: Cell; delay: number }[] = [];
    
    initialGrid.forEach(row => {
      row.forEach(cell => {
        if (cell.isMine && cell.isRevealed && typeof cell.explosionDelay === 'number') {
          minesWithDelays.push({ cell, delay: cell.explosionDelay });
        }
      });
    });

    // Sort by delay to process in order
    minesWithDelays.sort((a, b) => a.delay - b.delay);// Create animation timeouts for each mine
    minesWithDelays.forEach(({ cell, delay }) => {
      const timeout = setTimeout(() => {
        // Play explosion sound for this bomb
        soundManager.bombExplosion();       

        onGridUpdate((prevGrid: Cell[][]) =>
          prevGrid.map((row: Cell[]) =>
            row.map((gridCell: Cell) => {
              if (gridCell.x === cell.x && gridCell.y === cell.y) {
                return { ...gridCell, isExploding: true };
              }
              return gridCell;
            })
          )
        );          // Stop explosion animation after enhanced duration for better visual effect
        const stopTimeout = setTimeout(() => {
          onGridUpdate((prevGrid: Cell[][]) =>
            prevGrid.map((row: Cell[]) =>
              row.map((gridCell: Cell) => {
                if (gridCell.x === cell.x && gridCell.y === cell.y) {
                  return { ...gridCell, isExploding: false };
                }
                return gridCell;
              })
            )
          );
        }, 600); // Enhanced explosion lasts 600ms for better visual impact

        animationTimeouts.current.push(stopTimeout);
      }, delay);

      animationTimeouts.current.push(timeout);
    });  }, [gameStatus, onGridUpdate]);
  // Start animation when game is lost (only once)
  useEffect(() => {
    if (gameStatus === 'lost' && !animationStarted.current) {
      // Small delay to ensure grid is updated with explosion delays
      const startTimeout = setTimeout(() => startBombAnimation(grid), 50);
      return () => clearTimeout(startTimeout);
    } else if (gameStatus !== 'lost') {
      clearAnimations();
    }
  }, [gameStatus]); // Only depend on gameStatus to prevent infinite loops

  // Cleanup on unmount
  useEffect(() => {
    return clearAnimations;
  }, [clearAnimations]);

  return { clearAnimations };
};
