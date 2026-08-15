import dbConnect from '@/lib/db';
import Submission from '@/models/Submission';
import Test from '@/models/Test';
import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getUserFromCookies();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const submissions = await Submission.find({ studentId: user.userId })
      .populate({ path: 'testId', select: 'title timerMinutes revealScores resultMetrics issueCertificate organizationName eventName certificateEligibility' })
      .sort({ createdAt: -1 });

    const resultsWithEligibility = await Promise.all(submissions.map(async (sub) => {
      let isEligible = false;
      const subObj = sub.toObject();

      if (sub.disqualified) {
        // Disqualified students get nothing
        isEligible = false;
      } else if (sub.testId?.issueCertificate && sub.testId?.revealScores && sub.score !== undefined) {
        const eligibility = sub.testId.certificateEligibility || { condition: 'all', threshold: 0 };
        if (eligibility.condition === 'all') {
          isEligible = true;
        } else if (eligibility.condition === 'score') {
          isEligible = sub.score >= eligibility.threshold;
        } else if (eligibility.condition === 'rank') {
          const betterScoreCount = await Submission.countDocuments({
            testId: sub.testId._id,
            status: 'graded',
            disqualified: { $ne: true },
            score: { $gt: sub.score }
          });
          const equalScoreBetterTimeCount = await Submission.countDocuments({
            testId: sub.testId._id,
            status: 'graded',
            disqualified: { $ne: true },
            score: sub.score,
            timeTaken: { $lt: sub.timeTaken }
          });
          const rank = betterScoreCount + equalScoreBetterTimeCount + 1;
          isEligible = rank <= eligibility.threshold;
        }
        
        // Calculate Percentile if needed
        if (sub.testId.resultMetrics?.includes('percentile')) {
          const totalStudents = await Submission.countDocuments({
            testId: sub.testId._id,
            status: 'graded',
            disqualified: { $ne: true }
          });
          const studentsBelow = await Submission.countDocuments({
            testId: sub.testId._id,
            status: 'graded',
            disqualified: { $ne: true },
            score: { $lt: sub.score }
          });
          subObj.percentile = totalStudents > 1 ? ((studentsBelow / (totalStudents - 1)) * 100).toFixed(2) : 100.00;
        }
      }
      subObj.isCertificateEligible = isEligible;
      return subObj;
    }));

    return NextResponse.json(resultsWithEligibility);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
