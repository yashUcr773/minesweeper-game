import { prisma } from './prisma';
import { User, LeaderboardEntry, Difficulty, DailyPuzzle, DailyPuzzleEntry } from '../types/game';

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

// Daily Puzzle operations
export async function createDailyPuzzle(puzzle: Omit<DailyPuzzle, 'id' | 'createdAt'>): Promise<DailyPuzzle> {
  const dbPuzzle = await prisma.dailyPuzzle.create({
    data: {
      date: puzzle.date,
      difficulty: puzzle.difficulty,
      seed: puzzle.seed,
      width: puzzle.width,
      height: puzzle.height,
      mines: puzzle.mines
    }
  });

  return {
    id: dbPuzzle.id,
    date: dbPuzzle.date,
    difficulty: dbPuzzle.difficulty as Difficulty,
    seed: dbPuzzle.seed,
    width: dbPuzzle.width,
    height: dbPuzzle.height,
    mines: dbPuzzle.mines,
    createdAt: dbPuzzle.createdAt.toISOString()
  };
}

export async function getTodaysPuzzle(): Promise<DailyPuzzle | null> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const dbPuzzle = await prisma.dailyPuzzle.findUnique({
    where: { date: today }
  });

  if (!dbPuzzle) return null;

  return {
    id: dbPuzzle.id,
    date: dbPuzzle.date,
    difficulty: dbPuzzle.difficulty as Difficulty,
    seed: dbPuzzle.seed,
    width: dbPuzzle.width,
    height: dbPuzzle.height,
    mines: dbPuzzle.mines,
    createdAt: dbPuzzle.createdAt.toISOString()
  };
}

export async function getOrCreateTodaysPuzzle(): Promise<DailyPuzzle> {
  const existing = await getTodaysPuzzle();
  if (existing) return existing;

  // Create today's puzzle with a deterministic seed based on the date
  const today = new Date().toISOString().split('T')[0];
  const seed = `daily-${today}`;
  
  // Use intermediate difficulty for daily puzzles
  return await createDailyPuzzle({
    date: today,
    difficulty: Difficulty.INTERMEDIATE,
    seed: seed,
    width: 16,
    height: 16,
    mines: 40
  });
}

export async function submitDailyPuzzleScore(
  userId: string,
  puzzleId: string,
  timeElapsed: number,
  score: number,
  completed: boolean
): Promise<DailyPuzzleEntry> {
  try {
    // Get the current attempt number for this user and puzzle
    const existingAttempts = await prisma.dailyPuzzleEntry.findMany({
      where: { userId, puzzleId },
      orderBy: { attemptNumber: 'desc' },
      take: 1
    });

    const nextAttemptNumber = existingAttempts.length > 0 ? existingAttempts[0].attemptNumber + 1 : 1;

    // Create new entry with attempt tracking
    const dbEntry = await prisma.dailyPuzzleEntry.create({
      data: {
        userId,
        puzzleId,
        timeElapsed,
        score,
        completed,
        success: completed, // Success is true only if completed successfully
        attemptNumber: nextAttemptNumber
      },
      include: {
        user: true
      }
    });

    return {
      id: dbEntry.id,
      userId: dbEntry.userId,
      puzzleId: dbEntry.puzzleId,
      timeElapsed: dbEntry.timeElapsed,
      score: dbEntry.score,
      completed: dbEntry.completed,
      completedAt: dbEntry.completedAt.toISOString(),
      username: dbEntry.user.username
    };
  } catch (error: unknown) {
    console.error('Error submitting daily puzzle score:', error);
    throw error;
  }
}

export async function getDailyPuzzleLeaderboard(puzzleId: string, limit: number = 50): Promise<DailyPuzzleEntry[]> {
  // Get ALL attempts for this puzzle (both successful and failed)
  const allAttempts = await prisma.dailyPuzzleEntry.findMany({
    where: {
      puzzleId
    },
    include: {
      user: true
    },
    orderBy: [
      { userId: 'asc' },    // Group by user
      { attemptNumber: 'asc' } // Then by attempt number (first attempt first)
    ]
  });

  // Filter to only include users whose FIRST ATTEMPT was successful
  const eligibleEntries = new Map<string, any>();
  
  for (const entry of allAttempts) {
    if (!eligibleEntries.has(entry.userId)) {
      // This is the user's first attempt for this puzzle
      if (entry.completed && entry.success) {
        // Only include if first attempt was successful
        eligibleEntries.set(entry.userId, entry);
      }
      // If first attempt failed, user is not eligible for leaderboard
    }
  }

  // Convert to array and sort by performance
  const leaderboardEntries = Array.from(eligibleEntries.values())
    .sort((a, b) => {
      // Sort by time elapsed (ascending), then by score (descending)
      if (a.timeElapsed !== b.timeElapsed) {
        return a.timeElapsed - b.timeElapsed;
      }
      return b.score - a.score;
    })
    .slice(0, limit);

  return leaderboardEntries.map(entry => ({
    id: entry.id,
    userId: entry.userId,
    puzzleId: entry.puzzleId,
    timeElapsed: entry.timeElapsed,
    score: entry.score,
    completed: entry.completed,
    completedAt: entry.completedAt.toISOString(),
    username: entry.user.username
  }));
}

export async function getUserDailyPuzzleEntry(userId: string, puzzleId: string): Promise<DailyPuzzleEntry | null> {
  // Get the user's first successful completion only (if any)
  const completedEntry = await prisma.dailyPuzzleEntry.findFirst({
    where: {
      userId,
      puzzleId,
      completed: true,
      success: true
    },
    orderBy: { attemptNumber: 'asc' }, // First successful attempt
    include: {
      user: true
    }
  });

  if (completedEntry) {
    return {
      id: completedEntry.id,
      userId: completedEntry.userId,
      puzzleId: completedEntry.puzzleId,
      timeElapsed: completedEntry.timeElapsed,
      score: completedEntry.score,
      completed: completedEntry.completed,
      completedAt: completedEntry.completedAt.toISOString(),
      username: completedEntry.user.username
    };
  }

  // If no successful completion, return null (no entry for leaderboard purposes)
  return null;
}

export async function getUserDailyPuzzleAttempts(userId: string, puzzleId: string): Promise<DailyPuzzleEntry[]> {
  const attempts = await prisma.dailyPuzzleEntry.findMany({
    where: {
      userId,
      puzzleId
    },
    orderBy: { attemptNumber: 'asc' }, // Order by attempt number (first to last)
    include: {
      user: true
    }
  });

  return attempts.map(attempt => ({
    id: attempt.id,
    userId: attempt.userId,
    puzzleId: attempt.puzzleId,
    timeElapsed: attempt.timeElapsed,
    score: attempt.score,
    completed: attempt.completed,
    completedAt: attempt.completedAt.toISOString(),
    username: attempt.user.username
  }));
}
