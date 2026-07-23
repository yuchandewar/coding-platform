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
      .populate('studentId', 'name username email');

    // Sort in-memory to guarantee perfect handling of missing vs explicit 'false' values from older database entries
    submissions.sort((a, b) => {
      const aDisq = a.disqualified || false;
      const bDisq = b.disqualified || false;
      
      // 1. Disqualified goes to bottom
      if (aDisq !== bDisq) return aDisq ? 1 : -1;
      
      // 2. Tab switches (ascending, less is better)
      // Apply Tab Switch Forgiveness (forgiven tab switches count as 0 effective penalty)
      const forgiveLimit = test.forgiveTabSwitches || 0;
      
      const aActualTabs = a.tabSwitches || 0;
      const bActualTabs = b.tabSwitches || 0;
      
      const aEffectiveTabs = Math.max(0, aActualTabs - forgiveLimit);
      const bEffectiveTabs = Math.max(0, bActualTabs - forgiveLimit);
      
      if (aEffectiveTabs !== bEffectiveTabs) return aEffectiveTabs - bEffectiveTabs;
      
      // 3. Score (descending, higher is better)
      const aScore = a.score || 0;
      const bScore = b.score || 0;
      if (aScore !== bScore) return bScore - aScore;
      
      // 4. Time taken (ascending, less is better)
      const aTime = a.timeTaken || 0;
      const bTime = b.timeTaken || 0;
      return aTime - bTime;
    });

    let currentRank = 1;
    return NextResponse.json({
      testTitle: test.title,
      leaderboard: submissions.map((sub) => {
        const isDisqualified = sub.disqualified || false;
        const assignedRank = isDisqualified ? '-' : currentRank++;
        
        return {
          rank: assignedRank,
          submissionId: sub._id,
          studentName: sub.studentId?.name || 'Unknown',
          studentUsername: sub.studentId?.username || 'N/A',
          score: sub.score,
          timeTaken: sub.timeTaken || 0,
          tabSwitches: sub.tabSwitches || 0,
          createdAt: sub.createdAt,
          disqualified: isDisqualified,
        };
      })
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
