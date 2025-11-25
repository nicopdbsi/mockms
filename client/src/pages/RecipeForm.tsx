import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRecipeSchema, type Ingredient } from "@shared/schema";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const formSchema = insertRecipeSchema.omit({ userId: true }).extend({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  servings: z.number().min(1, "Servings must be at least 1"),
  targetMargin: z.string().min(0, "Target margin must be positive"),
  ingredients: z.array(
    z.object({
      ingredientId: z.string(),
      quantity: z.string().min(0, "Quantity must be positive"),
    })
  ).optional(),
});

type FormData = z.infer<typeof formSchema>;

type RecipeWithIngredients = {
  id: string;
  name: string;
  description: string | null;
  servings: number;
  targetMargin: string;
  ingredients: Array<{
    ingredientId: string;
    quantity: string;
  }>;
};

export default function RecipeForm() {
  const [, params] = useRoute("/recipes/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const recipeId = params?.id === "new" ? null : params?.id;

  const [selectedIngredients, setSelectedIngredients] = useState<
    Array<{ ingredientId: string; quantity: string }>
  >([]);

  const { data: ingredients, isLoading: ingredientsLoading } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  const { data: recipe, isLoading: recipeLoading } = useQuery<RecipeWithIngredients>({
    queryKey: ["/api/recipes", recipeId],
    enabled: !!recipeId,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      servings: 1,
      targetMargin: "50",
      ingredients: [],
    },
  });

  useEffect(() => {
    if (recipe) {
      form.reset({
        name: recipe.name,
        description: recipe.description || "",
        servings: recipe.servings,
        targetMargin: recipe.targetMargin,
      });
      setSelectedIngredients(recipe.ingredients || []);
    }
  }, [recipe, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/recipes", {
        ...data,
        ingredients: selectedIngredients,
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

  const totalCost = useMemo(() => {
    if (!ingredients) return 0;
    return selectedIngredients.reduce((sum, item) => {
      const ingredient = ingredients.find((i) => i.id === item.ingredientId);
      if (!ingredient) return sum;
      const quantity = parseFloat(item.quantity);
      const costPerUnit = parseFloat(ingredient.costPerUnit);
      if (isNaN(quantity) || isNaN(costPerUnit)) return sum;
      return sum + costPerUnit * quantity;
    }, 0);
  }, [selectedIngredients, ingredients]);

  const suggestedPrice = useMemo(() => {
    const marginValue = parseFloat(form.watch("targetMargin"));
    if (isNaN(marginValue) || marginValue >= 100 || marginValue < 0) return 0;
    const margin = marginValue / 100;
    return totalCost / (1 - margin);
  }, [totalCost, form]);

  const onSubmit = (data: FormData) => {
    if (recipeId) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const addIngredient = () => {
    setSelectedIngredients([...selectedIngredients, { ingredientId: "", quantity: "0" }]);
  };

  const removeIngredient = (index: number) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: "ingredientId" | "quantity", value: string) => {
    const updated = [...selectedIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedIngredients(updated);
  };

  if (ingredientsLoading || (recipeId && recipeLoading)) {
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
            {recipeId ? "Update recipe details and ingredients" : "Create a new recipe with cost calculation"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recipe Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipe Name</FormLabel>
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
                            placeholder="Optional description"
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
                          <FormLabel>Servings</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="1"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-recipe-servings"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                              max="100"
                              step="1"
                              data-testid="input-recipe-margin"
                            />
                          </FormControl>
                          <FormDescription>
                            Your desired profit margin percentage
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Ingredients</h3>
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

                    {selectedIngredients.length === 0 ? (
                      <div className="text-center py-8 border rounded-lg" data-testid="empty-state-recipe-ingredients">
                        <p className="text-muted-foreground">
                          No ingredients added yet. Click "Add Ingredient" to start.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedIngredients.map((item, index) => (
                          <div key={index} className="flex gap-3" data-testid={`ingredient-row-${index}`}>
                            <div className="flex-1">
                              <Select
                                value={item.ingredientId}
                                onValueChange={(value) =>
                                  updateIngredient(index, "ingredientId", value)
                                }
                              >
                                <SelectTrigger data-testid={`select-ingredient-${index}`}>
                                  <SelectValue placeholder="Select ingredient" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ingredients?.map((ing) => (
                                    <SelectItem key={ing.id} value={ing.id}>
                                      {ing.name} (${Number(ing.costPerUnit).toFixed(2)}/{ing.unit})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-32">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Quantity"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateIngredient(index, "quantity", e.target.value)
                                }
                                data-testid={`input-quantity-${index}`}
                              />
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
                        ))}
                      </div>
                    )}
                  </div>

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
            </CardContent>
          </Card>
        </div>

        <div>
          <Card data-testid="card-cost-calculation">
            <CardHeader>
              <CardTitle>Cost Calculation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Cost:</span>
                <span className="text-lg font-bold" data-testid="text-total-cost">
                  ${totalCost.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cost per Serving:</span>
                <span className="font-medium" data-testid="text-cost-per-serving">
                  ${(totalCost / (form.watch("servings") || 1)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Target Margin:</span>
                <span className="font-medium" data-testid="text-target-margin-display">
                  {form.watch("targetMargin")}%
                </span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Suggested Price:</span>
                  <span className="text-xl font-bold text-primary" data-testid="text-suggested-price">
                    ${suggestedPrice.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Price per serving to achieve target margin
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
