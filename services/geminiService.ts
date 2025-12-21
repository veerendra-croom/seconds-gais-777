
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini with API key from environment variable as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanJSON = (text: string) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    return jsonMatch ? jsonMatch[0] : text;
  } catch (e) {
    return text;
  }
};

export const generateItemDescription = async (title: string, category: string, condition: string, details: string): Promise<string> => {
  try {
    // Basic text tasks use gemini-3-flash-preview
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a catchy, student-focused marketplace description for: ${title} (${category}, ${condition}). Extra info: ${details}. Max 80 words.`,
    });
    return response.text || "";
  } catch (error) {
    return "";
  }
};

export const suggestPrice = async (itemTitle: string): Promise<string> => {
   try {
    // Price suggestion requires up-to-date info, using googleSearch tool
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Price for used "${itemTitle}" in USD for student-to-student sale. Return ONLY the number.`,
      config: { tools: [{ googleSearch: {} }] }
    });
    const match = response.text?.match(/\d+/);
    return match ? match[0] : "";
   } catch (e) {
     return "";
   }
}

export const parseSearchQuery = async (query: string): Promise<any> => {
  try {
    // Basic text parsing
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Parse query: "${query}" into JSON filters: {searchQuery, minPrice, maxPrice, category, sortBy}. Categories: [Electronics, Books, Furniture, Clothing, Services, Vehicles, Other]. SortBy: [PRICE_ASC, PRICE_DESC, NEWEST].`
    });
    const cleaned = cleanJSON(response.text || "{}");
    return JSON.parse(cleaned);
  } catch (e) {
    return null;
  }
}

export const checkImageSafety = async (file: File): Promise<boolean> => {
  try {
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    // Image analysis tasks use gemini-2.5-flash-image
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64Data } },
          { text: "Is this image safe for a public student marketplace? (No weapons/drugs/explicit). Return YES or NO." }
        ]
      }
    });
    return (response.text || "").toUpperCase().includes("YES");
  } catch (e) {
    return true; 
  }
}

export const analyzeImageForListing = async (file: File): Promise<any> => {
  try {
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });

    // Using responseSchema for reliable structured JSON
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64Data } },
          { text: "Analyze this image for a marketplace listing. Generate a complete, attractive, and accurate student-to-student listing. Price should be in USD." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A catchy 4-7 word title for the item." },
            category: { type: Type.STRING, description: "Must be one of: Electronics, Books, Furniture, Clothing, Services, Vehicles, Other." },
            price: { type: Type.NUMBER, description: "Estimated realistic student resale price in USD." },
            description: { type: Type.STRING, description: "A detailed 2-3 sentence description emphasizing student benefits." },
            condition: { type: Type.STRING, description: "One of: New, Like New, Good, Fair, Poor." },
            tags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "3-5 relevant hashtags or keywords (e.g., #Apple, #StudyEssential)." 
            }
          },
          required: ["title", "category", "price", "description", "condition", "tags"]
        }
      }
    });
    
    const cleaned = cleanJSON(response.text || "{}");
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("AI Analysis Error:", e);
    return null;
  }
}

export const analyzeImageForSearch = async (file: File): Promise<string> => {
  try {
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64Data } },
          { text: "What is this item? Give me a 2-3 word search query for a marketplace. Return ONLY the search terms." }
        ]
      }
    });
    return response.text?.trim() || "";
  } catch (e) {
    return "";
  }
}

export const generateSmartReplies = async (lastMessages: { sender: 'ME' | 'THEM', content: string }[], itemContext?: string): Promise<string[]> => {
  try {
    const contextStr = lastMessages.map(m => `${m.sender}: ${m.content}`).join('\n');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate 3 smart replies for "ME" based on: ${contextStr}. Context: ${itemContext}. Return replies separated by |.`
    });
    return (response.text || "").split('|').map(s => s.trim()).filter(s => s.length > 0).slice(0, 3);
  } catch (e) {
    return [];
  }
};

export const analyzePrice = async (title: string, price: number): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze used price for "${title}" at $${price}. Return JSON: {verdict, estimatedRange, reason}.`,
      config: { tools: [{ googleSearch: {} }] }
    });
    const cleaned = cleanJSON(response.text || "{}");
    return JSON.parse(cleaned);
  } catch (e) {
    return null;
  }
};

export const getSafeMeetingSpots = async (collegeName: string): Promise<any[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify 3 safe public meeting spots at ${collegeName}. Return JSON array: [{name, type}].`
    });
    const cleaned = cleanJSON(response.text || "[]");
    const spots = JSON.parse(cleaned);
    return Array.isArray(spots) ? spots.map((s, i) => ({ id: i+1, ...s })) : [];
  } catch (e) {
    return [];
  }
};

export const analyzeSustainability = async (itemTitle: string, category: string): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Environmental savings for used "${itemTitle}". JSON: {co2Saved, waterSaved, fact}.`
    });
    const cleaned = cleanJSON(response.text || "{}");
    return JSON.parse(cleaned);
  } catch (e) {
    return null;
  }
};

export const generateSellerTips = async (itemTitles: string[]): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `3 selling tips for: ${itemTitles.join(', ')}. Return JSON string array.`
    });
    const cleaned = cleanJSON(response.text || "[]");
    return JSON.parse(cleaned);
  } catch (e) {
    return [];
  }
};
