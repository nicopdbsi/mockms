import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ParsedRecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

interface ParsedRecipe {
  name: string;
  description?: string;
  ingredients: ParsedRecipeIngredient[];
  procedures?: string;
}

interface RecipeUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecipeExtracted: (recipe: ParsedRecipe) => void;
}

export function RecipeUploadDialog({
  open,
  onOpenChange,
  onRecipeExtracted,
}: RecipeUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
      if (!validTypes.includes(selectedFile.type)) {
        setError("Please upload a PNG, JPG, or PDF file");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      setError("");
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/recipes/parse-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to parse recipe");
      }

      const recipe = await response.json() as ParsedRecipe;
      
      toast({
        title: "Recipe imported successfully",
        description: `Extracted ${recipe.ingredients.length} ingredients from ${recipe.name}`,
      });

      onRecipeExtracted(recipe);
      setFile(null);
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload and parse recipe";
      setError(message);
      toast({
        title: "Upload failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Recipe from Image or PDF</DialogTitle>
          <DialogDescription>
            Upload a recipe card, photo, or PDF document to automatically extract recipe details and ingredients.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-accent/50 transition-colors">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".png,.jpg,.jpeg,.pdf"
              className="hidden"
              id="recipe-file-input"
              disabled={loading}
            />
            <label htmlFor="recipe-file-input" className="cursor-pointer">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">
                {file ? file.name : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, or PDF (max 10MB)
              </p>
            </label>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <p className="text-xs text-muted-foreground text-center mt-4">
                Analyzing recipe... This may take a moment
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setFile(null);
              setError("");
              onOpenChange(false);
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || loading} data-testid="button-upload-recipe">
            {loading ? "Processing..." : "Upload & Extract"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
