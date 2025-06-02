'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { GameBoard } from './GameBoard';
import { GameHeader } from './GameHeader';
import { StatsModal } from './StatsModal';
import { SettingsModal } from './SettingsModal';
import { WinLossModal } from './WinLossModal';
import { useGameState } from '../hooks/useGameState';
import { useBombAnimation } from '../hooks/useBombAnimation';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { Difficulty } from '../types/game';

interface MinesweeperGameProps {
  initialDifficulty?: Difficulty;
}

export const MinesweeperGame: React.FC<MinesweeperGameProps> = ({
  initialDifficulty = Difficulty.BEGINNER,
}) => {  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWinLoss, setShowWinLoss] = useState(false);
  
  const { preferences, updatePreferences } = useUserPreferences();
  const [focusMode, setFocusMode] = useState(false); // Will be initialized from preferences
  const {
    gameState,
    difficulty,
    timeElapsed,
    restartGame,
    changeDifficulty,
    startCustomGame,
    handleCellLeftClick,
    handleCellRightClick,
    updateGrid,
  } = useGameState(initialDifficulty);

  // Initialize bomb animation
  useBombAnimation(gameState.grid, gameState.status, updateGrid);

  // Initialize focus mode from preferences
  useEffect(() => {
    if (preferences?.focusMode !== undefined) {
      setFocusMode(preferences.focusMode);
    }
  }, [preferences?.focusMode]);

  // Save focus mode preference when it changes
  const toggleFocusMode = useCallback(() => {
    const newFocusMode = !focusMode;
    setFocusMode(newFocusMode);
    updatePreferences({ focusMode: newFocusMode });
  }, [focusMode, updatePreferences]);

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
  }, []);  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        restartGame();
      }
      // Toggle focus mode with 'F' key
      if (e.key === 'f' || e.key === 'F') {
        toggleFocusMode();
      }
      // Exit focus mode with Escape key
      if (e.key === 'Escape' && focusMode) {
        toggleFocusMode();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [restartGame, focusMode, toggleFocusMode]);

  // Show win/loss modal when game ends
  useEffect(() => {
    if (gameState.status === 'won' || gameState.status === 'lost') {
      // Small delay to allow bomb animations to complete
      const timer = setTimeout(() => {
        setShowWinLoss(true);
      }, gameState.status === 'lost' ? 1500 : 500); // Longer delay for loss to show bomb animations
      
      return () => clearTimeout(timer);
    }
  }, [gameState.status]);

  // Reset win/loss modal when game restarts
  useEffect(() => {
    if (gameState.status === 'ready' || gameState.status === 'playing') {
      setShowWinLoss(false);
    }
  }, [gameState.status]);

  return (
    <div className={`minesweeper-game min-h-screen transition-all duration-300 ${
      focusMode 
        ? 'bg-gray-900 flex items-center justify-center' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-100 py-8'
    }`}>        {/* Focus Mode Toggle Button - Always visible */}
      <button
        onClick={toggleFocusMode}
        className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
          focusMode
            ? 'bg-white text-gray-800 hover:bg-gray-100 shadow-lg'
            : 'bg-gray-800 text-white hover:bg-gray-700 shadow-md'
        }`}
        title={focusMode ? 'Exit Focus Mode (F or Esc)' : 'Enter Focus Mode (F)'}
      >
        {focusMode ? (
          <span className="flex items-center gap-2">
            <span>🔍</span> Exit Focus
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <span>🎯</span> Focus Mode
          </span>
        )}
      </button>

      <div className={`${focusMode ? '' : 'container mx-auto px-4 max-w-6xl'}`}>
        {/* Game Title - Hidden in focus mode */}
        {!focusMode && (
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">💣 Minesweeper</h1>
            <p className="text-gray-600">
              Find all mines without detonating them! Left click to reveal, right click to flag.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Press &apos;R&apos; to restart the game anytime
            </p>
          </div>
        )}        {/* Game Header - Simplified in focus mode */}
        {focusMode ? (
          // Minimal header for focus mode
          <div className="mb-4 flex justify-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3 flex items-center gap-6">
              <div className="text-white font-mono text-lg">
                💣 {gameState.config.mines - gameState.grid.flat().filter(cell => cell.isFlagged).length}
              </div>
              <div className="text-white font-mono text-lg">
                ⏱️ {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
              </div>
              <button
                onClick={restartGame}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                🔄
              </button>
              <button
                onClick={() => setShowStats(true)}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm transition-colors"
                title="View Statistics"
              >
                📊
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm transition-colors"
                title="Settings"
              >
                ⚙️
              </button>
            </div>
          </div>
        ) : (
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
        )}        {/* Game Board */}        <div className="flex justify-center">
          <GameBoard
            gameState={gameState}
            onCellLeftClick={handleCellLeftClick}
            onCellRightClick={handleCellRightClick}
            colorBlindMode={preferences?.colorBlindMode || false}
          />
        </div>        {/* Instructions - Hidden in focus mode */}
        {!focusMode && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">How to Play:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">🎯 Objective:</h4>
                <ul className="space-y-1">
                  <li>• Reveal all cells that don&apos;t contain mines</li>
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
                  <li>• <strong>F Key:</strong> Toggle focus mode</li>
                </ul>
              </div>
            </div>
          </div>
        )}{/* Footer - Hidden in focus mode */}
        {!focusMode && (
          <div className="text-center mt-8 text-gray-500 text-sm">
            <p>Classic Minesweeper Game • Built with Next.js & TypeScript</p>
          </div>
        )}        {/* Modals */}
        <StatsModal 
          isOpen={showStats} 
          onClose={() => setShowStats(false)} 
        />

        <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)}
          preferences={preferences || { preferredDifficulty: 'BEGINNER', soundEnabled: true, colorBlindMode: false, showTimer: true }}
          onPreferencesChange={updatePreferences}
        />        <WinLossModal
          isOpen={showWinLoss}
          onClose={() => setShowWinLoss(false)}
          gameState={gameState}
          difficulty={difficulty}
          timeElapsed={timeElapsed}
          onRestart={() => {
            setShowWinLoss(false);
            restartGame();
          }}
          onShowStats={() => {
            setShowWinLoss(false);
            setShowStats(true);
          }}
          onChangeDifficulty={(newDifficulty) => {
            setShowWinLoss(false);
            changeDifficulty(newDifficulty);
          }}
        />
      </div>
    </div>
  );
};
