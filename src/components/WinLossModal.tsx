'use client';

import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { GameState, Difficulty } from '../types/game';
import { getGameStats } from '../lib/storage';
import { soundManager } from '../lib/sounds';
import { X, Trophy, RotateCcw, BarChart3, Clock, Target,  Star } from 'lucide-react';

interface WinLossModalProps {
  isOpen: boolean;
  gameState: GameState;
  difficulty: Difficulty;
  timeElapsed: number;
  onClose: () => void;
  onRestart: () => void;
  onShowStats: () => void;
  onChangeDifficulty?: (difficulty: Difficulty) => void;
}

export const WinLossModal: React.FC<WinLossModalProps> = ({
  isOpen,
  gameState,
  difficulty,
  timeElapsed,
  onClose,
  onRestart,
  onShowStats,
  onChangeDifficulty,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [animationStage, setAnimationStage] = useState(0);
  const [stats, setStats] = useState(getGameStats());

  const isWin = gameState.status === 'won';  // Load latest stats when modal opens
  useEffect(() => {
    if (isOpen) {
      setStats(getGameStats());
      setShowDetails(false);
      setAnimationStage(0);
      
      // Play appropriate sound effect
      if (isWin) {
        setTimeout(() => soundManager.modalVictoryFanfare(), 200);
      } else {
        setTimeout(() => soundManager.modalDefeatSound(), 200);
      }
      
      // Animate in stages
      const timer1 = setTimeout(() => setAnimationStage(1), 100);
      const timer2 = setTimeout(() => setAnimationStage(2), 300);
      const timer3 = setTimeout(() => setAnimationStage(3), 600);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isOpen, isWin]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || (gameState.status !== 'won' && gameState.status !== 'lost')) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPerformanceRating = () => {
    if (!isWin) return null;
    
    const efficiency = (gameState.stats.cellsRevealed / (gameState.config.width * gameState.config.height - gameState.config.mines)) * 100;
    const flagAccuracy = gameState.config.mines > 0 ? ((gameState.config.mines - (gameState.stats.flagsUsed - gameState.config.mines)) / gameState.config.mines) * 100 : 100;
    
    const avgScore = (efficiency + Math.max(0, flagAccuracy)) / 2;
    
    if (avgScore >= 95) return { rating: 'Perfect', icon: '🌟', color: 'text-yellow-500' };
    if (avgScore >= 85) return { rating: 'Excellent', icon: '🏆', color: 'text-yellow-600' };
    if (avgScore >= 75) return { rating: 'Great', icon: '🥇', color: 'text-orange-500' };
    if (avgScore >= 65) return { rating: 'Good', icon: '🥈', color: 'text-gray-500' };
    return { rating: 'Completed', icon: '🥉', color: 'text-amber-600' };
  };

  const performance = getPerformanceRating();
  const winRate = stats.gamesPlayed > 0 ? ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(1) : '0.0';
  // Check if this is a new record
  const difficultyKey = difficulty as keyof typeof stats.bestTimes;
  const isNewRecord = isWin && difficulty !== Difficulty.CUSTOM && 
    (stats.bestTimes[difficultyKey] === null || timeElapsed < stats.bestTimes[difficultyKey]!);  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-md w-full transform transition-all duration-500 ${
        animationStage >= 1 ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        {/* Header */}
        <div className={`relative p-6 text-center ${
          isWin ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'
        } text-white rounded-t-2xl overflow-hidden -mx-6 -mt-6`}>
          {/* Background pattern */}          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-repeat" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
          </div>

          {/* Animated Emoji */}
          <div className={`text-6xl mb-4 transition-all duration-700 ${
            animationStage >= 2 ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
          }`}>
            {isWin ? '🎉' : '💥'}
          </div>

          {/* Title */}
          <h2 className={`text-3xl font-bold mb-2 transition-all duration-500 delay-200 ${
            animationStage >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            {isWin ? 'Victory!' : 'Game Over'}
          </h2>

          {/* Subtitle */}
          <p className={`text-lg opacity-90 transition-all duration-500 delay-300 ${
            animationStage >= 2 ? 'translate-y-0 opacity-90' : 'translate-y-4 opacity-0'
          }`}>
            {isWin ? (
              <>
                {isNewRecord && <span className="inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-sm font-semibold mb-2">
                  <Star className="w-4 h-4" />
                  New Record!
                </span>}
                <br />
                {performance && (
                  <span className={`inline-flex items-center gap-1 ${performance.color}`}>
                    <span>{performance.icon}</span>
                    {performance.rating} Clear!
                  </span>
                )}
              </>
            ) : (
              'Better luck next time!'
            )}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Game Statistics */}
          <div className={`space-y-4 mb-6 transition-all duration-500 delay-400 ${
            animationStage >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            {/* Time and Difficulty */}
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Time</span>
              </div>
              <span className="text-lg font-bold">{formatTime(timeElapsed)}</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Difficulty</span>
              </div>              <span className="text-lg font-bold capitalize">
                {difficulty === Difficulty.CUSTOM ? 'Custom' : difficulty}
                {difficulty !== Difficulty.CUSTOM && (
                  <span className="text-sm text-gray-500 ml-1">
                    ({gameState.config.width}×{gameState.config.height})
                  </span>
                )}
              </span>
            </div>

            {/* Win-specific stats */}
            {isWin && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{gameState.stats.cellsRevealed}</div>
                  <div className="text-xs text-gray-600">Cells Revealed</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{gameState.stats.flagsUsed}</div>
                  <div className="text-xs text-gray-600">Flags Used</div>
                </div>
              </div>
            )}

            {/* Overall Statistics Toggle */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center justify-between"
            >
              <span className="font-medium text-indigo-700">Your Overall Stats</span>
              <BarChart3 className="w-5 h-5 text-indigo-500" />
            </button>

            {/* Expandable Overall Stats */}
            {showDetails && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg animate-fade-in">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-xl font-bold text-blue-600">{stats.gamesPlayed}</div>
                    <div className="text-xs text-gray-600">Played</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-600">{stats.gamesWon}</div>
                    <div className="text-xs text-gray-600">Won</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-purple-600">{winRate}%</div>
                    <div className="text-xs text-gray-600">Win Rate</div>
                  </div>
                </div>
                  {/* Best times for standard difficulties */}
                {([Difficulty.BEGINNER, Difficulty.INTERMEDIATE, Difficulty.EXPERT] as const).some(d => stats.bestTimes[d as keyof typeof stats.bestTimes] !== null) && (
                  <div className="border-t pt-3">
                    <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Trophy className="w-4 h-4" />
                      Best Times
                    </div>
                    <div className="space-y-1">
                      {([Difficulty.BEGINNER, Difficulty.INTERMEDIATE, Difficulty.EXPERT] as const).map(diff => {
                        const bestTime = stats.bestTimes[diff as keyof typeof stats.bestTimes];
                        return bestTime !== null && (
                          <div key={diff} className="flex justify-between text-sm">
                            <span className="capitalize">{diff}:</span>
                            <span className="font-mono">{formatTime(bestTime)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className={`space-y-3 transition-all duration-500 delay-500 ${
            animationStage >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            {/* Primary Actions */}
            <div className="flex gap-3">
              <Button
                onClick={onRestart}
                className={`flex-1 ${
                  isWin 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } text-white`}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
              <Button
                onClick={onShowStats}
                variant="outline"
                className="flex-1"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Stats
              </Button>
            </div>            {/* Quick Difficulty Change (for standard difficulties) */}
            {difficulty !== Difficulty.CUSTOM && onChangeDifficulty && (
              <div className="flex gap-2 justify-center">
                {([Difficulty.BEGINNER, Difficulty.INTERMEDIATE, Difficulty.EXPERT] as const).map((diff) => (
                  <Button
                    key={diff}
                    onClick={() => onChangeDifficulty(diff)}
                    variant={difficulty === diff ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                  >
                    {diff === Difficulty.BEGINNER ? '🟢' : diff === Difficulty.INTERMEDIATE ? '🟡' : '🔴'}
                    <span className="ml-1 capitalize">{diff}</span>
                  </Button>
                ))}
              </div>            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
