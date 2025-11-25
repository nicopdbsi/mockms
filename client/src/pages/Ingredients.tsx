import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertIngredientSchema, type Ingredient } from "@shared/schema";
import { z } from "zod";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const formSchema = insertIngredientSchema.omit({ userId: true }).extend({
  name: z.string().min(1, "Name is required"),
  unit: z.string().min(1, "Unit is required"),
  costPerUnit: z.string().min(0, "Cost must be positive"),
  currentStock: z.string().min(0, "Stock must be positive"),
  minStock: z.string().min(0, "Minimum stock must be positive").optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function Ingredients() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const { toast } = useToast();

  const { data: ingredients, isLoading } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      unit: "",
      costPerUnit: "0",
      currentStock: "0",
      minStock: "0",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/ingredients", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/overview"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Ingredient created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create ingredient",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FormData> }) => {
      const response = await apiRequest("PATCH", `/api/ingredients/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/overview"] });
      setIsDialogOpen(false);
      setEditingIngredient(null);
      form.reset();
      toast({
        title: "Success",
        description: "Ingredient updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update ingredient",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/ingredients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/overview"] });
      toast({
        title: "Success",
        description: "Ingredient deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete ingredient",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (editingIngredient) {
      updateMutation.mutate({ id: editingIngredient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    form.reset({
      name: ingredient.name,
      unit: ingredient.unit,
      costPerUnit: ingredient.costPerUnit,
      currentStock: ingredient.currentStock,
      minStock: ingredient.minStock || "0",
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingIngredient(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const isLowStock = (ingredient: Ingredient) => {
    if (!ingredient.minStock) return false;
    return Number(ingredient.currentStock) < Number(ingredient.minStock);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-ingredients">
            Ingredients
          </h1>
          <p className="text-muted-foreground" data-testid="text-ingredients-description">
            Manage your ingredient inventory and stock levels
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} data-testid="button-add-ingredient">
              <Plus className="h-4 w-4 mr-2" />
              Add Ingredient
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-ingredient-form">
            <DialogHeader>
              <DialogTitle data-testid="dialog-title">
                {editingIngredient ? "Edit Ingredient" : "Add New Ingredient"}
              </DialogTitle>
              <DialogDescription>
                {editingIngredient
                  ? "Update the ingredient details below"
                  : "Enter the details for the new ingredient"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Flour"
                          data-testid="input-ingredient-name"
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
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., kg, lbs, pieces"
                          data-testid="input-ingredient-unit"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="costPerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Per Unit ($)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          data-testid="input-ingredient-cost"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currentStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Stock</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0"
                          data-testid="input-ingredient-stock"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Stock (Alert Threshold)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0"
                          data-testid="input-ingredient-min-stock"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-ingredient"
                  >
                    {editingIngredient ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {!ingredients || ingredients.length === 0 ? (
            <div className="text-center py-12" data-testid="empty-state-ingredients">
              <p className="text-muted-foreground">
                No ingredients yet. Add your first ingredient to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Cost/Unit</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Min Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((ingredient) => (
                  <TableRow key={ingredient.id} data-testid={`row-ingredient-${ingredient.id}`}>
                    <TableCell className="font-medium" data-testid={`text-ingredient-name-${ingredient.id}`}>
                      {ingredient.name}
                    </TableCell>
                    <TableCell data-testid={`text-ingredient-unit-${ingredient.id}`}>
                      {ingredient.unit}
                    </TableCell>
                    <TableCell data-testid={`text-ingredient-cost-${ingredient.id}`}>
                      ${Number(ingredient.costPerUnit).toFixed(2)}
                    </TableCell>
                    <TableCell data-testid={`text-ingredient-stock-${ingredient.id}`}>
                      {Number(ingredient.currentStock).toFixed(2)}
                    </TableCell>
                    <TableCell data-testid={`text-ingredient-min-stock-${ingredient.id}`}>
                      {ingredient.minStock ? Number(ingredient.minStock).toFixed(2) : "-"}
                    </TableCell>
                    <TableCell data-testid={`status-ingredient-${ingredient.id}`}>
                      {isLowStock(ingredient) ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="secondary">OK</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(ingredient)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
