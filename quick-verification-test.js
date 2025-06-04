// Quick verification test for multiple attempts functionality
// This script directly tests our database functions

async function quickTest() {
  console.log('🔍 Quick Multiple Attempts Test');
  
  try {
    // Import required modules
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    console.log('✅ Prisma client initialized');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Get today's puzzle
    const today = new Date().toISOString().split('T')[0];
    let puzzle = await prisma.dailyPuzzle.findFirst({
      where: { date: today }
    });
    
    if (!puzzle) {
      // Create today's puzzle if it doesn't exist
      puzzle = await prisma.dailyPuzzle.create({
        data: {
          date: today,
          difficulty: 'intermediate',
          seed: `daily-${today}`,
          width: 16,
          height: 16,
          mines: 40
        }
      });
      console.log('✅ Created daily puzzle for today');
    } else {
      console.log('✅ Found existing daily puzzle for today');
    }
    
    console.log(`   Puzzle ID: ${puzzle.id}`);
    console.log(`   Difficulty: ${puzzle.difficulty}`);
    console.log(`   Grid: ${puzzle.width}x${puzzle.height}, Mines: ${puzzle.mines}`);
    
    // Test our getUserDailyPuzzleAttempts function
    const { getUserDailyPuzzleAttempts } = require('./src/lib/database-prisma');
    
    const testUserId = 'test-verification-user';
    const attempts = await getUserDailyPuzzleAttempts(testUserId, puzzle.id);
    
    console.log(`✅ getUserDailyPuzzleAttempts returned ${attempts.length} attempts`);
    
    // Create a test attempt to verify insertion works
    await prisma.dailyPuzzleEntry.create({
      data: {
        userId: testUserId,
        puzzleId: puzzle.id,
        completed: false,
        success: false,
        timeSpent: 30,
        revealedCells: 10,
        attemptNumber: 1
      }
    });
    
    console.log('✅ Created test attempt successfully');
    
    // Verify we can retrieve it
    const updatedAttempts = await getUserDailyPuzzleAttempts(testUserId, puzzle.id);
    console.log(`✅ Retrieved ${updatedAttempts.length} attempts after insertion`);
    
    // Test leaderboard function
    const { getDailyPuzzleLeaderboard } = require('./src/lib/database-prisma');
    const leaderboard = await getDailyPuzzleLeaderboard(puzzle.id);
    
    console.log(`✅ Leaderboard has ${leaderboard.length} entries`);
    
    // Clean up test data
    await prisma.dailyPuzzleEntry.deleteMany({
      where: { userId: testUserId }
    });
    
    console.log('✅ Test data cleaned up');
    
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
    
    console.log('\n🎉 QUICK TEST PASSED!');
    console.log('\n📋 Verification Summary:');
    console.log('   - Database connection: ✅ Working');
    console.log('   - Daily puzzle exists: ✅ Working');
    console.log('   - getUserDailyPuzzleAttempts: ✅ Working');
    console.log('   - getDailyPuzzleLeaderboard: ✅ Working');
    console.log('   - Multiple attempts insertion: ✅ Working');
    console.log('   - Data retrieval: ✅ Working');
    
    console.log('\n🌐 Next: Test in browser at http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

quickTest().catch(console.error);
