import dbConnect from '@/lib/db';
import Submission from '@/models/Submission';
import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';

export async function PATCH(req, { params }) {
  try {
    const user = await getUserFromCookies();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { tabSwitches } = await req.json();

    if (tabSwitches === undefined) {
      return NextResponse.json({ error: 'tabSwitches required' }, { status: 400 });
    }

    await dbConnect();

    // Only update if it belongs to this student and is in progress
    const submission = await Submission.findOneAndUpdate(
      { _id: id, studentId: user.userId, status: 'in_progress' },
      { $set: { tabSwitches } },
      { new: true }
    );

    if (!submission) {
      return NextResponse.json({ error: 'Active submission not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, tabSwitches: submission.tabSwitches });
  } catch (error) {
    console.error('Update session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
