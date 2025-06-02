'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { getGameStats, getUserPreferences } from '../lib/storage';
import type { GameStats, UserPreferences } from '../lib/storage';
import { X, Trophy, Clock, Target } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStats(getGameStats());
      setPreferences(getUserPreferences());
    }
  }, [isOpen]);

  if (!isOpen || !stats || !preferences) return null;

  const winRate = stats.gamesPlayed > 0 ? (stats.gamesWon / stats.gamesPlayed * 100).toFixed(1) : '0.0';
  
  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotalTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
            Statistics
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

        {/* General Stats */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.gamesPlayed}</div>
              <div className="text-sm text-gray-600">Games Played</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{winRate}%</div>
              <div className="text-sm text-gray-600">Win Rate</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.gamesWon}</div>
              <div className="text-sm text-gray-600">Games Won</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{stats.gamesLost}</div>
              <div className="text-sm text-gray-600">Games Lost</div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600 flex items-center justify-center">
              <Clock className="w-5 h-5 mr-1" />
              {formatTotalTime(stats.totalPlayTime)}
            </div>
            <div className="text-sm text-gray-600">Total Play Time</div>
          </div>
        </div>

        {/* Best Times */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-500" />
            Best Times
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
              <span className="font-medium">Beginner (9×9)</span>
              <span className="text-blue-600 font-mono">{formatTime(stats.bestTimes.beginner)}</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
              <span className="font-medium">Intermediate (16×16)</span>
              <span className="text-orange-600 font-mono">{formatTime(stats.bestTimes.intermediate)}</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
              <span className="font-medium">Expert (30×16)</span>
              <span className="text-red-600 font-mono">{formatTime(stats.bestTimes.expert)}</span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <Button
          onClick={onClose}
          className="w-full"
        >
          Close
        </Button>
      </div>
    </div>
  );
};
