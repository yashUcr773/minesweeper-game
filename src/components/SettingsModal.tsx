'use client';

import React from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full mx-4">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="difficulty-select" className="text-gray-700 font-medium">
              Preferred Difficulty
            </Label>
            <Select value={preferences.preferredDifficulty} onValueChange={handlePreferredDifficultyChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DIFFICULTY_CONFIGS).map(([diff, config]) => {
                  if (diff === 'custom') return null;
                  
                  return (
                    <SelectItem key={diff} value={diff}>
                      {diff.charAt(0).toUpperCase() + diff.slice(1)} ({config.width}×{config.height}, {config.mines} mines)
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="sound-toggle" className="text-gray-700 font-medium">
              Sound Effects
            </Label>
            <Switch
              id="sound-toggle"
              checked={preferences.soundEnabled}
              onCheckedChange={handleSoundToggle}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="colorblind-toggle" className="text-gray-700 font-medium">
              Color-Blind Mode
            </Label>
            <Switch
              id="colorblind-toggle"
              checked={preferences.colorBlindMode}
              onCheckedChange={handleColorBlindToggle}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="timer-toggle" className="text-gray-700 font-medium">
              Show Timer
            </Label>
            <Switch
              id="timer-toggle"
              checked={preferences.showTimer}
              onCheckedChange={handleTimerToggle}
            />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-4">
            Color-blind mode shows numbers on flagged cells and uses different symbols to help distinguish cell states.
          </p>
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};