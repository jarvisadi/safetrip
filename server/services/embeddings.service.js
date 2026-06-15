import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export const getEmbedding = async (text) => {
  try {
    const result = await hf.featureExtraction({
      model: 'nomic-ai/nomic-embed-text-v1',
      inputs: text,
    });

    // Hugging Face returns an array of floats
    return Array.from(result);
  } catch (error) {
    console.error('Error getting embedding from Hugging Face:', error);
    throw error;
  }
};
