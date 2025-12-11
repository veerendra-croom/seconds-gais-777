
import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client
// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

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

    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Return empty string on failure to let user fill manually
    return "";
  }
};

/**
 * Suggests a price based on real-time market data using Search Grounding.
 */
export const suggestPrice = async (itemTitle: string): Promise<string> => {
   try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find the current used market price for "${itemTitle}" in USD. Return ONLY a single number representing a fair selling price for a quick student-to-student sale (e.g. 45). Do not output text.`,
      config: {
        tools: [{ googleSearch: {} }], // Use Search Grounding for accuracy
      }
    });
    
    // Extract number from potentially chatty response
    const text = response.text || "";
    const match = text.match(/\d+/);
    return match ? match[0] : "";
   } catch (e) {
     return "";
   }
}

/**
 * Parses natural language search queries into structured filters.
 */
export const parseSearchQuery = async (query: string): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Parse this search query: "${query}" into structured filters for a marketplace API.
        
        Return JSON object with optional fields:
        - searchQuery: The main keyword (string)
        - minPrice: number
        - maxPrice: number
        - category: One of [Electronics, Books, Furniture, Clothing, Services, Vehicles, Other] (string)
        - sortBy: One of [PRICE_ASC, PRICE_DESC, NEWEST] (string)
        
        Example: "cheap bike under 100" -> {"searchQuery": "bike", "maxPrice": 100, "sortBy": "PRICE_ASC", "category": "Vehicles"}
        Example: "math tutor" -> {"searchQuery": "math tutor", "category": "Services"}
        
        Return ONLY the raw JSON.
      `
    });

    const text = response.text?.trim() || "{}";
    const cleanText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Smart Search Error", e);
    return null;
  }
}

/**
 * Checks image safety before upload.
 */
export const checkImageSafety = async (file: File): Promise<boolean> => {
  try {
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64Data } },
          { text: "Is this image appropriate for a general public marketplace? Return YES or NO." }
        ]
      }
    });

    const text = response.text?.trim().toUpperCase() || "YES";
    return !text.includes("NO");
  } catch (e) {
    // If API fails, default to allowing upload but logging error (fail open for UX in this specific demo context, 
    // but typically would fail closed in strict environments)
    console.warn("Safety check failed, skipping", e);
    return true; 
  }
}

/**
 * Visual Search: Analyzes an image to generate a search query.
 */
export const analyzeImageForSearch = async (file: File): Promise<string> => {
  try {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
    const base64String = base64Data.split(',')[1];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64String } },
          { text: "Identify the main item in this picture. Return ONLY the product name or category (e.g. 'Graphing Calculator'). Keep it under 4 words." }
        ]
      }
    });

    return response.text?.trim() || "";
  } catch (e) {
    console.error("Visual Search Error:", e);
    return "";
  }
}

/**
 * Visual Listing: Analyzes an image to auto-fill listing details.
 */
export const analyzeImageForListing = async (file: File): Promise<any> => {
  try {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
    const base64String = base64Data.split(',')[1];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64String } },
          { 
            text: `
              Analyze this image for a student marketplace listing. 
              Identify the item and provide details.
              
              Return a JSON object with the following fields:
              - title: A short, catchy title (string)
              - category: One of [Electronics, Books, Furniture, Clothing, Services, Vehicles, Other] (string)
              - price: Estimated used market price in USD (number)
              - description: A persuasive 2-3 sentence description suitable for selling to students (string)
              - condition: One of [Like New, Good, Fair, Poor] (string)

              Return ONLY the raw JSON object. Do not wrap in markdown code blocks.
            ` 
          }
        ]
      }
    });

    const text = response.text?.trim() || "";
    const cleanText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Auto-fill listing error", e);
    return null;
  }
}

/**
 * Audio Listing: Analyzes voice input to auto-fill listing details.
 */
export const analyzeAudioForListing = async (audioBlob: Blob): Promise<any> => {
  try {
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve) => {
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
    });
    reader.readAsDataURL(audioBlob);
    const base64String = await base64Promise;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: audioBlob.type || 'audio/webm', data: base64String } },
          {
            text: `
              Listen to this student describing an item they want to sell or a service they offer.
              Extract the details into a JSON object:
              - title: Short item title (string)
              - category: One of [Electronics, Books, Furniture, Clothing, Services, Vehicles, Other] (string)
              - price: Numeric price in USD (number) (If not mentioned, estimate based on item type and used condition)
              - description: A persuasive sales description based on their speech (string)
              - condition: One of [Like New, Good, Fair, Poor] (string)
              - type: One of [SALE, RENT, SERVICE, REQUEST] (string) (Default to SALE if ambiguous)

              Return ONLY the raw JSON object. Do not wrap in markdown code blocks.
            `
          }
        ]
      }
    });

    const text = response.text?.trim() || "";
    const cleanText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Voice-to-listing error", e);
    return null;
  }
}

