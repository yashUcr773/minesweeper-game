console.log('🧪 Starting First Attempt Only Test...');

try {
  const { PrismaClient } = require('@prisma/client');
  console.log('✅ Prisma imported successfully');
  
  const prisma = new PrismaClient();
  console.log('✅ Prisma client created');
  
  // Test basic database connection
  async function testConnection() {
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Database connected. Found ${userCount} users.`);
      await prisma.$disconnect();
      console.log('✅ Database disconnected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
    }
  }
  
  testConnection();
  
} catch (error) {
  console.error('❌ Import failed:', error.message);
}
