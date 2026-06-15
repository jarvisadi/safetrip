import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
};

export const detectWildlife = async (input) => {
  let base64Image;
  let mimeType = 'image/jpeg';

  if (input.type === 'file') {
    // Read file from disk and convert to base64
    const imageBuffer = fs.readFileSync(input.path);
    base64Image = imageBuffer.toString('base64');
    const ext = path.extname(input.path).toLowerCase();
    const mimeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    mimeType = mimeMap[ext] || 'image/jpeg';
  } else if (input.type === 'base64') {
    // Already base64 from camera capture
    base64Image = input.data;
    mimeType = 'image/jpeg';
  }

  const prompt = `Analyze this image and detect if there is a dangerous wild animal.
Respond ONLY with a valid JSON object, no extra text, no markdown, no backticks.
Use exactly this format:
{
  "detected": true or false,
  "animal": "name of animal or null",
  "danger_level": "high or medium or low or none",
  "advice": "one sentence of safety advice for the tourist"
}`;

  const response = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
    max_tokens: 300,
  });

  try {
    const rawText = response.choices[0].message.content;
    const cleanText = rawText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText);
  } catch {
    return {
      detected: false,
      animal: null,
      danger_level: 'none',
      advice: 'Could not analyze image. Please try again.',
    };
  }
};
