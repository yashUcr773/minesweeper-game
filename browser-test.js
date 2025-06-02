/**
 * Browser-based Database Integration Test
 * 
 * Instructions:
 * 1. Open http://localhost:3000 in your browser
 * 2. Open Developer Tools (F12)
 * 3. Copy and paste this code into the Console
 * 4. Run: testDatabaseIntegration()
 */

async function testDatabaseIntegration() {
  console.log('🧪 Starting Database Integration Test...\n');
  
  const testEmail = `test${Date.now()}@example.com`;
  const testUsername = `testuser${Date.now()}`;
  let authToken = '';

  try {
    // Test 1: User Signup
    console.log('1️⃣ Testing user signup...');
    const signupResponse = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        email: testEmail,
        password: 'testpass123'
      })
    });

    const signupData = await signupResponse.json();
    console.log('Signup response:', signupData);

    if (!signupData.success) {
      throw new Error(`Signup failed: ${signupData.error}`);
    }

    authToken = signupData.user.token;
    console.log('✅ User signup successful!\n');

    // Test 2: Score Submission
    console.log('2️⃣ Testing score submission...');
    const scoreResponse = await fetch('/api/leaderboard/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        difficulty: 'beginner',
        timeElapsed: 85,
        score: 750,
        config: { width: 9, height: 9, mines: 10 }
      })
    });

    const scoreData = await scoreResponse.json();
    console.log('Score submission response:', scoreData);

    if (!scoreData.success) {
      throw new Error(`Score submission failed: ${scoreData.error}`);
    }

    console.log('✅ Score submission successful!\n');

    // Test 3: Leaderboard Retrieval
    console.log('3️⃣ Testing leaderboard retrieval...');
    const leaderboardResponse = await fetch('/api/leaderboard?difficulty=beginner&limit=5');
    const leaderboardData = await leaderboardResponse.json();
    console.log('Leaderboard response:', leaderboardData);

    if (!leaderboardData.success) {
      throw new Error(`Leaderboard retrieval failed: ${leaderboardData.error}`);
    }

    console.log('✅ Leaderboard retrieval successful!\n');
    console.log(`📊 Found ${leaderboardData.entries.length} entries in leaderboard`);

    // Test 4: User Stats
    console.log('4️⃣ Testing user stats...');
    const statsResponse = await fetch('/api/leaderboard/stats', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const statsData = await statsResponse.json();
    console.log('Stats response:', statsData);

    if (!statsData.success) {
      throw new Error(`Stats retrieval failed: ${statsData.error}`);
    }

    console.log('✅ User stats retrieval successful!\n');

    // Test 5: Login Test
    console.log('5️⃣ Testing user login...');
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'testpass123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginData.success) {
      throw new Error(`Login failed: ${loginData.error}`);
    }

    console.log('✅ User login successful!\n');

    // Summary
    console.log('🎉 ALL TESTS PASSED! Database integration is working correctly.');
    console.log('\n📋 Test Summary:');
    console.log('✅ User signup with Prisma database');
    console.log('✅ Score submission with authentication');
    console.log('✅ Leaderboard retrieval with filtering');
    console.log('✅ User statistics calculation');
    console.log('✅ User login authentication');
    console.log('\n🔥 The leaderboard should now properly store scores!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔍 Debugging information:');
    console.log('- Check browser network tab for API errors');
    console.log('- Verify development server is running');
    console.log('- Check browser console for additional errors');
  }
}

// Instructions for manual testing
console.log('🧪 Database Integration Test Ready!');
console.log('📝 Run: testDatabaseIntegration()');
console.log('🌐 Make sure you\'re on http://localhost:3000');

// Auto-run if this is being loaded directly
if (document.readyState === 'complete') {
  console.log('\n🚀 Auto-running test...');
  setTimeout(testDatabaseIntegration, 1000);
}
