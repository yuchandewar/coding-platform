import dbConnect from '@/lib/db';
import Test from '@/models/Test';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    await dbConnect();
    const test = await Test.findById(id);
    
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    return NextResponse.json({ feedbackTimer: test.feedbackTimer ?? 30 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
