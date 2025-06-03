'use client';

import React, { useState, useEffect } from 'react';
import { X, Trophy, Clock, Target,  User, Medal, Star } from 'lucide-react';
import { Button } from './ui/button';
import { LeaderboardEntry, Difficulty, LeaderboardStats } from '../types/game';
import { useAuth } from '../hooks/useAuth';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(Difficulty.BEGINNER);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('all');
  const [selectedStatsFilter, setSelectedStatsFilter] = useState<'all' | Difficulty>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<LeaderboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'mystats'>('leaderboard');

  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
      if (isAuthenticated) {
        fetchUserStats();
      }
    }
  }, [isOpen, selectedDifficulty, selectedTimeRange, isAuthenticated]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        difficulty: selectedDifficulty,
        timeRange: selectedTimeRange,
        limit: '10'
      });

      const response = await fetch(`/api/leaderboard?${params}`);
      const data = await response.json();

      if (data.success) {
        setEntries(data.entries);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchUserStats = async () => {
    try {
      // Get auth token from cookies
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      if (!token) {
        console.error('No auth token found for stats');
        return;
      }

      const response = await fetch('/api/leaderboard/stats', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setUserStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <Star className="w-5 h-5 text-gray-300" />;
  };
  const getRankBackground = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
    if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
    if (rank === 3) return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200';
    return 'bg-white border-gray-200';
  };

  // Function to get filtered stats based on selected difficulty
  const getFilteredStats = () => {
    if (!userStats) return null;
    
    if (selectedStatsFilter === 'all') {
      return {
        totalGames: userStats.totalGames,
        bestTime: userStats.bestTime,
        averageTime: userStats.averageTime,
        favoriteDifficulty: userStats.favoriteDifficulty
      };
    } else {
      const diffStats = userStats.byDifficulty[selectedStatsFilter];
      if (!diffStats) {
        return {
          totalGames: 0,
          bestTime: 0,
          averageTime: 0,
          favoriteDifficulty: selectedStatsFilter
        };
      }
      return {
        totalGames: diffStats.totalGames,
        bestTime: diffStats.bestTime,
        averageTime: diffStats.averageTime,
        favoriteDifficulty: selectedStatsFilter
      };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
            Leaderboard
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'leaderboard'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-1" />
            Leaderboard
          </button>
          {isAuthenticated && (
            <button
              onClick={() => setActiveTab('mystats')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'mystats'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4 inline mr-1" />
              My Stats
            </button>
          )}
        </div>

        {activeTab === 'leaderboard' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value as Difficulty)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="beginner">Beginner (9×9)</option>
                  <option value="intermediate">Intermediate (16×16)</option>
                  <option value="expert">Expert (30×16)</option>
                  <option value="master">Master (40×20)</option>
                  <option value="insane">Insane (50×25)</option>
                  <option value="extreme">Extreme (60×30)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Range
                </label>
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="day">Last 24 Hours</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="overflow-y-auto max-h-96">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No scores yet for this difficulty.</p>
                  <p className="text-sm">Be the first to set a record!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`p-4 rounded-lg border-2 ${getRankBackground(index + 1)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-gray-600">
                              #{index + 1}
                            </span>
                            {getDifficultyIcon(index + 1)}
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
                              {new Date(entry.completedAt).toLocaleDateString()}
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
          </>
        )}        {activeTab === 'mystats' && userStats && (
          <div className="space-y-6">
            {/* Overall Stats */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Overall Statistics</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Difficulty
                  </label>
                  <select
                    value={selectedStatsFilter}
                    onChange={(e) => setSelectedStatsFilter(e.target.value as 'all' | Difficulty)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="all">All Difficulties</option>
                    {Object.keys(userStats.byDifficulty).map(difficulty => (
                      <option key={difficulty} value={difficulty}>
                        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {(() => {
                const filteredStats = getFilteredStats();
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-600">{filteredStats?.totalGames || 0}</p>
                      <p className="text-sm text-gray-600">Games Played</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {filteredStats?.bestTime ? formatTime(filteredStats.bestTime) : '--'}
                      </p>
                      <p className="text-sm text-gray-600">Best Time</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-yellow-600">
                        {filteredStats?.averageTime ? formatTime(Math.round(filteredStats.averageTime)) : '--'}
                      </p>
                      <p className="text-sm text-gray-600">Average Time</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-purple-600 capitalize">
                        {selectedStatsFilter === 'all' ? filteredStats?.favoriteDifficulty : selectedStatsFilter}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedStatsFilter === 'all' ? 'Favorite' : 'Difficulty'}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Stats by Difficulty */}
            {userStats.byDifficulty && Object.keys(userStats.byDifficulty).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistics by Difficulty</h3>
                <div className="space-y-3">
                  {Object.entries(userStats.byDifficulty).map(([difficulty, stats]) => (
                    <div key={difficulty} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 capitalize">{difficulty}</h4>
                        <span className="text-sm text-gray-500">{stats.totalGames} games</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-semibold text-green-600">
                            {formatTime(stats.bestTime)}
                          </p>
                          <p className="text-gray-600">Best Time</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-blue-600">
                            {formatTime(stats.averageTime)}
                          </p>
                          <p className="text-gray-600">Avg Time</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-orange-600">
                            {stats.bestScore}
                          </p>
                          <p className="text-gray-600">Best Score</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {userStats.totalGames === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Complete your first game to see your stats!</p>
              </div>
            )}
          </div>
        )}

        {!isAuthenticated && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-center text-blue-800">
              <User className="w-4 h-4 inline mr-1" />
              Sign in to track your scores and compete on the leaderboard!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
