import * as pdfParse from "pdf-parse";

interface ParsedRecipe {
  name: string;
  description: string;
  ingredients: Array<{ name: string; quantity: string; unit: string }>;
  procedures: string;
}

export async function parseRecipePDF(fileBuffer: Buffer): Promise<ParsedRecipe> {
  const pdf = await pdfParse(fileBuffer);
  const text = pdf.text;

  const lines = text.split("\n").map((line) => line.trim()).filter((line) => line);
  
  // Extract recipe name from first non-empty line
  const name = lines[0] || "Uploaded Recipe";

  // Extract description (next few lines after name)
  let description = "";
  let ingredientsStart = -1;
  let proceduresStart = -1;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes("ingredient") || line.includes("recipe")) {
      ingredientsStart = i + 1;
      description = lines.slice(1, i).join(" ");
      break;
    }
  }

  // Extract ingredients
  const ingredients: Array<{ name: string; quantity: string; unit: string }> = [];
  if (ingredientsStart > 0) {
    for (let i = ingredientsStart; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes("instruction") || line.includes("procedure") || line.includes("method") || line.includes("direction")) {
        proceduresStart = i + 1;
        break;
      }
      if (line.trim() && !line.includes("ingredient")) {
        const parts = lines[i].split(/[\s-]+/);
        if (parts.length >= 2) {
          const quantity = parts[0];
          const unit = parts[1];
          const ingName = parts.slice(2).join(" ");
          if (ingName) {
            ingredients.push({ name: ingName, quantity, unit: unit || "g" });
          }
        }
      }
    }
  }

  // Extract procedures
  let procedures = "";
  if (proceduresStart > 0) {
    procedures = lines.slice(proceduresStart).join("\n");
  }

  return {
    name,
    description,
    ingredients,
    procedures,
  };
}
