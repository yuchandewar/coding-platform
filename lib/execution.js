export async function executeCode(language, code, input = '', driverCode = null) {
  // Map UI language keys to Judge0 API language IDs
  const languageMap = {
    javascript: 63, // Node.js
    python: 71,     // Python 3
    java: 62,       // Java
    cpp: 54,        // C++ (GCC)
  };

  const languageId = languageMap[language];
  if (!languageId) {
    throw new Error(`Language ${language} is not supported for execution.`);
  }

  let finalCode = code;
  if (driverCode) {
    // Inject the student's code into the driver code template
    finalCode = driverCode.replace('{{USER_CODE}}', code);
  }

  try {
    const response = await fetch('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_code: finalCode,
        language_id: languageId,
        stdin: input,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        output: data.message || data.error || 'Execution API Error',
        errorType: 'api_error'
      };
    }

    // Judge0 status ids: 3 is Accepted. 6 is Compile Error, etc.
    if (data.status.id === 6) {
      return {
        success: false,
        output: data.compile_output || data.stderr || 'Compilation Error',
        errorType: 'compile',
      };
    }

    if (data.status.id !== 3) {
      return {
        success: false,
        output: data.stderr || data.message || data.status.description,
        errorType: 'runtime',
      };
    }

    return {
      success: true,
      output: data.stdout || '',
    };
  } catch (err) {
    console.error('Judge0 API Error:', err);
    return {
      success: false,
      output: 'Failed to connect to execution server.',
      errorType: 'api_error'
    };
  }
}
