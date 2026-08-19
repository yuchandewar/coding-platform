import dbConnect from '@/lib/db';
import Submission from '@/models/Submission';
import Test from '@/models/Test';
import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = await getUserFromCookies();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Fetch all graded submissions
    const submissions = await Submission.find({ studentId: user.userId, status: 'graded', disqualified: { $ne: true } })
      .populate('testId');

    // Filter to only tests that allow performance tracking
    const validSubmissions = submissions.filter(sub => sub.testId && sub.testId.showPerformanceTrack);

    const overallPerformance = {};
    let testsAnalyzed = 0;
    const historyLine = []; // To track progress over time (by test)

    validSubmissions.forEach(sub => {
      testsAnalyzed++;
      let testEarned = 0;
      let testTotal = 0;

      sub.testId.questions.forEach(q => {
        const cat = q.category || 'Uncategorized';
        if (!overallPerformance[cat]) {
          overallPerformance[cat] = { totalMarks: 0, obtainedMarks: 0 };
        }
        overallPerformance[cat].totalMarks += (q.marks || 1);
        testTotal += (q.marks || 1);

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
          testEarned += obtained;
        }
      });
      
      const testPercentage = sub.maxScore > 0 ? (sub.score / sub.maxScore) * 100 : 0;
      historyLine.push({
        testName: sub.testId.title,
        date: new Date(sub.createdAt).toLocaleDateString(),
        sortDate: new Date(sub.createdAt).getTime(), // Added for reliable sorting
        score: Number(testPercentage.toFixed(2))
      });
    });

    const categories = Object.keys(overallPerformance).map(cat => {
      const stats = overallPerformance[cat];
      const percentage = stats.totalMarks > 0 ? (stats.obtainedMarks / stats.totalMarks) * 100 : 0;
      let label = 'Average';
      if (percentage >= 80) label = 'Strong';
      else if (percentage <= 40) label = 'Weak';
      
      let suggestion = '';
      if (label === 'Strong') suggestion = `You consistently excel in ${cat}. Keep maintaining this strong foundation!`;
      else if (label === 'Weak') suggestion = `Your overall history indicates a struggle with ${cat}. Consider dedicating more time to practice and fundamental concepts in this area.`;
      else suggestion = `Your performance in ${cat} is decent, but targeted practice can push you to the Strong level.`;

      return {
        category: cat,
        ...stats,
        percentage: Number(percentage.toFixed(2)),
        label,
        suggestion
      };
    });

    // Ensure chronological order for history chart
    historyLine.sort((a, b) => a.sortDate - b.sortDate);

    return NextResponse.json({ 
      testsAnalyzed,
      categories,
      historyLine
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
