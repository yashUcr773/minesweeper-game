// Simple JSON file-based database for development
// In production, you'd use a real database like PostgreSQL, MongoDB, etc.

import fs from 'fs';
import path from 'path';
import { User, LeaderboardEntry } from '../types/game';

const dbPath = path.join(process.cwd(), 'data');
const usersFile = path.join(dbPath, 'users.json');
const leaderboardFile = path.join(dbPath, 'leaderboard.json');

// Ensure database directory and files exist
export function initializeDatabase() {
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }
  
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]));
  }
  
  if (!fs.existsSync(leaderboardFile)) {
    fs.writeFileSync(leaderboardFile, JSON.stringify([]));
  }
}

// User operations
interface UserWithPassword extends User {
  password: string;
}

export function getUsers(): UserWithPassword[] {
  initializeDatabase();
  try {
    const data = fs.readFileSync(usersFile, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveUsers(users: UserWithPassword[]): void {
  initializeDatabase();
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

export function findUserByEmail(email: string): UserWithPassword | null {
  const users = getUsers();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
}

export function findUserById(id: string): User | null {
  const users = getUsers();
  const user = users.find(user => user.id === id);
  if (!user) return null;
  
  // Return user without password
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export function createUser(userData: Omit<UserWithPassword, 'id' | 'createdAt' | 'lastActive'>): User {
  const users = getUsers();
  const newUser: UserWithPassword = {
    ...userData,
    id: generateId(),
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString()
  };
  
  users.push(newUser);
  saveUsers(users);
  
  // Return user without password
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

export function updateUser(id: string, updates: Partial<UserWithPassword>): User | null {
  const users = getUsers();
  const userIndex = users.findIndex(user => user.id === id);
  
  if (userIndex === -1) return null;
  
  users[userIndex] = { ...users[userIndex], ...updates, lastActive: new Date().toISOString() };
  saveUsers(users);
  
  // Return user without password
  const { password, ...userWithoutPassword } = users[userIndex];
  return userWithoutPassword;
}

// Leaderboard operations
export function getLeaderboardEntries(): LeaderboardEntry[] {
  initializeDatabase();
  try {
    const data = fs.readFileSync(leaderboardFile, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveLeaderboardEntries(entries: LeaderboardEntry[]): void {
  initializeDatabase();
  fs.writeFileSync(leaderboardFile, JSON.stringify(entries, null, 2));
}

export function addLeaderboardEntry(entry: Omit<LeaderboardEntry, 'id'>): LeaderboardEntry {
  const entries = getLeaderboardEntries();
  const newEntry: LeaderboardEntry = {
    ...entry,
    id: generateId()
  };
  
  entries.push(newEntry);
  // Keep only the latest 1000 entries to prevent the file from growing too large
  const sortedEntries = entries
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 1000);
  
  saveLeaderboardEntries(sortedEntries);
  return newEntry;
}

export function getLeaderboardByDifficulty(
  difficulty: string,
  timeRange: 'day' | 'week' | 'month' | 'all' = 'all',
  limit: number = 10
): LeaderboardEntry[] {
  const entries = getLeaderboardEntries();
  
  // Filter by difficulty
  let filtered = entries.filter(entry => entry.difficulty === difficulty);
  
  // Filter by time range
  if (timeRange !== 'all') {
    const now = new Date();
    const cutoff = new Date();
    
    switch (timeRange) {
      case 'day':
        cutoff.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
    }
    
    filtered = filtered.filter(entry => 
      new Date(entry.completedAt) >= cutoff
    );
  }
  
  // Sort by time (fastest first) and limit results
  return filtered
    .sort((a, b) => a.timeElapsed - b.timeElapsed)
    .slice(0, limit);
}

export function getUserStats(userId: string) {
  const entries = getLeaderboardEntries().filter(entry => entry.userId === userId);
  
  if (entries.length === 0) {
    return {
      totalGames: 0,
      bestTime: 0,
      averageTime: 0,
      winRate: 100, // Assuming all entries are wins since we only save completed games
      favoriteDifficulty: 'beginner' as const
    };
  }
  
  const totalGames = entries.length;
  const bestTime = Math.min(...entries.map(e => e.timeElapsed));
  const averageTime = entries.reduce((sum, e) => sum + e.timeElapsed, 0) / totalGames;
  
  // Find most played difficulty
  const difficultyCount = entries.reduce((acc, entry) => {
    acc[entry.difficulty] = (acc[entry.difficulty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const favoriteDifficulty = Object.entries(difficultyCount)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'beginner';
  
  return {
    totalGames,
    bestTime,
    averageTime,
    winRate: 100, // All saved games are wins
    favoriteDifficulty
  };
}

// Utility function to generate unique IDs
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
