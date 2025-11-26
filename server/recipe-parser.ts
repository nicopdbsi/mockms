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

export interface ParsedRecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface ParsedRecipe {
  name: string;
  description?: string;
  ingredients: ParsedRecipeIngredient[];
  procedures?: string;
}

const recipeSystemPrompt = `You are a recipe extraction specialist. Analyze recipe images or documents and extract structured recipe data.

Return a JSON object with this exact structure:
{
  "name": "Recipe name",
  "description": "Brief description if available",
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": 100,
      "unit": "g, ml, tsp, tbsp, cup, pcs, etc."
    }
  ],
  "procedures": "Step-by-step instructions if available"
}

IMPORTANT RULES:
- quantity MUST be a NUMBER (e.g., 100, 2.5, 0.5), not a string
- unit should be standardized: g, kg, ml, L, tsp, tbsp, cup, pcs, box, pack, etc.
- If quantity is unclear, default to 1
- If unit is unclear, default to "g" for solids and "ml" for liquids
- Extract ALL ingredients from the recipe
- Clean ingredient names (remove extra descriptions like "finely chopped", "melted", etc.)
- Include procedures/instructions if visible`;

export async function parseRecipeImage(base64Image: string, mimeType: string): Promise<ParsedRecipe> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content: recipeSystemPrompt
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
            text: "Extract the recipe from this image. Include the recipe name, all ingredients with quantities and units, and procedures if visible. Return numeric values for quantities."
          }
        ]
      }
    ]
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Failed to parse recipe - no response from AI");
  }

  try {
    const parsed = JSON.parse(content);
    return normalizeRecipeData(parsed);
  } catch {
    throw new Error("Failed to parse recipe - invalid JSON response");
  }
}

export async function parseRecipePDF(pdfBuffer: Buffer): Promise<ParsedRecipe> {
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
        content: recipeSystemPrompt
      },
      {
        role: "user",
        content: `Extract the recipe from this PDF text. Include the recipe name, all ingredients with quantities and units, and procedures if visible. Return numeric values for quantities.\n\n${textContent}`
      }
    ]
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Failed to parse recipe PDF - no response from AI");
  }

  try {
    const parsed = JSON.parse(content);
    return normalizeRecipeData(parsed);
  } catch {
    throw new Error("Failed to parse recipe PDF - invalid JSON response");
  }
}

function normalizeRecipeData(data: any): ParsedRecipe {
  const result: ParsedRecipe = {
    name: String(data.name || "Imported Recipe").trim(),
    ingredients: [],
  };

  if (data.description) {
    result.description = String(data.description).trim();
  }

  if (data.procedures) {
    result.procedures = String(data.procedures).trim();
  }

  if (Array.isArray(data.ingredients)) {
    result.ingredients = data.ingredients.map((item: any) => ({
      name: String(item.name || "Unknown Ingredient").trim(),
      quantity: parseNumericValue(item.quantity) || 1,
      unit: String(item.unit || "g").trim(),
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
