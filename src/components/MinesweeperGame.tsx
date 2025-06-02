'use client';

import React, { useEffect, useState } from 'react';
import { GameBoard } from './GameBoard';
import { GameHeader } from './GameHeader';
import { StatsModal } from './StatsModal';
import { SettingsModal } from './SettingsModal';
import { useGameState } from '../hooks/useGameState';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { Difficulty } from '../types/game';

interface MinesweeperGameProps {
  initialDifficulty?: Difficulty;
}

export const MinesweeperGame: React.FC<MinesweeperGameProps> = ({
  initialDifficulty = Difficulty.BEGINNER,
}) => {  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const { preferences, updatePreferences } = useUserPreferences();
    const {
    gameState,
    difficulty,
    timeElapsed,
    restartGame,
    changeDifficulty,
    startCustomGame,
    handleCellLeftClick,
    handleCellRightClick,
  } = useGameState(initialDifficulty);

  // Prevent right-click context menu on the game area
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.minesweeper-game')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        restartGame();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [restartGame]);

  return (
    <div className="minesweeper-game min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Game Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">💣 Minesweeper</h1>
          <p className="text-gray-600">
            Find all mines without detonating them! Left click to reveal, right click to flag.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Press 'R' to restart the game anytime
          </p>
        </div>        {/* Game Header */}
        <GameHeader
          gameState={gameState}
          difficulty={difficulty}
          onRestart={restartGame}
          onDifficultyChange={changeDifficulty}
          onCustomGame={startCustomGame}
          onShowStats={() => setShowStats(true)}
          onShowSettings={() => setShowSettings(true)}
          timeElapsed={timeElapsed}
        />

        {/* Game Board */}        <div className="flex justify-center">
          <GameBoard
            gameState={gameState}
            onCellLeftClick={handleCellLeftClick}
            onCellRightClick={handleCellRightClick}
            colorBlindMode={preferences?.colorBlindMode || false}
          />
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">How to Play:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">🎯 Objective:</h4>
              <ul className="space-y-1">
                <li>• Reveal all cells that don't contain mines</li>
                <li>• Use numbers to deduce mine locations</li>
                <li>• Flag suspected mine locations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">🎮 Controls:</h4>
              <ul className="space-y-1">
                <li>• <strong>Left Click:</strong> Reveal cell</li>
                <li>• <strong>Right Click:</strong> Flag/unflag cell</li>
                <li>• <strong>Numbers:</strong> Adjacent mine count</li>
                <li>• <strong>R Key:</strong> Restart game</li>
              </ul>
            </div>
          </div>
        </div>        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Classic Minesweeper Game • Built with Next.js & TypeScript</p>
        </div>

        {/* Modals */}
        <StatsModal 
          isOpen={showStats} 
          onClose={() => setShowStats(false)} 
        />        <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)}
          preferences={preferences || { preferredDifficulty: 'BEGINNER', soundEnabled: true, colorBlindMode: false, showTimer: true }}
          onPreferencesChange={updatePreferences}
        />
      </div>
    </div>
  );
};
