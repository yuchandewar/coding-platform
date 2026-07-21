import dbConnect from '@/lib/db';
import Submission from '@/models/Submission';
import Test from '@/models/Test';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const admin = await getUserFromCookies();
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id: submissionId } = await params;
    
    // Find the submission and populate test and student details
    const submission = await Submission.findById(submissionId)
      .populate({ path: 'testId', select: 'title questions' })
      .populate({ path: 'studentId', select: 'username email' })
      .lean();

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