/**
 * Generates context-aware smart replies for chat.
 */
export const generateSmartReplies = async (
  lastMessages: { sender: 'ME' | 'THEM', content: string }[],
  itemContext?: string
): Promise<string[]> => {
  try {
    if (lastMessages.length === 0) return [];

    const contextStr = lastMessages.map(m => `${m.sender}: ${m.content}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        You are a smart assistant for a student marketplace chat.
        Context Item: ${itemContext || 'General Chat'}
        
        Recent Conversation:
        ${contextStr}
        
        Generate 3 short, polite, and relevant responses that "ME" could send next. 
        Keep them under 10 words. 
        Return ONLY the 3 responses separated by pipes (|).
        Example: Yes, it is available.|Would 2pm work?|I can meet at the library.
      `,
    });

    const text = response.text?.trim() || "";
    const replies = text.split('|').map(s => s.trim()).filter(s => s.length > 0);
    return replies.length >= 1 ? replies.slice(0, 3) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Analyzes market price for an item description using Search Grounding.
 */
export const analyzePrice = async (title: string, price: number): Promise<{ verdict: string, estimatedRange: string, reason: string, sources?: { title: string, uri: string }[] } | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Analyze the price of this used item: "${title}" listed for $${price}.
        Use Google Search to find current used prices on eBay, Mercari, or Amazon.
        
        Determine if it is a "Great Deal", "Fair Price", or "Overpriced".
        Provide a 1 sentence reason citing the typical market range found.
        
        Return JSON format:
        { "verdict": "Great Deal", "estimatedRange": "$10 - $15", "reason": "Cheaper than average eBay listing." }
      `,
      config: {
        tools: [{ googleSearch: {} }], // ENABLE GROUNDING
      }
    });

    const text = response.text?.trim();
    const jsonMatch = text?.match(/\{[\s\S]*\}/);
    let result = null;
    
    if (jsonMatch) {
      result = JSON.parse(jsonMatch[0]);
    }

    // Extract sources from Grounding Metadata
    if (result && response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
       const sources = response.candidates[0].groundingMetadata.groundingChunks
         .map((c: any) => c.web)
         .filter((w: any) => w && w.uri && w.title);
       
       if (sources.length > 0) {
         result.sources = sources;
       }
    }

    return result;
  } catch (e) {
    return null;
  }
};

/**
 * Identifies safe meeting spots on a specific college campus.
 */
export const getSafeMeetingSpots = async (collegeName: string): Promise<{ id: number, name: string, type: string }[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Identify 3-4 specific, well-known, safe, and public meeting spots on the campus of "${collegeName}".
        Focus on places like: Student Unions, Main Libraries, Campus Centers, or designated Safe Trade Zones.
        
        Return ONLY a raw JSON array with no markdown formatting.
        Example: [{"name": "Main Library Lobby", "type": "Public"}, {"name": "Student Center Info Desk", "type": "High Traffic"}]
      `
    });

    const text = response.text?.trim() || "";
    const cleanText = text.replace(/```json|```/g, '').trim();
    
    const spots = JSON.parse(cleanText);
    return spots.map((s: any, i: number) => ({ id: i + 1, name: s.name, type: s.type }));
  } catch (e) {
    console.error("Failed to get safe spots", e);
    return [];
  }
};

/**
 * Calculates sustainability impact of a used item.
 */
export const analyzeSustainability = async (itemTitle: string, category: string): Promise<{ co2Saved: string, waterSaved: string, fact: string } | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Estimate the environmental savings of buying a used "${itemTitle}" (${category}) instead of new.
        Return a JSON object with:
        - co2Saved: string (e.g. "12kg")
        - waterSaved: string (e.g. "500L")
        - fact: string (Short, 1-sentence fun fact about recycling this type of item)
        
        Return ONLY raw JSON.
      `
    });

    const text = response.text?.trim() || "{}";
    const cleanText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    return null;
  }
};

/**
 * Generates personalized selling tips for a user's inventory.
 */
export const generateSellerTips = async (itemTitles: string[]): Promise<string[]> => {
  try {
    if (itemTitles.length === 0) return [];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        I am selling these items on a college marketplace: ${itemTitles.join(', ')}.
        Give me 3 specific, short, actionable tips to sell these faster.
        Return ONLY a JSON array of strings.
        Example: ["Mention the textbook edition in the title", "Take a photo of the bike frame close-up"]
      `
    });

    const text = response.text?.trim() || "[]";
    const cleanText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    return [];
  }
};
