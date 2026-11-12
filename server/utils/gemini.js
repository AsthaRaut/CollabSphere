import { GoogleGenAI } from "@google/genai";

let client;

export const askGemini = async (prompt) => {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error("GEMINI_API_KEY is missing. Add it to server/.env");
    error.status = 500;
    throw error;
  }

  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await client.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: prompt
  });

  return response.text || "";
};
