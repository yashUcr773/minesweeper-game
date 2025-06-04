/**
 * Manual Testing Guide for Multiple Daily Puzzle Attempts
 * 
 * This document provides step-by-step instructions to manually test
 * the multiple attempts functionality in the browser.
 */

## 🎯 MANUAL TESTING CHECKLIST

### Pre-Test Setup
- [x] Development server is running (npm run dev)
- [x] Database migrations are applied
- [x] Daily puzzle API is responding correctly
- [x] Application loads without errors

### Test Scenario 1: First Time User (No Previous Attempts)

1. **Open Application**
   - Navigate to http://localhost:3000
   - Click "Daily Puzzle" button
   - ✅ Modal should open showing fresh game board
   - ✅ No attempt history should be visible
   - ✅ Game should be playable

2. **Make First Failed Attempt**
   - Click on a cell that contains a mine (intentionally lose)
   - ✅ Game should end with explosion animation
   - ✅ "Try Again" button should appear
   - ✅ No success message should show
   - ✅ Attempt history should show "Attempt 1: Failed"

3. **Verify Try Again Functionality**
   - Click "Try Again" button
   - ✅ Fresh game board should appear
   - ✅ Previous attempt should still show in history
   - ✅ Game should be fully playable again

### Test Scenario 2: Multiple Failed Attempts

4. **Make Second Failed Attempt**
   - Play and lose again (click on a mine)
   - ✅ "Try Again" button should appear again
   - ✅ Attempt history should show:
     - "Attempt 1: Failed"
     - "Attempt 2: Failed"

5. **Make Third Failed Attempt**
   - Repeat the process
   - ✅ Attempt history should show all 3 failed attempts
   - ✅ "Try Again" button should still be available

### Test Scenario 3: Successful Completion After Failed Attempts

6. **Complete the Puzzle Successfully**
   - Click "Try Again" and play carefully
   - Complete the puzzle without hitting mines
   - ✅ Success message should appear
   - ✅ Time and score should be displayed
   - ✅ Leaderboard rank should be shown
   - ✅ Attempt history should show all previous attempts plus the successful one
   - ✅ "Try Again" button should still be available

7. **Verify Leaderboard Entry**
   - Note the completion time and attempt number
   - Check that leaderboard shows this as the entry (not a better later attempt)
   - ✅ Leaderboard should show FIRST successful attempt, not best time

### Test Scenario 4: Multiple Attempts After Success

8. **Try Again After Success**
   - Click "Try Again" button
   - ✅ Fresh game should start
   - ✅ Previous completion should still show in history
   - ✅ Leaderboard position should remain the same

9. **Complete Again with Better Time**
   - Play and complete faster than the first successful attempt
   - ✅ Better time should be recorded as a new attempt
   - ✅ Leaderboard position should NOT change (still shows first success)
   - ✅ Attempt history should show both successful attempts

### Test Scenario 5: API and Data Verification

10. **Check API Response**
    - Open browser developer tools
    - Go to Network tab
    - Refresh the daily puzzle modal
    - Find the `/api/daily-puzzle` request
    - ✅ Response should include:
      - `userEntry`: First successful completion (if any)
      - `userAttempts`: Array of all attempts
      - `leaderboard`: List showing only first successful attempts per user

### Test Scenario 6: Edge Cases

11. **Close and Reopen Modal**
    - Close the daily puzzle modal
    - Reopen it
    - ✅ All attempt history should persist
    - ✅ Current state should be maintained

12. **Refresh Page**
    - Refresh the entire page
    - Open daily puzzle modal
    - ✅ All data should persist from database
    - ✅ Attempt history should be complete

### Expected Behavior Summary

**What Should Work:**
- ✅ Users can attempt the daily puzzle multiple times
- ✅ Each attempt is recorded with its own attempt number
- ✅ Failed attempts show "Try Again" button
- ✅ Successful attempts show completion details + "Try Again" button
- ✅ Attempt history displays all attempts with status
- ✅ Leaderboard shows only FIRST successful completion per user
- ✅ Multiple successes don't change leaderboard position
- ✅ All data persists across page refreshes

**What Should NOT Happen:**
- ❌ Users should NOT be blocked from additional attempts
- ❌ Leaderboard should NOT update with better later attempts
- ❌ Attempt history should NOT be lost
- ❌ Database should NOT have unique constraint errors

### Troubleshooting

**If "Try Again" button doesn't appear:**
- Check browser console for JavaScript errors
- Verify DailyPuzzleModal.tsx has been updated correctly
- Check that the blocking condition has been removed

**If attempt history doesn't show:**
- Verify API returns userAttempts array
- Check that getUserDailyPuzzleAttempts function works
- Ensure database allows multiple entries per user/puzzle

**If leaderboard shows wrong attempt:**
- Verify getDailyPuzzleLeaderboard function filters correctly
- Check that it uses ROW_NUMBER() with ORDER BY attemptNumber
- Ensure only success=true entries are considered

### Test Results Log

Record your test results here:

```
Test Scenario 1: [ ] PASS [ ] FAIL - Notes: ________________
Test Scenario 2: [ ] PASS [ ] FAIL - Notes: ________________  
Test Scenario 3: [ ] PASS [ ] FAIL - Notes: ________________
Test Scenario 4: [ ] PASS [ ] FAIL - Notes: ________________
Test Scenario 5: [ ] PASS [ ] FAIL - Notes: ________________
Test Scenario 6: [ ] PASS [ ] FAIL - Notes: ________________

Overall Status: [ ] ALL TESTS PASS [ ] SOME ISSUES FOUND
```

### Next Steps After Testing

If all tests pass:
- ✅ Feature is ready for production
- ✅ Update documentation
- ✅ Consider performance optimizations

If issues are found:
- 🔧 Fix identified issues
- 🔄 Re-run failed test scenarios
- 📝 Update implementation as needed
