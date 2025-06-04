'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useUserPreferences } from '../hooks/useUserPreferences';
import type { UserPreferences } from '../lib/storage';
import { Settings, Volume2, VolumeX, Eye, Clock } from 'lucide-react';

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl font-bold text-gray-800">
            <Settings className="w-6 h-6 mr-2 text-gray-600" />
            Settings
          </DialogTitle>
        </DialogHeader>

        {/* Settings */}
        <div className="space-y-6">
          {/* Preferred Difficulty */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Preferred Difficulty
            </Label>
            <Select 
              value={localPreferences.preferredDifficulty} 
              onValueChange={(value) => updateLocalPreference('preferredDifficulty', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner (9×9, 10 mines)</SelectItem>
                <SelectItem value="intermediate">Intermediate (16×16, 40 mines)</SelectItem>
                <SelectItem value="expert">Expert (30×16, 99 mines)</SelectItem>
              </SelectContent>
            </Select>
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
        </div>        {/* Buttons */}
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
      </DialogContent>
    </Dialog>
  );
};
