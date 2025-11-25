import OpenAI from "openai";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParseModule = require("pdf-parse");
const pdfParse = pdfParseModule.default || pdfParseModule;

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export interface ParsedReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  category?: string;
  type: "ingredient" | "material";
}

export interface ParsedReceipt {
  supplier?: {
    name: string;
    phone?: string;
    email?: string;
  };
  items: ParsedReceiptItem[];
  totalAmount?: number;
  date?: string;
}

const systemPrompt = `You are a receipt/invoice parser for a kitchen management system. Analyze the input and extract structured data.

For each item, determine if it's an "ingredient" (food items used in recipes) or "material" (packaging, equipment, supplies).

Common ingredient categories: Produce, Meat & Poultry, Seafood, Dairy, Grains & Flour, Spices & Seasonings, Oils & Fats, Sweeteners, Baking, Canned Goods, Frozen, Other
Common material categories: Packaging, Equipment, Utensils, Containers, Labels, Cleaning Supplies, Other

IMPORTANT: Return ONLY numeric values for quantity, price, and totalAmount. Do NOT include currency symbols or text.

Return a JSON object with this exact structure:
{
  "supplier": {
    "name": "store/vendor name if visible",
    "phone": "phone number if visible",
    "email": "email if visible"
  },
  "items": [
    {
      "name": "item name (clean, without quantity/price info)",
      "quantity": 1,
      "unit": "g, kg, ml, L, pcs, box, pack, etc.",
      "price": 10.50,
      "category": "suggested category from the lists above",
      "type": "ingredient"
    }
  ],
  "totalAmount": 100.50,
  "date": "receipt date if visible in YYYY-MM-DD format"
}

Rules:
- quantity must be a NUMBER (e.g., 1, 2.5, 1000), not a string
- price must be a NUMBER (e.g., 10.50), without currency symbols
- totalAmount must be a NUMBER, without currency symbols
- If quantity is unclear, default to 1
- If unit is unclear, default to "pcs" for materials and "g" for ingredients
- Always try to extract useful data even from unclear receipts`;

export async function parseReceiptImage(base64Image: string, mimeType: string): Promise<ParsedReceipt> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`
            }
          },
          {
            type: "text",
            text: "Parse this receipt/invoice image and extract all items with their prices, quantities, and categories. Return numeric values for quantity and price fields."
          }
        ]
      }
    ]
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Failed to parse receipt - no response from AI");
  }

  try {
    const parsed = JSON.parse(content);
    return normalizeReceiptData(parsed);
  } catch {
    throw new Error("Failed to parse receipt - invalid JSON response");
  }
}

export async function parseReceiptPDF(pdfBuffer: Buffer): Promise<ParsedReceipt> {
  const data = await pdfParse(pdfBuffer);
  const textContent = data.text;

  if (!textContent || textContent.trim().length === 0) {
    throw new Error("Could not extract text from PDF. The PDF may be image-based - please convert to an image format.");
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: `Parse this receipt/invoice text extracted from a PDF and extract all items with their prices, quantities, and categories. Return numeric values for quantity and price fields.\n\n${textContent}`
      }
    ]
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Failed to parse PDF receipt - no response from AI");
  }

  try {
    const parsed = JSON.parse(content);
    return normalizeReceiptData(parsed);
  } catch {
    throw new Error("Failed to parse PDF receipt - invalid JSON response");
  }
}

export async function parseReceiptCSV(csvContent: string): Promise<ParsedReceipt> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    max_completion_tokens: 16000,
    messages: [
      {
        role: "system",
        content: systemPrompt + `\n\nIMPORTANT: This is a CSV file. You MUST extract and return ALL items from the CSV, even if there are many (50, 100, or more items). Do not skip or truncate items. Parse every single row in the CSV.`
      },
      {
        role: "user",
        content: `Parse this CSV data and extract ALL items. There may be many items - make sure to include every single one. Return numeric values for quantity and price fields.\n\n${csvContent}`
      }
    ]
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Failed to parse CSV - no response from AI");
  }

  try {
    const parsed = JSON.parse(content);
    return normalizeReceiptData(parsed);
  } catch {
    throw new Error("Failed to parse CSV - invalid JSON response");
  }
}

function normalizeReceiptData(data: any): ParsedReceipt {
  const result: ParsedReceipt = {
    items: [],
  };

  if (data.supplier && data.supplier.name) {
    result.supplier = {
      name: String(data.supplier.name).trim(),
      phone: data.supplier.phone ? String(data.supplier.phone).trim() : undefined,
      email: data.supplier.email ? String(data.supplier.email).trim() : undefined,
    };
  }

  if (data.totalAmount !== undefined && data.totalAmount !== null) {
    result.totalAmount = parseNumericValue(data.totalAmount);
  }

  if (data.date) {
    result.date = String(data.date);
  }

  if (Array.isArray(data.items)) {
    result.items = data.items.map((item: any) => ({
      name: String(item.name || "Unknown Item").trim(),
      quantity: parseNumericValue(item.quantity) || 1,
      unit: String(item.unit || "pcs").trim(),
      price: parseNumericValue(item.price) || 0,
      category: item.category ? String(item.category).trim() : undefined,
      type: item.type === "material" ? "material" : "ingredient",
    }));
  }

  return result;
}

function parseNumericValue(value: any): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}
