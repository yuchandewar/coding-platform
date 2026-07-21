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

    if (!test.allowMultipleSubmissions) {
      const Submission = (await import('@/models/Submission')).default;
      const existingSubmission = await Submission.findOne({ testId: id, studentId: user.userId });
      if (existingSubmission) {
        return NextResponse.json({ error: 'You have already submitted this exam.' }, { status: 403 });
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

    return NextResponse.json(sanitizedTest);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
