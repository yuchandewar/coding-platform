import dbConnect from '@/lib/db';
import Submission from '@/models/Submission';
import Test from '@/models/Test';
import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';

export async function PUT(req, { params }) {
  try {
    const user = await getUserFromCookies();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { answers } = await req.json();

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Invalid answers format' }, { status: 400 });
    }

    await dbConnect();

    const test = await Test.findById(id);
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    if (test.saveAnswersMode !== 'server') {
      return NextResponse.json({ error: 'Server-side drafting is not enabled for this test' }, { status: 403 });
    }

    // Only update if there is an in_progress submission
    const submission = await Submission.findOneAndUpdate(
      { testId: id, studentId: user.userId, status: 'in_progress' },
      { $set: { answers } },
      { new: true }
    );

    if (!submission) {
      return NextResponse.json({ error: 'No active session found to save draft' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Draft saved successfully' });
  } catch (error) {
    console.error('Draft save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
