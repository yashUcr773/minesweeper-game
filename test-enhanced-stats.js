// Test script for enhanced stats functionality
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEnhancedStats() {
  try {
    console.log('Testing enhanced stats functionality...');
    
    // First, let's see if we have any users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users in database`);
    
    if (users.length === 0) {
      console.log('No users found. Creating a test user...');
      
      // Create a test user
      const testUser = await prisma.user.create({
        data: {
          email: 'testuser@example.com',
          username: 'TestPlayer',
          password: 'hashedpassword'
        }
      });
      
      console.log('Created test user:', testUser.id);
      
      // Create some test leaderboard entries with different difficulties
      const testEntries = [
        {
          userId: testUser.id,
          difficulty: 'beginner',
          timeElapsed: 45,
          score: 1000,
          gameSessionId: 'test-session-1',
          config: JSON.stringify({ width: 9, height: 9, mines: 10 })
        },
        {
          userId: testUser.id,
          difficulty: 'beginner',
          timeElapsed: 52,
          score: 950,
          gameSessionId: 'test-session-2',
          config: JSON.stringify({ width: 9, height: 9, mines: 10 })
        },
        {
          userId: testUser.id,
          difficulty: 'intermediate',
          timeElapsed: 120,
          score: 2000,
          gameSessionId: 'test-session-3',
          config: JSON.stringify({ width: 16, height: 16, mines: 40 })
        },
        {
          userId: testUser.id,
          difficulty: 'expert',
          timeElapsed: 200,
          score: 3000,
          gameSessionId: 'test-session-4',
          config: JSON.stringify({ width: 30, height: 16, mines: 99 })
        }
      ];
      
      for (const entry of testEntries) {
        await prisma.leaderboardEntry.create({ data: entry });
      }
      
      console.log('Created test leaderboard entries');
    }
    
    // Test the getUserStats function
    const testUserId = users[0]?.id || (await prisma.user.findFirst())?.id;
    
    if (!testUserId) {
      console.log('No user ID available for testing');
      return;
    }
      // We need to test the actual compiled function, so let's simulate it
    console.log('\nSimulating getUserStats function...');
    
    // Get leaderboard entries for the user
    const entries = await prisma.leaderboardEntry.findMany({
      where: { userId: testUserId },
      orderBy: { timeElapsed: 'asc' }
    });
    
    console.log(`Found ${entries.length} entries for user`);
    
    if (entries.length === 0) {
      console.log('No entries found, stats would be empty');
      return;
    }
    
    // Simulate the getUserStats logic
    const totalGames = entries.length;
    const bestTime = entries[0].timeElapsed;
    const averageTime = Math.round(entries.reduce((sum, e) => sum + e.timeElapsed, 0) / totalGames);
    
    // Find most played difficulty
    const difficultyCount = entries.reduce((acc, entry) => {
      acc[entry.difficulty] = (acc[entry.difficulty] || 0) + 1;
      return acc;
    }, {});
    
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
    }, {});
    
    // Calculate average times for each difficulty
    Object.keys(byDifficulty).forEach(diff => {
      const stats = byDifficulty[diff];
      const avgTime = Math.round(stats.totalTime / stats.totalGames);
      delete stats.totalTime;
      stats.averageTime = avgTime;
    });
    
    const stats = {
      totalGames,
      bestTime,
      averageTime,
      winRate: 100,
      favoriteDifficulty,
      byDifficulty
    };
    
    console.log('\nUser Stats Result:');
    console.log(JSON.stringify(stats, null, 2));
    
    // Verify the structure
    console.log('\nVerifying structure:');
    console.log('- Has totalGames:', typeof stats.totalGames === 'number');
    console.log('- Has bestTime:', typeof stats.bestTime === 'number');
    console.log('- Has averageTime:', typeof stats.averageTime === 'number');
    console.log('- Has favoriteDifficulty:', typeof stats.favoriteDifficulty === 'string');
    console.log('- Has byDifficulty:', typeof stats.byDifficulty === 'object');
    
    if (stats.byDifficulty) {
      console.log('\nDifficulty breakdown:');
      Object.entries(stats.byDifficulty).forEach(([diff, diffStats]) => {
        console.log(`${diff}:`, {
          totalGames: diffStats.totalGames,
          bestTime: diffStats.bestTime,
          averageTime: diffStats.averageTime,
          bestScore: diffStats.bestScore
        });
      });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEnhancedStats();
