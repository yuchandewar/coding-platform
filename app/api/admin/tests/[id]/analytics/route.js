import dbConnect from '@/lib/db';
import Submission from '@/models/Submission';
import Test from '@/models/Test';
import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const user = await getUserFromCookies();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const test = await Test.findOne({ _id: id, createdBy: user.userId });
    if (!test) return NextResponse.json({ error: 'Test not found or unauthorized' }, { status: 404 });

    const submissions = await Submission.find({ testId: id, status: 'graded', disqualified: { $ne: true } })
      .populate('studentId', 'name username');

    const studentsAnalytics = [];
    const overallCategoryStats = {};

    submissions.forEach(sub => {
      if (!sub.studentId) return;

      const categoryPerformance = {};

      test.questions.forEach(q => {
        const cat = q.category || 'Uncategorized';
        if (!categoryPerformance[cat]) {
          categoryPerformance[cat] = { totalMarks: 0, obtainedMarks: 0 };
        }
        categoryPerformance[cat].totalMarks += (q.marks || 1);

        const answer = sub.answers.find(a => a.questionId.toString() === q._id.toString());
        if (answer) {
          let obtained = 0;
          if (q.type === 'quiz') {
            if (answer.selectedOptionIndex === q.correctOptionIndex) obtained = q.marks || 1;
            else if (answer.selectedOptionIndex !== undefined) obtained = -(q.negativeMarks ?? test.defaultNegativeMarks ?? 0);
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
          categoryPerformance[cat].obtainedMarks += obtained;
        }
      });

      const categoriesArr = Object.keys(categoryPerformance).map(cat => {
        const stats = categoryPerformance[cat];
        const percentage = stats.totalMarks > 0 ? (stats.obtainedMarks / stats.totalMarks) * 100 : 0;
        let label = 'Average';
        if (percentage >= 80) label = 'Strong';
        else if (percentage <= 40) label = 'Weak';
        
        let suggestion = '';
        if (label === 'Strong') suggestion = `Excellent in ${cat}. Ready for advanced challenges.`;
        else if (label === 'Weak') suggestion = `Needs foundational review in ${cat}. Suggest targeted practice.`;
        else suggestion = `Solid understanding in ${cat}. Practice will increase speed and accuracy.`;

        // Update overall stats
        if (!overallCategoryStats[cat]) {
          overallCategoryStats[cat] = { totalPercentageSum: 0, studentCount: 0 };
        }
        overallCategoryStats[cat].totalPercentageSum += percentage;
        overallCategoryStats[cat].studentCount += 1;

        return {
          category: cat,
          ...stats,
          percentage: Number(percentage.toFixed(2)),
          label,
          suggestion
        };
      });

      studentsAnalytics.push({
        submissionId: sub._id,
        studentId: sub.studentId._id,
        studentName: sub.studentId.name,
        studentUsername: sub.studentId.username,
        score: sub.score,
        maxScore: sub.maxScore,
        categories: categoriesArr
      });
    });

    const categoryAverages = Object.keys(overallCategoryStats).map(cat => {
      const stats = overallCategoryStats[cat];
      return {
        category: cat,
        averagePercentage: Number((stats.totalPercentageSum / stats.studentCount).toFixed(2))
      };
    });

    return NextResponse.json({
      testTitle: test.title,
      categoryAverages,
      studentsAnalytics
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
