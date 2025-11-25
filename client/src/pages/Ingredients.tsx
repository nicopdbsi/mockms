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
  DialogDescription,
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
import { Plus, Pencil, Trash2, Package, X } from "lucide-react";
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
import type { Ingredient, Supplier, IngredientCategory } from "@shared/schema";
import { AppLayout } from "@/components/AppLayout";

const defaultCategories = [
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

const supplierFormSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierFormSchema>;

function AddCategoryDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (categoryName: string) => {
      const response = await apiRequest("POST", "/api/ingredient-categories", { name: categoryName });
      return response.json();
    },
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredient-categories"] });
      toast({ title: "Category added successfully" });
      onSuccess(category.name);
      setName("");
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to add category", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>Create a new category for your ingredients.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="input-new-category"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(name)}
              disabled={!name.trim() || createMutation.isPending}
              data-testid="button-save-category"
            >
              {createMutation.isPending ? "Saving..." : "Add Category"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditCategoryDialog({
  category,
  open,
  onOpenChange,
  onSuccess,
}: {
  category: IngredientCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(category?.name || "");
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/ingredient-categories/${category!.id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredient-categories"] });
      toast({ title: "Category updated successfully" });
      onSuccess();
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to update category", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/ingredient-categories/${category!.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredient-categories"] });
      toast({ title: "Category deleted successfully" });
      onSuccess();
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to delete category", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>Edit or delete this category.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="input-edit-category"
          />
          <div className="flex justify-between">
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-category"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={!name.trim() || updateMutation.isPending}
                data-testid="button-update-category"
              >
                {updateMutation.isPending ? "Saving..." : "Update"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddSupplierDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (supplierId: string) => void;
}) {
  const { toast } = useToast();
  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      const response = await apiRequest("POST", "/api/suppliers", {
        ...data,
        contactPerson: data.contactPerson || null,
        phone: data.phone || null,
        email: data.email || null,
      });
      return response.json();
    },
    onSuccess: (supplier) => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ title: "Supplier added successfully" });
      form.reset();
      onSuccess(supplier.id);
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to add supplier", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
          <DialogDescription>Create a new supplier for your business.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter supplier name" data-testid="input-supplier-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact person" data-testid="input-contact-person" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number" data-testid="input-supplier-phone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email address" data-testid="input-supplier-email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-supplier">
                {createMutation.isPending ? "Saving..." : "Add Supplier"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

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
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<IngredientCategory | null>(null);
  const [showAddSupplier, setShowAddSupplier] = useState(false);

  const { data: customCategories } = useQuery<IngredientCategory[]>({
    queryKey: ["/api/ingredient-categories"],
  });

  const allCategories = [
    ...defaultCategories,
    ...(customCategories?.map((c) => c.name) || []).filter(
      (name) => !defaultCategories.includes(name)
    ),
  ];

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

  const handleCategoryAdded = (name: string) => {
    form.setValue("category", name);
  };

  const handleSupplierAdded = (supplierId: string) => {
    form.setValue("supplierId", supplierId);
  };

  const handleEditCategory = (categoryName: string) => {
    const customCategory = customCategories?.find((c) => c.name === categoryName);
    if (customCategory) {
      setEditingCategory(customCategory);
      setShowEditCategory(true);
    }
  };

  return (
    <>
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
                <div className="flex items-center justify-between">
                  <FormLabel>Category</FormLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setShowAddCategory(true)}
                    data-testid="button-add-category"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add New
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-category" className="flex-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.value && customCategories?.some((c) => c.name === field.value) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditCategory(field.value!)}
                      data-testid="button-edit-category"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
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
              {calculatedPricePerGram ? `$${calculatedPricePerGram}` : "-"}
            </div>
          </div>

          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Supplier</FormLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setShowAddSupplier(true)}
                    data-testid="button-add-supplier"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add New
                  </Button>
                </div>
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

      <AddCategoryDialog
        open={showAddCategory}
        onOpenChange={setShowAddCategory}
        onSuccess={handleCategoryAdded}
      />

      <EditCategoryDialog
        category={editingCategory}
        open={showEditCategory}
        onOpenChange={setShowEditCategory}
        onSuccess={() => setEditingCategory(null)}
      />

      <AddSupplierDialog
        open={showAddSupplier}
        onOpenChange={setShowAddSupplier}
        onSuccess={handleSupplierAdded}
      />
    </>
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
