import { useState, useRef, useMemo, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Loader2, Check, X, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Ingredient, Material } from "@shared/schema";

interface ParsedReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  category?: string;
  type: "ingredient" | "material";
}

interface ParsedReceipt {
  supplier?: {
    name: string;
    phone?: string;
    email?: string;
  };
  items: ParsedReceiptItem[];
  totalAmount?: number;
  date?: string;
}

interface ReceiptUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemsImported: () => void;
  existingIngredients?: Ingredient[];
  existingMaterials?: Material[];
}

export function ReceiptUpload({ open, onOpenChange, onItemsImported, existingIngredients = [], existingMaterials = [] }: ReceiptUploadProps) {
  const [parsedData, setParsedData] = useState<ParsedReceipt | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [createSupplier, setCreateSupplier] = useState(true);
  const [showSupplier, setShowSupplier] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const existingIngredientNames = useMemo(() => {
    return new Set(existingIngredients.map(i => i.name.trim().toLowerCase()));
  }, [existingIngredients]);

  const existingMaterialNames = useMemo(() => {
    return new Set(existingMaterials.map(m => m.name.trim().toLowerCase()));
  }, [existingMaterials]);

  const duplicateIndices = useMemo(() => {
    if (!parsedData) return new Set<number>();
    const dupes = new Set<number>();
    parsedData.items.forEach((item, index) => {
      const normalizedName = item.name.trim().toLowerCase();
      if (item.type === "ingredient" && existingIngredientNames.has(normalizedName)) {
        dupes.add(index);
      } else if (item.type === "material" && existingMaterialNames.has(normalizedName)) {
        dupes.add(index);
      }
    });
    return dupes;
  }, [parsedData, existingIngredientNames, existingMaterialNames]);

  const duplicateCount = duplicateIndices.size;

  useEffect(() => {
    if (parsedData && duplicateIndices.size > 0) {
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        duplicateIndices.forEach(idx => newSet.delete(idx));
        return newSet;
      });
    }
  }, [parsedData, duplicateIndices]);

  const skipDuplicates = () => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      duplicateIndices.forEach(idx => newSet.delete(idx));
      return newSet;
    });
  };

  const parseMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/parse-receipt", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to parse receipt");
      }
      
      return response.json() as Promise<ParsedReceipt>;
    },
    onSuccess: (data) => {
      setParsedData(data);
      setSelectedItems(new Set(data.items.map((_, i) => i)));
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!parsedData) return;

      let supplierId: string | null = null;

      if (createSupplier && parsedData.supplier?.name) {
        const supplierResponse = await fetch("/api/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: parsedData.supplier.name,
            phone: parsedData.supplier.phone || null,
            email: parsedData.supplier.email || null,
            contactPerson: null,
          }),
          credentials: "include",
        });
        
        if (supplierResponse.ok) {
          const supplier = await supplierResponse.json();
          supplierId = supplier.id;
        }
      }

      const itemsToImport = parsedData.items.filter((_, i) => selectedItems.has(i) && !duplicateIndices.has(i));

      for (const item of itemsToImport) {
        const quantity = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity)) || 1;
        const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0;
        
        if (item.type === "ingredient") {
          const pricePerGram = quantity > 0 ? (price / quantity) : 0;
          const response = await fetch("/api/ingredients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: item.name,
              quantity: quantity.toString(),
              unit: item.unit || "pcs",
              purchaseAmount: price.toFixed(2),
              pricePerGram: pricePerGram.toFixed(4),
              category: item.category || null,
              supplierId,
            }),
            credentials: "include",
          });
          if (!response.ok) {
            console.error("Failed to import ingredient:", item.name, await response.text());
          }
        } else {
          const pricePerUnit = quantity > 0 ? (price / quantity) : 0;
          const response = await fetch("/api/materials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: item.name,
              quantity: quantity.toString(),
              unit: item.unit || "pcs",
              pricePerUnit: pricePerUnit.toFixed(2),
              purchaseAmount: price.toFixed(2),
              category: item.category || null,
              supplierId,
              notes: null,
            }),
            credentials: "include",
          });
          if (!response.ok) {
            console.error("Failed to import material:", item.name, await response.text());
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ title: "Items imported successfully" });
      handleClose();
      onItemsImported();
    },
    onError: () => {
      toast({ title: "Failed to import items", variant: "destructive" });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      parseMutation.mutate(file);
    }
  };

  const handleClose = () => {
    setParsedData(null);
    setSelectedItems(new Set());
    setCreateSupplier(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
  };

  const toggleItem = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    if (parsedData) {
      setSelectedItems(new Set(parsedData.items.map((_, i) => i)));
    }
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const ingredientCount = parsedData?.items.filter((item, i) => 
    selectedItems.has(i) && item.type === "ingredient"
  ).length || 0;

  const materialCount = parsedData?.items.filter((item, i) => 
    selectedItems.has(i) && item.type === "material"
  ).length || 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Items</DialogTitle>
          <DialogDescription>
            Upload a receipt image (.png, .jpg), PDF, or CSV file to auto-populate your inventory.
          </DialogDescription>
        </DialogHeader>

        {!parsedData ? (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              data-testid="dropzone-receipt"
            >
              {parseMutation.isPending ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
                  <p className="text-muted-foreground">Analyzing receipt...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <p className="font-medium">Click to upload a receipt</p>
                  <p className="text-sm text-muted-foreground">
                    Supported formats: PNG, JPG, PDF, CSV
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.pdf,.csv"
              className="hidden"
              onChange={handleFileSelect}
              data-testid="input-receipt-file"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {parsedData.supplier && (
              <Card>
                <CardContent className="p-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setShowSupplier(!showSupplier)}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">Detected Supplier</span>
                    </div>
                    {showSupplier ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                  {showSupplier && (
                    <div className="mt-3 space-y-2">
                      <p className="text-lg font-semibold">{parsedData.supplier.name}</p>
                      {parsedData.supplier.phone && (
                        <p className="text-sm text-muted-foreground">{parsedData.supplier.phone}</p>
                      )}
                      {parsedData.supplier.email && (
                        <p className="text-sm text-muted-foreground">{parsedData.supplier.email}</p>
                      )}
                      <div className="flex items-center gap-2 pt-2">
                        <Checkbox
                          id="createSupplier"
                          checked={createSupplier}
                          onCheckedChange={(checked) => setCreateSupplier(!!checked)}
                          data-testid="checkbox-create-supplier"
                        />
                        <label htmlFor="createSupplier" className="text-sm">
                          Add this supplier to your Suppliers list
                        </label>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {parsedData.date && (
              <p className="text-sm text-muted-foreground">Receipt date: {parsedData.date}</p>
            )}

            {duplicateCount > 0 && (
              <Alert variant="destructive" data-testid="alert-duplicates">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    {duplicateCount} {duplicateCount === 1 ? "item already exists" : "items already exist"} in your inventory and {duplicateCount === 1 ? "has" : "have"} been deselected.
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={skipDuplicates}
                    className="ml-2 shrink-0"
                    data-testid="button-skip-duplicates"
                  >
                    Skip Duplicates
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{parsedData.items.length} items found</span>
                <Badge variant="outline">{ingredientCount} ingredients</Badge>
                <Badge variant="outline">{materialCount} materials</Badge>
                {duplicateCount > 0 && (
                  <Badge variant="destructive">{duplicateCount} duplicates</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>

            <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
              {parsedData.items.map((item, index) => {
                const isDuplicate = duplicateIndices.has(index);
                return (
                  <div
                    key={index}
                    className={`p-3 flex items-center gap-3 ${
                      isDuplicate ? "opacity-60" : "cursor-pointer hover:bg-muted/50"
                    } ${
                      selectedItems.has(index) && !isDuplicate ? "bg-muted/30" : ""
                    } ${isDuplicate ? "bg-destructive/10" : ""}`}
                    onClick={() => !isDuplicate && toggleItem(index)}
                    data-testid={`receipt-item-${index}`}
                  >
                    <Checkbox
                      checked={selectedItems.has(index) && !isDuplicate}
                      onCheckedChange={() => !isDuplicate && toggleItem(index)}
                      disabled={isDuplicate}
                      data-testid={`checkbox-item-${index}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium truncate ${isDuplicate ? "text-destructive" : ""}`}>{item.name}</span>
                        <Badge variant={item.type === "ingredient" ? "default" : "secondary"} className="shrink-0">
                          {item.type}
                        </Badge>
                        {isDuplicate && (
                          <Badge variant="destructive" className="shrink-0" data-testid={`badge-duplicate-${index}`}>
                            Exists
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit} - ${item.price.toFixed(2)}
                        {item.category && ` - ${item.category}`}
                      </div>
                    </div>
                    {selectedItems.has(index) ? (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            {parsedData.totalAmount !== undefined && (
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Total Amount</span>
                <span className="text-lg font-semibold">${parsedData.totalAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose} data-testid="button-cancel-import">
                Cancel
              </Button>
              <Button
                onClick={() => importMutation.mutate()}
                disabled={selectedItems.size === 0 || importMutation.isPending}
                data-testid="button-import-items"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>Import {selectedItems.size} Item{selectedItems.size !== 1 ? "s" : ""}</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
