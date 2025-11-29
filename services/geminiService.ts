import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client
// Note: In a real production app, ensure the key is proxying through a backend or strict RLS
// For this demo, we assume process.env.API_KEY is injected safely.
const apiKey = process.env.API_KEY || 'dummy-key-for-demo'; 
const ai = new GoogleGenAI({ apiKey });

/**
 * Generates a creative and effective description for an item being sold/listed.
 */
export const generateItemDescription = async (
  title: string,
  category: string,
  condition: string,
  details: string
): Promise<string> => {
  try {
    if (!process.env.API_KEY) {
      return "AI description generation requires a valid API Key. (Demo Mode: Please enter details manually)";
    }

    const model = 'gemini-2.5-flash';
    const prompt = `
      You are an expert copywriter for a student marketplace app called "Seconds-App".
      Write a catchy, concise, and honest description (max 100 words) for a product listing.
      
      Item: ${title}
      Category: ${category}
      Condition: ${condition}
      Additional Details: ${details}
      
      Focus on value for money and student needs. Use emojis sparingly.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Could not generate description.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating description. Please try again.";
  }
};

/**
 * Suggests a price based on item details (Mock implementation of Valuation AI).
 */
export const suggestPrice = async (itemTitle: string): Promise<string> => {
   try {
    if (!process.env.API_KEY) return "AI unavailable";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Give me a single number representing the estimated used market price in USD for a used "${itemTitle}" in good condition for a college student. return only the number.`,
    });
    return response.text.trim();
   } catch (e) {
     return "N/A";
   }
}
