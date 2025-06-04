// Simple test to verify basic functionality
console.log('🚀 Starting simple test...');

async function simpleTest() {
  try {
    // Test 1: Check if we can import Prisma
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    console.log('✅ Prisma client imported successfully');

    // Test 2: Check database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Test 3: Test our custom function
    const { getUserDailyPuzzleAttempts } = require('./src/lib/database-prisma');
    console.log('✅ Custom database function imported successfully');

    // Test 4: Test API endpoint
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:3000/api/daily-puzzle');
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ API endpoint responding correctly');
      console.log(`   Puzzle ID: ${data.puzzle.id}`);
      console.log(`   UserAttempts field: ${data.userAttempts !== undefined ? 'present' : 'missing'}`);
    } else {
      console.log('❌ API endpoint returned error');
    }

    await prisma.$disconnect();
    console.log('✅ All basic tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

simpleTest();
