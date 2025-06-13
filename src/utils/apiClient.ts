const API_BASE_URL = 'http://localhost:3001/api';

export async function generateQuestions(
  examDetails: any,
  questionConfig: any,
  extractedTexts: string[]
): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        examDetails,
        questionConfig,
        extractedTexts
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate questions');
    }

    const data = await response.json();
    return data.questions;
  } catch (error) {
    console.error('Error calling API:', error);
    throw error;
  }
}

export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Server health check failed:', error);
    return false;
  }
}