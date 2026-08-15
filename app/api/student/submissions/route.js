import dbConnect from '@/lib/db';
import Submission from '@/models/Submission';
import Test from '@/models/Test';
import { executeCode } from '@/lib/execution';
import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';

export async function POST(req) {
  try {
    const user = await getUserFromCookies();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { testId, answers, tabSwitches = 0, timeTaken = 0 } = await req.json();

    if (!testId || !answers) {
      return NextResponse.json({ error: 'Test ID and answers are required' }, { status: 400 });
    }

    await dbConnect();

    const test = await Test.findById(testId);
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Check if submission already exists to prevent double submission error on retries
    if (!test.allowMultipleSubmissions) {
      const existingSubmission = await Submission.findOne({ 
        testId, 
        studentId: user.userId,
        status: { $in: ['submitted', 'graded'] }
      });
      if (existingSubmission) {
        return NextResponse.json({ message: 'Submission already recorded', submission: existingSubmission });
      }
    }

    // Evaluate answers
    let totalScore = 0;
    let maxScore = 0;
    let correctAnswers = 0;

    for (const question of test.questions) {
      maxScore += (question.marks ?? 1);
    }

    for (const answer of answers) {
      const question = test.questions.id(answer.questionId);
      if (!question) continue;

      const negativeMark = question.negativeMarks !== undefined && question.negativeMarks !== null 
        ? question.negativeMarks 
        : (test.allowNegativeMarking ? (test.defaultNegativeMarks || 0) : 0);

      if (question.type === 'programming') {
        const testCases = question.testCases || [];
        if (testCases.length === 0) {
          totalScore += question.marks ?? 1; // Give full marks if no test cases defined
          continue;
        }

        let passedTestCases = 0;
        const driverCode = question.driverCode?.get(answer.language) || null;
        
        const execPromises = testCases.map(async (tc) => {
          const execResult = await executeCode(answer.language, answer.code, tc.input, driverCode);
          const actualNormalized = execResult.output.replace(/\r\n/g, '\n').trim();
          const expectedNormalized = tc.expectedOutput.replace(/\r\n/g, '\n').trim();
          const passed = execResult.success && actualNormalized === expectedNormalized;
          if (passed) passedTestCases++;
        });
        
        await Promise.all(execPromises);
        
        if (passedTestCases === testCases.length) correctAnswers++;

        const questionScore = (passedTestCases / testCases.length) * (question.marks ?? 1);
        
        const baseCodeStr = question.baseCode?.get(answer.language) || '';
        const isAttempted = answer.code && answer.code.trim() !== baseCodeStr.trim() && answer.code.trim() !== '';

        if (passedTestCases === 0 && isAttempted) {
          totalScore -= negativeMark;
        } else {
          totalScore += questionScore;
        }
      } else if (question.type === 'quiz') {
        if (answer.selectedOptionIndex !== undefined && answer.selectedOptionIndex !== null) {
          if (answer.selectedOptionIndex === question.correctOptionIndex) {
            totalScore += question.marks ?? 1;
            correctAnswers++;
          } else {
            totalScore -= negativeMark;
          }
        }
      } else if (question.type === 'fill_in_the_blank') {
        if (answer.textResponse && answer.textResponse.trim() !== '') {
          const isCorrect = question.blankAnswers.some(ans => ans.trim().toLowerCase() === answer.textResponse.trim().toLowerCase());
          if (isCorrect) {
            totalScore += question.marks ?? 1;
            correctAnswers++;
          } else {
            totalScore -= negativeMark;
          }
        }
      } else if (question.type === 'pairing') {
        if (answer.pairedResponses && answer.pairedResponses.length > 0) {
          let allCorrect = true;
          let attempted = false;
          for (const pr of answer.pairedResponses) {
            if (pr.right && pr.right.trim() !== '') attempted = true;
            const expected = question.pairs.find(p => p.left === pr.left)?.right;
            if (expected !== pr.right) {
              allCorrect = false;
            }
          }
          if (attempted) {
            if (allCorrect) {
              totalScore += question.marks ?? 1;
              correctAnswers++;
            } else {
              totalScore -= negativeMark;
            }
          }
        }
      }
    }

    let submission = await Submission.findOneAndUpdate(
      { testId, studentId: user.userId, status: 'in_progress' },
      {
        $set: {
          answers,
          score: totalScore,
          maxScore,
          correctAnswers,
          timeTaken,
          status: 'graded'
        },
        $max: { tabSwitches }
      },
      { new: true }
    );

    if (!submission) {
      // Prevent race conditions where two rapid requests both bypass the initial check
      if (!test.allowMultipleSubmissions) {
        const doubleCheck = await Submission.findOne({ 
          testId, 
          studentId: user.userId,
          status: { $in: ['submitted', 'graded'] }
        });
        if (doubleCheck) {
          return NextResponse.json({ message: 'Submission already recorded', submission: doubleCheck });
        }
      }

      submission = await Submission.create({
        testId,
        studentId: user.userId,
        answers,
        score: totalScore,
        maxScore,
        correctAnswers,
        tabSwitches,
        timeTaken,
        status: 'graded',
      });
    }

    return NextResponse.json({ message: 'Submission successful and graded', submission });
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
