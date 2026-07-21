import dbConnect from '@/lib/db';
import Submission from '@/models/Submission';
import Test from '@/models/Test';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    await dbConnect();
    
    const submission = await Submission.findById(id)
      .populate({ 
        path: 'testId', 
        select: 'title issueCertificate organizationName eventName revealScores certificateTemplate certificateEligibility' 
      });

    if (!submission) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    if (!submission.testId?.issueCertificate) {
      return NextResponse.json({ error: 'This test does not issue certificates' }, { status: 403 });
    }

    // Must be graded and scores revealed
    if (!submission.testId?.revealScores || submission.score === undefined) {
      return NextResponse.json({ error: 'Certificate not yet available' }, { status: 403 });
    }

    // Fetch the student's name
    const student = await User.findById(submission.studentId).select('name username');
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Compute Rank
    // Fetch all graded submissions for this test
    const allSubmissions = await Submission.find({ 
      testId: submission.testId._id,
      status: 'graded'
    }).sort({ score: -1, timeTaken: 1 });

    const rank = allSubmissions.findIndex(s => s._id.toString() === submission._id.toString()) + 1;

    // Check Eligibility
    const eligibility = submission.testId.certificateEligibility || { condition: 'all', threshold: 0 };
    if (eligibility.condition === 'rank') {
      if (rank > eligibility.threshold) {
        return NextResponse.json({ error: `Certificate is only available for the top ${eligibility.threshold} ranks. Your rank is ${rank}.` }, { status: 403 });
      }
    } else if (eligibility.condition === 'score') {
      if (submission.score < eligibility.threshold) {
        return NextResponse.json({ error: `Certificate requires a minimum score of ${eligibility.threshold}%. Your score is ${submission.score}%.` }, { status: 403 });
      }
    }

    return NextResponse.json({
      studentName: student.name || student.username,
      score: submission.score,
      rank: rank,
      date: submission.createdAt,
      testTitle: submission.testId.title,
      organizationName: submission.testId.organizationName,
      eventName: submission.testId.eventName,
      template: submission.testId.certificateTemplate
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
