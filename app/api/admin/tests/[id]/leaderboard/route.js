import dbConnect from '@/lib/db';
import Submission from '@/models/Submission';
import Test from '@/models/Test';
import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const user = await getUserFromCookies();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: testId } = await params;

    await dbConnect();

    // Verify test exists
    const test = await Test.findById(testId);
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Fetch submissions for this test
    const submissions = await Submission.find({ testId })
      .populate('studentId', 'name username email')
      .sort({ tabSwitches: 1, score: -1, timeTaken: 1 }); // Sort by tabSwitches (less is better), then score, then timeTaken

    return NextResponse.json({
      testTitle: test.title,
      leaderboard: submissions.map((sub, index) => ({
        rank: index + 1,
        submissionId: sub._id,
        studentName: sub.studentId?.name || 'Unknown',
        studentUsername: sub.studentId?.username || 'N/A',
        score: sub.score,
        timeTaken: sub.timeTaken || 0,
        tabSwitches: sub.tabSwitches || 0,
        createdAt: sub.createdAt,
      }))
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
