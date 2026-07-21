import dbConnect from '@/lib/db';
import Submission from '@/models/Submission';
import Test from '@/models/Test';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();
    const submissions = await Submission.find()
      .populate({ path: 'testId', select: 'title' })
      .populate({ path: 'studentId', select: 'name username' })
      .sort({ createdAt: -1 });

    return NextResponse.json(submissions);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
