// Test script for database integration
// This script tests user signup, login, and score submission

const baseUrl = 'http://localhost:3000';

async function testDatabaseIntegration() {
  console.log('🧪 Testing Database Integration...\n');

  // Test user signup
  console.log('1. Testing user signup...');
  const signupResponse = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpass123'
    }),
  });

  const signupData = await signupResponse.json();
  console.log('Signup response:', signupData);

  if (!signupData.success) {
    console.error('❌ Signup failed:', signupData.error);
    return;
  }

  const token = signupData.user.token;
  console.log('✅ Signup successful!\n');

  // Test score submission
  console.log('2. Testing score submission...');
  const scoreResponse = await fetch(`${baseUrl}/api/leaderboard/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      difficulty: 'beginner',
      timeElapsed: 120,
      score: 500,
      config: { width: 9, height: 9, mines: 10 }
    }),
  });

  const scoreData = await scoreResponse.json();
  console.log('Score submission response:', scoreData);

  if (!scoreData.success) {
    console.error('❌ Score submission failed:', scoreData.error);
    return;
  }

  console.log('✅ Score submitted successfully!\n');

  // Test leaderboard retrieval
  console.log('3. Testing leaderboard retrieval...');
  const leaderboardResponse = await fetch(`${baseUrl}/api/leaderboard?difficulty=beginner&limit=5`);
  const leaderboardData = await leaderboardResponse.json();
  console.log('Leaderboard response:', leaderboardData);

  if (!leaderboardData.success) {
    console.error('❌ Leaderboard retrieval failed:', leaderboardData.error);
    return;
  }

  console.log('✅ Leaderboard retrieved successfully!\n');

  // Test user stats
  console.log('4. Testing user stats...');
  const statsResponse = await fetch(`${baseUrl}/api/leaderboard/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const statsData = await statsResponse.json();
  console.log('Stats response:', statsData);

  if (!statsData.success) {
    console.error('❌ Stats retrieval failed:', statsData.error);
    return;
  }

  console.log('✅ All tests passed! Database integration is working correctly. 🎉');
}

// Run the test
if (typeof window === 'undefined') {
  // Node.js environment - use built-in fetch if available (Node 18+)
  if (typeof fetch === 'undefined') {
    console.log('❌ This script requires Node.js 18+ for built-in fetch support.');
    console.log('💡 Please test the database integration through the browser instead.');
    console.log('   Open http://localhost:3000 and use the browser console to run testDatabaseIntegration()');
  } else {
    testDatabaseIntegration().catch(console.error);
  }
} else {
  // Browser environment
  window.testDatabaseIntegration = testDatabaseIntegration;
  console.log('Run testDatabaseIntegration() in the browser console to test the database integration.');
}
