'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { ErrorModal } from './ErrorModal';
import { AuthModal } from './AuthModal';
import { LeaderboardModal } from './LeaderboardModal';
import { DailyPuzzleModal } from './DailyPuzzleModal';
import { GameState, Difficulty, DIFFICULTY_CONFIGS, CustomGameConfig } from '../types/game';
import { cn } from '../lib/utils';
import { RotateCcw, BarChart3, Settings, ChevronUp, ChevronDown, Maximize2, Minimize2, Trophy, User, LogOut, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface GameHeaderProps {
  gameState: GameState;
  difficulty: Difficulty;
  onRestart: () => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onCustomGame?: (config: CustomGameConfig) => void;
  onShowStats: () => void;
  onShowSettings: () => void;
  timeElapsed: number;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  gameState,
  difficulty,
  onRestart,
  onDifficultyChange,
  onCustomGame,
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

  // Custom game state
  const [showCustomGame, setShowCustomGame] = useState(false);
  const [customConfig, setCustomConfig] = useState({
    width: 16,
    height: 16,
    mines: 40,
  });
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
    // Auth and leaderboard state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showDailyPuzzle, setShowDailyPuzzle] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const validateCustomConfig = (config: CustomGameConfig): string | null => {
    if (config.width < 5 || config.width > 99) return 'Width must be between 5 and 99';
    if (config.height < 5 || config.height > 99) return 'Height must be between 5 and 99';
    if (config.mines < 1) return 'Must have at least 1 mine';
    
    const maxMines = Math.floor((config.width * config.height) * 0.8);
    if (config.mines >= config.width * config.height) return 'Mines cannot fill all cells';
    if (config.mines > maxMines) return `Too many mines (max: ${maxMines})`;
    
    return null;
  };

  const handleCustomGameSubmit = () => {
    const error = validateCustomConfig(customConfig);
    if (error) {
      setErrorMessage(error);
      setShowError(true);
      return;
    }
    
    if (onCustomGame) {
      onCustomGame(customConfig);
      setShowCustomGame(false);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.log("🚀 ~ toggleFullscreen ~ error:", error)
      console.log('Fullscreen not supported or blocked');
    }
  };

  // Listen for fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);  return (
    <div className="bg-white rounded-lg shadow-lg mb-4">
      {/* Always Visible: Compact Game Info */}
      <div className="p-4">
        {/* Main Game Info Row */}
        <div className="flex items-center justify-between">
          {/* Left: Game Counters & Status */}
          <div className="flex items-center space-x-4">
            {/* Mine Counter with contextual info */}
            <div className="flex flex-col items-center">
              <div className="bg-black text-green-400 font-mono text-lg px-3 py-2 rounded border-2 border-gray-400 min-w-[70px] text-center">
                {minesRemaining.toString().padStart(3, '0')}
              </div>
              <span className="text-xs text-gray-500 mt-1">
                Mines Left ({config.mines} total)
              </span>
            </div>
            
            {/* Timer with game status */}
            <div className="flex flex-col items-center">
              <div className="bg-black text-green-400 font-mono text-lg px-3 py-2 rounded border-2 border-gray-400 min-w-[70px] text-center">
                {formatTime(timeElapsed)}
              </div>
              <span className="text-xs text-gray-500 mt-1">
                {status === 'playing' ? 'Playing' : status === 'won' ? 'Won' : status === 'lost' ? 'Lost' : 'Ready'}
              </span>
            </div>

            {/* Progress & Flags Combined */}
            <div className="flex flex-col items-center">
              <div className="bg-blue-100 text-blue-800 font-medium text-lg px-3 py-2 rounded border-2 border-blue-300 min-w-[70px] text-center">
                {Math.round((stats.cellsRevealed / (config.width * config.height - config.mines)) * 100) || 0}%
              </div>
              <span className="text-xs text-gray-500 mt-1">
                Progress ({stats.flagsUsed}🚩)
              </span>
            </div>

            {/* Game Info Badge */}
            <div className="flex flex-col items-center">
              <div className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-2 rounded-md border-2 border-gray-300">
                {difficulty === 'custom' 
                  ? `${config.width}×${config.height}`
                  : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
                }
              </div>
              <span className="text-xs text-gray-500 mt-1">
                {config.width * config.height} cells
              </span>
            </div>
          </div>

          {/* Center: Game Control */}
          <div className="flex flex-col items-center mx-6">
            <Button
              onClick={onRestart}
              variant="outline"
              size="lg"
              className="w-16 h-16 text-3xl p-0 border-2 hover:scale-105 transition-transform"
            >
              {getStatusEmoji()}
            </Button>
            <p className="text-xs text-gray-600 font-medium text-center mt-1 max-w-[120px]">
              {status === 'playing' ? 'In Progress' : 
               status === 'won' ? 'You Won!' :
               status === 'lost' ? 'Game Over' : 'Click to Start'}
            </p>
          </div>

          {/* Right: Actions & Controls */}
          <div className="flex flex-col space-y-2">            {/* Top row: Main actions */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={onRestart}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden md:inline">New</span>
              </Button>
              <Button
                onClick={onShowStats}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden md:inline">Stats</span>
              </Button>              <Button
                onClick={() => setShowDailyPuzzle(true)}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden md:inline">Daily</span>
              </Button>
              <Button
                onClick={() => setShowLeaderboard(true)}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <Trophy className="w-4 h-4" />
                <span className="hidden md:inline">Leaderboard</span>
              </Button>
              <Button
                onClick={onShowSettings}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">Settings</span>
              </Button>
            </div>
              {/* Bottom row: View controls & Auth */}
            <div className="flex items-center space-x-2">
              {/* Authentication buttons */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600 hidden lg:inline">
                    Hi, {user?.username}
                  </span>
                  <Button
                    onClick={logout}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden lg:inline">Logout</span>
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setShowAuthModal(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden lg:inline">Login</span>
                </Button>
              )}
              
              <Button
                onClick={toggleFullscreen}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span className="hidden lg:inline">{isFullscreen ? "Exit" : "Full"}</span>
              </Button>
              <Button
                onClick={() => setIsCollapsed(!isCollapsed)}
                variant="ghost"
                size="sm"
                title={isCollapsed ? "Show game options" : "Hide game options"}
              >
                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                <span className="hidden lg:inline">{isCollapsed ? "More" : "Less"}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="border-t px-4 pb-4">
          {/* Game Configuration Section */}
          <div className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Game Configuration</h3>
              <div className="text-sm text-gray-600">
                Current: {difficulty === 'custom' 
                  ? `Custom ${config.width}×${config.height} (${config.mines} mines)`
                  : `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} - ${config.width}×${config.height} (${config.mines} mines)`
                }
              </div>
            </div>
            
            {/* Difficulty Selection */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Preset Difficulties:</h4>
              <div className="flex flex-wrap gap-2 justify-center">
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
                          {config.width}×{config.height} • {config.mines} mines
                        </div>
                      </div>
                    </Button>
                  );
                })}
                
                <Button
                  onClick={() => setShowCustomGame(!showCustomGame)}
                  variant={showCustomGame ? 'default' : 'outline'}
                  className={cn(
                    'transition-all duration-200',
                    showCustomGame && 'ring-2 ring-purple-500'
                  )}
                >
                  <div className="text-center">
                    <div className="font-semibold">Custom</div>
                    <div className="text-xs opacity-75">Create your own</div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Custom Game Configuration */}
            {showCustomGame && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Custom Game Setup
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width (5-99)
                    </label>
                    <input
                      type="number"
                      value={customConfig.width === 0 ? '' : customConfig.width}
                      onChange={(e) => setCustomConfig(prev => ({ ...prev, width: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height (5-99)
                    </label>
                    <input
                      type="number"
                      value={customConfig.height === 0 ? '' : customConfig.height}
                      onChange={(e) => setCustomConfig(prev => ({ ...prev, height: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mines (1-{Math.floor(customConfig.width * customConfig.height * 0.8)})
                    </label>
                    <input
                      type="number"
                      value={customConfig.mines === 0 ? '' : customConfig.mines}
                      onChange={(e) => setCustomConfig(prev => ({ ...prev, mines: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded border">
                    📊 Board: {customConfig.width}×{customConfig.height} = {customConfig.width * customConfig.height} cells • 
                    Density: {Math.round((customConfig.mines / (customConfig.width * customConfig.height)) * 100)}% • 
                    Safe cells: {customConfig.width * customConfig.height - customConfig.mines}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setShowCustomGame(false)}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCustomGameSubmit}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Start Custom Game
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Current Game Statistics */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Current Game Statistics
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded border border-blue-200">
                  <div className="text-sm text-blue-700 font-medium">Cells Revealed</div>
                  <div className="text-xl font-bold text-blue-800">{stats.cellsRevealed}</div>
                  <div className="text-xs text-blue-600">of {config.width * config.height - config.mines}</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded border border-orange-200">
                  <div className="text-sm text-orange-700 font-medium">Flags Used</div>
                  <div className="text-xl font-bold text-orange-800">{stats.flagsUsed}</div>
                  <div className="text-xs text-orange-600">of {config.mines} mines</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded border border-green-200">
                  <div className="text-sm text-green-700 font-medium">Progress</div>
                  <div className="text-xl font-bold text-green-800">
                    {Math.round((stats.cellsRevealed / (config.width * config.height - config.mines)) * 100) || 0}%
                  </div>
                  <div className="text-xs text-green-600">completion</div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded border border-gray-200">
                  <div className="text-sm text-gray-700 font-medium">Time Elapsed</div>
                  <div className="text-xl font-bold text-gray-800">{formatTime(timeElapsed)}</div>
                  <div className="text-xs text-gray-600">
                    {status === 'playing' ? 'ongoing' : status === 'won' ? 'completed' : status === 'lost' ? 'game over' : 'not started'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}      {/* Error Modal */}
      <ErrorModal
        isOpen={showError}
        onClose={() => setShowError(false)}
        title="Invalid Custom Game Configuration"
        message={errorMessage}
      />      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />

      {/* Daily Puzzle Modal */}
      <DailyPuzzleModal
        isOpen={showDailyPuzzle}
        onClose={() => setShowDailyPuzzle(false)}
      />
    </div>
  );
};