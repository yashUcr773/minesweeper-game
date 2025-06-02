import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../../lib/auth';
import { addLeaderboardEntry } from '../../../../lib/database-prisma';
import { Difficulty } from '../../../../types/game';

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
    const { difficulty, timeElapsed, score, config } = body;

    // Validate required fields
    if (!difficulty || timeElapsed === undefined || score === undefined || !config) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate difficulty
    const validDifficulties = ['beginner', 'intermediate', 'expert', 'master', 'insane', 'extreme', 'custom'];
    if (!validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { success: false, error: 'Invalid difficulty' },
        { status: 400 }
      );
    }    // Create leaderboard entry
    const entry = await addLeaderboardEntry({
      userId: decoded.userId,
      username: decoded.username,
      difficulty: difficulty as Difficulty,
      timeElapsed,
      score,
      config,
      completedAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      entry
    }, { status: 201 });
  } catch (error) {
    console.error('Submit score API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
