const { PrismaClient } = require('@prisma/client');
const { submitDailyPuzzleScore, getDailyPuzzleLeaderboard, getOrCreateTodaysPuzzle } = require('./src/lib/database-prisma');

const prisma = new PrismaClient();

async function testFirstAttemptOnlyLogic() {
  try {
    console.log('🧪 Testing "First Attempt Only" Leaderboard Logic\n');

    // Get today's puzzle
    const puzzle = await getOrCreateTodaysPuzzle();
    console.log(`📋 Using puzzle: ${puzzle.id} (${puzzle.difficulty})`);

    // Clean up any existing test data
    await prisma.dailyPuzzleEntry.deleteMany({
      where: {
        userId: { in: ['test-user-1', 'test-user-2', 'test-user-3'] }
      }
    });

    console.log('\n🧑‍💼 Test Scenario Setup:');
    console.log('  • User 1: Succeeds on first attempt');
    console.log('  • User 2: Fails first attempt, succeeds on second');
    console.log('  • User 3: Fails first attempt, fails second, succeeds on third');

    // User 1: Success on first attempt (should appear on leaderboard)
    console.log('\n👤 User 1 - First attempt (SUCCESS):');
    const user1Attempt1 = await submitDailyPuzzleScore('test-user-1', puzzle.id, 45, 954, true);
    console.log(`   ✅ Success: ${user1Attempt1.timeElapsed}s, score ${user1Attempt1.score}`);

    // User 2: Fail first, succeed second (should NOT appear on leaderboard)
    console.log('\n👤 User 2 - First attempt (FAIL):');
    const user2Attempt1 = await submitDailyPuzzleScore('test-user-2', puzzle.id, 30, 0, false);
    console.log(`   ❌ Failed: ${user2Attempt1.timeElapsed}s`);
    
    console.log('👤 User 2 - Second attempt (SUCCESS):');
    const user2Attempt2 = await submitDailyPuzzleScore('test-user-2', puzzle.id, 35, 964, true);
    console.log(`   ✅ Success: ${user2Attempt2.timeElapsed}s, score ${user2Attempt2.score}`);

    // User 3: Fail first, fail second, succeed third (should NOT appear on leaderboard)
    console.log('\n👤 User 3 - First attempt (FAIL):');
    const user3Attempt1 = await submitDailyPuzzleScore('test-user-3', puzzle.id, 25, 0, false);
    console.log(`   ❌ Failed: ${user3Attempt1.timeElapsed}s`);
    
    console.log('👤 User 3 - Second attempt (FAIL):');
    const user3Attempt2 = await submitDailyPuzzleScore('test-user-3', puzzle.id, 40, 0, false);
    console.log(`   ❌ Failed: ${user3Attempt2.timeElapsed}s`);
    
    console.log('👤 User 3 - Third attempt (SUCCESS):');
    const user3Attempt3 = await submitDailyPuzzleScore('test-user-3', puzzle.id, 28, 971, true);
    console.log(`   ✅ Success: ${user3Attempt3.timeElapsed}s, score ${user3Attempt3.score}`);

    // Check leaderboard
    console.log('\n📊 LEADERBOARD RESULTS:');
    const leaderboard = await getDailyPuzzleLeaderboard(puzzle.id);
    
    console.log(`Total entries: ${leaderboard.length}`);
    leaderboard.forEach((entry, index) => {
      console.log(`  ${index + 1}. ${entry.username || `User ${entry.userId}`}: ${entry.timeElapsed}s (Score: ${entry.score})`);
    });

    // Verify expected behavior
    console.log('\n🔍 VERIFICATION:');
    const user1OnBoard = leaderboard.find(e => e.userId === 'test-user-1');
    const user2OnBoard = leaderboard.find(e => e.userId === 'test-user-2');
    const user3OnBoard = leaderboard.find(e => e.userId === 'test-user-3');

    if (user1OnBoard) {
      console.log('✅ User 1 appears on leaderboard (CORRECT - succeeded on first attempt)');
    } else {
      console.log('❌ User 1 missing from leaderboard (ERROR)');
    }

    if (!user2OnBoard) {
      console.log('✅ User 2 does NOT appear on leaderboard (CORRECT - failed first attempt)');
    } else {
      console.log('❌ User 2 appears on leaderboard (ERROR - should be excluded)');
    }

    if (!user3OnBoard) {
      console.log('✅ User 3 does NOT appear on leaderboard (CORRECT - failed first attempt)');
    } else {
      console.log('❌ User 3 appears on leaderboard (ERROR - should be excluded)');
    }

    // Check raw data
    console.log('\n📋 RAW DATA VERIFICATION:');
    const allEntries = await prisma.dailyPuzzleEntry.findMany({
      where: {
        puzzleId: puzzle.id,
        userId: { in: ['test-user-1', 'test-user-2', 'test-user-3'] }
      },
      orderBy: [
        { userId: 'asc' },
        { attemptNumber: 'asc' }
      ]
    });

    allEntries.forEach(entry => {
      console.log(`  ${entry.userId} - Attempt #${entry.attemptNumber}: ${entry.success ? 'SUCCESS' : 'FAIL'} (${entry.timeElapsed}s)`);
    });

    const expectedBehavior = leaderboard.length === 1 && user1OnBoard && !user2OnBoard && !user3OnBoard;
    console.log(`\n${expectedBehavior ? '🎉 SUCCESS' : '❌ FAILURE'}: First attempt only logic is ${expectedBehavior ? 'working correctly' : 'not working as expected'}!`);

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Test failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testFirstAttemptOnlyLogic();
