# Minesweeper Authentication & Leaderboard Testing Guide

This guide helps you test the newly implemented authentication and leaderboard features.

## Features Implemented ✅

### 1. User Authentication
- **Signup**: Create new user accounts with username, email, and password
- **Login**: Authenticate existing users with email and password
- **Logout**: Sign out and clear authentication state
- **Persistent sessions**: Users stay logged in across browser sessions
- **Auto-login**: Automatic re-authentication on page load

### 2. Leaderboard System
- **Score submission**: Automatic submission when winning non-custom games
- **Global leaderboard**: View top scores across all difficulties
- **Personal stats**: Track your own performance and statistics
- **Difficulty filtering**: Filter leaderboard by specific difficulty levels
- **Time-based filtering**: View scores from different time periods

### 3. UI Integration
- **Authentication buttons**: Login/logout buttons in game header
- **Leaderboard modal**: Access leaderboard from game header
- **User greeting**: Display logged-in username
- **Responsive design**: Works on desktop and mobile devices

## Testing Steps

### Test 1: User Registration
1. Open the game at http://localhost:3001
2. Click the "Login" button in the top-right area of the game header
3. In the modal, click "Create an account"
4. Fill in:
   - Username: "testuser"
   - Email: "test@example.com"
   - Password: "password123"
5. Click "Sign Up"
6. ✅ Should see success message and be logged in
7. ✅ Header should show "Hi, testuser" and "Logout" button

### Test 2: User Login
1. Click "Logout" if logged in
2. Click "Login" button
3. Enter the credentials from Test 1
4. Click "Sign In"
5. ✅ Should be logged in successfully

### Test 3: Score Submission
1. Make sure you're logged in
2. Start a Beginner game (9x9, 10 mines)
3. Win the game by revealing all non-mine cells
4. ✅ Score should be automatically submitted to leaderboard
5. Check browser console for "Score submitted successfully!" message

### Test 4: Leaderboard Viewing
1. Click the "Leaderboard" button in the game header
2. ✅ Should see the leaderboard modal with:
   - Global leaderboard tab showing all scores
   - Personal stats tab showing your statistics
   - Difficulty filter dropdown
   - Time range filter (day/week/month/all)

### Test 5: Multiple Users
1. Open an incognito/private window
2. Go to http://localhost:3001
3. Create a second user account
4. Win some games with the second user
5. ✅ Both users should appear in the global leaderboard
6. ✅ Personal stats should be different for each user

### Test 6: Persistent Login
1. Close the browser tab
2. Reopen http://localhost:3001
3. ✅ Should automatically be logged in (if you were before)

### Test 7: Guest Mode
1. Logout (if logged in)
2. Play and win a game
3. ✅ Score should NOT be submitted (only authenticated users)
4. ✅ Leaderboard button should still work but show message to login

## Expected Behavior

### Authentication
- ✅ Passwords are securely hashed with bcrypt
- ✅ JWT tokens are used for session management
- ✅ Input validation prevents invalid data
- ✅ Error messages are user-friendly
- ✅ Loading states show during API calls

### Leaderboard
- ✅ Only wins on non-custom difficulties are submitted
- ✅ Scores calculate: (max_time - actual_time) × difficulty_multiplier
- ✅ Higher difficulty games get higher score multipliers
- ✅ Leaderboard updates in real-time
- ✅ Personal stats track games played, won, average time, etc.

### Data Storage
- ✅ User data stored in JSON file (users.json)
- ✅ Leaderboard entries stored in JSON file (leaderboard.json)
- ✅ Unique IDs prevent duplicate entries
- ✅ Data persists across server restarts

## Troubleshooting

### If authentication doesn't work:
1. Check browser console for error messages
2. Verify .env.local file exists with JWT_SECRET
3. Restart the development server
4. Clear browser cookies/localStorage

### If scores don't submit:
1. Make sure you're logged in
2. Win a non-custom game (not custom difficulty)
3. Check browser console for error messages
4. Verify API endpoints are responding (Network tab)

### If leaderboard doesn't load:
1. Check if leaderboard.json file exists in project root
2. Verify file permissions allow read/write
3. Check server logs for database errors

## Files Modified/Created

### New Files:
- `src/types/game.ts` - Extended with auth/leaderboard types
- `src/lib/database.ts` - JSON file database operations
- `src/lib/auth.ts` - Authentication utilities
- `src/hooks/useAuth.tsx` - Authentication React context
- `src/components/AuthModal.tsx` - Login/signup UI
- `src/components/LeaderboardModal.tsx` - Leaderboard UI
- `src/app/api/auth/login/route.ts` - Login API endpoint
- `src/app/api/auth/signup/route.ts` - Signup API endpoint
- `src/app/api/auth/me/route.ts` - User verification API
- `src/app/api/leaderboard/route.ts` - Get leaderboard API
- `src/app/api/leaderboard/submit/route.ts` - Submit score API
- `src/app/api/leaderboard/stats/route.ts` - User stats API
- `.env.local` - Environment variables

### Modified Files:
- `src/app/layout.tsx` - Added AuthProvider wrapper
- `src/components/GameHeader.tsx` - Added auth/leaderboard buttons
- `src/hooks/useGameState.ts` - Added score submission on win

## Security Notes

⚠️ **For Production Use:**
1. Change JWT_SECRET to a strong, random value
2. Replace JSON file storage with a real database
3. Add rate limiting to API endpoints
4. Implement HTTPS
5. Add email verification for signups
6. Add password reset functionality

## Next Steps

1. **Enhanced Features:**
   - Add password reset via email
   - Implement email verification
   - Add profile management
   - Create admin panel for user management

2. **Performance Improvements:**
   - Replace JSON files with PostgreSQL/MongoDB
   - Add caching for leaderboard queries
   - Implement pagination for large leaderboards

3. **Social Features:**
   - Add friend system
   - Enable leaderboard sharing
   - Create tournaments and competitions

---

**Implementation Status: ✅ COMPLETE**
All core authentication and leaderboard features are fully implemented and ready for testing!
