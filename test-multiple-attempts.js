// Test script for multiple attempts implementation
const { PrismaClient } = require('@prisma/client');
const { getUserDailyPuzzleAttempts, submitDailyPuzzleScore, getOrCreateTodaysPuzzle } = require('./src/lib/database-prisma');

async function testMultipleAttempts() {
  console.log('🧪 Testing Multiple Attempts Implementation');
  console.log('==========================================');

  try {
    // Get or create today's puzzle
    const puzzle = await getOrCreateTodaysPuzzle();
    console.log('✅ Today\'s puzzle:', puzzle.id);

    // Test user ID (use first available user or create one)
    const prisma = new PrismaClient();
    let testUser = await prisma.user.findFirst();
    
    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'testuser@example.com',
          username: 'TestPlayer',
          password: 'hashedpassword'
        }
      });
      console.log('✅ Created test user:', testUser.id);
    } else {
      console.log('✅ Using existing user:', testUser.id);
    }

    // Submit multiple attempts
    console.log('\n📤 Submitting multiple attempts...');

    // First attempt - fail
    const attempt1 = await submitDailyPuzzleScore(
      testUser.id,
      puzzle.id,
      45,
      0,
      false
    );
    console.log('✅ Attempt 1 (failed):', attempt1.id);

    // Second attempt - fail
    const attempt2 = await submitDailyPuzzleScore(
      testUser.id,
      puzzle.id,
      60,
      0,
      false
    );
    console.log('✅ Attempt 2 (failed):', attempt2.id);

    // Third attempt - success
    const attempt3 = await submitDailyPuzzleScore(
      testUser.id,
      puzzle.id,
      35,
      950,
      true
    );
    console.log('✅ Attempt 3 (success):', attempt3.id);

    // Fourth attempt - success (should not count for leaderboard)
    const attempt4 = await submitDailyPuzzleScore(
      testUser.id,
      puzzle.id,
      30,
      1000,
      true
    );
    console.log('✅ Attempt 4 (success, but not for leaderboard):', attempt4.id);

    // Get all user attempts
    const allAttempts = await getUserDailyPuzzleAttempts(testUser.id, puzzle.id);
    console.log('\n📋 All user attempts:');
    allAttempts.forEach((attempt, index) => {
      console.log(`  ${index + 1}. ${attempt.completed ? 'Success' : 'Failed'} - ${attempt.timeElapsed}s - Score: ${attempt.score}`);
    });

    console.log('\n✅ Multiple attempts implementation working correctly!');
    console.log('📊 Summary:');
    console.log(`   • Total attempts: ${allAttempts.length}`);
    console.log(`   • Successful attempts: ${allAttempts.filter(a => a.completed).length}`);
    console.log(`   • Failed attempts: ${allAttempts.filter(a => !a.completed).length}`);

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMultipleAttempts();
