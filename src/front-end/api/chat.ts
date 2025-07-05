import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

// Serverless function
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers – ajuste conforme sua política de segurança
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body as { prompt?: string };

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'GEMINI_API_KEY not configured' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-pro',
      contents: prompt,
    });

    const answer = (result as any).text ?? '';
    return res.status(200).json({ answer });
  } catch (error) {
    console.error('Gemini error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 