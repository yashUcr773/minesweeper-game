import { prisma } from './prisma';
import { User, LeaderboardEntry, Difficulty } from '../types/game';

// User operations
export interface UserWithPassword extends User {
  password: string;
}

export async function findUserByEmail(email: string): Promise<UserWithPassword | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    password: user.password,
    createdAt: user.createdAt.toISOString(),
    lastActive: user.lastActive.toISOString()
  };
}

export async function findUserById(id: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    createdAt: user.createdAt.toISOString(),
    lastActive: user.lastActive.toISOString()
  };
}

export async function createUser(userData: Omit<UserWithPassword, 'id' | 'createdAt' | 'lastActive'>): Promise<User> {
  const user = await prisma.user.create({
    data: {
      email: userData.email.toLowerCase(),
      username: userData.username,
      password: userData.password
    }
  });

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    createdAt: user.createdAt.toISOString(),
    lastActive: user.lastActive.toISOString()
  };
}

export async function updateUser(id: string, updates: Partial<UserWithPassword>): Promise<User | null> {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(updates.email && { email: updates.email.toLowerCase() }),
        ...(updates.username && { username: updates.username }),
        ...(updates.password && { password: updates.password }),
        lastActive: new Date()
      }
    });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt.toISOString(),
      lastActive: user.lastActive.toISOString()
    };  } catch {
    return null;
  }
}

// Leaderboard operations
export async function addLeaderboardEntry(entry: Omit<LeaderboardEntry, 'id'>): Promise<LeaderboardEntry> {
  try {
    const dbEntry = await prisma.leaderboardEntry.create({
      data: {
        userId: entry.userId,
        difficulty: entry.difficulty,
        timeElapsed: entry.timeElapsed,
        score: entry.score,
        config: JSON.stringify(entry.config),
        gameSessionId: entry.gameSessionId,
        completedAt: new Date(entry.completedAt)
      },
      include: {
        user: true
      }
    });

    return {
      id: dbEntry.id,
      userId: dbEntry.userId,
      username: dbEntry.user.username,
      difficulty: dbEntry.difficulty as Difficulty,
      timeElapsed: dbEntry.timeElapsed,
      score: dbEntry.score,
      gameSessionId: dbEntry.gameSessionId,
      config: JSON.parse(dbEntry.config),
      completedAt: dbEntry.completedAt.toISOString()
    };  } catch (error: unknown) {
    // Handle unique constraint violation (duplicate session)
    if (error && typeof error === 'object' && 'code' in error && 
        error.code === 'P2002' && 'meta' in error &&
        typeof error.meta === 'object' && error.meta &&
        'target' in error.meta && 
        Array.isArray(error.meta.target) && 
        error.meta.target.includes('unique_user_session')) {
      throw new Error('DUPLICATE_SUBMISSION');
    }
    throw error;
  }
}

export async function getLeaderboardByDifficulty(
  difficulty: string,
  timeRange: 'day' | 'week' | 'month' | 'all' = 'all',
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  // Calculate time range filter
  let dateFilter: Date | undefined;
  if (timeRange !== 'all') {
    const now = new Date();
    switch (timeRange) {
      case 'day':
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }
  }

  const entries = await prisma.leaderboardEntry.findMany({
    where: {
      difficulty,
      ...(dateFilter && {
        completedAt: {
          gte: dateFilter
        }
      })
    },
    include: {
      user: true
    },
    orderBy: {
      timeElapsed: 'asc' // Fastest times first
    },
    take: limit
  });
  return entries.map(entry => ({
    id: entry.id,
    userId: entry.userId,
    username: entry.user.username,
    difficulty: entry.difficulty as Difficulty,
    timeElapsed: entry.timeElapsed,
    score: entry.score,
    gameSessionId: entry.gameSessionId,
    config: JSON.parse(entry.config),
    completedAt: entry.completedAt.toISOString()
  }));
}

export async function getUserStats(userId: string) {
  const entries = await prisma.leaderboardEntry.findMany({
    where: { userId },
    orderBy: { timeElapsed: 'asc' }
  });

  if (entries.length === 0) {
    return {
      totalGames: 0,
      bestTime: 0,
      averageTime: 0,
      winRate: 100,
      favoriteDifficulty: 'beginner' as const,
      byDifficulty: {}
    };
  }

  const totalGames = entries.length;
  const bestTime = entries[0].timeElapsed;
  const averageTime = Math.round(entries.reduce((sum, e) => sum + e.timeElapsed, 0) / totalGames);

  // Find most played difficulty
  const difficultyCount = entries.reduce((acc, entry) => {
    acc[entry.difficulty] = (acc[entry.difficulty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const favoriteDifficulty = Object.entries(difficultyCount)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'beginner';

  // Calculate stats by difficulty
  const byDifficulty = entries.reduce((acc, entry) => {
    const diff = entry.difficulty;
    if (!acc[diff]) {
      acc[diff] = {
        totalGames: 0,
        bestTime: Number.MAX_SAFE_INTEGER,
        totalTime: 0,
        bestScore: 0
      };
    }
    
    acc[diff].totalGames += 1;
    acc[diff].bestTime = Math.min(acc[diff].bestTime, entry.timeElapsed);
    acc[diff].totalTime += entry.timeElapsed;
    acc[diff].bestScore = Math.max(acc[diff].bestScore, entry.score);
    
    return acc;
  }, {} as Record<string, {
    totalGames: number;
    bestTime: number;
    totalTime: number;
    bestScore: number;
  }>);
  // Calculate average times for each difficulty
  Object.keys(byDifficulty).forEach(diff => {
    const stats = byDifficulty[diff];
    const averageTime = Math.round(stats.totalTime / stats.totalGames);
    // Remove totalTime and add averageTime
    delete (stats as any).totalTime;
    (stats as any).averageTime = averageTime;
  });

  return {
    totalGames,
    bestTime,
    averageTime,
    winRate: 100, // All saved games are wins
    favoriteDifficulty,
    byDifficulty
  };
}
