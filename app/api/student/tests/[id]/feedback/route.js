import dbConnect from '@/lib/db';
import Submission from '@/models/Submission';
import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';

export async function POST(req, { params }) {
  try {
    const user = await getUserFromCookies();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: testId } = await params;
    const { rating, feedbackText } = await req.json();

    if (!rating) {
      return NextResponse.json({ error: 'Rating is required' }, { status: 400 });
    }

    await dbConnect();

    // Find the student's most recent submission for this test
    const submission = await Submission.findOne({ testId, studentId: user.userId }).sort({ createdAt: -1 });
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    submission.rating = rating;
    submission.feedbackText = feedbackText;
    await submission.save();

    return NextResponse.json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
