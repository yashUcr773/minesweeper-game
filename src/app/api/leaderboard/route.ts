import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboardByDifficulty } from '@/lib/database-prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get('difficulty') || 'beginner';
    const timeRange = searchParams.get('timeRange') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate parameters
    const validDifficulties = ['beginner', 'intermediate', 'expert', 'master', 'insane', 'extreme', 'custom'];
    if (!validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { success: false, error: 'Invalid difficulty' },
        { status: 400 }
      );
    }

    const validTimeRanges = ['day', 'week', 'month', 'all'];
    if (!validTimeRanges.includes(timeRange)) {
      return NextResponse.json(
        { success: false, error: 'Invalid time range' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }    const entries = await getLeaderboardByDifficulty(
      difficulty,
      timeRange as 'day' | 'week' | 'month' | 'all',
      limit
    );

    return NextResponse.json({
      success: true,
      entries,
      meta: {
        difficulty,
        timeRange,
        limit,
        count: entries.length
      }
    });
  } catch (error) {
    console.error('Get leaderboard API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
