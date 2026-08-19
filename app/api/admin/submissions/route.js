import dbConnect from '@/lib/db';
import Submission from '@/models/Submission';
import Test from '@/models/Test';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    await dbConnect();
    const submissions = await Submission.find()
      .populate({ path: 'testId', select: 'title' })
      .populate({ path: 'studentId', select: 'name username' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Submission.countDocuments();
    const hasMore = skip + submissions.length < total;

    return NextResponse.json({ submissions, hasMore, total });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
