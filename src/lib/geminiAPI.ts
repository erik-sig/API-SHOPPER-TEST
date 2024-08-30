import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../env';

const genAI = new GoogleGenerativeAI(env.GEMINI_API);

const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function promptGemini(base64Image: string) {
  const prompt =
    'Você consegue me dizer quanto deu a medição? responda apenas o número';
  const image = {
    inlineData: {
      data: base64Image,
      mimeType: 'image/png',
    },
  };
  image.inlineData.data;
  const result = await model.generateContent([prompt, image]);

  return result;
}
