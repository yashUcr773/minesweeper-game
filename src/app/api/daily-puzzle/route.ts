import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateTodaysPuzzle, getDailyPuzzleLeaderboard, getUserDailyPuzzleEntry, getUserDailyPuzzleAttempts } from '../../../lib/database-prisma';
import { verifyToken } from '../../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get today's puzzle
    const puzzle = await getOrCreateTodaysPuzzle();

    // Get leaderboard for this puzzle
    const leaderboard = await getDailyPuzzleLeaderboard(puzzle.id);    // Check if user is authenticated and get their entry
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    let userEntry = null;
    let userAttempts = null;
    let rank = null;

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        userEntry = await getUserDailyPuzzleEntry(decoded.userId, puzzle.id);
        userAttempts = await getUserDailyPuzzleAttempts(decoded.userId, puzzle.id);
        
        // Calculate user's rank if they have completed the puzzle
        if (userEntry && userEntry.completed) {
          const betterEntries = await getDailyPuzzleLeaderboard(puzzle.id, 1000);
          rank = betterEntries.findIndex(entry => entry.userId === decoded.userId) + 1;
        }
      }
    }

    return NextResponse.json({
      success: true,
      puzzle,
      leaderboard,
      userEntry,
      userAttempts,
      rank
    });

  } catch (error) {
    console.error('Get daily puzzle API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
