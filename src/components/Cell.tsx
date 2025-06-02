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
      // Show false flag with crossed-out appearance when game is lost
      if (gameStatus === 'lost' && cell.isFalseFlag) {
        return (
          <div className="relative">
            <span className="text-red-500 font-bold">🚩</span>
            <span className="absolute inset-0 flex items-center justify-center text-red-600 font-bold text-lg">
              ✗
            </span>
          </div>
        );
      }
      return <span className="text-red-500 font-bold">🚩</span>;
    }
    
    if (!cell.isRevealed) {
      return null;
    }    if (cell.isMine) {
      if (cell.isExploding) {
        // Enhanced realistic explosion animation with multiple stages
        return (
          <div className="relative w-full h-full overflow-hidden">
            {/* Main explosion blast with custom animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-yellow-500 font-bold text-2xl animate-explode z-30">
                💥
              </span>
            </div>
            
            {/* Secondary fire effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-orange-600 font-bold text-xl animate-pulse transform scale-125 z-20">
                🔥
              </span>
            </div>
            
            {/* Flash effect for initial blast */}
            <div className="absolute inset-0 bg-white animate-flash z-10"></div>
            
            {/* Multiple expanding shock wave rings */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 border-4 border-red-500 rounded-full animate-shockwave opacity-80"></div>
              <div className="absolute inset-1 border-2 border-orange-400 rounded-full animate-shockwave opacity-60" style={{animationDelay: '0.1s'}}></div>
              <div className="absolute inset-2 border border-yellow-300 rounded-full animate-shockwave opacity-40" style={{animationDelay: '0.2s'}}></div>
            </div>
            
            {/* Glowing background with radial gradient */}
            <div className="absolute inset-0 bg-gradient-radial from-yellow-400 via-orange-500 to-red-600 opacity-70 animate-pulse rounded"></div>
            
            {/* Enhanced debris/sparks with custom animation */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-2 w-2 h-2 bg-yellow-300 rounded-full animate-debris" style={{'--debris-x': '-10px', '--debris-y': '-15px'} as React.CSSProperties}></div>
              <div className="absolute top-0 right-2 w-1 h-1 bg-orange-400 rounded-full animate-debris" style={{'--debris-x': '12px', '--debris-y': '-18px', animationDelay: '0.05s'} as React.CSSProperties}></div>
              <div className="absolute bottom-0 left-2 w-1 h-1 bg-red-500 rounded-full animate-debris" style={{'--debris-x': '-15px', '--debris-y': '20px', animationDelay: '0.1s'} as React.CSSProperties}></div>
              <div className="absolute bottom-0 right-2 w-2 h-2 bg-yellow-400 rounded-full animate-debris" style={{'--debris-x': '18px', '--debris-y': '15px', animationDelay: '0.08s'} as React.CSSProperties}></div>
              <div className="absolute top-1/2 left-0 w-1 h-1 bg-orange-300 rounded-full animate-debris" style={{'--debris-x': '-20px', '--debris-y': '5px', animationDelay: '0.12s'} as React.CSSProperties}></div>
              <div className="absolute top-1/2 right-0 w-1 h-1 bg-red-400 rounded-full animate-debris" style={{'--debris-x': '25px', '--debris-y': '-8px', animationDelay: '0.15s'} as React.CSSProperties}></div>
            </div>
          </div>
        );
      }
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
    );    if (cell.isRevealed) {
      if (cell.isMine) {
        if (cell.isExploding) {
          // Special explosive styling
          return cn(
            baseStyles,
            'bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 border-red-600 animate-pulse'
          );
        }
        return cn(
          baseStyles,
          'bg-red-500 border-red-600'
        );
      }
      return cn(baseStyles, 'bg-gray-100 border-gray-300 cursor-default');
    }if (cell.isFlagged) {
      // Different styling for false flags when game is lost
      if (gameStatus === 'lost' && cell.isFalseFlag) {
        return cn(baseStyles, 'bg-red-100 border-red-300');
      }
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
