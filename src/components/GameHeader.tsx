'use client';

import React from 'react';
import { Button } from './ui/button';
import { GameState, Difficulty, DIFFICULTY_CONFIGS } from '../types/game';
import { cn } from '../lib/utils';
import { RotateCcw, BarChart3, Settings } from 'lucide-react';

interface GameHeaderProps {
  gameState: GameState;
  difficulty: Difficulty;
  onRestart: () => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onShowStats: () => void;
  onShowSettings: () => void;
  timeElapsed: number;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  gameState,
  difficulty,
  onRestart,
  onDifficultyChange,
  onShowStats,
  onShowSettings,
  timeElapsed,
}) => {
  const { config, stats, status } = gameState;
  const minesRemaining = config.mines - stats.flagsUsed;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusEmoji = () => {
    switch (status) {
      case 'won':
        return '😎';
      case 'lost':
        return '😵';
      case 'playing':
        return '😮';
      default:
        return '🙂';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'won':
        return 'Congratulations! You won!';
      case 'lost':
        return 'Game Over! Try again!';
      case 'playing':
        return 'Game in progress...';
      default:
        return 'Click a cell to start!';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
      {/* Main Status Display */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {/* Mine Counter */}
          <div className="bg-black text-green-400 font-mono text-xl px-3 py-2 rounded border-2 border-gray-400 min-w-[80px] text-center">
            {minesRemaining.toString().padStart(3, '0')}
          </div>
        </div>

        {/* Restart Button with Status */}
        <div className="flex flex-col items-center space-y-2">
          <Button
            onClick={onRestart}
            variant="outline"
            size="lg"
            className="w-16 h-16 text-2xl p-0 border-2 hover:scale-105 transition-transform"
          >
            {getStatusEmoji()}
          </Button>
          <p className="text-sm text-gray-600 font-medium">
            {getStatusMessage()}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Timer */}
          <div className="bg-black text-green-400 font-mono text-xl px-3 py-2 rounded border-2 border-gray-400 min-w-[80px] text-center">
            {formatTime(timeElapsed)}
          </div>
        </div>
      </div>

      {/* Difficulty Selection */}
      <div className="border-t pt-4">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <h3 className="text-lg font-semibold text-gray-800">Difficulty Level:</h3>
          
          <div className="flex flex-wrap gap-2">
            {Object.entries(DIFFICULTY_CONFIGS).map(([diff, config]) => {
              if (diff === 'custom') return null;
              
              return (
                <Button
                  key={diff}
                  onClick={() => onDifficultyChange(diff as Difficulty)}
                  variant={difficulty === diff ? 'default' : 'outline'}
                  className={cn(
                    'transition-all duration-200',
                    difficulty === diff && 'ring-2 ring-blue-500'
                  )}
                >
                  <div className="text-center">
                    <div className="font-semibold capitalize">{diff}</div>
                    <div className="text-xs opacity-75">
                      {config.width}×{config.height}, {config.mines} mines
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>          <Button
            onClick={onRestart}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New Game</span>
          </Button>

          <div className="flex space-x-2">
            <Button
              onClick={onShowStats}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Stats</span>
            </Button>
            <Button
              onClick={onShowSettings}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Game Statistics */}
      <div className="border-t pt-4 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Cells Revealed</div>
            <div className="text-lg font-bold text-blue-600">{stats.cellsRevealed}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Flags Used</div>
            <div className="text-lg font-bold text-orange-600">{stats.flagsUsed}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Completion</div>
            <div className="text-lg font-bold text-green-600">
              {Math.round((stats.cellsRevealed / (config.width * config.height - config.mines)) * 100) || 0}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
