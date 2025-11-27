import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRoute, useLocation } from "wouter";
import { formatCurrency } from "@/lib/currency";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRecipeSchema, type Ingredient, type Material } from "@shared/schema";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2, AlertTriangle, DollarSign, Calculator, TrendingUp, Package, ClipboardList, Scale, RefreshCw, ChevronUp, ChevronDown, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import PanYieldConverter from "@/components/PanYieldConverter";
import CakePanConverter from "@/components/CakePanConverter";

const formSchema = insertRecipeSchema.omit({ userId: true }).extend({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  servings: z.number().optional(),
  targetMargin: z.string().min(0, "Target margin must be positive"),
  targetFoodCost: z.string().min(0, "Target food cost must be positive"),
  laborCost: z.string().optional(),
  batchYield: z.coerce.number().optional(),
  procedures: z.string().optional(),
  standardYieldPieces: z.coerce.number().optional(),
  standardYieldWeightPerPiece: z.coerce.number().optional(),
  standardPanSize: z.string().optional(),
  standardNumTrays: z.coerce.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

type ProcedureStep = {
  componentName: string;
  text: string;
};

type RecipeIngredientWithDetails = {
  ingredientId: string;
  quantity: string;
  componentName?: string | null;
  unit?: string | null;
  ingredient: Ingredient;
};

type RecipeMaterialWithDetails = {
  materialId: string;
  quantity: string;
  material: Material;
};

type RecipeWithIngredients = {
  id: string;
  name: string;
  description: string | null;
  category?: string | null;
  servings: number;
  targetMargin: string;
  targetFoodCost: string | null;
  laborCost: string | null;
  batchYield: number | null;
  procedures: string | null;
  standardYieldPieces?: number | null;
  standardYieldWeightPerPiece?: number | null;
  standardPanSize?: string | null;
  standardNumTrays?: number | null;
  ingredients: RecipeIngredientWithDetails[];
  materials?: RecipeMaterialWithDetails[];
};

type ScaledIngredient = {
  ingredientId: string;
  name: string;
  originalWeight: number;
  bakerPercentage: number;
  newWeight: number;
  originalCost: number;
  newCost: number;
  pricePerGram: number;
};

function AddIngredientDialog({
  open,
  onOpenChange,
  existingIngredients,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingIngredients: Ingredient[];
  onSuccess: (ingredientId: string) => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("g");
  const [purchaseAmount, setPurchaseAmount] = useState("");

  const normalizedName = (name ?? "").trim().toLowerCase();
  const duplicateIngredient = normalizedName
    ? existingIngredients.find(
        (i) => i.name.toLowerCase().trim() === normalizedName
      )
    : null;

  const calculatedPricePerGram = useMemo(() => {
    const qty = parseFloat(quantity);
    const amount = parseFloat(purchaseAmount);
    if (qty > 0 && amount > 0) {
      return (amount / qty).toFixed(4);
    }
    return null;
  }, [quantity, purchaseAmount]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const pricePerGram = calculatedPricePerGram || "0";
      const response = await apiRequest("POST", "/api/ingredients", {
        name,
        quantity,
        unit,
        purchaseAmount,
        pricePerGram,
      });
      return response.json();
    },
    onSuccess: (newIngredient) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      toast({ title: "Ingredient added successfully" });
      onSuccess(newIngredient.id);
      setName("");
      setQuantity("");
      setUnit("g");
      setPurchaseAmount("");
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to add ingredient", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !quantity || !purchaseAmount) return;
    createMutation.mutate();
  };

  const resetForm = () => {
    setName("");
    setQuantity("");
    setUnit("g");
    setPurchaseAmount("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Ingredient</DialogTitle>
          <DialogDescription>
            Add a new ingredient to your masterlist. It will be available for selection immediately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ingredient-name">Ingredient Name *</Label>
            <Input
              id="ingredient-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., All Purpose Flour"
              data-testid="input-new-ingredient-name"
            />
            {duplicateIngredient && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription data-testid="warning-duplicate-ingredient-inline">
                  An ingredient named '{duplicateIngredient.name}' already exists
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ingredient-quantity">Quantity *</Label>
              <Input
                id="ingredient-quantity"
                type="number"
                step="0.01"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g., 1000"
                data-testid="input-new-ingredient-quantity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ingredient-unit">Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger data-testid="select-new-ingredient-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">g (grams)</SelectItem>
                  <SelectItem value="kg">kg (kilograms)</SelectItem>
                  <SelectItem value="ml">ml (milliliters)</SelectItem>
                  <SelectItem value="L">L (liters)</SelectItem>
                  <SelectItem value="pcs">pcs (pieces)</SelectItem>
                  <SelectItem value="oz">oz (ounces)</SelectItem>
                  <SelectItem value="lb">lb (pounds)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ingredient-purchase">Purchase Amount ($) *</Label>
            <Input
              id="ingredient-purchase"
              type="number"
              step="0.01"
              min="0"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              placeholder="e.g., 5.00"
              data-testid="input-new-ingredient-purchase"
            />
          </div>

          {calculatedPricePerGram && (
            <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
              Calculated Price: ${calculatedPricePerGram}/{unit}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createMutation.isPending ||
                !name.trim() ||
                !quantity ||
                !purchaseAmount ||
                !!duplicateIngredient
              }
              data-testid="button-save-new-ingredient"
            >
              {createMutation.isPending ? "Saving..." : "Add Ingredient"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddMaterialDialog({
  open,
  onOpenChange,
  existingMaterials,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingMaterials: Material[];
  onSuccess: (materialId: string) => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [purchaseAmount, setPurchaseAmount] = useState("");

  const normalizedName = (name ?? "").trim().toLowerCase();
  const duplicateMaterial = normalizedName
    ? existingMaterials.find((m) => m.name.toLowerCase().trim() === normalizedName)
    : null;

  const calculatedPricePerUnit = useMemo(() => {
    const qty = parseFloat(quantity);
    const amount = parseFloat(purchaseAmount);
    if (qty > 0 && amount > 0) {
      return (amount / qty).toFixed(4);
    }
    return null;
  }, [quantity, purchaseAmount]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const pricePerUnit = calculatedPricePerUnit || "0";
      const response = await apiRequest("POST", "/api/materials", {
        name,
        quantity,
        unit,
        purchaseAmount,
        pricePerUnit,
      });
      return response.json();
    },
    onSuccess: (newMaterial) => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({ title: "Material added successfully" });
      onSuccess(newMaterial.id);
      resetForm();
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to add material", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !quantity || !purchaseAmount) return;
    createMutation.mutate();
  };

  const resetForm = () => {
    setName("");
    setQuantity("");
    setUnit("pcs");
    setPurchaseAmount("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Material</DialogTitle>
          <DialogDescription>
            Add packaging or equipment to your masterlist.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="material-name">Material Name *</Label>
            <Input
              id="material-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Takeout Container"
              data-testid="input-new-material-name"
            />
            {duplicateMaterial && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  A material named '{duplicateMaterial.name}' already exists
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="material-quantity">Quantity *</Label>
              <Input
                id="material-quantity"
                type="number"
                step="1"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g., 100"
                data-testid="input-new-material-quantity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="material-unit">Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger data-testid="select-new-material-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">pcs (pieces)</SelectItem>
                  <SelectItem value="pack">pack</SelectItem>
                  <SelectItem value="box">box</SelectItem>
                  <SelectItem value="roll">roll</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="material-purchase">Purchase Amount ($) *</Label>
            <Input
              id="material-purchase"
              type="number"
              step="0.01"
              min="0"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              placeholder="e.g., 25.00"
              data-testid="input-new-material-purchase"
            />
          </div>

          {calculatedPricePerUnit && (
            <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
              Calculated Price: ${calculatedPricePerUnit}/{unit}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createMutation.isPending ||
                !name.trim() ||
                !quantity ||
                !purchaseAmount ||
                !!duplicateMaterial
              }
              data-testid="button-save-new-material"
            >
              {createMutation.isPending ? "Saving..." : "Add Material"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const FLOUR_KEYWORDS = ["flour", "harina", "tepung", "atta"];

export default function RecipeForm({ viewOnly = false }: { viewOnly?: boolean }) {
  const [location, setLocation] = useLocation();
  const [, paramsView] = useRoute("/recipes/:id/view");
  const [, paramsEdit] = useRoute("/recipes/:id");
  const { toast } = useToast();
  const { user } = useAuth();
  
  const isViewMode = location.includes("/view") || viewOnly;
  const params = paramsView || paramsEdit;
  const recipeId = params?.id === "new" ? null : params?.id;
  const isTemplate = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("template") === "true";

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedIngredients, setSelectedIngredients] = useState<
    Array<{ ingredientId: string; quantity: string; componentName?: string | null; unit?: string }>
  >([]);
  const [selectedMaterials, setSelectedMaterials] = useState<
    Array<{ materialId: string; quantity: string }>
  >([]);
  const [procedureSteps, setProcedureSteps] = useState<ProcedureStep[]>([]);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [pendingIngredientIndex, setPendingIngredientIndex] = useState<number | null>(null);
  const [pendingMaterialIndex, setPendingMaterialIndex] = useState<number | null>(null);
  const [pricingMarginSlider, setPricingMarginSlider] = useState(50);

  const [scalingDesiredPieces, setScalingDesiredPieces] = useState<string>("");
  const [scalingWeightPerPiece, setScalingWeightPerPiece] = useState<string>("");
  const [scaledIngredients, setScaledIngredients] = useState<ScaledIngredient[]>([]);
  const [hasScaled, setHasScaled] = useState(false);
  const [showPanConverter, setShowPanConverter] = useState(false);
  const [panSetup, setPanSetup] = useState("2 trays, 12x18 in");

  const [forecastUnitsPerMonth, setForecastUnitsPerMonth] = useState<string>("100");
  const [forecastSellingPrice, setForecastSellingPrice] = useState<string>("");
  const [forecastPackagingCost, setForecastPackagingCost] = useState<string>("1");
  const [forecastDeliveryCost, setForecastDeliveryCost] = useState<string>("0");
  const [forecastMarketplaceFee, setForecastMarketplaceFee] = useState<string>("0");
  const [forecastUtilities, setForecastUtilities] = useState<string>("0");

  const [accessType, setAccessType] = useState<"all" | "only-me" | "by-plan" | "selected-users">("all");
  const [selectedPlans, setSelectedPlans] = useState<Set<string>>(new Set());
  const [userEmails, setUserEmails] = useState<string>("");

  const { data: ingredients, isLoading: ingredientsLoading } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  const { data: materials, isLoading: materialsLoading } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  const { data: recipe, isLoading: recipeLoading } = useQuery<RecipeWithIngredients>({
    queryKey: ["/api/recipes", recipeId],
    enabled: !!recipeId,
  });

  const sortedIngredients = useMemo(() => {
    if (!ingredients) return [];
    return [...ingredients].sort((a, b) => a.name.localeCompare(b.name));
  }, [ingredients]);

  const sortedMaterials = useMemo(() => {
    if (!materials) return [];
    return [...materials].sort((a, b) => a.name.localeCompare(b.name));
  }, [materials]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      servings: undefined,
      targetMargin: "50",
      targetFoodCost: "30",
      laborCost: "0",
      batchYield: undefined,
      procedures: "",
      standardYieldPieces: undefined,
      standardYieldWeightPerPiece: undefined,
      standardPanSize: "",
      standardNumTrays: undefined,
    },
  });

  useEffect(() => {
    if (recipe) {
      let parsedProcedures: ProcedureStep[] = [];
      if (recipe.procedures) {
        try {
          const parsed = JSON.parse(recipe.procedures);
          if (Array.isArray(parsed)) {
            parsedProcedures = parsed;
          } else {
            parsedProcedures = [{ componentName: "", text: recipe.procedures }];
          }
        } catch {
          parsedProcedures = [{ componentName: "", text: recipe.procedures }];
        }
      }

      form.reset({
        name: recipe.name,
        description: recipe.description || "",
        category: recipe.category || "",
        servings: recipe.servings || undefined,
        targetMargin: recipe.targetMargin,
        targetFoodCost: recipe.targetFoodCost || "30",
        laborCost: recipe.laborCost || "0",
        batchYield: recipe.batchYield || undefined,
        procedures: recipe.procedures || "",
        standardYieldPieces: recipe.standardYieldPieces || undefined,
        standardYieldWeightPerPiece: recipe.standardYieldWeightPerPiece || undefined,
        standardPanSize: recipe.standardPanSize || "",
        standardNumTrays: recipe.standardNumTrays || undefined,
      });
      setSelectedIngredients(
        recipe.ingredients?.map((i) => ({
          ingredientId: i.ingredientId,
          quantity: i.quantity,
          componentName: i.componentName,
          unit: i.unit || "g",
        })) || []
      );
      setSelectedMaterials(
        recipe.materials?.map((m) => ({
          materialId: m.materialId,
          quantity: m.quantity,
        })) || []
      );
      setProcedureSteps(parsedProcedures);
      setPricingMarginSlider(parseFloat(recipe.targetMargin) || 50);
    }
  }, [recipe, form]);

  const serializeProcedures = (): string => {
    if (procedureSteps.length === 0) return "";
    return JSON.stringify(procedureSteps);
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: any = {
        ...data,
        procedures: serializeProcedures(),
        ingredients: selectedIngredients,
        materials: selectedMaterials,
      };

      if (isTemplate) {
        payload.isFreeRecipe = true;
        payload.isVisible = true;
        payload.accessType = accessType;
        if (accessType === "by-plan") {
          payload.allowedPlans = Array.from(selectedPlans).join(",");
        } else if (accessType === "selected-users") {
          payload.allowedUserEmails = userEmails;
        }
      }

      const response = await apiRequest("POST", "/api/recipes", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/free-recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/overview"] });
      toast({
        title: "Success",
        description: isTemplate ? "Free recipe template created successfully" : "Recipe created successfully",
      });
      setLocation(isTemplate ? "/library/bentohub-library" : "/recipes");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create recipe",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("PATCH", `/api/recipes/${recipeId}`, {
        ...data,
        procedures: serializeProcedures(),
        ingredients: selectedIngredients,
        materials: selectedMaterials,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", recipeId] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/overview"] });
      toast({
        title: "Success",
        description: "Recipe updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update recipe",
        variant: "destructive",
      });
    },
  });

  const watchedMargin = form.watch("targetMargin");
  const watchedFoodCost = form.watch("targetFoodCost");
  const watchedLaborCost = form.watch("laborCost");
  const watchedBatchYield = form.watch("batchYield");
  const watchedStandardYieldPieces = form.watch("standardYieldPieces");
  const watchedStandardYieldWeight = form.watch("standardYieldWeightPerPiece");
  const watchedStandardPanSize = form.watch("standardPanSize");
  const watchedStandardNumTrays = form.watch("standardNumTrays");

  const getQuantityInGrams = (item: { ingredientId: string; quantity: string; unit?: string }, ingredient: Ingredient | undefined) => {
    if (!ingredient) return 0;
    const quantity = parseFloat(item.quantity);
    if (isNaN(quantity)) return 0;
    
    const isCountBased = ingredient.isCountBased || false;
    const currentUnit = item.unit || "g";
    const weightPerPiece = parseFloat(ingredient.weightPerPiece || "0");
    
    if (isCountBased && currentUnit === "pcs" && weightPerPiece > 0) {
      return quantity * weightPerPiece;
    }
    return quantity;
  };

  const ingredientsCost = useMemo(() => {
    if (!ingredients) return 0;
    return selectedIngredients.reduce((sum, item) => {
      const ingredient = ingredients.find((i) => i.id === item.ingredientId);
      if (!ingredient) return sum;
      const quantityInGrams = getQuantityInGrams(item, ingredient);
      const pricePerGram = parseFloat(ingredient.pricePerGram);
      if (isNaN(pricePerGram)) return sum;
      return sum + pricePerGram * quantityInGrams;
    }, 0);
  }, [selectedIngredients, ingredients]);

  const materialsCost = useMemo(() => {
    if (!materials) return 0;
    return selectedMaterials.reduce((sum, item) => {
      const material = materials.find((m) => m.id === item.materialId);
      if (!material) return sum;
      const quantity = parseFloat(item.quantity);
      const pricePerUnit = parseFloat(material.pricePerUnit);
      if (isNaN(quantity) || isNaN(pricePerUnit)) return sum;
      return sum + pricePerUnit * quantity;
    }, 0);
  }, [selectedMaterials, materials]);

  const laborCostValue = useMemo(() => {
    return parseFloat(watchedLaborCost || "0") || 0;
  }, [watchedLaborCost]);

  const totalCost = useMemo(() => {
    return ingredientsCost + materialsCost + laborCostValue;
  }, [ingredientsCost, materialsCost, laborCostValue]);

  const batchYieldValue = useMemo(() => {
    return watchedBatchYield || 1;
  }, [watchedBatchYield]);

  const costPerUnit = useMemo(() => {
    if (batchYieldValue <= 0) return totalCost;
    return totalCost / batchYieldValue;
  }, [totalCost, batchYieldValue]);

  const suggestedPriceByMargin = useMemo(() => {
    const marginValue = parseFloat(watchedMargin);
    if (isNaN(marginValue) || marginValue >= 100 || marginValue < 0) return 0;
    const margin = marginValue / 100;
    return costPerUnit / (1 - margin);
  }, [costPerUnit, watchedMargin]);

  const suggestedPriceByFoodCost = useMemo(() => {
    const foodCostValue = parseFloat(watchedFoodCost);
    if (isNaN(foodCostValue) || foodCostValue <= 0 || foodCostValue >= 100) return 0;
    return ingredientsCost / batchYieldValue / (foodCostValue / 100);
  }, [ingredientsCost, batchYieldValue, watchedFoodCost]);

  const sliderPrice = useMemo(() => {
    if (pricingMarginSlider >= 100 || pricingMarginSlider < 0) return 0;
    return costPerUnit / (1 - pricingMarginSlider / 100);
  }, [costPerUnit, pricingMarginSlider]);

  const sliderProfit = useMemo(() => {
    return sliderPrice - costPerUnit;
  }, [sliderPrice, costPerUnit]);

  const sliderFoodCostPercent = useMemo(() => {
    if (sliderPrice <= 0) return 0;
    return (ingredientsCost / batchYieldValue / sliderPrice) * 100;
  }, [ingredientsCost, batchYieldValue, sliderPrice]);

  const originalTotalDoughWeight = useMemo(() => {
    if (!ingredients) return 0;
    return selectedIngredients.reduce((sum, item) => {
      const ingredient = ingredients.find((i) => i.id === item.ingredientId);
      const qty = getQuantityInGrams(item, ingredient);
      return sum + qty;
    }, 0);
  }, [selectedIngredients, ingredients]);

  const dominantIngredient = useMemo(() => {
    if (!ingredients || selectedIngredients.length === 0) return null;

    const flourIngredient = selectedIngredients.find((item) => {
      const ing = ingredients.find((i) => i.id === item.ingredientId);
      if (!ing) return false;
      return FLOUR_KEYWORDS.some((keyword) =>
        ing.name.toLowerCase().includes(keyword)
      );
    });

    if (flourIngredient) {
      const ing = ingredients.find((i) => i.id === flourIngredient.ingredientId);
      const qtyInGrams = getQuantityInGrams(flourIngredient, ing);
      return {
        id: flourIngredient.ingredientId,
        name: ing?.name || "Flour",
        quantity: qtyInGrams,
        isFlour: true,
      };
    }

    let maxItem: { ingredientId: string; quantity: string; componentName?: string | null; unit?: string } | null = null;
    let maxQty = 0;
    for (const item of selectedIngredients) {
      const ing = ingredients.find((i) => i.id === item.ingredientId);
      const qty = getQuantityInGrams(item, ing);
      if (qty > maxQty) {
        maxQty = qty;
        maxItem = item;
      }
    }

    if (maxItem !== null) {
      const foundItem = maxItem;
      const ing = ingredients.find((i) => i.id === foundItem.ingredientId);
      return {
        id: foundItem.ingredientId,
        name: ing?.name || "Unknown",
        quantity: maxQty,
        isFlour: false,
      };
    }

    return null;
  }, [selectedIngredients, ingredients]);

  const bakerPercentages = useMemo(() => {
    if (!ingredients || !dominantIngredient || dominantIngredient.quantity <= 0) return [];

    return selectedIngredients.map((item) => {
      const ing = ingredients.find((i) => i.id === item.ingredientId);
      const qtyInGrams = getQuantityInGrams(item, ing);
      const percentage = (qtyInGrams / dominantIngredient.quantity) * 100;
      return {
        ingredientId: item.ingredientId,
        name: ing?.name || "Unknown",
        originalWeight: qtyInGrams,
        bakerPercentage: percentage,
        pricePerGram: parseFloat(ing?.pricePerGram || "0"),
      };
    });
  }, [selectedIngredients, ingredients, dominantIngredient]);

  const scalingDesiredTotalWeight = useMemo(() => {
    const pieces = parseFloat(scalingDesiredPieces) || 0;
    const weight = parseFloat(scalingWeightPerPiece) || 0;
    return pieces * weight;
  }, [scalingDesiredPieces, scalingWeightPerPiece]);

  const scalingFlourFactor = useMemo(() => {
    const totalBakersPercent = bakerPercentages.reduce((sum, i) => sum + i.bakerPercentage, 0);
    if (totalBakersPercent <= 0) return 0;
    return 100 / totalBakersPercent;
  }, [bakerPercentages]);

  const scalingRequiredFlour = useMemo(() => {
    return scalingFlourFactor * scalingDesiredTotalWeight;
  }, [scalingFlourFactor, scalingDesiredTotalWeight]);

  const handleScaleRecipe = () => {
    if (!ingredients || scalingFlourFactor <= 0) {
      toast({
        title: "Cannot scale",
        description: "Please enter valid desired pieces and weight per piece",
        variant: "destructive",
      });
      return;
    }

    const roundedFlourWeight = Math.round(scalingRequiredFlour);
    let scaled: ScaledIngredient[] = bakerPercentages.map((item) => {
      const newWeight = (roundedFlourWeight / 100) * item.bakerPercentage;
      return {
        ingredientId: item.ingredientId,
        name: item.name,
        originalWeight: item.originalWeight,
        bakerPercentage: item.bakerPercentage,
        newWeight: newWeight,
        originalCost: item.originalWeight * item.pricePerGram,
        newCost: newWeight * item.pricePerGram,
        pricePerGram: item.pricePerGram,
      };
    });
    
    if (dominantIngredient) {
      scaled.sort((a, b) => {
        if (a.ingredientId === dominantIngredient.id) return -1;
        if (b.ingredientId === dominantIngredient.id) return 1;
        return 0;
      });
    }

    setScaledIngredients(scaled);
    setHasScaled(true);
    toast({
      title: "Recipe scaled successfully",
      description: `Scaled from ${batchYieldValue} to ${scalingDesiredPieces} pieces`,
    });
  };

  const handleApplyScaledWeights = () => {
    if (!hasScaled || scaledIngredients.length === 0) {
      toast({
        title: "No scaled recipe",
        description: "Please scale the recipe first before applying",
        variant: "destructive",
      });
      return;
    }

    const updatedIngredients = selectedIngredients.map((item) => {
      const scaledItem = scaledIngredients.find((s) => s.ingredientId === item.ingredientId);
      if (scaledItem) {
        return {
          ...item,
          quantity: scaledItem.newWeight.toFixed(2),
          unit: item.unit || "g",
        };
      }
      return item;
    });
    setSelectedIngredients(updatedIngredients);

    const newPieces = parseFloat(scalingDesiredPieces) || batchYieldValue;
    form.setValue("batchYield", newPieces);

    const scaledMaterialQty = selectedMaterials.map((item) => ({
      ...item,
      quantity: (parseFloat(item.quantity) * scalingFlourFactor).toFixed(0),
    }));
    setSelectedMaterials(scaledMaterialQty);

    const newLaborCost = (laborCostValue * scalingFlourFactor).toFixed(2);
    form.setValue("laborCost", newLaborCost);

    setHasScaled(false);
    setScaledIngredients([]);
    setScalingDesiredPieces("");
    setScalingWeightPerPiece("");

    toast({
      title: "Weights applied",
      description: `Recipe updated to ${newPieces} pieces. Don't forget to save!`,
    });
  };

  const scaledTotalCost = useMemo(() => {
    if (!hasScaled) return 0;
    const ingredientsCostScaled = scaledIngredients.reduce((sum, item) => sum + item.newCost, 0);
    const scaledMaterialsCost = materialsCost * scalingFlourFactor;
    const scaledLaborCost = laborCostValue * scalingFlourFactor;
    return ingredientsCostScaled + scaledMaterialsCost + scaledLaborCost;
  }, [hasScaled, scaledIngredients, materialsCost, laborCostValue, scalingFlourFactor]);

  const scaledCostPerPiece = useMemo(() => {
    const pieces = parseFloat(scalingDesiredPieces) || 0;
    if (pieces <= 0 || !hasScaled) return 0;
    return scaledTotalCost / pieces;
  }, [scaledTotalCost, scalingDesiredPieces, hasScaled]);

  const scaledSuggestedPrice = useMemo(() => {
    const marginValue = parseFloat(watchedMargin) || 50;
    if (marginValue >= 100 || marginValue < 0) return 0;
    return scaledCostPerPiece / (1 - marginValue / 100);
  }, [scaledCostPerPiece, watchedMargin]);

  const validateAndSubmit = (data: FormData) => {
    const recipeName = form.getValues("name");
    if (!recipeName || recipeName.trim() === "") {
      setActiveTab("overview");
      toast({
        title: "Missing Required Field",
        description: "Please fill out the Recipe Name in the Overview tab before saving.",
        variant: "destructive",
      });
      return;
    }

    if (recipeId) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const addIngredient = () => {
    setSelectedIngredients([...selectedIngredients, { ingredientId: "", quantity: "0", componentName: null, unit: "g" }]);
  };

  const removeIngredient = (index: number) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (
    index: number,
    field: "ingredientId" | "quantity" | "componentName" | "unit",
    value: string
  ) => {
    if (field === "ingredientId" && value === "__add_new__") {
      setPendingIngredientIndex(index);
      setShowAddIngredient(true);
      return;
    }
    const updated = [...selectedIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedIngredients(updated);
  };

  const handleNewIngredientAdded = (ingredientId: string) => {
    if (pendingIngredientIndex !== null) {
      const updated = [...selectedIngredients];
      updated[pendingIngredientIndex] = { ...updated[pendingIngredientIndex], ingredientId };
      setSelectedIngredients(updated);
      setPendingIngredientIndex(null);
    }
  };

  const addMaterial = () => {
    setSelectedMaterials([...selectedMaterials, { materialId: "", quantity: "1" }]);
  };

  const removeMaterial = (index: number) => {
    setSelectedMaterials(selectedMaterials.filter((_, i) => i !== index));
  };

  const updateMaterial = (index: number, field: "materialId" | "quantity", value: string) => {
    if (field === "materialId" && value === "__add_new__") {
      setPendingMaterialIndex(index);
      setShowAddMaterial(true);
      return;
    }
    const updated = [...selectedMaterials];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedMaterials(updated);
  };

  const handleNewMaterialAdded = (materialId: string) => {
    if (pendingMaterialIndex !== null) {
      const updated = [...selectedMaterials];
      updated[pendingMaterialIndex] = { ...updated[pendingMaterialIndex], materialId };
      setSelectedMaterials(updated);
      setPendingMaterialIndex(null);
    }
  };

  const addProcedure = () => {
    setProcedureSteps([...procedureSteps, { componentName: "", text: "" }]);
  };

  const removeProcedure = (index: number) => {
    setProcedureSteps(procedureSteps.filter((_, i) => i !== index));
  };

  const updateProcedure = (index: number, field: "componentName" | "text", value: string) => {
    const updated = [...procedureSteps];
    updated[index] = { ...updated[index], [field]: value };
    setProcedureSteps(updated);
  };

  const moveIngredient = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedIngredients.length) return;
    const updated = [...selectedIngredients];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setSelectedIngredients(updated);
  };

  const moveMaterial = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedMaterials.length) return;
    const updated = [...selectedMaterials];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setSelectedMaterials(updated);
  };

  const moveProcedure = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= procedureSteps.length) return;
    const updated = [...procedureSteps];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setProcedureSteps(updated);
  };

  if (ingredientsLoading || materialsLoading || (recipeId && recipeLoading)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/recipes")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-recipe-form">
            {isViewMode ? "View Recipe" : recipeId ? "Edit Recipe" : "New Recipe"}
          </h1>
          <p className="text-muted-foreground" data-testid="text-recipe-form-description">
            {isViewMode ? "Recipe details, costs, and pricing analysis" : recipeId ? "Update recipe details, costs, and pricing" : "Create a new recipe with full cost analysis"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(validateAndSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview" data-testid="tab-overview">
                <ClipboardList className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="ingredients" data-testid="tab-ingredients">
                <Package className="h-4 w-4 mr-2" />
                Ingredients
              </TabsTrigger>
              <TabsTrigger value="costing" data-testid="tab-costing">
                <Calculator className="h-4 w-4 mr-2" />
                Costing
              </TabsTrigger>
              <TabsTrigger value="pricing" data-testid="tab-pricing">
                <TrendingUp className="h-4 w-4 mr-2" />
                Pricing
              </TabsTrigger>
              <TabsTrigger value="scaling" data-testid="tab-scaling">
                <Scale className="h-4 w-4 mr-2" />
                Scaling
              </TabsTrigger>
              <TabsTrigger value="forecast" data-testid="tab-forecast">
                <BarChart3 className="h-4 w-4 mr-2" />
                Forecast
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recipe Details</CardTitle>
                  <CardDescription>Basic information about your recipe</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {isViewMode ? (
                      <div>
                        <FormLabel>Recipe Name *</FormLabel>
                        <div className="mt-2 p-2 text-sm">{form.getValues("name")}</div>
                      </div>
                    ) : (
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recipe Name *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g., Chocolate Cake"
                                data-testid="input-recipe-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {isViewMode ? (
                      <div>
                        <FormLabel>Category</FormLabel>
                        <div className="mt-2 p-2 text-sm">{form.getValues("category") || "-"}</div>
                      </div>
                    ) : (
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g., Desserts, Bread"
                                data-testid="input-recipe-category"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  {isViewMode ? (
                    <div>
                      <FormLabel>Description</FormLabel>
                      <div className="mt-2 p-2 text-sm whitespace-pre-wrap">{form.getValues("description") || "-"}</div>
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Brief description of the recipe"
                              rows={3}
                              data-testid="input-recipe-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Standard Recipe Yield</CardTitle>
                  <CardDescription>Standard batch configuration for production and scaling</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-4">
                    {isViewMode ? (
                      <>
                        <div>
                          <FormLabel>Number of Pieces</FormLabel>
                          <div className="mt-2 p-2 text-sm">{form.getValues("standardYieldPieces") || "-"}</div>
                        </div>
                        <div>
                          <FormLabel>Weight per Piece (g)</FormLabel>
                          <div className="mt-2 p-2 text-sm">{form.getValues("standardYieldWeightPerPiece") || "-"}</div>
                        </div>
                        <div>
                          <FormLabel>Batch Yield</FormLabel>
                          <div className="mt-2 p-2 text-sm">{form.getValues("batchYield") || "-"}</div>
                        </div>
                        <div>
                          <FormLabel>Serving Size (portions)</FormLabel>
                          <div className="mt-2 p-2 text-sm">{form.getValues("servings") || "-"}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <FormField
                          control={form.control}
                          name="standardYieldPieces"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Pieces</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min="1"
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(val === "" ? undefined : Number(val));
                                  }}
                                  placeholder="e.g., 24"
                                  data-testid="input-kitchen-setup-pieces"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="standardYieldWeightPerPiece"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Weight per Piece (g)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(val === "" ? undefined : Number(val));
                                  }}
                                  placeholder="e.g., 50"
                                  data-testid="input-kitchen-setup-weight"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="batchYield"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Batch Yield</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min="1"
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(val === "" ? undefined : Number(val));
                                  }}
                                  placeholder="e.g., 24"
                                  data-testid="input-batch-yield"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="servings"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Serving Size (portions)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min="1"
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(val === "" ? undefined : Number(val));
                                  }}
                                  placeholder="e.g., 8"
                                  data-testid="input-serving-size"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {isViewMode ? (
                      <>
                        <div>
                          <FormLabel>Pan Size</FormLabel>
                          <div className="mt-2 p-2 text-sm">{form.getValues("standardPanSize") || "-"}</div>
                        </div>
                        <div>
                          <FormLabel>Number of Trays</FormLabel>
                          <div className="mt-2 p-2 text-sm">{form.getValues("standardNumTrays") || "-"}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <FormField
                          control={form.control}
                          name="standardPanSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pan Size</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="e.g., 9x13, 10-inch round"
                                  data-testid="input-standard-pan-size"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="standardNumTrays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Trays</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min="1"
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(val === "" ? undefined : Number(val));
                                  }}
                                  placeholder="e.g., 1"
                                  data-testid="input-standard-num-trays"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ingredients" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Ingredients</CardTitle>
                      <CardDescription>Food items used in this recipe</CardDescription>
                    </div>
                    {!isViewMode && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addIngredient}
                        data-testid="button-add-recipe-ingredient"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Ingredient
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedIngredients.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg border-dashed" data-testid="empty-state-recipe-ingredients">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        No ingredients added yet. Click "Add Ingredient" to start.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedIngredients.map((item, index) => {
                        const selectedIng = ingredients?.find((i) => i.id === item.ingredientId);
                        const isCountBased = selectedIng?.isCountBased || false;
                        const weightPerPiece = parseFloat(selectedIng?.weightPerPiece || "0");
                        const currentUnit = item.unit || "g";
                        
                        let quantityInGrams = parseFloat(item.quantity) || 0;
                        let displayConversion = "";
                        
                        if (isCountBased && currentUnit === "pcs" && weightPerPiece > 0) {
                          quantityInGrams = parseFloat(item.quantity) * weightPerPiece;
                          displayConversion = `${quantityInGrams.toFixed(1)}g`;
                        } else if (isCountBased && currentUnit === "g" && weightPerPiece > 0) {
                          const pieces = parseFloat(item.quantity) / weightPerPiece;
                          displayConversion = `${pieces.toFixed(1)} pcs`;
                        }
                        
                        const itemCost = selectedIng
                          ? quantityInGrams * parseFloat(selectedIng.pricePerGram)
                          : 0;
                        return (
                          <div key={index} className="flex flex-col gap-1" data-testid={`ingredient-row-${index}`}>
                            <div className="flex gap-2 items-start">
                              {!isViewMode && (
                                <div className="flex flex-col">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => moveIngredient(index, "up")}
                                    disabled={index === 0}
                                    data-testid={`button-move-ingredient-up-${index}`}
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => moveIngredient(index, "down")}
                                    disabled={index === selectedIngredients.length - 1}
                                    data-testid={`button-move-ingredient-down-${index}`}
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                              {isViewMode ? (
                                <>
                                  {item.componentName && (
                                    <div className="w-36 text-sm font-medium">{item.componentName}</div>
                                  )}
                                  <div className="flex-1 text-sm">{selectedIng?.name}</div>
                                  <div className="w-20 text-sm text-right">{item.quantity} {currentUnit}</div>
                                  {isCountBased && displayConversion && (
                                    <div className="text-sm text-muted-foreground">≈ {displayConversion}</div>
                                  )}
                                  <div className="w-20 text-right text-sm font-medium">
                                    {formatCurrency(isNaN(itemCost) ? "0.00" : itemCost.toFixed(2), user?.currency || "USD")}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="w-36">
                                    <Input
                                      placeholder="Component"
                                      value={item.componentName || ""}
                                      onChange={(e) => updateIngredient(index, "componentName", e.target.value)}
                                      data-testid={`input-component-${index}`}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Select
                                      value={item.ingredientId}
                                      onValueChange={(value) => updateIngredient(index, "ingredientId", value)}
                                    >
                                      <SelectTrigger data-testid={`select-ingredient-${index}`}>
                                        <SelectValue placeholder="Select ingredient" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="__add_new__" data-testid="option-add-new-ingredient">
                                          <span className="flex items-center gap-2 text-primary">
                                            <Plus className="h-4 w-4" />
                                            Add New Ingredient
                                          </span>
                                        </SelectItem>
                                        {sortedIngredients.map((ing) => (
                                          <SelectItem key={ing.id} value={ing.id}>
                                            {ing.name} {ing.isCountBased ? "(count)" : ""} ({formatCurrency(Number(ing.pricePerGram).toFixed(4), user?.currency || "USD")}/g)
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="w-20">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      placeholder="Qty"
                                      value={item.quantity}
                                      onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                                      data-testid={`input-quantity-${index}`}
                                    />
                                  </div>
                                  {isCountBased ? (
                                    <div className="w-16">
                                      <Select
                                        value={currentUnit}
                                        onValueChange={(value) => updateIngredient(index, "unit", value)}
                                      >
                                        <SelectTrigger data-testid={`select-unit-${index}`}>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="g">g</SelectItem>
                                          <SelectItem value="pcs">pcs</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  ) : (
                                    <div className="w-16 text-sm text-muted-foreground pt-2 text-center">
                                      g
                                    </div>
                                  )}
                                  <div className="w-20 text-right text-sm text-muted-foreground pt-2">
                                    {formatCurrency(isNaN(itemCost) ? "0.00" : itemCost.toFixed(2), user?.currency || "USD")}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeIngredient(index)}
                                    data-testid={`button-remove-ingredient-${index}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                            {isCountBased && displayConversion && (
                              <div className="ml-20 text-xs text-muted-foreground" data-testid={`conversion-${index}`}>
                                ≈ {displayConversion}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div className="flex justify-end pt-2 border-t">
                        <div className="text-sm font-medium">
                          Ingredients Total: <span className="text-primary">{formatCurrency(ingredientsCost.toFixed(2), user?.currency || "USD")}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Packaging & Materials</CardTitle>
                      <CardDescription>Containers, labels, and other materials</CardDescription>
                    </div>
                    {!isViewMode && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addMaterial}
                        data-testid="button-add-recipe-material"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Material
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedMaterials.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg border-dashed" data-testid="empty-state-recipe-materials">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        No materials added yet. Add packaging or equipment costs.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedMaterials.map((item, index) => {
                        const selectedMat = materials?.find((m) => m.id === item.materialId);
                        const itemCost = selectedMat
                          ? parseFloat(item.quantity) * parseFloat(selectedMat.pricePerUnit)
                          : 0;
                        return (
                          <div key={index} className="flex gap-2 items-center" data-testid={`material-row-${index}`}>
                            {!isViewMode && (
                              <div className="flex flex-col">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => moveMaterial(index, "up")}
                                  disabled={index === 0}
                                  data-testid={`button-move-material-up-${index}`}
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => moveMaterial(index, "down")}
                                  disabled={index === selectedMaterials.length - 1}
                                  data-testid={`button-move-material-down-${index}`}
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            {isViewMode ? (
                              <>
                                <div className="flex-1 text-sm">{selectedMat?.name}</div>
                                <div className="w-28 text-sm text-right">{item.quantity} {selectedMat?.unit}</div>
                                <div className="w-20 text-right text-sm font-medium">
                                  {formatCurrency(isNaN(itemCost) ? "0.00" : itemCost.toFixed(2), user?.currency || "USD")}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex-1">
                                  <Select
                                    value={item.materialId}
                                    onValueChange={(value) => updateMaterial(index, "materialId", value)}
                                  >
                                    <SelectTrigger data-testid={`select-material-${index}`}>
                                      <SelectValue placeholder="Select material" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__add_new__">
                                        <span className="flex items-center gap-2 text-primary">
                                          <Plus className="h-4 w-4" />
                                          Add New Material
                                        </span>
                                      </SelectItem>
                                      {sortedMaterials.map((mat) => (
                                        <SelectItem key={mat.id} value={mat.id}>
                                          {mat.name} ({formatCurrency(Number(mat.pricePerUnit).toFixed(2), user?.currency || "USD")}/{mat.unit})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="w-28">
                                  <Input
                                    type="number"
                                    step="1"
                                    min="0"
                                    placeholder="Qty"
                                    value={item.quantity}
                                    onChange={(e) => updateMaterial(index, "quantity", e.target.value)}
                                    data-testid={`input-material-quantity-${index}`}
                                  />
                                </div>
                                <div className="w-20 text-right text-sm text-muted-foreground">
                                  {formatCurrency(isNaN(itemCost) ? "0.00" : itemCost.toFixed(2), user?.currency || "USD")}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeMaterial(index)}
                                  data-testid={`button-remove-material-${index}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        );
                      })}
                      <div className="flex justify-end pt-2 border-t">
                        <div className="text-sm font-medium">
                          Materials Total: <span className="text-primary">{formatCurrency(materialsCost.toFixed(2), user?.currency || "USD")}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Procedures</CardTitle>
                      <CardDescription>Step-by-step instructions for preparing this recipe</CardDescription>
                    </div>
                    {!isViewMode && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addProcedure}
                        data-testid="button-add-procedure"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Procedure
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {procedureSteps.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg border-dashed" data-testid="empty-state-procedures">
                      <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        No procedures added yet. Click "Add Procedure" to start.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {procedureSteps.map((step, index) => (
                        <div key={index} className="flex gap-2 items-start" data-testid={`procedure-row-${index}`}>
                          {!isViewMode && (
                            <div className="flex flex-col">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => moveProcedure(index, "up")}
                                disabled={index === 0}
                                data-testid={`button-move-procedure-up-${index}`}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => moveProcedure(index, "down")}
                                disabled={index === procedureSteps.length - 1}
                                data-testid={`button-move-procedure-down-${index}`}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {isViewMode ? (
                            <div className="flex-1 space-y-2">
                              {step.componentName && (
                                <div className="text-sm font-medium">{step.componentName}</div>
                              )}
                              <div className="text-sm whitespace-pre-wrap">{step.text}</div>
                            </div>
                          ) : (
                            <>
                              <div className="w-36">
                                <Input
                                  placeholder="Component"
                                  value={step.componentName}
                                  onChange={(e) => updateProcedure(index, "componentName", e.target.value)}
                                  data-testid={`input-procedure-component-${index}`}
                                />
                              </div>
                              <div className="flex-1">
                                <Textarea
                                  placeholder="Step instructions..."
                                  value={step.text}
                                  onChange={(e) => updateProcedure(index, "text", e.target.value)}
                                  rows={2}
                                  data-testid={`input-procedure-text-${index}`}
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeProcedure(index)}
                                data-testid={`button-remove-procedure-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="costing" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Cost Breakdown</CardTitle>
                    <CardDescription>All costs for producing one batch</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Ingredients Cost</span>
                        <span className="font-medium" data-testid="text-ingredients-cost">
                          {formatCurrency(ingredientsCost.toFixed(2), user?.currency || "USD")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Materials & Packaging</span>
                        <span className="font-medium" data-testid="text-materials-cost">
                          {formatCurrency(materialsCost.toFixed(2), user?.currency || "USD")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        {isViewMode ? (
                          <div className="flex justify-between items-center w-full">
                            <span className="text-muted-foreground">Labor Cost ({user?.currency || "USD"})</span>
                            <span className="font-medium text-right w-28">{formatCurrency(laborCostValue.toFixed(2), user?.currency || "USD")}</span>
                          </div>
                        ) : (
                          <div className="flex-1 mr-4">
                            <FormField
                              control={form.control}
                              name="laborCost"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between space-y-0">
                                  <FormLabel className="text-muted-foreground">Labor Cost ({user?.currency || "USD"})</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      className="w-28 text-right"
                                      data-testid="input-labor-cost"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center py-3 bg-muted rounded-lg px-3">
                        <span className="font-semibold">Total Batch Cost</span>
                        <span className="text-xl font-bold text-primary" data-testid="text-total-batch-cost">
                          {formatCurrency(totalCost.toFixed(2), user?.currency || "USD")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Per Unit Analysis</CardTitle>
                    <CardDescription>Cost per sellable unit (based on batch yield of {batchYieldValue})</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Ingredients per Unit</span>
                        <span className="font-medium">
                          {formatCurrency((ingredientsCost / batchYieldValue).toFixed(2), user?.currency || "USD")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Materials per Unit</span>
                        <span className="font-medium">
                          {formatCurrency((materialsCost / batchYieldValue).toFixed(2), user?.currency || "USD")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Labor per Unit</span>
                        <span className="font-medium">
                          {formatCurrency((laborCostValue / batchYieldValue).toFixed(2), user?.currency || "USD")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 bg-muted rounded-lg px-3">
                        <span className="font-semibold">Cost per Unit</span>
                        <span className="text-xl font-bold text-primary" data-testid="text-cost-per-unit">
                          {formatCurrency(costPerUnit.toFixed(2), user?.currency || "USD")}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <h4 className="font-medium">Target Calculations</h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="targetMargin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target Margin (%)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min="0"
                                  max="99"
                                  step="1"
                                  data-testid="input-recipe-margin"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="targetFoodCost"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target Food Cost (%)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min="1"
                                  max="100"
                                  step="1"
                                  data-testid="input-recipe-food-cost"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 pt-2">
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-xs text-muted-foreground">Price @ {watchedMargin}% Margin</div>
                          <div className="text-lg font-bold text-primary" data-testid="text-suggested-price-margin">
                            {formatCurrency(suggestedPriceByMargin.toFixed(2), user?.currency || "USD")}
                          </div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-xs text-muted-foreground">Price @ {watchedFoodCost}% Food Cost</div>
                          <div className="text-lg font-bold text-primary" data-testid="text-suggested-price-food-cost">
                            {formatCurrency(suggestedPriceByFoodCost.toFixed(2), user?.currency || "USD")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Interactive Pricing</CardTitle>
                  <CardDescription>
                    Use the slider to find your ideal price point balancing margin and competitiveness
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Profit Margin: {pricingMarginSlider}%</Label>
                    </div>
                    <Slider
                      value={[pricingMarginSlider]}
                      onValueChange={([value]) => setPricingMarginSlider(value)}
                      min={0}
                      max={90}
                      step={1}
                      className="w-full"
                      data-testid="slider-margin"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0% margin (break-even)</span>
                      <span>90% margin</span>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground font-medium">Suggested Retail Price (per unit)</div>
                      <div className="text-3xl font-bold text-primary" data-testid="text-srp-per-unit">
                        {formatCurrency(sliderPrice.toFixed(2), user?.currency || "USD")}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground font-medium">Batch SRP ({batchYieldValue} units)</div>
                      <div className="text-3xl font-bold text-primary" data-testid="text-srp-batch">
                        {formatCurrency((sliderPrice * batchYieldValue).toFixed(2), user?.currency || "USD")}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-muted/50">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <DollarSign className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <div className="text-xs text-muted-foreground">Cost per Unit</div>
                          <div className="text-xl font-bold">{formatCurrency(costPerUnit.toFixed(2), user?.currency || "USD")}</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/50">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <TrendingUp className="h-8 w-8 mx-auto text-green-600 mb-2" />
                          <div className="text-xs text-muted-foreground">Profit per Unit</div>
                          <div className="text-xl font-bold text-green-600" data-testid="text-slider-profit">
                            {formatCurrency(sliderProfit.toFixed(2), user?.currency || "USD")}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/50">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Calculator className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <div className="text-xs text-muted-foreground">Food Cost %</div>
                          <div className="text-xl font-bold" data-testid="text-slider-food-cost">
                            {sliderFoodCostPercent.toFixed(1)}%
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Batch Projections (Yield: {batchYieldValue} units)</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Total Batch Revenue</div>
                        <div className="text-2xl font-bold">
                          {formatCurrency((sliderPrice * batchYieldValue).toFixed(2), user?.currency || "USD")}
                        </div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Total Batch Profit</div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency((sliderProfit * batchYieldValue).toFixed(2), user?.currency || "USD")}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scaling" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pan Conversion</h3>
                <CakePanConverter 
                  selectedIngredients={selectedIngredients.map(ing => ({ ...ing, unit: ing.unit || "g" }))}
                  ingredients={ingredients}
                  getQuantityInGrams={getQuantityInGrams}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Scale className="h-5 w-5" />
                      Baker's Math Scaling
                    </CardTitle>
                    <CardDescription>
                      Scale your recipe based on desired pieces and weight per piece
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="desired-pieces">Desired # of Pieces</Label>
                          <Input
                            id="desired-pieces"
                            type="number"
                            min="1"
                            placeholder="e.g., 100"
                            value={scalingDesiredPieces}
                            onChange={(e) => setScalingDesiredPieces(e.target.value)}
                            data-testid="input-scaling-desired-pieces"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="weight-per-piece">Weight per Piece (g)</Label>
                          <Input
                            id="weight-per-piece"
                            type="number"
                            min="1"
                            step="0.1"
                            placeholder="e.g., 30"
                            value={scalingWeightPerPiece}
                            onChange={(e) => setScalingWeightPerPiece(e.target.value)}
                            data-testid="input-scaling-weight-per-piece"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-muted rounded-lg space-y-3">
                        <h4 className="font-medium text-sm">Auto-Calculated Values</h4>
                        <div className="grid gap-3 md:grid-cols-3">
                          <div>
                            <div className="text-xs text-muted-foreground">Desired Total Weight</div>
                            <div className="text-lg font-bold" data-testid="text-scaling-total-weight">
                              {scalingDesiredTotalWeight.toFixed(1)} g
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Flour Factor</div>
                            <div className="text-lg font-bold" data-testid="text-scaling-factor">
                              {scalingFlourFactor.toFixed(4)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Required Amount of Flour
                            </div>
                            <div className="text-lg font-bold" data-testid="text-scaling-required-flour">
                              {Math.round(scalingRequiredFlour)} g
                            </div>
                          </div>
                        </div>
                      </div>

                      {dominantIngredient && (
                        <div className="flex items-center gap-2">
                          <Badge variant={dominantIngredient.isFlour ? "default" : "secondary"}>
                            {dominantIngredient.isFlour ? "Flour Detected" : "Dominant Ingredient"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {dominantIngredient.name} ({dominantIngredient.quantity}g = 100%)
                          </span>
                        </div>
                      )}

                      <Button
                        type="button"
                        onClick={handleScaleRecipe}
                        disabled={!scalingDesiredPieces || !scalingWeightPerPiece || selectedIngredients.length === 0}
                        className="w-full"
                        data-testid="button-scale-recipe"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Scale Recipe
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Original Recipe</CardTitle>
                    <CardDescription>
                      Current batch yields {batchYieldValue} pieces ({originalTotalDoughWeight.toFixed(1)}g total)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedIngredients.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Add ingredients in the Ingredients tab first
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ingredient</TableHead>
                            <TableHead className="text-right">Baker's %</TableHead>
                            <TableHead className="text-right">Weight (g)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bakerPercentages.map((item) => (
                            <TableRow key={item.ingredientId} data-testid={`baker-row-${item.ingredientId}`}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell className="text-right">
                                {item.bakerPercentage.toFixed(1)}%
                              </TableCell>
                              <TableCell className="text-right">
                                {item.originalWeight.toFixed(1)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="font-bold bg-muted">
                            <TableCell>Total</TableCell>
                            <TableCell className="text-right">
                              {bakerPercentages.reduce((sum, i) => sum + i.bakerPercentage, 0).toFixed(1)}%
                            </TableCell>
                            <TableCell className="text-right">
                              {originalTotalDoughWeight.toFixed(1)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>

              {hasScaled && scaledIngredients.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">Scaled Recipe Results</CardTitle>
                    <CardDescription>
                      Scaled to {scalingDesiredPieces} pieces at {scalingWeightPerPiece}g each
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingredient</TableHead>
                          <TableHead className="text-right">Baker's %</TableHead>
                          <TableHead className="text-right">Original (g)</TableHead>
                          <TableHead className="text-right">New Weight (g)</TableHead>
                          <TableHead className="text-right">New Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scaledIngredients.map((item) => {
                          const ing = ingredients?.find((i) => i.id === item.ingredientId);
                          const isCountBased = ing?.isCountBased || false;
                          const weightPerPiece = parseFloat(ing?.weightPerPiece || "0");
                          const approxPieces = isCountBased && weightPerPiece > 0 
                            ? Math.round(item.newWeight / weightPerPiece * 10) / 10
                            : null;
                          
                          return (
                            <TableRow key={item.ingredientId} data-testid={`scaled-row-${item.ingredientId}`}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell className="text-right">
                                {item.bakerPercentage.toFixed(1)}%
                              </TableCell>
                              <TableCell className="text-right">
                                {item.originalWeight.toFixed(1)}
                              </TableCell>
                              <TableCell className="text-right font-medium text-green-600">
                                <div>{item.newWeight.toFixed(1)}</div>
                                {approxPieces !== null && (
                                  <div className="text-xs text-muted-foreground font-normal">
                                    ≈ {approxPieces} pcs
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                ${item.newCost.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow className="font-bold bg-muted">
                          <TableCell>Total</TableCell>
                          <TableCell className="text-right">
                            {scaledIngredients.reduce((sum, i) => sum + i.bakerPercentage, 0).toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right">
                            {originalTotalDoughWeight.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {scalingDesiredTotalWeight.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right">
                            ${scaledIngredients.reduce((sum, i) => sum + i.newCost, 0).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    <div className="grid gap-4 md:grid-cols-3">
                      <Card className="bg-muted/50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <DollarSign className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <div className="text-xs text-muted-foreground">Cost per Batch</div>
                            <div className="text-xl font-bold" data-testid="text-scaled-batch-cost">
                              ${scaledTotalCost.toFixed(2)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <Calculator className="h-8 w-8 mx-auto text-primary mb-2" />
                            <div className="text-xs text-muted-foreground">Cost per Piece</div>
                            <div className="text-xl font-bold text-primary" data-testid="text-scaled-cost-per-piece">
                              ${scaledCostPerPiece.toFixed(2)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <TrendingUp className="h-8 w-8 mx-auto text-green-600 mb-2" />
                            <div className="text-xs text-muted-foreground">Suggested SRP ({watchedMargin}% margin)</div>
                            <div className="text-xl font-bold text-green-600" data-testid="text-scaled-suggested-srp">
                              ${scaledSuggestedPrice.toFixed(2)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Alert>
                      <Scale className="h-4 w-4" />
                      <AlertDescription data-testid="text-scaling-summary">
                        For {scalingDesiredPieces} pieces, your cost per piece is ${scaledCostPerPiece.toFixed(2)} and suggested SRP is ${scaledSuggestedPrice.toFixed(2)}
                      </AlertDescription>
                    </Alert>

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        onClick={handleApplyScaledWeights}
                        className="flex-1"
                        data-testid="button-apply-scaled-weights"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Apply Scaled Weights to Recipe
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      This will update the ingredient quantities to the scaled values. Remember to save the recipe to persist changes.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="forecast" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Profit Forecast & Scale Readiness
                  </CardTitle>
                  <CardDescription>Project monthly profitability and determine if you're ready to scale</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm">Sales Assumptions</h4>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="forecast-units">Units Sold Per Month</Label>
                          <Input
                            id="forecast-units"
                            type="number"
                            min="1"
                            value={forecastUnitsPerMonth}
                            onChange={(e) => setForecastUnitsPerMonth(e.target.value)}
                            placeholder="e.g., 100"
                            data-testid="input-forecast-units"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="forecast-price">Selling Price per Unit ($)</Label>
                          <Input
                            id="forecast-price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={forecastSellingPrice}
                            onChange={(e) => setForecastSellingPrice(e.target.value)}
                            placeholder={sliderPrice.toFixed(2)}
                            data-testid="input-forecast-price"
                          />
                        </div>
                      </div>

                      <h4 className="font-semibold text-sm pt-2">Cost Assumptions</h4>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="forecast-packaging">Packaging Cost per Unit ($)</Label>
                          <Input
                            id="forecast-packaging"
                            type="number"
                            step="0.01"
                            min="0"
                            value={forecastPackagingCost}
                            onChange={(e) => setForecastPackagingCost(e.target.value)}
                            placeholder="e.g., 1.00"
                            data-testid="input-forecast-packaging"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="forecast-delivery">Delivery Costs (Monthly, $)</Label>
                          <Input
                            id="forecast-delivery"
                            type="number"
                            step="0.01"
                            min="0"
                            value={forecastDeliveryCost}
                            onChange={(e) => setForecastDeliveryCost(e.target.value)}
                            placeholder="e.g., 0"
                            data-testid="input-forecast-delivery"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="forecast-marketplace">Marketplace Fee (%)</Label>
                          <Input
                            id="forecast-marketplace"
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={forecastMarketplaceFee}
                            onChange={(e) => setForecastMarketplaceFee(e.target.value)}
                            placeholder="e.g., 0"
                            data-testid="input-forecast-marketplace"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="forecast-utilities">Utilities (Monthly, $)</Label>
                          <Input
                            id="forecast-utilities"
                            type="number"
                            step="0.01"
                            min="0"
                            value={forecastUtilities}
                            onChange={(e) => setForecastUtilities(e.target.value)}
                            placeholder="e.g., 0"
                            data-testid="input-forecast-utilities"
                          />
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const units = parseFloat(forecastUnitsPerMonth) || 0;
                      const price = parseFloat(forecastSellingPrice) || sliderPrice || 0;
                      const foodCost = costPerUnit || 0;
                      const packaging = parseFloat(forecastPackagingCost) || 0;
                      const delivery = parseFloat(forecastDeliveryCost) || 0;
                      const marketplaceFeePercent = parseFloat(forecastMarketplaceFee) || 0;
                      const utilities = parseFloat(forecastUtilities) || 0;

                      const revenue = units * price;
                      const directCostsPerUnit = foodCost + packaging;
                      const directCosts = directCostsPerUnit * units;
                      const grossProfit = revenue - directCosts;
                      const marketplaceFeeCost = (revenue * marketplaceFeePercent) / 100;
                      const totalOperatingExpenses = delivery + marketplaceFeeCost + utilities;
                      const netProfit = grossProfit - totalOperatingExpenses;
                      const netMarginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;

                      let readinessStatus = "not-ready";
                      let readinessColor = "bg-red-100 dark:bg-red-950 border-red-200 dark:border-red-800";
                      let readinessText = "Not Ready";
                      let readinessMessage = "Margins too low. Increase price or reduce costs.";

                      if (netMarginPercent >= 35) {
                        readinessStatus = "ready";
                        readinessColor = "bg-green-100 dark:bg-green-950 border-green-200 dark:border-green-800";
                        readinessText = "Ready to Scale";
                        readinessMessage = `At current performance, ${Math.ceil((units * 3) / 30)} units/day generates ₱${(netProfit * 3).toFixed(0)}/month.`;
                      } else if (netMarginPercent >= 20) {
                        readinessStatus = "caution";
                        readinessColor = "bg-yellow-100 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800";
                        readinessText = "Caution";
                        readinessMessage = "Profitable but tight margins. Test higher volumes before scaling.";
                      }

                      return (
                        <div className="space-y-4">
                          <Card className="bg-muted/50 border-0">
                            <CardContent className="pt-6 space-y-4">
                              <div className="space-y-2">
                                <div className="text-sm text-muted-foreground">Monthly Revenue</div>
                                <div className="text-3xl font-bold text-primary" data-testid="text-forecast-revenue">
                                  ₱{revenue.toFixed(0)}
                                </div>
                              </div>

                              <div className="grid gap-3 md:grid-cols-2">
                                <div className="p-3 bg-background rounded-lg">
                                  <div className="text-xs text-muted-foreground">Direct Costs</div>
                                  <div className="text-lg font-semibold" data-testid="text-forecast-direct-costs">
                                    ₱{directCosts.toFixed(0)}
                                  </div>
                                </div>
                                <div className="p-3 bg-background rounded-lg">
                                  <div className="text-xs text-muted-foreground">Gross Profit</div>
                                  <div className="text-lg font-semibold text-green-600" data-testid="text-forecast-gross-profit">
                                    ₱{grossProfit.toFixed(0)}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2 pt-2 border-t">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Marketplace Fees ({marketplaceFeePercent}%)</span>
                                  <span>-₱{marketplaceFeeCost.toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Delivery</span>
                                  <span>-₱{delivery.toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Utilities</span>
                                  <span>-₱{utilities.toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between font-bold pt-2 border-t">
                                  <span>Net Profit (Take-Home)</span>
                                  <span className={netProfit >= 0 ? "text-green-600" : "text-red-600"} data-testid="text-forecast-net-profit">
                                    ₱{netProfit.toFixed(0)}
                                  </span>
                                </div>
                              </div>

                              <div className="pt-2 text-xs text-muted-foreground">
                                <div>Profit per Unit: ₱{(price - directCostsPerUnit).toFixed(2)}</div>
                                <div>Net Margin: {netMarginPercent.toFixed(1)}%</div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className={`border ${readinessColor}`}>
                            <CardContent className="pt-6">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className={`h-3 w-3 rounded-full ${readinessStatus === "ready" ? "bg-green-600" : readinessStatus === "caution" ? "bg-yellow-600" : "bg-red-600"}`} />
                                  <h4 className="font-semibold" data-testid="text-forecast-readiness">
                                    {readinessText}
                                  </h4>
                                </div>
                                <p className="text-sm" data-testid="text-forecast-message">
                                  {readinessMessage}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {isTemplate && user?.role === "admin" && !isViewMode && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Access Control</CardTitle>
                <CardDescription>Who can use this recipe template?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="access-all"
                      name="accessType"
                      value="all"
                      checked={accessType === "all"}
                      onChange={() => setAccessType("all")}
                      className="w-4 h-4"
                      data-testid="radio-access-all"
                    />
                    <label htmlFor="access-all" className="text-sm font-medium cursor-pointer">
                      All users
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="access-only-me"
                      name="accessType"
                      value="only-me"
                      checked={accessType === "only-me"}
                      onChange={() => setAccessType("only-me")}
                      className="w-4 h-4"
                      data-testid="radio-access-only-me"
                    />
                    <label htmlFor="access-only-me" className="text-sm font-medium cursor-pointer">
                      Only me
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        id="access-by-plan"
                        name="accessType"
                        value="by-plan"
                        checked={accessType === "by-plan"}
                        onChange={() => setAccessType("by-plan")}
                        className="w-4 h-4"
                        data-testid="radio-access-by-plan"
                      />
                      <label htmlFor="access-by-plan" className="text-sm font-medium cursor-pointer">
                        By plan
                      </label>
                    </div>
                    {accessType === "by-plan" && (
                      <div className="ml-7 space-y-2">
                        {["Hobby", "Starter", "Pro"].map((plan) => (
                          <div key={plan} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`plan-${plan.toLowerCase()}`}
                              checked={selectedPlans.has(plan)}
                              onChange={(e) => {
                                const newPlans = new Set(selectedPlans);
                                if (e.target.checked) {
                                  newPlans.add(plan);
                                } else {
                                  newPlans.delete(plan);
                                }
                                setSelectedPlans(newPlans);
                              }}
                              className="w-4 h-4"
                              data-testid={`checkbox-plan-${plan.toLowerCase()}`}
                            />
                            <label htmlFor={`plan-${plan.toLowerCase()}`} className="text-sm cursor-pointer">
                              {plan}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        id="access-selected-users"
                        name="accessType"
                        value="selected-users"
                        checked={accessType === "selected-users"}
                        onChange={() => setAccessType("selected-users")}
                        className="w-4 h-4"
                        data-testid="radio-access-selected-users"
                      />
                      <label htmlFor="access-selected-users" className="text-sm font-medium cursor-pointer">
                        Selected users
                      </label>
                    </div>
                    {accessType === "selected-users" && (
                      <div className="ml-7">
                        <textarea
                          placeholder="Enter email addresses, one per line or comma-separated"
                          value={userEmails}
                          onChange={(e) => setUserEmails(e.target.value)}
                          className="w-full min-h-24 p-2 border rounded-md text-sm"
                          data-testid="textarea-selected-emails"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!isViewMode && (
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-recipe"
              >
                {recipeId ? "Update Recipe" : "Create Recipe"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/recipes")}
                data-testid="button-cancel-recipe"
              >
                Cancel
              </Button>
            </div>
          )}
        </form>
      </Form>

      <AddIngredientDialog
        open={showAddIngredient}
        onOpenChange={setShowAddIngredient}
        existingIngredients={ingredients || []}
        onSuccess={handleNewIngredientAdded}
      />
      <AddMaterialDialog
        open={showAddMaterial}
        onOpenChange={setShowAddMaterial}
        existingMaterials={materials || []}
        onSuccess={handleNewMaterialAdded}
      />

      <PanYieldConverter
        open={showPanConverter}
        onOpenChange={setShowPanConverter}
        currentYield={batchYieldValue}
        currentPanSetup={panSetup}
        flourWeight={Math.round(scalingRequiredFlour) || dominantIngredient?.quantity || 0}
        batchYieldValue={batchYieldValue}
        scaledIngredients={scaledIngredients.length > 0 ? scaledIngredients : bakerPercentages}
      />
    </div>
  );
}
