import OpenAI from "openai";
import { createRequire } from "module";
import { Buffer } from "node:buffer";
const require = createRequire(import.meta.url);
const pdfParseModule = require("pdf-parse");
const pdfParse = typeof pdfParseModule === "function" ? pdfParseModule : (pdfParseModule.default || pdfParseModule);

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

const recipeSystemPrompt = `You are an expert recipe extraction specialist. Your task is to carefully analyze recipe images, cards, or documents and extract ALL recipe information into structured JSON format.

CRITICAL: You MUST extract EVERY ingredient you see. Do not skip any ingredients.

Return ONLY valid JSON matching this structure exactly:
{
  "name": "Recipe Title",
  "description": "Brief description of the recipe",
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": 2,
      "unit": "cups"
    },
    {
      "name": "another ingredient",
      "quantity": 250,
      "unit": "g"
    }
  ],
  "procedures": "Instructions for preparing the recipe. Include all steps in order."
}

MANDATORY RULES - FOLLOW STRICTLY:
1. Extract EVERY visible ingredient - do not omit any
2. quantity field MUST ALWAYS be a NUMBER (examples: 1, 2.5, 0.75, 100) - NEVER text
3. unit field MUST be a STRING - standardize to: g, kg, ml, L, oz, lb, cup, tbsp, tsp, pcs, pieces, etc.
4. For missing quantity, default to 1
5. For missing unit, use "g" for solids, "ml" for liquids
6. Clean ingredient names: remove words like "finely chopped", "melted", "beaten", "sifted"
7. Include recipe title as "name"
8. Include full cooking procedures/instructions as a single combined string
9. Return ONLY the JSON object, no additional text
10. Do not hallucinate ingredients - only extract what you actually see

EXAMPLE OUTPUT:
{
  "name": "Chocolate Cake",
  "description": "A rich and moist chocolate dessert",
  "ingredients": [
    {"name": "flour", "quantity": 2, "unit": "cups"},
    {"name": "cocoa powder", "quantity": 0.75, "unit": "cup"},
    {"name": "eggs", "quantity": 3, "unit": "pcs"},
    {"name": "sugar", "quantity": 1.5, "unit": "cups"}
  ],
  "procedures": "Mix dry ingredients. Beat eggs and sugar. Combine. Bake at 350F for 30 minutes."
}`;

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
  try {
    if (typeof pdfParse !== "function") {
      throw new Error("PDF parser is not available - invalid module import");
    }
    
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
  } catch (error: any) {
    if (error.message.includes("is not a function")) {
      throw new Error("PDF parser module error - please try uploading an image instead");
    }
    throw error;
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
