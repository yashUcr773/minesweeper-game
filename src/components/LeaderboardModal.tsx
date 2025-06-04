'use client';

import React, { useState, useEffect } from 'react';
import { X, Trophy, Clock, Target,  User, Medal, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
            Leaderboard
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'leaderboard' | 'mystats')} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="leaderboard" className="flex items-center">
              <Trophy className="w-4 h-4 mr-1" />
              Leaderboard
            </TabsTrigger>
            {isAuthenticated && (
              <TabsTrigger value="mystats" className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                My Stats
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="leaderboard" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </Label>
                <Select value={selectedDifficulty} onValueChange={(value) => setSelectedDifficulty(value as Difficulty)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner (9×9)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (16×16)</SelectItem>
                    <SelectItem value="expert">Expert (30×16)</SelectItem>
                    <SelectItem value="master">Master (40×20)</SelectItem>
                    <SelectItem value="insane">Insane (50×25)</SelectItem>
                    <SelectItem value="extreme">Extreme (60×30)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1">
                  Time Range
                </Label>
                <Select value={selectedTimeRange} onValueChange={(value) => setSelectedTimeRange(value as 'day' | 'week' | 'month' | 'all')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
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
                    <Card key={entry.id} className={`${getRankBackground(index + 1)}`}>
                      <CardContent className="p-4">
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="mystats" className="space-y-6">
            {userStats && (
              <div className="space-y-6">
                {/* Overall Stats */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Overall Statistics</h3>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-1">
                        Filter by Difficulty
                      </Label>
                      <Select value={selectedStatsFilter} onValueChange={(value) => setSelectedStatsFilter(value as 'all' | Difficulty)}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Difficulties</SelectItem>
                          {Object.keys(userStats.byDifficulty).map(difficulty => (
                            <SelectItem key={difficulty} value={difficulty}>
                              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {(() => {
                    const filteredStats = getFilteredStats();
                    return (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-blue-600">{filteredStats?.totalGames || 0}</p>
                            <p className="text-sm text-gray-600">Games Played</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-green-600">
                              {filteredStats?.bestTime ? formatTime(filteredStats.bestTime) : '--'}
                            </p>
                            <p className="text-sm text-gray-600">Best Time</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-yellow-50 border-yellow-200">
                          <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-yellow-600">
                              {filteredStats?.averageTime ? formatTime(Math.round(filteredStats.averageTime)) : '--'}
                            </p>
                            <p className="text-sm text-gray-600">Average Time</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-purple-50 border-purple-200">
                          <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-purple-600 capitalize">
                              {selectedStatsFilter === 'all' ? filteredStats?.favoriteDifficulty : selectedStatsFilter}
                            </p>
                            <p className="text-sm text-gray-600">
                              {selectedStatsFilter === 'all' ? 'Favorite' : 'Difficulty'}
                            </p>
                          </CardContent>
                        </Card>
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
                        <Card key={difficulty} className="bg-gray-50">
                          <CardContent className="p-4">
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
                          </CardContent>
                        </Card>
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
          </TabsContent>
        </Tabs>

        {!isAuthenticated && (
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-center text-blue-800">
                <User className="w-4 h-4 inline mr-1" />
                Sign in to track your scores and compete on the leaderboard!
              </p>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}
