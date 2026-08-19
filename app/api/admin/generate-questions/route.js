import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(req) {
  try {
    const user = await getUserFromCookies();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, count, type, existingQuestions = [], availableCategories = [] } = await req.json();

    if (!prompt || !count || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();
    const adminUser = await User.findById(user.userId);
    
    if (!adminUser || !adminUser.geminiApiKey) {
      return NextResponse.json({ error: 'Gemini API key not found. Please add it in your Admin Settings.' }, { status: 403 });
    }

    const apiKey = adminUser.geminiApiKey;
    
    const categoryInstruction = availableCategories.length > 0 
      ? `\n- "category": Select the most appropriate category from this exact list: [${availableCategories.join(', ')}]. If none perfectly fit, generate a short logical category string.`
      : `\n- "category": A short string representing the category (e.g. "Arrays", "Database", "Logical Reasoning").`;

    let formatInstruction = '';
    if (type === 'quiz') {
      formatInstruction = `Return ONLY a valid JSON array of ${count} objects. Each object MUST have:
- "type": "quiz"
- "questionText": The question string
- "options": An array of exactly 4 strings representing the choices
- "correctOptionIndex": A number between 0 and 3 representing the correct choice index.${categoryInstruction}`;
    } else if (type === 'fill_in_the_blank') {
      formatInstruction = `Return ONLY a valid JSON array of ${count} objects. Each object MUST have:
- "type": "fill_in_the_blank"
- "questionText": The question string with blanks denoted by underscores, e.g., "The capital of France is ___."
- "blankAnswers": An array of strings containing the correct answer for each blank in order.${categoryInstruction}`;
    } else if (type === 'pairing') {
      formatInstruction = `Return ONLY a valid JSON array of ${count} objects. Each object MUST have:
- "type": "pairing"
- "questionText": The question instruction string, e.g., "Match the following items."
- "pairs": An array of exactly 4 objects, each with a "left" string and a "right" string representing the correct matching pairs.${categoryInstruction}`;
    } else if (type === 'programming') {
      formatInstruction = `Return ONLY a valid JSON array of ${count} objects. Each object MUST have:
- "type": "programming"
- "questionText": The programming problem description.
- "supportedLanguages": ["javascript", "python", "java", "cpp"]
- "baseCode": A JSON object with keys "javascript", "python", "java", "cpp". The starter code MUST define a function with parameters perfectly matching the specific problem.
- "driverCode": A JSON object with keys "javascript", "python", "java", "cpp". This is the hidden code that runs the tests. It MUST read standard input, parse it, call the student's function, and print the result. Use "{{USER_CODE}}" as a placeholder.
- "testCases": An array of 3 objects, each with "input" (string), "expectedOutput" (string), and "isHidden" (boolean).${categoryInstruction}`;
    }

    let systemPrompt = `You are an expert educational content creator. The user needs ${count} question(s) about the topic: "${prompt}".
${formatInstruction}

CRITICAL: Every question you generate MUST be completely unique. DO NOT generate the same question twice.`;

    if (existingQuestions && existingQuestions.length > 0) {
      systemPrompt += `\n\nALSO, you MUST completely avoid generating questions that are similar to these existing ones:\n- ${existingQuestions.join('\n- ')}`;
    }

    systemPrompt += `\n\nDO NOT include markdown code blocks like \`\`\`json. Return RAW JSON only, starting with [ and ending with ].`;

    const modelToUse = adminUser.geminiModel || 'gemini-1.5-flash-latest';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`;
    
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemPrompt }]
        }],
        generationConfig: {
          temperature: 0.7,
        }
      })
    });

    const geminiData = await geminiRes.json();
    
    if (!geminiRes.ok) {
      console.error('Gemini API Error:', geminiData);
      let errorMessage = geminiData.error?.message || 'Gemini API failed to generate content';
      
      // DIAGNOSTIC: Fetch available models
      try {
        const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const listData = await listRes.json();
        if (listData.models) {
          const availableModels = listData.models.map(m => m.name).join(', ');
          errorMessage += `\n\n[DIAGNOSTIC] Available models for this key: ${availableModels}`;
        }
      } catch (e) {
        // ignore
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    let responseText = geminiData.candidates[0].content.parts[0].text;
    
    // Clean up response if it has markdown formatting
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/```/g, '').trim();
    }

    const questions = JSON.parse(responseText);

    // Validate the generated questions slightly
    if (!Array.isArray(questions)) {
      throw new Error('API did not return an array');
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
