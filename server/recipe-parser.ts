interface ParsedRecipe {
  name: string;
  description: string;
  ingredients: Array<{ name: string; quantity: string; unit: string }>;
  procedures: string;
}

export async function parseRecipePDF(fileBuffer: Buffer): Promise<ParsedRecipe> {
  try {
    const pdfParse = require("pdf-parse");
    const pdf = await pdfParse(fileBuffer);
    const text = pdf.text || "";

    const lines = text
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line && line.length > 0);

    if (lines.length === 0) {
      throw new Error("PDF appears to be empty or unreadable");
    }

    // Extract recipe name from first non-empty line
    const name = lines[0] || "Uploaded Recipe";

    // Extract description and find where ingredients section starts
    let description = "";
    let ingredientsStart = -1;
    let proceduresStart = -1;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (
        line.includes("ingredient") ||
        line.includes("what") ||
        line.includes("you need")
      ) {
        ingredientsStart = i + 1;
        description = lines.slice(1, i).join(" ");
        break;
      }
    }

    // If no ingredients section found, use lines 1-5 as description
    if (ingredientsStart === -1) {
      description = lines.slice(1, Math.min(6, lines.length)).join(" ");
      ingredientsStart = Math.min(6, lines.length);
    }

    // Extract ingredients
    const ingredients: Array<{ name: string; quantity: string; unit: string }> =
      [];
    if (ingredientsStart > 0 && ingredientsStart < lines.length) {
      for (let i = ingredientsStart; i < lines.length; i++) {
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
        // Skip headers
        if (
          trimmedLine.toLowerCase().includes("ingredient") ||
          trimmedLine.length < 2
        ) {
          continue;
        }

        // Try to parse ingredient line (e.g., "2 cups flour" or "1 tbsp sugar")
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

    // Extract procedures
    let procedures = "";
    if (proceduresStart > 0 && proceduresStart < lines.length) {
      procedures = lines.slice(proceduresStart).join("\n");
    }

    return {
      name: name.substring(0, 100),
      description: description.substring(0, 500),
      ingredients: ingredients.slice(0, 50),
      procedures: procedures.substring(0, 2000),
    };
  } catch (error: any) {
    throw new Error(
      `PDF parsing failed: ${error.message || "Unknown error occurred"}`
    );
  }
}
