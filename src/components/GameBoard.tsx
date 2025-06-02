'use client';

import React from 'react';
import { Cell } from './Cell';
import { GameState } from '../types/game';
import { cn } from '../lib/utils';

interface GameBoardProps {
  gameState: GameState;
  onCellLeftClick: (x: number, y: number) => void;
  onCellRightClick: (x: number, y: number) => void;
  colorBlindMode?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onCellLeftClick,
  onCellRightClick,
  colorBlindMode = false,
}) => {
  const { grid, config, status } = gameState;
  
  // Determine cell size based on grid dimensions
  const getCellSize = () => {
    if (config.width >= 30) return 'sm';
    if (config.width >= 16) return 'md';
    return 'lg';
  };

  const cellSize = getCellSize();

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={cn(
          'inline-grid gap-0 border-2 border-gray-600 bg-gray-200 p-2',
          'shadow-lg rounded-lg'
        )}
        style={{
          gridTemplateColumns: `repeat(${config.width}, 1fr)`,
          gridTemplateRows: `repeat(${config.height}, 1fr)`,
        }}
      >
        {grid.map((row) =>
          row.map((cell) => (            
          <Cell
              key={cell.id}
              cell={cell}
              onLeftClick={onCellLeftClick}
              onRightClick={onCellRightClick}
              gameStatus={status}
              colorBlindMode={colorBlindMode}
              size={cellSize}
            />
          ))
        )}
      </div>
    </div>
  );
};
