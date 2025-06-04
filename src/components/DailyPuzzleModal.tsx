'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, Clock, Star, Medal, Users, Target } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../hooks/useAuth';
import { DailyPuzzle as DailyPuzzleType, DailyPuzzleEntry, DailyPuzzleLeaderboard } from '../types/game';
import { GameBoard } from './GameBoard';
import { generateDeterministicPuzzle, generateMineCounts, PuzzleData } from '../lib/puzzleGenerator';

interface DailyPuzzleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DailyGameState extends PuzzleData {
  mineCounts: number[][];
  config: {
    width: number;
    height: number;
    mines: number;
  };
}

export function DailyPuzzleModal({ isOpen, onClose }: DailyPuzzleModalProps) {  const [dailyData, setDailyData] = useState<DailyPuzzleLeaderboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [gameState, setGameState] = useState<DailyGameState | null>(null);
  const [activeTab, setActiveTab] = useState<'play' | 'leaderboard'>('play');
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchDailyPuzzle();
    }
  }, [isOpen, isAuthenticated]);

  const fetchDailyPuzzle = async () => {
    setLoading(true);
    try {
      // Get auth token from cookies
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch('/api/daily-puzzle', { headers });
      const data = await response.json();

      if (data.success) {
        setDailyData(data);
        initializeGame(data.puzzle);
      }
    } catch (error) {
      console.error('Failed to fetch daily puzzle:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeGame = (puzzle: DailyPuzzleType) => {
    const puzzleData = generateDeterministicPuzzle({
      width: puzzle.width,
      height: puzzle.height,
      mines: puzzle.mines,
      seed: puzzle.seed
    });

    const mineCounts = generateMineCounts(puzzleData.mines, puzzle.width, puzzle.height);

    setGameState({
      ...puzzleData,
      mineCounts,
      config: {
        width: puzzle.width,
        height: puzzle.height,
        mines: puzzle.mines
      }
    });
  };
  const handleCellClick = (row: number, col: number) => {
    if (!gameState || gameState.gameEnded || !isAuthenticated) return;// Start timer on first click
    if (gameState.firstClick) {
      setGameStartTime(Date.now());
      setGameState(prev => prev ? { ...prev, firstClick: false, gameStarted: true } : null);
    }

    // Handle game logic (simplified for daily puzzle)
    const newRevealed = gameState.revealed.map((row: boolean[]) => [...row]);
    
    if (gameState.mines[row][col]) {
      // Hit a mine - game over
      newRevealed[row][col] = true;
      setGameState(prev => prev ? ({
        ...prev,
        revealed: newRevealed,
        gameEnded: true,
        gameWon: false
      }) : null);
      submitScore(false);
    } else {
      // Reveal cell and check for win
      revealCell(row, col, newRevealed);
      
      const isWon = checkWinCondition(newRevealed, gameState.mines);
      if (isWon) {
        setGameState(prev => prev ? ({
          ...prev,
          revealed: newRevealed,
          gameEnded: true,
          gameWon: true
        }) : null);
        submitScore(true);
      } else {
        setGameState(prev => prev ? ({
          ...prev,
          revealed: newRevealed
        }) : null);
      }
    }
  };
  const revealCell = (row: number, col: number, revealed: boolean[][]) => {
    if (!gameState || revealed[row][col] || gameState.flagged[row][col]) return;

    revealed[row][col] = true;

    // If cell has no adjacent mines, reveal neighbors
    if (gameState.mineCounts[row][col] === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const newRow = row + dr;
          const newCol = col + dc;
          if (newRow >= 0 && newRow < gameState.config.height && 
              newCol >= 0 && newCol < gameState.config.width) {
            revealCell(newRow, newCol, revealed);
          }
        }
      }
    }
  };

  const checkWinCondition = (revealed: boolean[][], mines: boolean[][]): boolean => {
    if (!gameState) return false;
    for (let row = 0; row < gameState.config.height; row++) {
      for (let col = 0; col < gameState.config.width; col++) {
        if (!mines[row][col] && !revealed[row][col]) {
          return false;
        }
      }
    }
    return true;
  };

  const submitScore = async (completed: boolean) => {
    if (!gameStartTime || isSubmitting || !isAuthenticated) return;

    setIsSubmitting(true);
    const timeElapsed = Math.floor((Date.now() - gameStartTime) / 1000);
    const score = completed ? Math.max(0, 999 - timeElapsed) : 0;

    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const response = await fetch('/api/daily-puzzle/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          timeElapsed,
          score,
          completed
        })
      });

      if (response.ok) {
        // Refresh data to show updated leaderboard
        await fetchDailyPuzzle();
      }
    } catch (error) {
      console.error('Failed to submit score:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleRightClick = (row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!gameState || gameState.gameEnded || gameState.revealed[row][col]) return;

    const newFlagged = gameState.flagged.map((flagRow: boolean[]) => [...flagRow]);
    newFlagged[row][col] = !newFlagged[row][col];
    setGameState(prev => prev ? ({ ...prev, flagged: newFlagged }) : null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <Star className="w-5 h-5 text-gray-300" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-900">Daily Puzzle</h2>
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('play')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'play'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Play Today's Puzzle
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'leaderboard'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Leaderboard
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {activeTab === 'play' && (
                <div className="space-y-6">
                  {!isAuthenticated ? (
                    <div className="text-center py-8">
                      <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Sign in to Play Daily Puzzle
                      </h3>
                      <p className="text-gray-600">
                        Create an account or sign in to play today's puzzle and compete on the leaderboard.
                      </p>
                    </div>                  ) : dailyData?.userEntry?.completed ? (
                    <div className="space-y-6">
                      {/* User's Best Result */}
                      <div className="text-center">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                          <Trophy className="w-16 h-16 mx-auto mb-4 text-green-500" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Puzzle Completed!
                          </h3>
                          <div className="space-y-2 text-gray-600">
                            <p>Best Time: {formatTime(dailyData.userEntry.timeElapsed)}</p>
                            <p>Best Score: {dailyData.userEntry.score}</p>
                            {dailyData.rank && (
                              <p>Current Rank: #{dailyData.rank}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Attempt History */}
                      {dailyData.userAttempts && dailyData.userAttempts.length > 1 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h4 className="text-md font-semibold text-gray-900 mb-3">
                            Your Attempts ({dailyData.userAttempts.length})
                          </h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {dailyData.userAttempts.map((attempt, index) => (
                              <div key={attempt.id} className="flex justify-between items-center text-sm">
                                <span className={`${attempt.completed ? 'text-green-600' : 'text-red-600'}`}>
                                  Attempt #{dailyData.userAttempts!.length - index}
                                  {attempt.completed && index === 0 && ' (Best)'}
                                </span>
                                <span className="text-gray-500">
                                  {attempt.completed 
                                    ? `${formatTime(attempt.timeElapsed)} • ${attempt.score} pts`
                                    : 'Failed'
                                  }
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Try Again Button */}
                      <div className="text-center">
                        <Button 
                          onClick={() => {
                            setGameState(null);
                            initializeGame(dailyData.puzzle);
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Try Again
                        </Button>                        <p className="text-sm text-gray-500 mt-2">
                          Only your first successful completion counts for the leaderboard
                        </p>
                      </div>
                    </div>
                  ) : dailyData?.userAttempts && dailyData.userAttempts.length > 0 ? (
                    <div className="space-y-6">
                      {/* Previous Attempts */}
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                        <Target className="w-16 h-16 mx-auto mb-4 text-orange-500" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Keep Trying!
                        </h3>
                        <p className="text-gray-600 mb-4">
                          You've made {dailyData.userAttempts.length} attempt{dailyData.userAttempts.length > 1 ? 's' : ''} but haven't completed the puzzle yet.
                        </p>
                        
                        {/* Attempt History */}
                        <div className="bg-white border border-orange-200 rounded-lg p-4 mb-4">
                          <h4 className="text-md font-semibold text-gray-900 mb-3">
                            Previous Attempts
                          </h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {dailyData.userAttempts.map((attempt, index) => (
                              <div key={attempt.id} className="flex justify-between items-center text-sm">
                                <span className="text-red-600">
                                  Attempt #{dailyData.userAttempts!.length - index}
                                </span>
                                <span className="text-gray-500">Failed</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button 
                          onClick={() => {
                            setGameState(null);
                            initializeGame(dailyData.puzzle);
                          }}
                          className="bg-orange-600 hover:bg-orange-700 w-full"
                        >
                          Try Again
                        </Button>
                      </div>

                      {/* Show game if user clicked try again */}
                      {gameState && (
                        <div className="space-y-4">
                          {/* Game Info */}
                          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="text-center">
                                <p className="text-lg font-bold text-blue-600">
                                  {dailyData?.puzzle.difficulty || 'Intermediate'}
                                </p>
                                <p className="text-sm text-gray-600">Difficulty</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-bold text-green-600">
                                  {gameState.config.mines}
                                </p>
                                <p className="text-sm text-gray-600">Mines</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-bold text-purple-600">
                                  {gameState.config.width}×{gameState.config.height}
                                </p>
                                <p className="text-sm text-gray-600">Grid</p>
                              </div>
                            </div>
                            
                            {gameState.gameEnded && (
                              <div className="text-center">
                                <p className={`text-lg font-bold ${gameState.gameWon ? 'text-green-600' : 'text-red-600'}`}>
                                  {gameState.gameWon ? 'Victory!' : 'Game Over'}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Game Board */}
                          <div className="flex justify-center">
                            <div 
                              className="inline-block border-2 border-gray-300 bg-gray-100 p-2"
                              style={{ 
                                display: 'grid', 
                                gridTemplateColumns: `repeat(${gameState.config.width}, 24px)`,
                                gap: '1px'
                              }}
                            >
                              {Array(gameState.config.height).fill(null).map((_, row: number) =>
                                Array(gameState.config.width).fill(null).map((_, col: number) => (
                                  <button
                                    key={`${row}-${col}`}
                                    className={`
                                      w-6 h-6 text-xs font-bold border border-gray-400 flex items-center justify-center
                                      ${gameState.revealed[row][col] 
                                        ? gameState.mines[row][col]
                                          ? 'bg-red-500 text-white'
                                          : 'bg-gray-200 text-gray-900'
                                        : gameState.flagged[row][col]
                                          ? 'bg-yellow-400 text-red-600'
                                          : 'bg-gray-300 hover:bg-gray-350'
                                      }
                                    `}
                                    onClick={() => handleCellClick(row, col)}
                                    onContextMenu={(e) => handleRightClick(row, col, e)}
                                    disabled={gameState.gameEnded}
                                  >
                                    {gameState.revealed[row][col] 
                                      ? gameState.mines[row][col]
                                        ? '💣'
                                        : gameState.mineCounts[row][col] > 0
                                          ? gameState.mineCounts[row][col]
                                          : ''
                                      : gameState.flagged[row][col]
                                        ? '🚩'
                                        : ''
                                    }
                                  </button>
                                ))
                              )}
                            </div>
                          </div>

                          <div className="text-center text-sm text-gray-600">
                            Left click to reveal • Right click to flag
                          </div>
                        </div>
                      )}
                    </div>
                  ) : gameState ? (
                    <div className="space-y-4">
                      {/* Game Info */}
                      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <p className="text-lg font-bold text-blue-600">
                              {dailyData?.puzzle.difficulty || 'Intermediate'}
                            </p>
                            <p className="text-sm text-gray-600">Difficulty</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-green-600">
                              {gameState.config.mines}
                            </p>
                            <p className="text-sm text-gray-600">Mines</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-purple-600">
                              {gameState.config.width}×{gameState.config.height}
                            </p>
                            <p className="text-sm text-gray-600">Grid</p>
                          </div>
                        </div>
                        
                        {gameState.gameEnded && (
                          <div className="text-center">
                            <p className={`text-lg font-bold ${gameState.gameWon ? 'text-green-600' : 'text-red-600'}`}>
                              {gameState.gameWon ? 'Victory!' : 'Game Over'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Game Board */}
                      <div className="flex justify-center">
                        <div 
                          className="inline-block border-2 border-gray-300 bg-gray-100 p-2"
                          style={{ 
                            display: 'grid', 
                            gridTemplateColumns: `repeat(${gameState.config.width}, 24px)`,
                            gap: '1px'
                          }}
                        >                          {Array(gameState.config.height).fill(null).map((_, row: number) =>
                            Array(gameState.config.width).fill(null).map((_, col: number) => (
                              <button
                                key={`${row}-${col}`}
                                className={`
                                  w-6 h-6 text-xs font-bold border border-gray-400 flex items-center justify-center
                                  ${gameState.revealed[row][col] 
                                    ? gameState.mines[row][col]
                                      ? 'bg-red-500 text-white'
                                      : 'bg-gray-200 text-gray-900'
                                    : gameState.flagged[row][col]
                                      ? 'bg-yellow-400 text-red-600'
                                      : 'bg-gray-300 hover:bg-gray-350'
                                  }
                                `}
                                onClick={() => handleCellClick(row, col)}
                                onContextMenu={(e) => handleRightClick(row, col, e)}
                                disabled={gameState.gameEnded}
                              >
                                {gameState.revealed[row][col] 
                                  ? gameState.mines[row][col]
                                    ? '💣'
                                    : gameState.mineCounts[row][col] > 0
                                      ? gameState.mineCounts[row][col]
                                      : ''
                                  : gameState.flagged[row][col]
                                    ? '🚩'
                                    : ''
                                }
                              </button>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="text-center text-sm text-gray-600">
                        Left click to reveal • Right click to flag
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {activeTab === 'leaderboard' && dailyData && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Today's Leaderboard
                    </h3>
                    <p className="text-gray-600">
                      {dailyData.leaderboard.length} player{dailyData.leaderboard.length !== 1 ? 's' : ''} completed today's puzzle
                    </p>
                  </div>

                  {dailyData.leaderboard.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No completions yet today.</p>
                      <p className="text-sm">Be the first to solve today's puzzle!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dailyData.leaderboard.map((entry: DailyPuzzleEntry, index: number) => (
                        <div
                          key={entry.id}
                          className={`p-4 rounded-lg border-2 ${
                            index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200' :
                            index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200' :
                            index === 2 ? 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200' :
                            'bg-white border-gray-200'
                          } ${entry.userId === user?.id ? 'ring-2 ring-blue-300' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg font-bold text-gray-600">
                                  #{index + 1}
                                </span>
                                {getRankIcon(index + 1)}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {entry.username}
                                  {entry.userId === user?.id && (
                                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                      You
                                    </span>
                                  )}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(entry.completedAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <p className="font-bold text-lg text-gray-900 flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {formatTime(entry.timeElapsed)}
                                  </p>
                                  <p className="text-sm text-gray-500 flex items-center">
                                    <Target className="w-3 h-3 mr-1" />
                                    Score: {entry.score}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t bg-gray-50">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
