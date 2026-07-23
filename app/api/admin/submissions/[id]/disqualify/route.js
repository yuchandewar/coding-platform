import dbConnect from '@/lib/db';
import Submission from '@/models/Submission';
import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';

export async function PATCH(request, { params }) {
  try {
    const user = await getUserFromCookies();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { disqualified } = body;

    await dbConnect();

    const submission = await Submission.findById(id);
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    submission.disqualified = disqualified;
    await submission.save();

    return NextResponse.json({ message: 'Submission disqualification status updated', disqualified: submission.disqualified });
  } catch (error) {
    console.error('Disqualify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
