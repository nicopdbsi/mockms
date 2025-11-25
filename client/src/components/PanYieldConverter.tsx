import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PanYieldConverterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentYield: number;
  currentPanSetup: string;
  flourWeight: number;
  batchYieldValue: number;
  scaledIngredients: Array<{
    ingredientId: string;
    name: string;
    bakerPercentage: number;
    originalWeight: number;
    newWeight?: number;
    newCost?: number;
  }>;
  onApply?: (data: {
    newYield: number;
    newPanSetup: string;
    scaledIngredients: any[];
  }) => void;
}

type PanShape = "rectangular" | "round" | "other";
type ConversionMode = "pieces" | "pan";

interface PanDimensions {
  shape: PanShape;
  width?: number;
  length?: number;
  diameter?: number;
  depth?: number;
  count: number;
}

export default function PanYieldConverter({
  open,
  onOpenChange,
  currentYield,
  currentPanSetup,
  flourWeight,
  batchYieldValue,
  scaledIngredients,
}: PanYieldConverterProps) {
  const [mode, setMode] = useState<ConversionMode>("pieces");
  const [desiredPieces, setDesiredPieces] = useState("");
  const [targetWeightPerPiece, setTargetWeightPerPiece] = useState("30");
  const [originalPan, setOriginalPan] = useState<PanDimensions>({
    shape: "rectangular",
    width: 12,
    length: 18,
    count: 2,
  });
  const [newPan, setNewPan] = useState<PanDimensions>({
    shape: "rectangular",
    width: 12,
    length: 18,
    count: 2,
  });

  const calculatePanArea = (pan: PanDimensions): number => {
    if (pan.shape === "rectangular") {
      return (pan.width || 0) * (pan.length || 0) * pan.count;
    } else if (pan.shape === "round") {
      const radius = (pan.diameter || 0) / 2;
      return Math.PI * radius * radius * pan.count;
    }
    return 0;
  };

  const calculateByPieces = () => {
    const pieces = parseFloat(desiredPieces) || 0;
    const weight = parseFloat(targetWeightPerPiece) || 30;
    if (pieces <= 0 || weight <= 0) return null;

    const newTotalWeight = pieces * weight;
    const scalingFactor = newTotalWeight / (flourWeight || 1);

    return {
      newYield: pieces,
      newTotalWeight,
      scalingFactor,
      panDescription: currentPanSetup,
    };
  };

  const calculateByPan = () => {
    const originalArea = calculatePanArea(originalPan);
    const newArea = calculatePanArea(newPan);

    if (originalArea <= 0 || newArea <= 0) return null;

    const scalingFactor = newArea / originalArea;
    const currentTotal = batchYieldValue;
    const newYield = Math.round(currentTotal * scalingFactor);
    const newTotalWeight = (flourWeight / scalingFactor) * scalingFactor;

    let panDesc = "";
    if (newPan.shape === "rectangular") {
      panDesc = `${newPan.count} tray${newPan.count > 1 ? "s" : ""}, ${newPan.width}x${newPan.length} in`;
    } else if (newPan.shape === "round") {
      panDesc = `${newPan.count} pan${newPan.count > 1 ? "s" : ""}, ${newPan.diameter}" diameter`;
    }

    return {
      newYield,
      newTotalWeight,
      scalingFactor,
      panDescription: panDesc,
    };
  };

  const result = mode === "pieces" ? calculateByPieces() : calculateByPan();

  const scaledResults = result
    ? scaledIngredients.map((ing) => ({
        ...ing,
        newWeight: ing.originalWeight * result.scalingFactor,
        newCost: (ing.newCost || 0) * result.scalingFactor,
      }))
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pan & Yield Converter</DialogTitle>
          <DialogDescription>
            Convert your recipe based on pieces or pan size
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Section A - Current Recipe Summary */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Current Recipe Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Flour Weight</div>
                  <div className="text-lg font-bold">{flourWeight.toFixed(0)} g</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Current Yield</div>
                  <div className="text-lg font-bold">{batchYieldValue} pcs</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Current Pan Setup</div>
                  <div className="text-lg font-bold">{currentPanSetup}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section B - Conversion Modes */}
          <div className="space-y-4">
            <Tabs value={mode} onValueChange={(v) => setMode(v as ConversionMode)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pieces">By Pieces</TabsTrigger>
                <TabsTrigger value="pan">By Pan Size</TabsTrigger>
              </TabsList>

              <TabsContent value="pieces" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="desired-pieces">Desired # of Pieces</Label>
                    <Input
                      id="desired-pieces"
                      type="number"
                      min="1"
                      placeholder="e.g., 50"
                      value={desiredPieces}
                      onChange={(e) => setDesiredPieces(e.target.value)}
                      data-testid="input-pan-converter-pieces"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target-weight">Target Weight per Piece (g)</Label>
                    <Input
                      id="target-weight"
                      type="number"
                      min="1"
                      step="0.1"
                      placeholder="e.g., 30"
                      value={targetWeightPerPiece}
                      onChange={(e) => setTargetWeightPerPiece(e.target.value)}
                      data-testid="input-pan-converter-weight"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pan" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-6">
                  {/* Original Pan */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-semibold text-sm">Original Pan</h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Shape</Label>
                        <Select value={originalPan.shape} onValueChange={(v) => setOriginalPan({ ...originalPan, shape: v as PanShape })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rectangular">Rectangular</SelectItem>
                            <SelectItem value="round">Round</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {originalPan.shape === "rectangular" && (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Width (in)</Label>
                              <Input
                                type="number"
                                value={originalPan.width || ""}
                                onChange={(e) =>
                                  setOriginalPan({ ...originalPan, width: parseFloat(e.target.value) })
                                }
                                data-testid="input-original-pan-width"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Length (in)</Label>
                              <Input
                                type="number"
                                value={originalPan.length || ""}
                                onChange={(e) =>
                                  setOriginalPan({ ...originalPan, length: parseFloat(e.target.value) })
                                }
                                data-testid="input-original-pan-length"
                              />
                            </div>
                          </div>
                        </>
                      )}
                      {originalPan.shape === "round" && (
                        <div className="space-y-1">
                          <Label className="text-xs">Diameter (in)</Label>
                          <Input
                            type="number"
                            value={originalPan.diameter || ""}
                            onChange={(e) =>
                              setOriginalPan({ ...originalPan, diameter: parseFloat(e.target.value) })
                            }
                            data-testid="input-original-pan-diameter"
                          />
                        </div>
                      )}
                      <div className="space-y-1">
                        <Label className="text-xs">Number of Pans</Label>
                        <Input
                          type="number"
                          min="1"
                          value={originalPan.count}
                          onChange={(e) =>
                            setOriginalPan({ ...originalPan, count: parseInt(e.target.value) || 1 })
                          }
                          data-testid="input-original-pan-count"
                        />
                      </div>
                    </div>
                  </div>

                  {/* New Pan */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-semibold text-sm">New Pan</h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Shape</Label>
                        <Select value={newPan.shape} onValueChange={(v) => setNewPan({ ...newPan, shape: v as PanShape })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rectangular">Rectangular</SelectItem>
                            <SelectItem value="round">Round</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {newPan.shape === "rectangular" && (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Width (in)</Label>
                              <Input
                                type="number"
                                value={newPan.width || ""}
                                onChange={(e) =>
                                  setNewPan({ ...newPan, width: parseFloat(e.target.value) })
                                }
                                data-testid="input-new-pan-width"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Length (in)</Label>
                              <Input
                                type="number"
                                value={newPan.length || ""}
                                onChange={(e) =>
                                  setNewPan({ ...newPan, length: parseFloat(e.target.value) })
                                }
                                data-testid="input-new-pan-length"
                              />
                            </div>
                          </div>
                        </>
                      )}
                      {newPan.shape === "round" && (
                        <div className="space-y-1">
                          <Label className="text-xs">Diameter (in)</Label>
                          <Input
                            type="number"
                            value={newPan.diameter || ""}
                            onChange={(e) =>
                              setNewPan({ ...newPan, diameter: parseFloat(e.target.value) })
                            }
                            data-testid="input-new-pan-diameter"
                          />
                        </div>
                      )}
                      <div className="space-y-1">
                        <Label className="text-xs">Number of Pans</Label>
                        <Input
                          type="number"
                          min="1"
                          value={newPan.count}
                          onChange={(e) =>
                            setNewPan({ ...newPan, count: parseInt(e.target.value) || 1 })
                          }
                          data-testid="input-new-pan-count"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Calculation Results */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Conversion Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground">New Yield</div>
                    <div className="text-2xl font-bold">{result.newYield} pcs</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground">New Total Weight</div>
                    <div className="text-2xl font-bold">{result.newTotalWeight.toFixed(0)} g</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground">Scaling Factor</div>
                    <div className="text-2xl font-bold">{result.scalingFactor.toFixed(2)}x</div>
                  </div>
                </div>

                {scaledResults.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Scaled Ingredients</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingredient</TableHead>
                          <TableHead className="text-right">Baker's %</TableHead>
                          <TableHead className="text-right">New Weight (g)</TableHead>
                          <TableHead className="text-right">New Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scaledResults.map((ing) => (
                          <TableRow key={ing.ingredientId}>
                            <TableCell className="font-medium">{ing.name}</TableCell>
                            <TableCell className="text-right">{ing.bakerPercentage.toFixed(1)}%</TableCell>
                            <TableCell className="text-right">{ing.newWeight.toFixed(1)}</TableCell>
                            <TableCell className="text-right">${ing.newCost.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={!result}
              onClick={() => {
                onOpenChange(false);
              }}
              data-testid="button-apply-pan-conversion"
            >
              Apply This Batch Only
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
