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
import { Plus, Pencil, Trash2, Package, Upload, Search, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { ReceiptUpload } from "@/components/ReceiptUpload";

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
  isCountBased: z.boolean().optional(),
  purchaseUnit: z.string().optional(),
  piecesPerPurchaseUnit: z.string().optional(),
  weightPerPiece: z.string().optional(),
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
  allSuppliers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (supplierId: string) => void;
  allSuppliers: Supplier[];
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

  const watchName = form.watch("name") ?? "";
  const normalizedWatchName = watchName.toLowerCase().trim();
  const duplicateSupplier = normalizedWatchName ? allSuppliers.find((s) => 
    s.name.toLowerCase().trim() === normalizedWatchName
  ) : null;

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
                  {duplicateSupplier && (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 text-sm" data-testid="warning-duplicate-supplier-inline">
                      <AlertTriangle className="h-4 w-4" />
                      <span>A supplier named "{duplicateSupplier.name}" already exists</span>
                    </div>
                  )}
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
              <Button type="submit" disabled={createMutation.isPending || !!duplicateSupplier} data-testid="button-save-supplier">
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
  allIngredients,
  onSuccess,
  onCancel,
}: {
  ingredient?: Ingredient;
  suppliers: Supplier[];
  allIngredients: Ingredient[];
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
      isCountBased: ingredient?.isCountBased || false,
      purchaseUnit: ingredient?.purchaseUnit || "",
      piecesPerPurchaseUnit: ingredient?.piecesPerPurchaseUnit || "",
      weightPerPiece: ingredient?.weightPerPiece || "",
    },
  });

  const watchName = form.watch("name") ?? "";
  const watchQuantity = form.watch("quantity");
  const watchPurchaseAmount = form.watch("purchaseAmount");
  const watchIsCountBased = form.watch("isCountBased");
  const watchPiecesPerPurchaseUnit = form.watch("piecesPerPurchaseUnit");
  const watchWeightPerPiece = form.watch("weightPerPiece");

  const normalizedWatchName = watchName.toLowerCase().trim();
  const duplicateIngredient = normalizedWatchName ? allIngredients.find((i) => {
    if (ingredient && i.id === ingredient.id) return false;
    return i.name.toLowerCase().trim() === normalizedWatchName;
  }) : null;
  
  const countBasedCalculations = (() => {
    if (!watchIsCountBased) return null;
    const pieces = parseFloat(watchPiecesPerPurchaseUnit || "0");
    const weightPer = parseFloat(watchWeightPerPiece || "0");
    const purchaseAmt = parseFloat(watchPurchaseAmount || "0");
    
    if (pieces > 0 && weightPer > 0 && purchaseAmt > 0) {
      const totalGrams = pieces * weightPer;
      const costPerGram = purchaseAmt / totalGrams;
      const costPerPiece = purchaseAmt / pieces;
      return {
        totalGrams: totalGrams.toFixed(2),
        costPerGram: costPerGram.toFixed(4),
        costPerPiece: costPerPiece.toFixed(2),
      };
    }
    return null;
  })();

  const calculatedPricePerGram = (() => {
    if (watchIsCountBased && countBasedCalculations) {
      return countBasedCalculations.costPerGram;
    }
    const qty = parseFloat(watchQuantity);
    const amount = parseFloat(watchPurchaseAmount);
    if (qty > 0 && amount > 0) {
      return (amount / qty).toFixed(4);
    }
    return null;
  })();

  const createMutation = useMutation({
    mutationFn: async (data: IngredientFormData) => {
      let pricePerGram: string;
      let quantity = data.quantity;
      
      if (data.isCountBased) {
        const pieces = parseFloat(data.piecesPerPurchaseUnit || "0");
        const weightPer = parseFloat(data.weightPerPiece || "0");
        const purchaseAmt = parseFloat(data.purchaseAmount);
        const totalGrams = pieces * weightPer;
        pricePerGram = (purchaseAmt / totalGrams).toFixed(4);
        quantity = totalGrams.toString();
      } else {
        pricePerGram = (parseFloat(data.purchaseAmount) / parseFloat(data.quantity)).toFixed(4);
      }
      
      await apiRequest("POST", "/api/ingredients", {
        name: data.name,
        category: data.category || null,
        quantity,
        unit: data.isCountBased ? "g" : data.unit,
        purchaseAmount: data.purchaseAmount,
        pricePerGram,
        supplierId: data.supplierId === "none" ? null : data.supplierId || null,
        isCountBased: data.isCountBased || false,
        purchaseUnit: data.isCountBased ? data.purchaseUnit : null,
        piecesPerPurchaseUnit: data.isCountBased ? data.piecesPerPurchaseUnit : null,
        weightPerPiece: data.isCountBased ? data.weightPerPiece : null,
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
      let pricePerGram: string;
      let quantity = data.quantity;
      
      if (data.isCountBased) {
        const pieces = parseFloat(data.piecesPerPurchaseUnit || "0");
        const weightPer = parseFloat(data.weightPerPiece || "0");
        const purchaseAmt = parseFloat(data.purchaseAmount);
        const totalGrams = pieces * weightPer;
        pricePerGram = (purchaseAmt / totalGrams).toFixed(4);
        quantity = totalGrams.toString();
      } else {
        pricePerGram = (parseFloat(data.purchaseAmount) / parseFloat(data.quantity)).toFixed(4);
      }
      
      await apiRequest("PATCH", `/api/ingredients/${ingredient!.id}`, {
        name: data.name,
        category: data.category || null,
        quantity,
        unit: data.isCountBased ? "g" : data.unit,
        purchaseAmount: data.purchaseAmount,
        pricePerGram,
        supplierId: data.supplierId === "none" ? null : data.supplierId || null,
        isCountBased: data.isCountBased || false,
        purchaseUnit: data.isCountBased ? data.purchaseUnit : null,
        piecesPerPurchaseUnit: data.isCountBased ? data.piecesPerPurchaseUnit : null,
        weightPerPiece: data.isCountBased ? data.weightPerPiece : null,
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
                {duplicateIngredient && (
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 text-sm" data-testid="warning-duplicate-ingredient">
                    <AlertTriangle className="h-4 w-4" />
                    <span>An ingredient named "{duplicateIngredient.name}" already exists</span>
                  </div>
                )}
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

          <FormField
            control={form.control}
            name="isCountBased"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-medium flex items-center gap-2">
                    Count-Based Ingredient
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Enable for ingredients sold by count (eggs, vanilla pods) that need weight conversion for recipe costing and Baker's Math.</p>
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    For items like eggs, bought by tray but used by weight in recipes
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-count-based"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {watchIsCountBased ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="purchaseUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Unit *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., tray, dozen, box"
                          data-testid="input-purchase-unit"
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="piecesPerPurchaseUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pieces per Unit *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          placeholder="e.g., 30 eggs per tray"
                          data-testid="input-pieces-per-unit"
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="weightPerPiece"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Weight per Piece (g) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="e.g., 55g per egg"
                        data-testid="input-weight-per-piece"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {countBasedCalculations && (
                <div className="rounded-md bg-muted p-3 space-y-2">
                  <div className="text-sm font-medium">Calculated Values</div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total Grams</div>
                      <div className="font-semibold" data-testid="text-total-grams">{countBasedCalculations.totalGrams}g</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Cost per Piece</div>
                      <div className="font-semibold" data-testid="text-cost-per-piece">${countBasedCalculations.costPerPiece}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Cost per Gram</div>
                      <div className="font-semibold" data-testid="text-cost-per-gram">${countBasedCalculations.costPerGram}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
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
                          placeholder="e.g., g, kg, ml"
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
            </>
          )}

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
              disabled={isPending || !!duplicateIngredient}
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
        allSuppliers={suppliers}
      />
    </>
  );
}

type SortField = "name" | "category" | "pricePerGram" | "quantity" | "unit" | "purchaseAmount" | "supplier";
type SortDirection = "asc" | "desc";

function SortableHeader({
  label,
  field,
  currentSort,
  currentDirection,
  onSort,
  className,
}: {
  label: string;
  field: SortField;
  currentSort: SortField;
  currentDirection: SortDirection;
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const isActive = currentSort === field;
  return (
    <TableHead
      className={`cursor-pointer select-none hover:bg-muted/50 ${className || ""}`}
      onClick={() => onSort(field)}
      data-testid={`sort-header-${field}`}
    >
      <div className={`flex items-center gap-1 ${className?.includes("text-right") ? "justify-end" : ""}`}>
        <span>{label}</span>
        {isActive ? (
          currentDirection === "asc" ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-50" />
        )}
      </div>
    </TableHead>
  );
}

export default function Ingredients() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | undefined>();
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const { toast } = useToast();

  const { data: ingredients, isLoading } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const getSupplierName = (supplierId: string | null) => {
    if (!supplierId || !suppliers) return "-";
    const supplier = suppliers.find((s) => s.id === supplierId);
    return supplier?.name || "-";
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredIngredients = ingredients?.filter((ingredient) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const supplierName = getSupplierName(ingredient.supplierId).toLowerCase();
    return (
      ingredient.name.toLowerCase().includes(query) ||
      (ingredient.category && ingredient.category.toLowerCase().includes(query)) ||
      (ingredient.unit && ingredient.unit.toLowerCase().includes(query)) ||
      supplierName.includes(query)
    );
  });

  const sortedIngredients = filteredIngredients?.slice().sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;
    
    switch (sortField) {
      case "name":
        return direction * a.name.localeCompare(b.name);
      case "category":
        return direction * (a.category || "").localeCompare(b.category || "");
      case "pricePerGram":
        return direction * (parseFloat(a.pricePerGram) - parseFloat(b.pricePerGram));
      case "quantity":
        return direction * (parseFloat(a.quantity) - parseFloat(b.quantity));
      case "unit":
        return direction * (a.unit || "").localeCompare(b.unit || "");
      case "purchaseAmount":
        return direction * ((parseFloat(a.purchaseAmount || "0")) - (parseFloat(b.purchaseAmount || "0")));
      case "supplier":
        return direction * getSupplierName(a.supplierId).localeCompare(getSupplierName(b.supplierId));
      default:
        return 0;
    }
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">
              Ingredient Masterlist
            </h1>
            <p className="text-muted-foreground">
              Manage your ingredients with pricing and supplier information
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowReceiptUpload(true)}
              data-testid="button-upload-receipt"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
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
                  allIngredients={ingredients || []}
                  onSuccess={handleCloseDialog}
                  onCancel={handleCloseDialog}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Ingredients
              {filteredIngredients && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({filteredIngredients.length} {filteredIngredients.length === 1 ? "item" : "items"})
                </span>
              )}
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-ingredients"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : sortedIngredients && sortedIngredients.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader label="Item Name" field="name" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                    <SortableHeader label="Category" field="category" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                    <SortableHeader label="Price/Gram" field="pricePerGram" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} className="text-right" />
                    <SortableHeader label="Quantity" field="quantity" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} className="text-right" />
                    <SortableHeader label="UOM" field="unit" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                    <SortableHeader label="Purchase Amt" field="purchaseAmount" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} className="text-right" />
                    <SortableHeader label="Supplier" field="supplier" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedIngredients.map((ingredient) => (
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

      <ReceiptUpload
        open={showReceiptUpload}
        onOpenChange={setShowReceiptUpload}
        onItemsImported={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
        }}
        existingIngredients={ingredients || []}
        existingMaterials={[]}
      />
    </AppLayout>
  );
}
