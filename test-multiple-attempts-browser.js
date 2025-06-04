// Test script for multiple attempts functionality
// Run this in the browser console after logging in

async function testMultipleAttempts() {
  console.log('🧪 Testing Multiple Attempts for Daily Puzzles');
  console.log('===============================================');

  // Get auth token from cookies
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('auth_token='))
    ?.split('=')[1];

  if (!token) {
    console.error('❌ No auth token found. Please log in first.');
    return;
  }

  console.log('✅ Found auth token');

  try {
    // Get today's puzzle
    console.log('📅 Getting today\'s puzzle...');
    const puzzleResponse = await fetch('/api/daily-puzzle', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!puzzleResponse.ok) {
      throw new Error(`Failed to get puzzle: ${puzzleResponse.status}`);
    }
    
    const puzzleData = await puzzleResponse.json();
    console.log('✅ Got puzzle:', puzzleData.puzzle.id);
    console.log('📊 Current attempts:', puzzleData.userAttempts?.length || 0);

    // Submit multiple attempts
    console.log('\n📤 Submitting test attempts...');

    // Attempt 1 - Failed
    console.log('Submitting attempt 1 (failed)...');
    const attempt1Response = await fetch('/api/daily-puzzle/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        timeElapsed: 60,
        score: 0,
        completed: false
      })
    });

    const attempt1Result = await attempt1Response.json();
    console.log(attempt1Response.ok ? '✅ Attempt 1 submitted' : '❌ Attempt 1 failed:', attempt1Result);

    // Attempt 2 - Failed
    console.log('Submitting attempt 2 (failed)...');
    const attempt2Response = await fetch('/api/daily-puzzle/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        timeElapsed: 45,
        score: 0,
        completed: false
      })
    });

    const attempt2Result = await attempt2Response.json();
    console.log(attempt2Response.ok ? '✅ Attempt 2 submitted' : '❌ Attempt 2 failed:', attempt2Result);

    // Attempt 3 - Success
    console.log('Submitting attempt 3 (success)...');
    const attempt3Response = await fetch('/api/daily-puzzle/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        timeElapsed: 35,
        score: 950,
        completed: true
      })
    });

    const attempt3Result = await attempt3Response.json();
    console.log(attempt3Response.ok ? '✅ Attempt 3 submitted' : '❌ Attempt 3 failed:', attempt3Result);

    // Attempt 4 - Another success (should not count for leaderboard)
    console.log('Submitting attempt 4 (success, should not count for leaderboard)...');
    const attempt4Response = await fetch('/api/daily-puzzle/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        timeElapsed: 25,
        score: 1000,
        completed: true
      })
    });

    const attempt4Result = await attempt4Response.json();
    console.log(attempt4Response.ok ? '✅ Attempt 4 submitted' : '❌ Attempt 4 failed:', attempt4Result);

    // Get updated puzzle data
    console.log('\n📊 Getting updated attempt history...');
    const updatedResponse = await fetch('/api/daily-puzzle', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const updatedData = await updatedResponse.json();
    
    if (updatedData.success) {
      console.log('\n📈 Results:');
      console.log(`Total attempts: ${updatedData.userAttempts?.length || 0}`);
      console.log('Attempt history:');
      updatedData.userAttempts?.forEach((attempt, index) => {
        console.log(`  ${index + 1}. ${attempt.completed ? 'SUCCESS' : 'FAILED'} - ${attempt.timeElapsed}s - Score: ${attempt.score}`);
      });
      
      console.log('\nLeaderboard entry (first success only):');
      console.log(`User entry: ${updatedData.userEntry ? `${updatedData.userEntry.timeElapsed}s - Score: ${updatedData.userEntry.score}` : 'None'}`);
      console.log(`Rank: ${updatedData.rank ? `#${updatedData.rank}` : 'Not ranked'}`);
    }

    console.log('\n✅ Multiple attempts test completed!');
    console.log('🎯 Key observations:');
    console.log('   • Users can submit unlimited attempts');
    console.log('   • Only first successful completion counts for leaderboard');
    console.log('   • All attempts are tracked in userAttempts array');
    console.log('   • UI should show attempt history and allow retries');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Instructions for manual testing
console.log('🎯 Multiple Attempts Test Ready!');
console.log('=================================');
console.log('');
console.log('Instructions:');
console.log('1. Make sure you are logged in to the application');
console.log('2. Run: testMultipleAttempts()');
console.log('3. Check the console output for results');
console.log('4. Open Daily Puzzle modal to see the new UI');
console.log('');
console.log('Expected behavior:');
console.log('• Multiple attempts should be allowed');
console.log('• Attempt history should be tracked');
console.log('• Only first success counts for leaderboard');
console.log('• UI should show "Try Again" options');

// Make function available globally
window.testMultipleAttempts = testMultipleAttempts;
