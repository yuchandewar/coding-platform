import dbConnect from '@/lib/db';
import Test from '@/models/Test';
import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const user = await getUserFromCookies();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const test = await Test.findById(id);
    
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    if (!['live', 'published'].includes(test.status)) {
      return NextResponse.json({ error: 'Test is not currently available' }, { status: 403 });
    }

    const now = new Date();
    if (test.startTime && now < new Date(test.startTime)) {
      return NextResponse.json({ error: 'Test has not started yet' }, { status: 403 });
    }

    if (test.endTime && now > new Date(test.endTime)) {
      return NextResponse.json({ error: 'Test has expired' }, { status: 403 });
    }

    const Submission = (await import('@/models/Submission')).default;

    if (!test.allowMultipleSubmissions) {
      const existingSubmission = await Submission.findOne({ testId: id, studentId: user.userId, status: { $in: ['submitted', 'graded'] } });
      if (existingSubmission) {
        return NextResponse.json({ error: 'You have already submitted this exam.' }, { status: 403 });
      }
    }

    let serverTimeLeft = test.timerMinutes * 60; // in seconds
    let sessionSubmissionId = null;
    let initialTabSwitches = 0;

    if (test.strictTimer) {
      let inProgressSubmission = await Submission.findOne({ testId: id, studentId: user.userId, status: 'in_progress' });
      
      if (inProgressSubmission) {
        const timeElapsedSeconds = Math.floor((now.getTime() - new Date(inProgressSubmission.createdAt).getTime()) / 1000);
        serverTimeLeft = (test.timerMinutes * 60) - timeElapsedSeconds;
        sessionSubmissionId = inProgressSubmission._id;
        initialTabSwitches = inProgressSubmission.tabSwitches || 0;

        if (serverTimeLeft <= 0) {
          // Auto submit them if time has passed
          inProgressSubmission.status = 'submitted';
          await inProgressSubmission.save();
          return NextResponse.json({ error: 'Time limit exceeded. Your test has been auto-submitted.' }, { status: 403 });
        }
      } else {
        // Create new session
        const newSession = await Submission.create({
          testId: id,
          studentId: user.userId,
          status: 'in_progress',
          answers: [],
          tabSwitches: 0,
        });
        sessionSubmissionId = newSession._id;
      }
    }

    // Strip answers from test questions if they exist in the model
    const sanitizedTest = test.toObject({ flattenMaps: true });
    sanitizedTest.questions.forEach(q => {
      delete q.correctOptionIndex;
      if (q.testCases) {
        q.testCases = q.testCases.map(tc => {
          if (tc.isHidden) {
            return { isHidden: true };
          }
          return tc;
        });
      }
    });

    sanitizedTest.serverTimeLeft = serverTimeLeft;
    sanitizedTest.sessionSubmissionId = sessionSubmissionId;
    sanitizedTest.initialTabSwitches = initialTabSwitches;

    return NextResponse.json(sanitizedTest);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
