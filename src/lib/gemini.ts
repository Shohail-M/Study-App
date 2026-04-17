import { GoogleGenAI } from '@google/genai';

export const askGemini = async (prompt: string, apiKey: string) => {
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key is not configured. Please add it in Settings.');
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error('Gemini API error', error);
    throw new Error('Failed to connect to the AI model.');
  }
};
