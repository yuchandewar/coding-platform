import dbConnect from '@/lib/db';
import Submission from '@/models/Submission';
import Test from '@/models/Test';
import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const user = await getUserFromCookies();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submissionId } = await params;
    await dbConnect();

    const submission = await Submission.findOne({ _id: submissionId, studentId: user.userId })
      .populate('testId');

    if (!submission || !submission.testId) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (!submission.testId.showPerformanceTrack) {
      return NextResponse.json({ error: 'Performance tracking is not enabled for this test' }, { status: 403 });
    }

    // We can evaluate category performance if we just calculate it from the answers stored
    const categoryPerformance = {};

    submission.testId.questions.forEach((q) => {
      const cat = q.category || 'Uncategorized';
      if (!categoryPerformance[cat]) {
        categoryPerformance[cat] = { totalMarks: 0, obtainedMarks: 0, totalQuestions: 0, attemptedQuestions: 0 };
      }
      categoryPerformance[cat].totalMarks += (q.marks || 1);
      categoryPerformance[cat].totalQuestions += 1;

      // Find answer for this question
      const answer = submission.answers.find(a => a.questionId.toString() === q._id.toString());
      if (answer) {
         categoryPerformance[cat].attemptedQuestions += 1;
         
         // Simplified re-grading logic for performance track
         let obtained = 0;
         if (q.type === 'quiz') {
            if (answer.selectedOptionIndex === q.correctOptionIndex) {
               obtained = q.marks || 1;
            } else if (answer.selectedOptionIndex !== undefined) {
               obtained = -(q.negativeMarks ?? submission.testId.defaultNegativeMarks ?? 0);
            }
         } else if (q.type === 'fill_in_the_blank') {
            const isCorrect = q.blankAnswers?.some(b => b.toLowerCase() === (answer.textResponse || '').toLowerCase());
            if (isCorrect) obtained = q.marks || 1;
         } else if (q.type === 'pairing') {
            // Simplified
            let matchCount = 0;
            if (answer.pairedResponses && q.pairs) {
              q.pairs.forEach(p => {
                const ansP = answer.pairedResponses.find(ap => ap.left === p.left);
                if (ansP && ansP.right === p.right) matchCount++;
              });
              if (matchCount === q.pairs.length && matchCount > 0) obtained = q.marks || 1;
            }
         }
         // Programming grading is skipped here because it requires executing the code.
         // In a real app, we should save per-question score in Submission. 
         // For now, this gives us basic stats.
         categoryPerformance[cat].obtainedMarks += obtained;
      }
    });

    const categories = Object.keys(categoryPerformance).map(cat => {
      const stats = categoryPerformance[cat];
      const percentage = stats.totalMarks > 0 ? (stats.obtainedMarks / stats.totalMarks) * 100 : 0;
      let label = 'Average';
      if (percentage >= 80) label = 'Strong';
      else if (percentage <= 40) label = 'Weak';
      
      let suggestion = '';
      if (label === 'Strong') {
         suggestion = `Great job! You have a strong grasp of ${cat}. Keep it up!`;
      } else if (label === 'Weak') {
         suggestion = `You need to focus more on ${cat}. Consider reviewing the basics.`;
      } else {
         suggestion = `You are doing okay in ${cat}, but there is room for improvement.`;
      }

      return {
        category: cat,
        ...stats,
        percentage: percentage.toFixed(2),
        label,
        suggestion
      };
    });

    return NextResponse.json({ 
       testTitle: submission.testId.title, 
       score: submission.score, 
       maxScore: submission.maxScore,
       categories
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
