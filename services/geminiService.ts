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
    if (!process.env.API_KEY) return "N/A";

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

/**
 * Visual Listing: Analyzes an image to auto-fill listing details.
 */
export const analyzeImageForListing = async (file: File): Promise<any> => {
  try {
    if (!process.env.API_KEY) return null;

    // Convert file to base64
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
    if (!process.env.API_KEY) return null;

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
    if (!process.env.API_KEY || lastMessages.length === 0) {
      return ["Is this available?", "Interested!", "Can we meet?"];
    }

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
    return replies.length >= 1 ? replies.slice(0, 3) : ["Is this available?", "Interested!", "Can we meet?"];
  } catch (e) {
    return ["Is this available?", "Interested!", "Can we meet?"];
  }
};

/**
 * Analyzes market price for an item description.
 */
export const analyzePrice = async (title: string, price: number): Promise<{ verdict: string, estimatedRange: string, reason: string }> => {
  try {
    if (!process.env.API_KEY) return { verdict: 'Unknown', estimatedRange: '$-', reason: 'AI unavailable' };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Analyze the price of this used item: "${title}" listed for $${price}.
        Estimate the typical used market price range.
        Determine if it is a "Great Deal", "Fair Price", or "Overpriced".
        Provide a 1 sentence reason.
        
        Return JSON format:
        { "verdict": "Great Deal", "estimatedRange": "$10 - $15", "reason": "Typically sells for $20 used." }
      `
    });

    // Simple JSON extraction
    const text = response.text?.trim();
    const jsonMatch = text?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { verdict: 'Fair Price', estimatedRange: 'Unknown', reason: 'Could not analyze market data.' };
  } catch (e) {
    return { verdict: 'Unknown', estimatedRange: '$-', reason: 'Analysis failed.' };
  }
};

/**
 * Identifies safe meeting spots on a specific college campus.
 */
export const getSafeMeetingSpots = async (collegeName: string): Promise<{ id: number, name: string, type: string }[]> => {
  try {
    if (!process.env.API_KEY) {
      return [
        { id: 1, name: "Student Union (Lobby)", type: "Public" },
        { id: 2, name: "Main Library (Front Desk)", type: "Quiet" },
        { id: 3, name: "Campus Police Station", type: "Safe Zone" }
      ];
    }

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
    // Clean up markdown if present
    const cleanText = text.replace(/```json|```/g, '').trim();
    
    const spots = JSON.parse(cleanText);
    return spots.map((s: any, i: number) => ({ id: i + 1, name: s.name, type: s.type }));
  } catch (e) {
    console.error("Failed to get safe spots", e);
    return [
        { id: 1, name: "Student Union (Lobby)", type: "Public" },
        { id: 2, name: "Main Library (Front Desk)", type: "Quiet" },
        { id: 3, name: "Campus Police Station", type: "Safe Zone" }
    ];
  }
};