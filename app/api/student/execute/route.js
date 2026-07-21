import dbConnect from '@/lib/db';
import Test from '@/models/Test';
import { executeCode } from '@/lib/execution';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { testId, questionId, code, language } = await req.json();

    if (!testId || !questionId || !code || !language) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();
    const test = await Test.findById(testId);
    if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 });

    const question = test.questions.id(questionId);
    if (!question || question.type !== 'programming') {
      return NextResponse.json({ error: 'Programming question not found' }, { status: 404 });
    }

    // Only run visible test cases during the exam
    const testCases = question.testCases || [];
    const visibleTestCases = testCases.filter(tc => !tc.isHidden);
    
    if (visibleTestCases.length === 0) {
      return NextResponse.json({ message: 'No visible test cases for this question.', results: [] });
    }

    const driverCode = question.driverCode?.get(language) || null;
    
    const execPromises = visibleTestCases.map(async (tc) => {
      const execResult = await executeCode(language, code, tc.input, driverCode);
      
      const actualNormalized = execResult.output.replace(/\r\n/g, '\n').trim();
      const expectedNormalized = tc.expectedOutput.replace(/\r\n/g, '\n').trim();
      const passed = execResult.success && actualNormalized === expectedNormalized;
      
      return {
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: execResult.output,
        passed,
        errorType: execResult.errorType,
      };
    });

    const results = await Promise.all(execPromises);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Execution error:', error);
    return NextResponse.json({ error: 'Execution failed: ' + error.message }, { status: 500 });
  }
}
