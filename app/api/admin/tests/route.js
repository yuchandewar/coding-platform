import dbConnect from '@/lib/db';
import Test from '@/models/Test';
import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getUserFromCookies();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const tests = await Test.find({ createdBy: user.userId }).sort({ createdAt: -1 });
    return NextResponse.json(tests);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getUserFromCookies();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, timerMinutes, status, startTime, endTime, questions, strictTimer } = await req.json();

    if (!title || !timerMinutes) {
      return NextResponse.json({ error: 'Title and Timer are required' }, { status: 400 });
    }

    await dbConnect();

    const test = await Test.create({
      title,
      description,
      timerMinutes,
      status: status || 'draft',
      startTime,
      endTime,
      strictTimer: strictTimer || false,
      questions: questions || [],
      createdBy: user.userId,
    });

    return NextResponse.json({ message: 'Test created successfully', test });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
