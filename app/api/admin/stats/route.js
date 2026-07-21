import dbConnect from '@/lib/db';
import User from '@/models/User';
import Test from '@/models/Test';
import Submission from '@/models/Submission';
import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';

export async function GET(req) {
  try {
    const admin = await getUserFromCookies();
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTests = await Test.countDocuments();
    const totalSubmissions = await Submission.countDocuments();

    // Calculate Average Score
    const submissions = await Submission.find({}, 'score tabSwitches').lean();
    
    let averageScore = 0;
    let totalTabSwitches = 0;
    
    if (submissions.length > 0) {
      const totalScore = submissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
      averageScore = totalScore / submissions.length;
      totalTabSwitches = submissions.reduce((sum, sub) => sum + (sub.tabSwitches || 0), 0);
    }

    return NextResponse.json({
      totalStudents,
      totalTests,
      totalSubmissions,
      averageScore: averageScore.toFixed(2),
      totalTabSwitches
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
