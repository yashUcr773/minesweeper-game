'use client';

import React from 'react';
import { Cell as CellType } from '../types/game';
import { cn } from '../lib/utils';

interface CellProps {
  cell: CellType;
  onLeftClick: (x: number, y: number) => void;
  onRightClick: (x: number, y: number) => void;
  gameStatus: 'ready' | 'playing' | 'won' | 'lost';
  colorBlindMode?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Cell: React.FC<CellProps> = ({
  cell,
  onLeftClick,
  onRightClick,
  gameStatus,
  colorBlindMode = false,
  size = 'md'
}) => {
  const handleClick = () => {
    if (gameStatus === 'won' || gameStatus === 'lost') return;
    onLeftClick(cell.x, cell.y);
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (gameStatus === 'won' || gameStatus === 'lost') return;
    onRightClick(cell.x, cell.y);
  };

  const getCellContent = () => {
    if (cell.isFlagged) {
      return <span className="text-red-500 font-bold">🚩</span>;
    }
    
    if (!cell.isRevealed) {
      return null;
    }
    
    if (cell.isMine) {
      return <span className="text-red-600 font-bold">💣</span>;
    }
      if (cell.adjacentMines > 0) {
      if (colorBlindMode) {
        // Use symbols for color-blind users
        const symbols = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];
        return (
          <span className="font-bold text-sm text-gray-800">
            {symbols[cell.adjacentMines - 1]}
          </span>
        );
      }
      
      return (
        <span
          className={cn(
            'font-bold text-sm',
            {
              'text-blue-600': cell.adjacentMines === 1,
              'text-green-600': cell.adjacentMines === 2,
              'text-red-600': cell.adjacentMines === 3,
              'text-purple-600': cell.adjacentMines === 4,
              'text-yellow-600': cell.adjacentMines === 5,
              'text-pink-600': cell.adjacentMines === 6,
              'text-black': cell.adjacentMines === 7,
              'text-gray-600': cell.adjacentMines === 8,
            }
          )}
        >
          {cell.adjacentMines}
        </span>
      );
    }
    
    return null;
  };

  const getCellStyles = () => {
    const baseStyles = cn(
      'border border-gray-400 flex items-center justify-center font-mono cursor-pointer transition-all duration-100 select-none',
      {
        'w-6 h-6 text-xs': size === 'sm',
        'w-8 h-8 text-sm': size === 'md',
        'w-10 h-10 text-base': size === 'lg',
      }
    );

    if (cell.isRevealed) {
      if (cell.isMine) {
        return cn(
          baseStyles,
          'bg-red-500 border-red-600',
          gameStatus === 'lost' && cell.x === cell.x && cell.y === cell.y
            ? 'bg-red-600'
            : 'bg-red-500'
        );
      }
      return cn(baseStyles, 'bg-gray-100 border-gray-300 cursor-default');
    }

    if (cell.isFlagged) {
      return cn(baseStyles, 'bg-orange-200 border-orange-400');
    }

    return cn(
      baseStyles,
      'bg-gray-300 hover:bg-gray-200 active:bg-gray-400 border-gray-500'
    );
  };

  return (
    <button
      className={getCellStyles()}
      onClick={handleClick}
      onContextMenu={handleRightClick}
      onMouseDown={(e) => e.preventDefault()} // Prevent text selection
      disabled={gameStatus === 'won' || gameStatus === 'lost'}
    >
      {getCellContent()}
    </button>
  );
};
