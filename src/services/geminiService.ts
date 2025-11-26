import { GoogleGenAI } from "@google/genai";
import { Invoice } from "../Resto/types";

// Use Vite env var
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Define the expected schema for the model output
const invoiceSchema = {
  type: "OBJECT",
  properties: {
    vendorName: { type: "STRING", description: "Name of the vendor or supplier issued the invoice" },
    date: { type: "STRING", description: "Date of the invoice in YYYY-MM-DD format" },
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          description: { type: "STRING" },
          quantity: { type: "NUMBER" },
          unitPrice: { type: "NUMBER" },
          total: { type: "NUMBER" },
        },
        required: ["description", "quantity", "unitPrice", "total"]
      },
    },
    subtotal: { type: "NUMBER" },
    tax: { type: "NUMBER" },
    total: { type: "NUMBER" },
  },
  required: ["vendorName", "date", "items", "total"],
};

export const extractInvoiceData = async (imageBase64: string, mimeType: string): Promise<Partial<Invoice>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: imageBase64,
            },
          },
          {
            text: "Extract data from this invoice. If a field is missing, estimate it or put 0. Format date as YYYY-MM-DD.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: invoiceSchema,
        systemInstruction: "You are an expert OCR assistant specialized in extracting structured data from invoices.",
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return data;
    }
    throw new Error("No data extracted");
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
};
