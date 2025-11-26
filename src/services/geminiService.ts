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
    category: { 
      type: "STRING", 
      description: "Category of invoice: Materials, Supplies, Services, Maintenance, Taxes, or Other" 
    },
    suggestedCompanyType: {
      type: "STRING",
      description: "Suggested company type based on invoice content: restaurant, warehouse, transport, retail, services, or other"
    },
    detectedUnits: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "List of detected unit types in the invoice (e.g., kg, liters, units)"
    }
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
            text: `You are an advanced AI invoice analyzer for multiple business types (restaurants, warehouses, retail, transport, services, etc.).

TASK: Extract ALL data from this invoice with high precision.

INSTRUCTIONS:
1. **Vendor Analysis**: Identify vendor name. Check if it's a well-known company and use canonical spelling.
2. **Company Type Detection**: Based on items and vendor, suggest the most likely business type that would receive this invoice:
   - "restaurant": Food, beverages, kitchen supplies
   - "warehouse": Bulk goods, storage materials, pallets
   - "transport": Fuel, maintenance, vehicle parts
   - "retail": Products for resale, display materials
   - "services": Tools, equipment, professional services
   - "other": Mixed or unclear
3. **Item Parsing**: For each item:
   - Extract description with semantic understanding (e.g., "Coca-Cola 2L" → standardize)
   - Detect quantity AND unit type (kg, g, L, mL, units, boxes, etc.)
   - Normalize units to standard format (e.g., "un" → "units", "kilo" → "kg")
   - Extract unit price and calcul total precisely
4. **Category Assignment**: Assign overall category based on dominant item types
5. **Tax Detection**: Identify VAT/IVA percentage if shown (commonly 19%, 21%, etc.)
6. **Date Format**: ALWAYS use YYYY-MM-DD format
7. **Missing Data**: If any field is unclear, make best intelligent guess based on context. Do NOT leave fields empty.

Return structured JSON matching the schema.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: invoiceSchema,
        systemInstruction: `You are FacturaAI, an expert multi-industry invoice analysis system with advanced semantic understanding. 
You excel at:
- Recognizing vendor names across all industries
- Understanding product taxonomies (food, materials, services, etc.)
- Detecting business contexts from invoice patterns
- Normalizing units and measurements
- Making intelligent inferences when data is partial or unclear

Use your knowledge of:
- Common vendor names and their variations
- Product categories across industries
- Standard units of measurement
- Tax rates in different regions
- Invoice formats and layouts`,
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
