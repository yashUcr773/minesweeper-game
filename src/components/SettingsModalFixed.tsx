'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useUserPreferences } from '../hooks/useUserPreferences';
import type { UserPreferences } from '../lib/storage';
import { X, Settings, Volume2, VolumeX, Eye, Clock } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [localPreferences, setLocalPreferences] = useState<UserPreferences | null>(null);
  const { preferences: globalPreferences, updatePreferences } = useUserPreferences();

  useEffect(() => {
    if (isOpen && globalPreferences) {
      setLocalPreferences({ ...globalPreferences });
    }
  }, [isOpen, globalPreferences]);

  const handleSave = () => {
    if (localPreferences) {
      updatePreferences(localPreferences);
      onClose();
    }
  };

  const updateLocalPreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    if (localPreferences) {
      setLocalPreferences({ ...localPreferences, [key]: value });
    }
  };

  if (!isOpen || !localPreferences) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Settings className="w-6 h-6 mr-2 text-gray-600" />
            Settings
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

        {/* Settings */}
        <div className="space-y-6">
          {/* Preferred Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Difficulty
            </label>
            <select
              value={localPreferences.preferredDifficulty}
              onChange={(e) => updateLocalPreference('preferredDifficulty', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="beginner">Beginner (9×9, 10 mines)</option>
              <option value="intermediate">Intermediate (16×16, 40 mines)</option>
              <option value="expert">Expert (30×16, 99 mines)</option>
            </select>
          </div>

          {/* Sound Effects */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {localPreferences.soundEnabled ? (
                <Volume2 className="w-5 h-5 mr-2 text-green-600" />
              ) : (
                <VolumeX className="w-5 h-5 mr-2 text-red-600" />
              )}
              <span className="text-sm font-medium text-gray-700">Sound Effects</span>
            </div>
            <Button
              onClick={() => updateLocalPreference('soundEnabled', !localPreferences.soundEnabled)}
              variant={localPreferences.soundEnabled ? 'default' : 'outline'}
              size="sm"
            >
              {localPreferences.soundEnabled ? 'On' : 'Off'}
            </Button>
          </div>

          {/* Color Blind Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Eye className="w-5 h-5 mr-2 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Color Blind Mode</span>
            </div>
            <Button
              onClick={() => updateLocalPreference('colorBlindMode', !localPreferences.colorBlindMode)}
              variant={localPreferences.colorBlindMode ? 'default' : 'outline'}
              size="sm"
            >
              {localPreferences.colorBlindMode ? 'On' : 'Off'}
            </Button>
          </div>

          {/* Show Timer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Show Timer</span>
            </div>
            <Button
              onClick={() => updateLocalPreference('showTimer', !localPreferences.showTimer)}
              variant={localPreferences.showTimer ? 'default' : 'outline'}
              size="sm"
            >
              {localPreferences.showTimer ? 'On' : 'Off'}
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tips:</strong> Color blind mode uses symbols instead of colors for mine counts. 
            Sound effects provide audio feedback for game events.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex space-x-3 mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};
