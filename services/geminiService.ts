
import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client
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
    return response.text?.trim() || "N/A";
   } catch (e) {
     return "N/A";
   }
}

/**
 * Visual Search: Analyzes an image to generate a search query.
 */
export const analyzeImageForSearch = async (file: File): Promise<string> => {
  try {
    if (!process.env.API_KEY) return "";

    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

    // Remove the data URL prefix (e.g. "data:image/jpeg;base64,")
    const base64String = base64Data.split(',')[1];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Using flash for speed/vision capabilities
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64String
            }
          },
          {
            text: "Identify the main item in this picture. Return ONLY the product name or category that I should search for in a marketplace (e.g. 'Graphing Calculator' or 'Calculus Textbook'). Keep it under 4 words."
          }
        ]
      }
    });

    return response.text?.trim() || "";
  } catch (e) {
    console.error("Visual Search Error:", e);
    return "";
  }
}
