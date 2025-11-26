import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Ingredient } from "@shared/schema";

type PanShape = "round" | "rectangular" | "square";

interface PanDimensions {
  shape: PanShape;
  diameter?: number;
  length?: number;
  width?: number;
  height?: number;
}

interface RecipeIngredient {
  ingredientId: string;
  quantity: string;
  unit: string;
  componentName?: string | null;
}

interface CakePanConverterProps {
  selectedIngredients?: RecipeIngredient[];
  ingredients?: Ingredient[];
  getQuantityInGrams?: (item: RecipeIngredient, ingredient?: Ingredient) => number;
}

export default function CakePanConverter({
  selectedIngredients = [],
  ingredients = [],
  getQuantityInGrams = () => 0,
}: CakePanConverterProps) {
  const { toast } = useToast();
  const [originalPan, setOriginalPan] = useState<PanDimensions>({
    shape: "round",
    diameter: 9,
    height: 2,
  });

  const [newPan, setNewPan] = useState<PanDimensions>({
    shape: "round",
    diameter: 8,
    height: 2,
  });

  const calculateVolume = (pan: PanDimensions): number => {
    const height = pan.height || 2;

    if (pan.shape === "round") {
      const radius = (pan.diameter || 0) / 2;
      return Math.PI * radius * radius * height;
    } else if (pan.shape === "rectangular" || pan.shape === "square") {
      const length = pan.length || 0;
      const width = pan.width || 0;
      return length * width * height;
    }
    return 0;
  };

  const originalVolume = useMemo(() => calculateVolume(originalPan), [originalPan]);
  const newVolume = useMemo(() => calculateVolume(newPan), [newPan]);

  const conversionRatio = useMemo(() => {
    if (originalVolume <= 0) return 0;
    return newVolume / originalVolume;
  }, [originalVolume, newVolume]);

  const scaledIngredients = useMemo(() => {
    if (conversionRatio === 0 || selectedIngredients.length === 0) return [];

    return selectedIngredients
      .map((item) => {
        const ingredient = ingredients.find((i) => i.id === item.ingredientId);
        if (!ingredient) return null;

        const originalWeight = getQuantityInGrams(item, ingredient);
        const scaledWeight = originalWeight * conversionRatio;

        return {
          name: ingredient.name,
          originalWeight,
          scaledWeight,
        };
      })
      .filter((item) => item !== null);
  }, [selectedIngredients, ingredients, conversionRatio, getQuantityInGrams]);

  const handleCopyRatio = () => {
    navigator.clipboard.writeText(conversionRatio.toFixed(2));
    toast({ title: "Conversion ratio copied to clipboard" });
  };

  const updateOriginalPan = (field: keyof PanDimensions, value: any) => {
    setOriginalPan((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateNewPan = (field: keyof PanDimensions, value: any) => {
    setNewPan((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Original Pan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recipe Pan</CardTitle>
            <CardDescription>Original baking pan from recipe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="original-shape">Pan Shape</Label>
              <Select
                value={originalPan.shape}
                onValueChange={(value) => updateOriginalPan("shape", value as PanShape)}
              >
                <SelectTrigger data-testid="select-original-pan-shape">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round">Round</SelectItem>
                  <SelectItem value="rectangular">Rectangular</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {originalPan.shape === "round" && (
              <div className="space-y-2">
                <Label htmlFor="original-diameter">Diameter (inches)</Label>
                <Input
                  id="original-diameter"
                  type="number"
                  step="0.1"
                  min="1"
                  value={originalPan.diameter || ""}
                  onChange={(e) => updateOriginalPan("diameter", parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 9"
                  data-testid="input-original-diameter"
                />
              </div>
            )}

            {(originalPan.shape === "rectangular" || originalPan.shape === "square") && (
              <>
                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="original-length">Length (inches)</Label>
                    <Input
                      id="original-length"
                      type="number"
                      step="0.1"
                      min="1"
                      value={originalPan.length || ""}
                      onChange={(e) => updateOriginalPan("length", parseFloat(e.target.value) || 0)}
                      placeholder="e.g., 13"
                      data-testid="input-original-length"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="original-width">Width (inches)</Label>
                    <Input
                      id="original-width"
                      type="number"
                      step="0.1"
                      min="1"
                      value={originalPan.width || ""}
                      onChange={(e) => updateOriginalPan("width", parseFloat(e.target.value) || 0)}
                      placeholder="e.g., 9"
                      data-testid="input-original-width"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="original-height">Height (inches)</Label>
              <Input
                id="original-height"
                type="number"
                step="0.1"
                min="1"
                value={originalPan.height || ""}
                onChange={(e) => updateOriginalPan("height", parseFloat(e.target.value) || 0)}
                placeholder="e.g., 2"
                data-testid="input-original-height"
              />
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Volume</div>
              <div className="text-2xl font-bold" data-testid="text-original-volume">
                {originalVolume.toFixed(1)} in³
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Pan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Pan</CardTitle>
            <CardDescription>Your available baking pan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-shape">Pan Shape</Label>
              <Select
                value={newPan.shape}
                onValueChange={(value) => updateNewPan("shape", value as PanShape)}
              >
                <SelectTrigger data-testid="select-new-pan-shape">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round">Round</SelectItem>
                  <SelectItem value="rectangular">Rectangular</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newPan.shape === "round" && (
              <div className="space-y-2">
                <Label htmlFor="new-diameter">Diameter (inches)</Label>
                <Input
                  id="new-diameter"
                  type="number"
                  step="0.1"
                  min="1"
                  value={newPan.diameter || ""}
                  onChange={(e) => updateNewPan("diameter", parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 8"
                  data-testid="input-new-diameter"
                />
              </div>
            )}

            {(newPan.shape === "rectangular" || newPan.shape === "square") && (
              <>
                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-length">Length (inches)</Label>
                    <Input
                      id="new-length"
                      type="number"
                      step="0.1"
                      min="1"
                      value={newPan.length || ""}
                      onChange={(e) => updateNewPan("length", parseFloat(e.target.value) || 0)}
                      placeholder="e.g., 11"
                      data-testid="input-new-length"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-width">Width (inches)</Label>
                    <Input
                      id="new-width"
                      type="number"
                      step="0.1"
                      min="1"
                      value={newPan.width || ""}
                      onChange={(e) => updateNewPan("width", parseFloat(e.target.value) || 0)}
                      placeholder="e.g., 7"
                      data-testid="input-new-width"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-height">Height (inches)</Label>
              <Input
                id="new-height"
                type="number"
                step="0.1"
                min="1"
                value={newPan.height || ""}
                onChange={(e) => updateNewPan("height", parseFloat(e.target.value) || 0)}
                placeholder="e.g., 2"
                data-testid="input-new-height"
              />
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Volume</div>
              <div className="text-2xl font-bold" data-testid="text-new-volume">
                {newVolume.toFixed(1)} in³
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Result */}
      <Card>
        <CardContent className="pt-6">
          {originalVolume <= 0 ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Please enter valid dimensions for both pans</AlertDescription>
            </Alert>
          ) : (
            <div>
              <Label className="text-sm text-muted-foreground">Conversion Factor</Label>
              <div className="text-4xl font-bold text-primary" data-testid="text-conversion-ratio">
                {conversionRatio.toFixed(2)}x
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scaled Ingredients */}
      {scaledIngredients.length > 0 && originalVolume > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scaled Ingredient Weights</CardTitle>
            <CardDescription>
              Ingredient amounts adjusted for {conversionRatio.toFixed(2)}x conversion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient</TableHead>
                  <TableHead className="text-right">Original (g)</TableHead>
                  <TableHead className="text-right">Scaled (g)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scaledIngredients.map((item, index) => (
                  <TableRow key={index} data-testid={`row-scaled-ingredient-${index}`}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right" data-testid={`text-original-weight-${index}`}>
                      {item.originalWeight.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary" data-testid={`text-scaled-weight-${index}`}>
                      {item.scaledWeight.toFixed(1)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
