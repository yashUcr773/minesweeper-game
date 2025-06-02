// Local Storage utilities for saving game statistics and preferences

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  bestTimes: {
    beginner: number | null;
    intermediate: number | null;
    expert: number | null;
  };
  totalPlayTime: number;
}

export interface UserPreferences {
  preferredDifficulty: string;
  soundEnabled: boolean;
  colorBlindMode: boolean;
  showTimer: boolean;
}

const STATS_KEY = 'minesweeper-stats';
const PREFERENCES_KEY = 'minesweeper-preferences';

export function getGameStats(): GameStats {
  if (typeof window === 'undefined') {
    return getDefaultStats();
  }
  
  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (stored) {
      return { ...getDefaultStats(), ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading game stats:', error);
  }
  
  return getDefaultStats();
}

export function saveGameStats(stats: GameStats): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving game stats:', error);
  }
}

export function updateGameStats(
  difficulty: 'beginner' | 'intermediate' | 'expert',
  won: boolean,
  timeElapsed: number
): void {
  const stats = getGameStats();
  
  stats.gamesPlayed++;
  stats.totalPlayTime += timeElapsed;
  
  if (won) {
    stats.gamesWon++;
    const currentBest = stats.bestTimes[difficulty];
    if (currentBest === null || timeElapsed < currentBest) {
      stats.bestTimes[difficulty] = timeElapsed;
    }
  } else {
    stats.gamesLost++;
  }
  
  saveGameStats(stats);
}

export function getUserPreferences(): UserPreferences {
  if (typeof window === 'undefined') {
    return getDefaultPreferences();
  }
  
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      return { ...getDefaultPreferences(), ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading user preferences:', error);
  }
  
  return getDefaultPreferences();
}

export function saveUserPreferences(preferences: UserPreferences): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
}

function getDefaultStats(): GameStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    bestTimes: {
      beginner: null,
      intermediate: null,
      expert: null,
    },
    totalPlayTime: 0,
  };
}

function getDefaultPreferences(): UserPreferences {
  return {
    preferredDifficulty: 'beginner',
    soundEnabled: true,
    colorBlindMode: false,
    showTimer: true,
  };
}
