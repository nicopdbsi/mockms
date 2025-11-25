import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRoute, useLocation } from "wouter";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRecipeSchema, type Ingredient, type Material } from "@shared/schema";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2, AlertTriangle, DollarSign, Calculator, TrendingUp, ChefHat, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = insertRecipeSchema.omit({ userId: true }).extend({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  servings: z.number().min(1, "Servings must be at least 1"),
  targetMargin: z.string().min(0, "Target margin must be positive"),
  targetFoodCost: z.string().min(0, "Target food cost must be positive"),
  laborCost: z.string().optional(),
  batchYield: z.number().optional(),
  procedures: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

type RecipeIngredientWithDetails = {
  ingredientId: string;
  quantity: string;
  componentName?: string | null;
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
  servings: number;
  targetMargin: string;
  targetFoodCost: string | null;
  laborCost: string | null;
  batchYield: number | null;
  procedures: string | null;
  ingredients: RecipeIngredientWithDetails[];
  materials?: RecipeMaterialWithDetails[];
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

export default function RecipeForm() {
  const [, params] = useRoute("/recipes/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const recipeId = params?.id === "new" ? null : params?.id;

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedIngredients, setSelectedIngredients] = useState<
    Array<{ ingredientId: string; quantity: string; componentName?: string | null }>
  >([]);
  const [selectedMaterials, setSelectedMaterials] = useState<
    Array<{ materialId: string; quantity: string }>
  >([]);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [pendingIngredientIndex, setPendingIngredientIndex] = useState<number | null>(null);
  const [pendingMaterialIndex, setPendingMaterialIndex] = useState<number | null>(null);
  const [pricingMarginSlider, setPricingMarginSlider] = useState(50);

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
      servings: 1,
      targetMargin: "50",
      targetFoodCost: "30",
      laborCost: "0",
      batchYield: 1,
      procedures: "",
    },
  });

  useEffect(() => {
    if (recipe) {
      form.reset({
        name: recipe.name,
        description: recipe.description || "",
        servings: recipe.servings,
        targetMargin: recipe.targetMargin,
        targetFoodCost: recipe.targetFoodCost || "30",
        laborCost: recipe.laborCost || "0",
        batchYield: recipe.batchYield || 1,
        procedures: recipe.procedures || "",
      });
      setSelectedIngredients(
        recipe.ingredients?.map((i) => ({
          ingredientId: i.ingredientId,
          quantity: i.quantity,
          componentName: i.componentName,
        })) || []
      );
      setSelectedMaterials(
        recipe.materials?.map((m) => ({
          materialId: m.materialId,
          quantity: m.quantity,
        })) || []
      );
      setPricingMarginSlider(parseFloat(recipe.targetMargin) || 50);
    }
  }, [recipe, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/recipes", {
        ...data,
        ingredients: selectedIngredients,
        materials: selectedMaterials,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/overview"] });
      toast({
        title: "Success",
        description: "Recipe created successfully",
      });
      setLocation("/recipes");
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
      setLocation("/recipes");
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
  const watchedServings = form.watch("servings");
  const watchedLaborCost = form.watch("laborCost");
  const watchedBatchYield = form.watch("batchYield");

  const ingredientsCost = useMemo(() => {
    if (!ingredients) return 0;
    return selectedIngredients.reduce((sum, item) => {
      const ingredient = ingredients.find((i) => i.id === item.ingredientId);
      if (!ingredient) return sum;
      const quantity = parseFloat(item.quantity);
      const pricePerGram = parseFloat(ingredient.pricePerGram);
      if (isNaN(quantity) || isNaN(pricePerGram)) return sum;
      return sum + pricePerGram * quantity;
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

  const onSubmit = (data: FormData) => {
    if (recipeId) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const addIngredient = () => {
    setSelectedIngredients([...selectedIngredients, { ingredientId: "", quantity: "0", componentName: null }]);
  };

  const removeIngredient = (index: number) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (
    index: number,
    field: "ingredientId" | "quantity" | "componentName",
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

  const ingredientsByComponent = useMemo(() => {
    const grouped: Record<string, typeof selectedIngredients> = {};
    selectedIngredients.forEach((item) => {
      const key = item.componentName || "Main";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return grouped;
  }, [selectedIngredients]);

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
            {recipeId ? "Edit Recipe" : "New Recipe"}
          </h1>
          <p className="text-muted-foreground" data-testid="text-recipe-form-description">
            {recipeId ? "Update recipe details, costs, and pricing" : "Create a new recipe with full cost analysis"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" data-testid="tab-overview">
                <ChefHat className="h-4 w-4 mr-2" />
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
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recipe Details</CardTitle>
                  <CardDescription>Basic information about your recipe</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="servings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Servings per Batch</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="1"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-recipe-servings"
                            />
                          </FormControl>
                          <FormDescription>How many servings this recipe makes</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="batchYield"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch Yield (Units for Sale)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="1"
                              value={field.value || 1}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-recipe-batch-yield"
                            />
                          </FormControl>
                          <FormDescription>Number of sellable units from one batch</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="procedures"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Procedures / Instructions</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Step-by-step cooking instructions..."
                            rows={6}
                            data-testid="input-recipe-procedures"
                          />
                        </FormControl>
                        <FormDescription>
                          Cooking steps and instructions for preparing this recipe
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                        const itemCost = selectedIng
                          ? parseFloat(item.quantity) * parseFloat(selectedIng.pricePerGram)
                          : 0;
                        return (
                          <div key={index} className="flex gap-3 items-start" data-testid={`ingredient-row-${index}`}>
                            <div className="w-40">
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
                                      {ing.name} (${Number(ing.pricePerGram).toFixed(4)}/{ing.unit})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-28">
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
                            <div className="w-24 text-right text-sm text-muted-foreground pt-2">
                              ${isNaN(itemCost) ? "0.00" : itemCost.toFixed(2)}
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
                          </div>
                        );
                      })}
                      <div className="flex justify-end pt-2 border-t">
                        <div className="text-sm font-medium">
                          Ingredients Total: <span className="text-primary">${ingredientsCost.toFixed(2)}</span>
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
                          <div key={index} className="flex gap-3 items-center" data-testid={`material-row-${index}`}>
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
                                      {mat.name} (${Number(mat.pricePerUnit).toFixed(2)}/{mat.unit})
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
                            <div className="w-24 text-right text-sm text-muted-foreground">
                              ${isNaN(itemCost) ? "0.00" : itemCost.toFixed(2)}
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
                          </div>
                        );
                      })}
                      <div className="flex justify-end pt-2 border-t">
                        <div className="text-sm font-medium">
                          Materials Total: <span className="text-primary">${materialsCost.toFixed(2)}</span>
                        </div>
                      </div>
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
                          ${ingredientsCost.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Materials & Packaging</span>
                        <span className="font-medium" data-testid="text-materials-cost">
                          ${materialsCost.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <div className="flex-1 mr-4">
                          <FormField
                            control={form.control}
                            name="laborCost"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between space-y-0">
                                <FormLabel className="text-muted-foreground">Labor Cost ($)</FormLabel>
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
                      </div>
                      <div className="flex justify-between items-center py-3 bg-muted rounded-lg px-3">
                        <span className="font-semibold">Total Batch Cost</span>
                        <span className="text-xl font-bold text-primary" data-testid="text-total-batch-cost">
                          ${totalCost.toFixed(2)}
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
                          ${(ingredientsCost / batchYieldValue).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Materials per Unit</span>
                        <span className="font-medium">
                          ${(materialsCost / batchYieldValue).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Labor per Unit</span>
                        <span className="font-medium">
                          ${(laborCostValue / batchYieldValue).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 bg-muted rounded-lg px-3">
                        <span className="font-semibold">Cost per Unit</span>
                        <span className="text-xl font-bold text-primary" data-testid="text-cost-per-unit">
                          ${costPerUnit.toFixed(2)}
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
                            ${suggestedPriceByMargin.toFixed(2)}
                          </div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-xs text-muted-foreground">Price @ {watchedFoodCost}% Food Cost</div>
                          <div className="text-lg font-bold text-primary" data-testid="text-suggested-price-food-cost">
                            ${suggestedPriceByFoodCost.toFixed(2)}
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
                      <div className="text-2xl font-bold text-primary" data-testid="text-slider-price">
                        ${sliderPrice.toFixed(2)}
                      </div>
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

                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-muted/50">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <DollarSign className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <div className="text-xs text-muted-foreground">Cost per Unit</div>
                          <div className="text-xl font-bold">${costPerUnit.toFixed(2)}</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/50">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <TrendingUp className="h-8 w-8 mx-auto text-green-600 mb-2" />
                          <div className="text-xs text-muted-foreground">Profit per Unit</div>
                          <div className="text-xl font-bold text-green-600" data-testid="text-slider-profit">
                            ${sliderProfit.toFixed(2)}
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
                          ${(sliderPrice * batchYieldValue).toFixed(2)}
                        </div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Total Batch Profit</div>
                        <div className="text-2xl font-bold text-green-600">
                          ${(sliderProfit * batchYieldValue).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

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
    </div>
  );
}
