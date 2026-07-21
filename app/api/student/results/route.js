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
      .populate({ path: 'testId', select: 'title timerMinutes revealScores issueCertificate organizationName eventName certificateEligibility' })
      .sort({ createdAt: -1 });

    const resultsWithEligibility = await Promise.all(submissions.map(async (sub) => {
      let isEligible = false;
      const subObj = sub.toObject();

      if (sub.testId?.issueCertificate && sub.testId?.revealScores && sub.score !== undefined) {
        const eligibility = sub.testId.certificateEligibility || { condition: 'all', threshold: 0 };
        if (eligibility.condition === 'all') {
          isEligible = true;
        } else if (eligibility.condition === 'score') {
          isEligible = sub.score >= eligibility.threshold;
        } else if (eligibility.condition === 'rank') {
          const allSubmissions = await Submission.find({ 
            testId: sub.testId._id,
            status: 'graded'
          }).sort({ score: -1, timeTaken: 1 });
          const rank = allSubmissions.findIndex(s => s._id.toString() === sub._id.toString()) + 1;
          isEligible = rank <= eligibility.threshold;
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
