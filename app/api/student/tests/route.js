import dbConnect from '@/lib/db';
import Test from '@/models/Test';
import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getUserFromCookies();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const now = new Date();
    
    // Only return live/published tests that haven't expired and have started
    const tests = await Test.find({ 
      status: { $in: ['live', 'published'] },
      $and: [
        {
          $or: [
            { startTime: { $exists: false } },
            { startTime: null },
            { startTime: { $lte: now } }
          ]
        },
        {
          $or: [
            { endTime: { $exists: false } },
            { endTime: null },
            { endTime: { $gt: now } }
          ]
        }
      ]
    }).sort({ createdAt: -1 });
    
    return NextResponse.json(tests);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
