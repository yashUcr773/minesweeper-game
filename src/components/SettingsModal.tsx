'use client';

import React from 'react';
import { Button } from './ui/button';
import { UserPreferences } from '../lib/storage';
import { DIFFICULTY_CONFIGS } from '../types/game';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onPreferencesChange: (preferences: UserPreferences) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onPreferencesChange,
}) => {
  if (!isOpen) return null;

  const handlePreferredDifficultyChange = (difficulty: string) => {
    onPreferencesChange({
      ...preferences,
      preferredDifficulty: difficulty,
    });
  };

  const handleSoundToggle = () => {
    onPreferencesChange({
      ...preferences,
      soundEnabled: !preferences.soundEnabled,
    });
  };

  const handleColorBlindToggle = () => {
    onPreferencesChange({
      ...preferences,
      colorBlindMode: !preferences.colorBlindMode,
    });
  };

  const handleTimerToggle = () => {
    onPreferencesChange({
      ...preferences,
      showTimer: !preferences.showTimer,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            aria-label="Close settings"
          >
            ×
          </button>
        </div>        <div className="space-y-4">
          <div>
            <label htmlFor="difficulty-select" className="block text-gray-700 font-medium mb-2">
              Preferred Difficulty
            </label>
            <select
              id="difficulty-select"
              value={preferences.preferredDifficulty}
              onChange={(e) => handlePreferredDifficultyChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(DIFFICULTY_CONFIGS).map(([diff, config]) => {
                if (diff === 'custom') return null;
                
                return (
                  <option key={diff} value={diff}>
                    {diff.charAt(0).toUpperCase() + diff.slice(1)} ({config.width}×{config.height}, {config.mines} mines)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="sound-toggle" className="text-gray-700 font-medium">
              Sound Effects
            </label>
            <button
              id="sound-toggle"
              onClick={handleSoundToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.soundEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-label={`Sound effects ${preferences.soundEnabled ? 'enabled' : 'disabled'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="colorblind-toggle" className="text-gray-700 font-medium">
              Color-Blind Mode
            </label>
            <button
              id="colorblind-toggle"
              onClick={handleColorBlindToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.colorBlindMode ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-label={`Color-blind mode ${preferences.colorBlindMode ? 'enabled' : 'disabled'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.colorBlindMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="timer-toggle" className="text-gray-700 font-medium">
              Show Timer
            </label>
            <button
              id="timer-toggle"
              onClick={handleTimerToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.showTimer ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-label={`Timer ${preferences.showTimer ? 'enabled' : 'disabled'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.showTimer ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-4">
            Color-blind mode shows numbers on flagged cells and uses different symbols to help distinguish cell states.
          </p>
          <Button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};