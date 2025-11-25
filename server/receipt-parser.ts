import OpenAI from "openai";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export interface ParsedReceiptItem {
  name: string;
  quantity: string;
  unit: string;
  price: string;
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
  totalAmount?: string;
  date?: string;
}

export async function parseReceiptImage(base64Image: string, mimeType: string): Promise<ParsedReceipt> {
  // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content: `You are a receipt/invoice parser for a kitchen management system. Analyze the image and extract structured data.

For each item, determine if it's an "ingredient" (food items used in recipes) or "material" (packaging, equipment, supplies).

Common ingredient categories: Produce, Meat & Poultry, Seafood, Dairy, Grains & Flour, Spices & Seasonings, Oils & Fats, Sweeteners, Baking, Canned Goods, Frozen, Other
Common material categories: Packaging, Equipment, Utensils, Containers, Labels, Cleaning Supplies, Other

Return a JSON object with this structure:
{
  "supplier": {
    "name": "store/vendor name if visible",
    "phone": "phone number if visible",
    "email": "email if visible"
  },
  "items": [
    {
      "name": "item name",
      "quantity": "numeric quantity",
      "unit": "unit of measure (g, kg, ml, L, pcs, box, etc.)",
      "price": "price paid for this item",
      "category": "suggested category",
      "type": "ingredient or material"
    }
  ],
  "totalAmount": "total receipt amount if visible",
  "date": "receipt date if visible"
}

If information is not clear, make reasonable estimates. Prefer extracting as much useful data as possible.`
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
            text: "Parse this receipt/invoice and extract all items with their prices, quantities, and categories."
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
    return JSON.parse(content) as ParsedReceipt;
  } catch {
    throw new Error("Failed to parse receipt - invalid JSON response");
  }
}

export async function parseReceiptCSV(csvContent: string): Promise<ParsedReceipt> {
  // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
  const response = await openai.chat.completions.create({
    model: "gpt-5",
    response_format: { type: "json_object" },
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content: `You are a CSV data parser for a kitchen management system. Analyze the CSV data and extract structured item data.

For each item, determine if it's an "ingredient" (food items used in recipes) or "material" (packaging, equipment, supplies).

Common ingredient categories: Produce, Meat & Poultry, Seafood, Dairy, Grains & Flour, Spices & Seasonings, Oils & Fats, Sweeteners, Baking, Canned Goods, Frozen, Other
Common material categories: Packaging, Equipment, Utensils, Containers, Labels, Cleaning Supplies, Other

Return a JSON object with this structure:
{
  "supplier": {
    "name": "vendor name if present in data"
  },
  "items": [
    {
      "name": "item name",
      "quantity": "numeric quantity",
      "unit": "unit of measure (g, kg, ml, L, pcs, box, etc.)",
      "price": "price paid for this item",
      "category": "suggested category",
      "type": "ingredient or material"
    }
  ],
  "totalAmount": "total if present",
  "date": "date if present"
}

Parse the CSV intelligently - it may have headers or not. Extract as much useful data as possible.`
      },
      {
        role: "user",
        content: `Parse this CSV data and extract all items:\n\n${csvContent}`
      }
    ]
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Failed to parse CSV - no response from AI");
  }

  try {
    return JSON.parse(content) as ParsedReceipt;
  } catch {
    throw new Error("Failed to parse CSV - invalid JSON response");
  }
}
