import { GoogleGenAI, Type } from "@google/genai";
import { Invoice, InvoiceItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define the expected schema for the model output
const invoiceSchema = {
  type: Type.OBJECT,
  properties: {
    vendorName: { type: Type.STRING, description: "Name of the vendor or supplier issued the invoice" },
    date: { type: Type.STRING, description: "Date of the invoice in YYYY-MM-DD format" },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          unitPrice: { type: Type.NUMBER },
          total: { type: Type.NUMBER },
        },
        required: ["description", "quantity", "unitPrice", "total"]
      },
    },
    subtotal: { type: Type.NUMBER },
    tax: { type: Type.NUMBER },
    total: { type: Type.NUMBER },
  },
  required: ["vendorName", "date", "items", "total"],
};

export const extractInvoiceData = async (imageBase64: string, mimeType: string): Promise<Partial<Invoice>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
      // Ensure we define ID and Status locally later, just return extracted fields
      return data;
    }
    throw new Error("No data extracted");
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
};
