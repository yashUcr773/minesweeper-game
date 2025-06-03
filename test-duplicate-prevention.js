// Test script to verify duplicate prevention implementation
// Run this in browser console when logged in and after winning a game

async function testDuplicatePrevention() {
  console.log('🧪 Testing duplicate score submission prevention...');
  
  // Get auth token from cookies
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('auth_token='))
    ?.split('=')[1];

  if (!token) {
    console.error('❌ No auth token found. Please log in first.');
    return;
  }

  // Test data - simulate a game completion
  const testGameData = {
    difficulty: 'beginner',
    timeElapsed: 45,
    score: 954,
    config: { width: 9, height: 9, mines: 10 },
    gameSessionId: crypto.randomUUID()
  };

  console.log('📤 Submitting first score...');
  
  // First submission - should succeed
  const response1 = await fetch('/api/leaderboard/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(testGameData),
  });

  const result1 = await response1.json();
  console.log('✅ First submission:', response1.status, result1);

  console.log('📤 Submitting duplicate score...');
  
  // Second submission with same gameSessionId - should fail with 409
  const response2 = await fetch('/api/leaderboard/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(testGameData), // Same gameSessionId
  });

  const result2 = await response2.json();
  console.log('🚫 Duplicate submission:', response2.status, result2);

  if (response1.status === 201 && response2.status === 409) {
    console.log('✅ SUCCESS: Duplicate prevention is working correctly!');
    console.log('   - First submission: ACCEPTED (201)');
    console.log('   - Duplicate submission: REJECTED (409)');
  } else {
    console.log('❌ FAILED: Duplicate prevention is not working as expected');
    console.log(`   - Expected: 201, 409 | Got: ${response1.status}, ${response2.status}`);
  }
}

// Usage instructions
console.log('🎯 To test duplicate prevention:');
console.log('1. Log in to the application');
console.log('2. Run: testDuplicatePrevention()');
console.log('3. Check the console output');

// Export for global access
window.testDuplicatePrevention = testDuplicatePrevention;
