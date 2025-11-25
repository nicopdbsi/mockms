interface ParsedRecipe {
  name: string;
  description: string;
  ingredients: Array<{ name: string; quantity: string; unit: string }>;
  procedures: string;
}

export async function parseRecipePDF(fileBuffer: Buffer): Promise<ParsedRecipe> {
  try {
    const { createRequire } = await import("module");
    const require = createRequire(import.meta.url);
    const pdfParse = require("pdf-parse");
    
    const pdf = await pdfParse(fileBuffer);
    const text = pdf.text || "";

    const lines = text
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line && line.length > 0);

    if (lines.length === 0) {
      return {
        name: "Recipe from PDF",
        description: "Please fill in the description",
        ingredients: [],
        procedures: "Please add the procedure steps",
      };
    }

    const name = lines[0] || "Recipe from PDF";
    let description = "";
    let ingredientsStart = -1;
    let proceduresStart = -1;

    for (let i = 1; i < Math.min(lines.length, 20); i++) {
      const line = lines[i].toLowerCase();
      if (
        line.includes("ingredient") ||
        line.includes("what you need") ||
        line.includes("ingredients:")
      ) {
        ingredientsStart = i + 1;
        description = lines.slice(1, i).join(" ");
        break;
      }
    }

    if (ingredientsStart === -1) {
      description = lines.slice(1, Math.min(6, lines.length)).join(" ");
      ingredientsStart = Math.min(6, lines.length);
    }

    const ingredients: Array<{ name: string; quantity: string; unit: string }> =
      [];
    if (ingredientsStart > 0 && ingredientsStart < lines.length) {
      for (let i = ingredientsStart; i < Math.min(ingredientsStart + 20, lines.length); i++) {
        const line = lines[i].toLowerCase();
        if (
          line.includes("instruction") ||
          line.includes("procedure") ||
          line.includes("method") ||
          line.includes("direction") ||
          line.includes("step")
        ) {
          proceduresStart = i + 1;
          break;
        }

        const trimmedLine = lines[i];
        if (trimmedLine.toLowerCase().includes("ingredient") || trimmedLine.length < 2) {
          continue;
        }

        const parts = trimmedLine.split(/\s+/);
        if (parts.length >= 2) {
          const quantity = parts[0];
          const unit = parts[1];
          const ingName = parts.slice(2).join(" ");
          if (ingName && !isNaN(Number(quantity))) {
            ingredients.push({
              name: ingName,
              quantity,
              unit: unit || "g",
            });
          }
        }
      }
    }

    let procedures = "";
    if (proceduresStart > 0 && proceduresStart < lines.length) {
      procedures = lines.slice(proceduresStart, Math.min(proceduresStart + 30, lines.length)).join("\n");
    }

    return {
      name: name.substring(0, 100),
      description: description.substring(0, 500) || "Please fill in the description",
      ingredients: ingredients.slice(0, 50),
      procedures: procedures.substring(0, 2000) || "Please add the procedure steps",
    };
  } catch (error: any) {
    return {
      name: "Recipe from PDF",
      description: "Unable to extract text from PDF. Please fill in the details manually.",
      ingredients: [],
      procedures: "Please add the procedure steps",
    };
  }
}
