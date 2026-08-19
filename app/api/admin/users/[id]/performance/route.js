import dbConnect from '@/lib/db';
import Submission from '@/models/Submission';
import Test from '@/models/Test';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const adminUser = await getUserFromCookies();
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: studentId } = await params;
    await dbConnect();

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const submissions = await Submission.find({ studentId }).populate('testId');

    const overallPerformance = {};
    let totalExamsTaken = 0;

    submissions.forEach(sub => {
      if (!sub.testId || sub.status !== 'graded') return;
      totalExamsTaken++;

      sub.testId.questions.forEach(q => {
        const cat = q.category || 'Uncategorized';
        if (!overallPerformance[cat]) {
          overallPerformance[cat] = { totalMarks: 0, obtainedMarks: 0 };
        }
        overallPerformance[cat].totalMarks += (q.marks || 1);

        const answer = sub.answers.find(a => a.questionId.toString() === q._id.toString());
        if (answer) {
          let obtained = 0;
          if (q.type === 'quiz') {
            if (answer.selectedOptionIndex === q.correctOptionIndex) obtained = q.marks || 1;
            else if (answer.selectedOptionIndex !== undefined) obtained = -(q.negativeMarks ?? sub.testId.defaultNegativeMarks ?? 0);
          } else if (q.type === 'fill_in_the_blank') {
            const isCorrect = q.blankAnswers?.some(b => b.toLowerCase() === (answer.textResponse || '').toLowerCase());
            if (isCorrect) obtained = q.marks || 1;
          } else if (q.type === 'pairing') {
            let matchCount = 0;
            if (answer.pairedResponses && q.pairs) {
              q.pairs.forEach(p => {
                const ansP = answer.pairedResponses.find(ap => ap.left === p.left);
                if (ansP && ansP.right === p.right) matchCount++;
              });
              if (matchCount === q.pairs.length && matchCount > 0) obtained = q.marks || 1;
            }
          }
          overallPerformance[cat].obtainedMarks += obtained;
        }
      });
    });

    const categories = Object.keys(overallPerformance).map(cat => {
      const stats = overallPerformance[cat];
      const percentage = stats.totalMarks > 0 ? (stats.obtainedMarks / stats.totalMarks) * 100 : 0;
      let label = 'Average';
      if (percentage >= 80) label = 'Strong';
      else if (percentage <= 40) label = 'Weak';
      
      let suggestion = '';
      if (label === 'Strong') suggestion = `Student excels in ${cat}. Encourage advanced topics.`;
      else if (label === 'Weak') suggestion = `Student is struggling with ${cat}. Recommend foundational review and practice.`;
      else suggestion = `Student is average in ${cat}. Consistent practice will help improve.`;

      return {
        category: cat,
        ...stats,
        percentage: percentage.toFixed(2),
        label,
        suggestion
      };
    });

    return NextResponse.json({ 
       studentName: student.name,
       studentUsername: student.username,
       totalExamsTaken,
       categories
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
