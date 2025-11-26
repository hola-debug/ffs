import { GoogleGenAI } from "@google/genai";
import { InvoiceItemDB } from "./invoiceService";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export interface MatchSuggestion {
  existingItem: InvoiceItemDB;
  confidence: number;
  reasons: string[];
}

/**
 * AI-Powered Item Matching Service
 * Uses semantic analysis to match new invoice items with existing items in the database
 */
export const aiMatchingService = {
  /**
   * Find similar items using AI semantic matching
   * @param newItemDescription - Description of the new item from invoice
   * @param existingItems - Array of existing items in database
   * @param vendorName - Optional vendor name for better matching
   * @returns Array of match suggestions sorted by confidence
   */
  async findSimilarInvoiceItems(
    newItemDescription: string,
    existingItems: InvoiceItemDB[],
    vendorName?: string
  ): Promise<MatchSuggestion[]> {
    if (existingItems.length === 0) {
      return [];
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: {
          parts: [{
            text: `You are an expert item matching system. Analyze semantic similarity between a new invoice item and existing database items.

NEW ITEM TO MATCH:
Description: "${newItemDescription}"
${vendorName ? `Vendor: "${vendorName}"` : ''}

EXISTING ITEMS IN DATABASE:
${existingItems.map((item, idx) => `
${idx + 1}. "${item.item_name}"
   - Current Stock: ${item.current_stock} ${item.unit_type}
   - Unit Price: $${item.unit_price}
   - Status: ${item.stock_status}
`).join('\n')}

TASK: For each existing item, determine if it's a match for the new item. Consider:
1. **Semantic Similarity**: Are they the same product, even with different wording?
   Example: "Coca Cola 2L" matches "Coca-Cola 2 Litros"
2. **Unit Equivalence**: Same product but different units?
   Example: "Sugar 1kg" matches "Azúcar 1000g"
3. **Brand Variations**: Same product, different brand variations?
   Example: "Pepsi Cola" vs "PepsiCola"

For each item, rate confidence from 0-100 and provide specific reasons.
Only include matches with confidence >= 60.

Respond in JSON format:
{
  "matches": [
    {
      "itemIndex": 0,
      "confidence": 85,
      "reasons": ["Same product", "Similar unit size", "Price within expected range"]
    }
  ]
}`,
          }],
        },
        config: {
          responseMimeType: "application/json",
          temperature: 0.3, // Lower temperature for more consistent matching
        },
      });

      if (!response.text) {
        return [];
      }

      const result = JSON.parse(response.text);
      const suggestions: MatchSuggestion[] = [];

      if (result.matches && Array.isArray(result.matches)) {
        for (const match of result.matches) {
          if (match.itemIndex >= 0 && match.itemIndex < existingItems.length) {
            suggestions.push({
              existingItem: existingItems[match.itemIndex],
              confidence: match.confidence / 100, // Normalize to 0-1
              reasons: match.reasons || []
            });
          }
        }
      }

      // Sort by confidence descending
      return suggestions.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      console.error("AI Matching Error:", error);
      // Fallback to simple string matching
      return this.fallbackStringMatching(newItemDescription, existingItems);
    }
  },

  /**
   * Suggest matches for all items in an invoice
   * @param invoiceItems - Items from the invoice
   * @param existingDatabase - All existing items in database
   * @param vendorName - Vendor name for context
   * @returns Map of item description to match suggestions
   */
  async suggestMatches(
    invoiceItems: Array<{ description: string }>,
    existingDatabase: InvoiceItemDB[],
    vendorName?: string
  ): Promise<Map<string, MatchSuggestion[]>> {
    const matchesMap = new Map<string, MatchSuggestion[]>();

    for (const item of invoiceItems) {
      const suggestions = await this.findSimilarInvoiceItems(
        item.description,
        existingDatabase,
        vendorName
      );
      matchesMap.set(item.description, suggestions);
    }

    return matchesMap;
  },

  /**
   * Fallback string matching when AI fails
   * Uses simple Levenshtein distance and keyword matching
   */
  fallbackStringMatching(
    newItemDescription: string,
    existingItems: InvoiceItemDB[]
  ): MatchSuggestion[] {
    const suggestions: MatchSuggestion[] = [];
    const newItemLower = newItemDescription.toLowerCase();

    for (const existingItem of existingItems) {
      const existingLower = existingItem.item_name.toLowerCase();
      
      // Exact match
      if (newItemLower === existingLower) {
        suggestions.push({
          existingItem,
          confidence: 1.0,
          reasons: ['Exact match']
        });
        continue;
      }

      // Contains check
      if (newItemLower.includes(existingLower) || existingLower.includes(newItemLower)) {
        suggestions.push({
          existingItem,
          confidence: 0.8,
          reasons: ['Partial match - contains']
        });
        continue;
      }

      // Word overlap
      const newWords = newItemLower.split(/\s+/);
      const existingWords = existingLower.split(/\s+/);
      const commonWords = newWords.filter(word => existingWords.includes(word));
      
      if (commonWords.length >= 2) {
        suggestions.push({
          existingItem,
          confidence: 0.6 + (commonWords.length * 0.1),
          reasons: [`${commonWords.length} matching keywords`]
        });
      }
    }

    return suggestions
      .filter(s => s.confidence >= 0.6)
      .sort((a, b) => b.confidence - a.confidence);
  },

  /**
   * Calculate price deviation for validation
   * Useful to warn if matched item has significantly different price
   */
  calculatePriceDeviation(
    newPrice: number,
    existingPrice: number
  ): { deviation: number; withinNormalRange: boolean } {
    const deviation = Math.abs((newPrice - existingPrice) / existingPrice);
    const withinNormalRange = deviation <= 0.2; // 20% tolerance
    
    return { deviation, withinNormalRange };
  }
};
