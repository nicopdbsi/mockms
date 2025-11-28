import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Gift, Package, Wrench, AlertCircle, CheckCircle2 } from "lucide-react";
import { type StarterIngredient, type StarterMaterial, type Ingredient, type Material } from "@shared/schema";
import { formatCurrency } from "@/lib/currency";

interface StarterPackImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "ingredients" | "materials";
}

export function StarterPackImportDialog({ open, onOpenChange, type }: StarterPackImportDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const currency = user?.currency || "PHP";
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const { data: starterItems, isLoading: starterLoading } = useQuery<StarterIngredient[] | StarterMaterial[]>({
    queryKey: [`/api/starter-pack/${type}`],
    enabled: open,
  });

  const { data: existingIngredients } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
    enabled: open && type === "ingredients",
  });

  const { data: existingMaterials } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
    enabled: open && type === "materials",
  });

  const existingNames = type === "ingredients" 
    ? (existingIngredients || []).map(i => i.name.toLowerCase())
    : (existingMaterials || []).map(m => m.name.toLowerCase());

  const getDuplicates = () => {
    if (!starterItems) return [];
    return starterItems.filter(item => existingNames.includes(item.name.toLowerCase()));
  };

  const duplicates = getDuplicates();
  const duplicateIds = duplicates.map(d => d.id);

  useEffect(() => {
    if (starterItems && open) {
      const nonDuplicateIds = starterItems
        .filter(item => !duplicateIds.includes(item.id))
        .map(item => item.id);
      setSelectedItems(nonDuplicateIds);
    }
  }, [starterItems, open]);

  const importMutation = useMutation({
    mutationFn: async () => {
      const payload = type === "ingredients" 
        ? { ingredientIds: selectedItems, materialIds: [] }
        : { ingredientIds: [], materialIds: selectedItems };
      
      const res = await apiRequest("POST", "/api/starter-pack/import", payload);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/${type}`] });
      const count = type === "ingredients" ? data.importedIngredients : data.importedMaterials;
      toast({
        title: "Success",
        description: `Imported ${count} ${type} to your pantry.`,
      });
      onOpenChange(false);
      setSelectedItems([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to import items. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleItem = (id: string) => {
    if (duplicateIds.includes(id)) return;
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (starterItems) {
      setSelectedItems(starterItems.filter(i => !duplicateIds.includes(i.id)).map(i => i.id));
    }
  };

  const deselectAll = () => {
    setSelectedItems([]);
  };

  const handleImport = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to import.",
        variant: "destructive",
      });
      return;
    }
    importMutation.mutate();
  };

  const Icon = type === "ingredients" ? Package : Wrench;
  const title = type === "ingredients" ? "Import Starter Ingredients" : "Import Starter Materials";
  const description = type === "ingredients" 
    ? "Import common ingredients from the Bento Starter Pack to quickly populate your pantry."
    : "Import common materials and packaging from the Bento Starter Pack.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {starterLoading ? (
          <div className="space-y-2 py-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : starterItems && starterItems.length > 0 ? (
          <>
            {duplicates.length > 0 && (
              <Alert variant="default" className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  {duplicates.length} item(s) already exist in your pantry and cannot be imported again.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedItems.length} of {starterItems.length - duplicateIds.length} available items selected
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>

            <ScrollArea className="max-h-[300px] pr-4">
              <div className="space-y-1">
                {starterItems.map((item) => {
                  const isDuplicate = duplicateIds.includes(item.id);
                  const isIngredient = 'pricePerGram' in item;
                  
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        isDuplicate 
                          ? "opacity-50 cursor-not-allowed bg-muted/50" 
                          : "hover:bg-muted cursor-pointer"
                      }`}
                    >
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => toggleItem(item.id)}
                        disabled={isDuplicate}
                        data-testid={`checkbox-import-${item.id}`}
                      />
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{item.name}</span>
                          {isDuplicate && (
                            <Badge variant="secondary" className="text-xs">
                              Exists
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.category && <span>{item.category}</span>}
                          {isIngredient && (
                            <span className="ml-2">
                              {formatCurrency(parseFloat((item as StarterIngredient).pricePerGram), currency)}/g
                            </span>
                          )}
                          {!isIngredient && (item as StarterMaterial).pricePerUnit && (
                            <span className="ml-2">
                              {formatCurrency(parseFloat((item as StarterMaterial).pricePerUnit!), currency)}/{(item as StarterMaterial).unit}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Icon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No starter {type} available.</p>
            <p className="text-sm">Check back later or add items manually.</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedItems.length === 0 || importMutation.isPending}
            data-testid="button-confirm-starter-import"
          >
            {importMutation.isPending ? "Importing..." : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Import {selectedItems.length} Items
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
