// Test script to demonstrate improved mine generation
// Run this in the browser console when the game is loaded

function testMineGenerationImprovement() {
  console.log('🧪 Mine Generation Improvement Test');
  console.log('=====================================');
  
  // This function would be available when the game is running
  if (typeof window !== 'undefined' && window.minesweeperDebug) {
    console.log('✅ Debug tools available');
    console.log('');
    console.log('Available commands:');
    console.log('  minesweeperDebug.enableComparison() - Enable detailed comparison');
    console.log('  minesweeperDebug.disableComparison() - Disable comparison');
    console.log('  minesweeperDebug.testGenerationQuality() - Test quality metrics');
    console.log('');
    console.log('Instructions:');
    console.log('1. Run minesweeperDebug.enableComparison()');
    console.log('2. Start a new game by clicking on any cell');
    console.log('3. Check console for detailed comparison results');
    console.log('4. Look for fewer 50/50 situations in the improved algorithm');
  } else {
    console.log('❌ Debug tools not available (make sure you\'re in development mode)');
  }
}

// Auto-run when script is loaded
testMineGenerationImprovement();

// Export for manual testing
if (typeof window !== 'undefined') {
  window.testMineGeneration = testMineGenerationImprovement;
}
