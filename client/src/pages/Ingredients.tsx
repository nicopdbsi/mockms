import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Ingredient, Supplier } from "@shared/schema";
import { AppLayout } from "@/components/AppLayout";

const ingredientCategories = [
  "Produce",
  "Meat & Poultry",
  "Seafood",
  "Dairy",
  "Grains & Flour",
  "Spices & Seasonings",
  "Oils & Fats",
  "Sweeteners",
  "Baking",
  "Canned Goods",
  "Frozen",
  "Other",
];

const ingredientFormSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  category: z.string().optional(),
  quantity: z.string().min(1, "Quantity is required").refine((val) => parseFloat(val) > 0, "Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit of measure is required"),
  purchaseAmount: z.string().min(1, "Purchase amount is required").refine((val) => parseFloat(val) > 0, "Purchase amount must be greater than 0"),
  supplierId: z.string().optional(),
});

type IngredientFormData = z.infer<typeof ingredientFormSchema>;

function IngredientForm({
  ingredient,
  suppliers,
  onSuccess,
  onCancel,
}: {
  ingredient?: Ingredient;
  suppliers: Supplier[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();

  const form = useForm<IngredientFormData>({
    resolver: zodResolver(ingredientFormSchema),
    defaultValues: {
      name: ingredient?.name || "",
      category: ingredient?.category || "",
      quantity: ingredient?.quantity || "",
      unit: ingredient?.unit || "",
      purchaseAmount: ingredient?.purchaseAmount || "",
      supplierId: ingredient?.supplierId || "none",
    },
  });

  const watchQuantity = form.watch("quantity");
  const watchPurchaseAmount = form.watch("purchaseAmount");
  
  const calculatedPricePerGram = (() => {
    const qty = parseFloat(watchQuantity);
    const amount = parseFloat(watchPurchaseAmount);
    if (qty > 0 && amount > 0) {
      return (amount / qty).toFixed(4);
    }
    return null;
  })();

  const createMutation = useMutation({
    mutationFn: async (data: IngredientFormData) => {
      const pricePerGram = (parseFloat(data.purchaseAmount) / parseFloat(data.quantity)).toFixed(4);
      await apiRequest("POST", "/api/ingredients", {
        ...data,
        category: data.category || null,
        pricePerGram,
        supplierId: data.supplierId === "none" ? null : data.supplierId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      toast({ title: "Ingredient added successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to add ingredient", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: IngredientFormData) => {
      const pricePerGram = (parseFloat(data.purchaseAmount) / parseFloat(data.quantity)).toFixed(4);
      await apiRequest("PATCH", `/api/ingredients/${ingredient!.id}`, {
        ...data,
        category: data.category || null,
        pricePerGram,
        supplierId: data.supplierId === "none" ? null : data.supplierId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      toast({ title: "Ingredient updated successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to update ingredient", variant: "destructive" });
    },
  });

  const onSubmit = (data: IngredientFormData) => {
    if (ingredient) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter ingredient name"
                  data-testid="input-ingredient-name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ingredientCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    data-testid="input-quantity"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit of Measure *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., g, kg, ml, pcs"
                    data-testid="input-unit"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="purchaseAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purchase Amount *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="How much you paid"
                  data-testid="input-purchase-amount"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="rounded-md bg-muted p-3">
          <div className="text-sm text-muted-foreground mb-1">Price per Gram (auto-calculated)</div>
          <div className="text-lg font-semibold" data-testid="text-calculated-price">
            {calculatedPricePerGram ? `$${calculatedPricePerGram}` : "Enter quantity and purchase amount"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Formula: Purchase Amount ÷ Quantity
          </div>
        </div>

        <FormField
          control={form.control}
          name="supplierId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(value === "none" ? "none" : value)} 
                value={field.value || "none"}
              >
                <FormControl>
                  <SelectTrigger data-testid="select-supplier">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No supplier</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            data-testid="button-submit-ingredient"
          >
            {isPending ? "Saving..." : ingredient ? "Update" : "Add"} Ingredient
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function Ingredients() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | undefined>();
  const { toast } = useToast();

  const { data: ingredients, isLoading } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/ingredients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      toast({ title: "Ingredient deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete ingredient", variant: "destructive" });
    },
  });

  const handleOpenDialog = (ingredient?: Ingredient) => {
    setEditingIngredient(ingredient);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingIngredient(undefined);
  };

  const getSupplierName = (supplierId: string | null) => {
    if (!supplierId || !suppliers) return "-";
    const supplier = suppliers.find((s) => s.id === supplierId);
    return supplier?.name || "-";
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">
              Ingredient Masterlist
            </h1>
            <p className="text-muted-foreground">
              Manage your ingredients with pricing and supplier information
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => handleOpenDialog()}
                data-testid="button-add-ingredient"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Ingredient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingIngredient ? "Edit Ingredient" : "Add New Ingredient"}
                </DialogTitle>
              </DialogHeader>
              <IngredientForm
                ingredient={editingIngredient}
                suppliers={suppliers || []}
                onSuccess={handleCloseDialog}
                onCancel={handleCloseDialog}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Ingredients
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : ingredients && ingredients.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price/Gram</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>UOM</TableHead>
                    <TableHead className="text-right">Purchase Amt</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredients.map((ingredient) => (
                    <TableRow key={ingredient.id} data-testid={`row-ingredient-${ingredient.id}`}>
                      <TableCell className="font-medium" data-testid={`text-ingredient-name-${ingredient.id}`}>
                        {ingredient.name}
                      </TableCell>
                      <TableCell>{ingredient.category || "-"}</TableCell>
                      <TableCell className="text-right">
                        ${parseFloat(ingredient.pricePerGram).toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right">{ingredient.quantity}</TableCell>
                      <TableCell>{ingredient.unit}</TableCell>
                      <TableCell className="text-right">
                        {ingredient.purchaseAmount
                          ? `$${parseFloat(ingredient.purchaseAmount).toFixed(2)}`
                          : "-"}
                      </TableCell>
                      <TableCell>{getSupplierName(ingredient.supplierId)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenDialog(ingredient)}
                            data-testid={`button-edit-ingredient-${ingredient.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(ingredient.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-ingredient-${ingredient.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No ingredients yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first ingredient to start building your recipe costing
                </p>
                <Button onClick={() => handleOpenDialog()} data-testid="button-add-first-ingredient">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ingredient
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
