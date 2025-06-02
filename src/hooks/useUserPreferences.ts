'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUserPreferences, saveUserPreferences, type UserPreferences } from '../lib/storage';
import { soundManager } from '../lib/sounds';

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    setPreferences(getUserPreferences());
  }, []);

  useEffect(() => {
    if (preferences) {
      soundManager.setEnabled(preferences.soundEnabled);
    }
  }, [preferences?.soundEnabled]);

  const updatePreferences = useCallback((newPreferences: Partial<UserPreferences>) => {
    if (preferences) {
      const updated = { ...preferences, ...newPreferences };
      setPreferences(updated);
      saveUserPreferences(updated);
    }
  }, [preferences]);

  return {
    preferences,
    updatePreferences,
  };
};
