
import { GoogleGenAI } from "@google/genai";
import { Product, Sale } from "../types";

const getSystemPrompt = (context: string) => `
You are an expert AI Business Consultant for "AR Printers", a printing and merchandise shop.
Your goal is to analyze data and provide actionable, concise, and professional advice.
The currency used is Sri Lankan Rupees (Rs.).
Current Business Context: ${context}
`;

export const analyzeBusinessData = async (
  sales: Sale[],
  products: Product[],
  query: string
): Promise<string> => {
  try {
    // Initializing Gemini API using the recommended named parameter and model gemini-3-flash-preview
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    // Prepare data summary to reduce token usage
    const lowStockItems = products.filter(p => p.stock <= p.minStockLevel).map(p => p.name);
    const totalRevenue = sales.reduce((acc, curr) => acc + curr.total, 0);
    const recentSales = sales.slice(-10).map(s => `${s.date.split('T')[0]}: Rs. ${s.total} (${s.items.length} items)`).join('\n');
    
    const dataContext = `
      Total Products: ${products.length}
      Low Stock Items: ${lowStockItems.join(', ') || 'None'}
      Total Revenue: Rs. ${totalRevenue.toFixed(2)}
      Total Sales Count: ${sales.length}
      Recent Transactions Sample:
      ${recentSales}
    `;

    // Using gemini-3-flash-preview for text analysis as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Data Context: ${dataContext}\n\nUser Question: ${query}`,
      config: {
        systemInstruction: getSystemPrompt('Analyzing POS Data'),
      }
    });

    return response.text || "I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error while communicating with the AI service.";
  }
};

export const generateMarketingCopy = async (productName: string): Promise<string> => {
  try {
    // Initializing Gemini API using the recommended named parameter
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    // Using gemini-3-flash-preview for creative copy generation
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a catchy social media post for our product: "${productName}". Keep it under 50 words. Use emojis.`,
      config: {
        systemInstruction: "You are a creative marketing assistant for a print shop.",
      }
    });

    return response.text || "No copy generated.";
  } catch (error) {
    console.error(error);
    return "Error generating copy.";
  }
};
