import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { ChefHat, Package, Wrench, Sparkles, ArrowRight, Check, Gift, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { type StarterIngredient, type StarterMaterial } from "@shared/schema";
import { formatCurrency } from "@/lib/currency";
import bentoLogo from "@assets/BentoHubLogo_1764103927788.png";

type OnboardingStep = "welcome" | "starter-choice" | "select-items" | "complete";

export function OnboardingWizard() {
  const { user, refetchUser } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);

  const currency = user?.currency || "PHP";

  // Check if user needs onboarding
  useEffect(() => {
    if (user && !user.hasCompletedOnboarding) {
      setIsOpen(true);
    }
  }, [user]);

  // Fetch starter pack items
  const { data: starterIngredients, isLoading: ingredientsLoading } = useQuery<StarterIngredient[]>({
    queryKey: ["/api/starter-pack/ingredients"],
    enabled: isOpen,
  });

  const { data: starterMaterials, isLoading: materialsLoading } = useQuery<StarterMaterial[]>({
    queryKey: ["/api/starter-pack/materials"],
    enabled: isOpen,
  });

  // Fetch user's existing items for duplicate detection
  const { data: userIngredients } = useQuery<{ name: string }[]>({
    queryKey: ["/api/ingredients"],
    enabled: isOpen,
  });

  const { data: userMaterials } = useQuery<{ name: string }[]>({
    queryKey: ["/api/materials"],
    enabled: isOpen,
  });

  // Build sets of existing item names (case-insensitive)
  const existingIngredientNames = new Set(
    (userIngredients || []).map(i => i.name.toLowerCase())
  );
  const existingMaterialNames = new Set(
    (userMaterials || []).map(m => m.name.toLowerCase())
  );

  // Filter out duplicates when selecting
  const getAvailableIngredientIds = () => {
    return (starterIngredients || [])
      .filter(i => !existingIngredientNames.has(i.name.toLowerCase()))
      .map(i => i.id);
  };

  const getAvailableMaterialIds = () => {
    return (starterMaterials || [])
      .filter(m => !existingMaterialNames.has(m.name.toLowerCase()))
      .map(m => m.id);
  };

  // Select all available (non-duplicate) items by default when entering select-items step
  useEffect(() => {
    if (starterIngredients && step === "select-items" && selectedIngredients.length === 0) {
      setSelectedIngredients(getAvailableIngredientIds());
    }
  }, [starterIngredients, step, userIngredients]);

  useEffect(() => {
    if (starterMaterials && step === "select-items" && selectedMaterials.length === 0) {
      setSelectedMaterials(getAvailableMaterialIds());
    }
  }, [starterMaterials, step, userMaterials]);

  // Complete onboarding mutation
  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/onboarding/complete");
      return res.json();
    },
    onSuccess: () => {
      refetchUser();
      setIsOpen(false);
    },
  });

  // Import starter pack mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/starter-pack/import", {
        ingredientIds: selectedIngredients,
        materialIds: selectedMaterials,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      const total = data.importedIngredients + data.importedMaterials;
      if (total > 0) {
        toast({
          title: "Pantry Ready!",
          description: `Imported ${data.importedIngredients} ingredients and ${data.importedMaterials} materials to your pantry.`,
        });
      }
      setStep("complete");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to import starter pack. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImportAll = () => {
    setSelectedIngredients(getAvailableIngredientIds());
    setSelectedMaterials(getAvailableMaterialIds());
    setStep("select-items");
  };

  const handleChooseItems = () => {
    setSelectedIngredients([]);
    setSelectedMaterials([]);
    setStep("select-items");
  };

  const handleSkip = () => {
    completeOnboardingMutation.mutate();
  };

  const handleConfirmImport = () => {
    if (selectedIngredients.length === 0 && selectedMaterials.length === 0) {
      completeOnboardingMutation.mutate();
    } else {
      importMutation.mutate();
    }
  };

  const handleFinish = () => {
    completeOnboardingMutation.mutate();
  };

  const toggleIngredient = (id: string) => {
    const item = starterIngredients?.find(i => i.id === id);
    if (item && existingIngredientNames.has(item.name.toLowerCase())) return;
    setSelectedIngredients(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleMaterial = (id: string) => {
    const item = starterMaterials?.find(m => m.id === id);
    if (item && existingMaterialNames.has(item.name.toLowerCase())) return;
    setSelectedMaterials(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const selectAllIngredients = () => {
    setSelectedIngredients(getAvailableIngredientIds());
  };

  const selectAllMaterials = () => {
    setSelectedMaterials(getAvailableMaterialIds());
  };

  const hasStarterItems = (starterIngredients?.length || 0) > 0 || (starterMaterials?.length || 0) > 0;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        {step === "welcome" && (
          <>
            <DialogHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img src={bentoLogo} alt="BentoHub" className="h-16 w-auto" />
              </div>
              <DialogTitle className="text-2xl">Welcome to BentoHub!</DialogTitle>
              <DialogDescription className="text-base">
                Your all-in-one kitchen management system for recipe costing, inventory tracking, and business growth.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <ChefHat className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium">Recipe Costing</h4>
                  <p className="text-sm text-muted-foreground">Calculate accurate costs and set profitable prices for your recipes.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Package className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium">Pantry Management</h4>
                  <p className="text-sm text-muted-foreground">Track ingredients, materials, and suppliers in one place.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Sparkles className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium">Growth Analytics</h4>
                  <p className="text-sm text-muted-foreground">Monitor profitability and scale your business with data-driven insights.</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setStep("starter-choice")} className="w-full" data-testid="button-get-started">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "starter-choice" && (
          <>
            <DialogHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Gift className="h-8 w-8 text-primary" />
                </div>
              </div>
              <DialogTitle>Bento Starter Pack</DialogTitle>
              <DialogDescription className="text-base">
                Would you like us to pre-fill your pantry with common starter items? This includes basic ingredients and packaging materials to help you get started quickly.
              </DialogDescription>
            </DialogHeader>
            
            {(ingredientsLoading || materialsLoading) ? (
              <div className="py-4 space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : hasStarterItems ? (
              <div className="py-4 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <span>Ingredients</span>
                  </div>
                  <span className="font-medium">{starterIngredients?.length || 0} items</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-muted-foreground" />
                    <span>Materials & Equipment</span>
                  </div>
                  <span className="font-medium">{starterMaterials?.length || 0} items</span>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                <p>No starter items available at the moment.</p>
                <p className="text-sm">You can add ingredients and materials manually.</p>
              </div>
            )}

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              {hasStarterItems && (
                <>
                  <Button onClick={handleImportAll} className="w-full" data-testid="button-import-all">
                    <Check className="mr-2 h-4 w-4" />
                    Import All Items
                  </Button>
                  <Button onClick={handleChooseItems} variant="outline" className="w-full" data-testid="button-choose-items">
                    Choose Items to Import
                  </Button>
                </>
              )}
              <Button onClick={handleSkip} variant="ghost" className="w-full" data-testid="button-skip">
                {hasStarterItems ? "Skip for Now" : "Continue"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "select-items" && (
          <>
            <DialogHeader>
              <DialogTitle>Select Items to Import</DialogTitle>
              <DialogDescription>
                Choose which ingredients and materials you want to add to your pantry.
              </DialogDescription>
            </DialogHeader>
            
            {(existingIngredientNames.size > 0 || existingMaterialNames.size > 0) && (
              <Alert variant="default" className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  Items already in your pantry are shown as "Exists" and cannot be imported again.
                </AlertDescription>
              </Alert>
            )}
            
            <ScrollArea className="max-h-[400px] pr-4">
              <div className="space-y-4">
                {starterIngredients && starterIngredients.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Ingredients
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={selectAllIngredients}
                        className="h-auto py-1 px-2 text-xs"
                      >
                        Select All
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {starterIngredients.map((item) => {
                        const isDuplicate = existingIngredientNames.has(item.name.toLowerCase());
                        return (
                          <label
                            key={item.id}
                            className={`flex items-center gap-3 p-2 rounded-lg ${
                              isDuplicate 
                                ? "opacity-50 cursor-not-allowed bg-muted/50" 
                                : "hover:bg-muted cursor-pointer"
                            }`}
                          >
                            <Checkbox
                              checked={selectedIngredients.includes(item.id)}
                              onCheckedChange={() => toggleIngredient(item.id)}
                              disabled={isDuplicate}
                              data-testid={`checkbox-ingredient-${item.id}`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{item.name}</span>
                                {isDuplicate && (
                                  <Badge variant="secondary" className="text-xs">Exists</Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.category} · {formatCurrency(parseFloat(item.pricePerGram), currency)}/g
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {starterMaterials && starterMaterials.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Materials & Equipment
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={selectAllMaterials}
                        className="h-auto py-1 px-2 text-xs"
                      >
                        Select All
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {starterMaterials.map((item) => {
                        const isDuplicate = existingMaterialNames.has(item.name.toLowerCase());
                        return (
                          <label
                            key={item.id}
                            className={`flex items-center gap-3 p-2 rounded-lg ${
                              isDuplicate 
                                ? "opacity-50 cursor-not-allowed bg-muted/50" 
                                : "hover:bg-muted cursor-pointer"
                            }`}
                          >
                            <Checkbox
                              checked={selectedMaterials.includes(item.id)}
                              onCheckedChange={() => toggleMaterial(item.id)}
                              disabled={isDuplicate}
                              data-testid={`checkbox-material-${item.id}`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{item.name}</span>
                                {isDuplicate && (
                                  <Badge variant="secondary" className="text-xs">Exists</Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.category} {item.pricePerUnit && `· ${formatCurrency(parseFloat(item.pricePerUnit), currency)}/${item.unit}`}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                onClick={handleConfirmImport}
                className="w-full"
                disabled={importMutation.isPending}
                data-testid="button-confirm-import"
              >
                {importMutation.isPending ? "Importing..." : (
                  selectedIngredients.length + selectedMaterials.length > 0
                    ? `Import ${selectedIngredients.length + selectedMaterials.length} Items`
                    : "Continue Without Importing"
                )}
              </Button>
              <Button
                onClick={() => setStep("starter-choice")}
                variant="ghost"
                className="w-full"
                disabled={importMutation.isPending}
              >
                Back
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "complete" && (
          <>
            <DialogHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <DialogTitle>You're All Set!</DialogTitle>
              <DialogDescription className="text-base">
                Your pantry has been set up with starter items. You can now start creating recipes and tracking your costs.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-3">
              <div className="text-center text-sm text-muted-foreground">
                <p>Next steps:</p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">1</div>
                <div>
                  <h4 className="font-medium">Review Your Pantry</h4>
                  <p className="text-sm text-muted-foreground">Check and update prices for your ingredients.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">2</div>
                <div>
                  <h4 className="font-medium">Create Your First Recipe</h4>
                  <p className="text-sm text-muted-foreground">Build a recipe with accurate cost calculations.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">3</div>
                <div>
                  <h4 className="font-medium">Set Your Pricing</h4>
                  <p className="text-sm text-muted-foreground">Use the pricing tools to find your ideal selling price.</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleFinish}
                className="w-full"
                disabled={completeOnboardingMutation.isPending}
                data-testid="button-finish"
              >
                {completeOnboardingMutation.isPending ? "Finishing..." : "Go to Dashboard"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
