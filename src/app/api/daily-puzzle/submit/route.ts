import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../../lib/auth';
import { submitDailyPuzzleScore, getOrCreateTodaysPuzzle } from '../../../../lib/database-prisma';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { timeElapsed, score, completed } = body;

    // Validate required fields
    if (timeElapsed === undefined || score === undefined || completed === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get today's puzzle
    const puzzle = await getOrCreateTodaysPuzzle();

    // Submit score
    const entry = await submitDailyPuzzleScore(
      decoded.userId,
      puzzle.id,
      timeElapsed,
      score,
      completed
    );

    return NextResponse.json({
      success: true,
      entry
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Submit daily puzzle score API error:', error);
    
    // Handle duplicate submission
    if (error instanceof Error && error.message === 'DUPLICATE_SUBMISSION') {
      return NextResponse.json(
        { success: false, error: 'You have already submitted a score for today\'s puzzle' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
