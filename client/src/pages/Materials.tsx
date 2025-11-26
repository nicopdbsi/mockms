import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/currency";
import { useAuth } from "@/lib/auth";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Wrench, Upload, Search, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
import type { Material, Supplier, MaterialCategory } from "@shared/schema";
import { AppLayout } from "@/components/AppLayout";
import { ReceiptUpload } from "@/components/ReceiptUpload";

const defaultCategories = [
  "Packaging",
  "Equipment",
  "Utensils",
  "Containers",
  "Labels",
  "Cleaning Supplies",
  "Other",
];

const materialFormSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  category: z.string().optional(),
  quantity: z.string().min(1, "Quantity is required"),
  unit: z.string().min(1, "Unit is required"),
  pricePerUnit: z.string().min(1, "Price per unit is required"),
  purchaseAmount: z.string().optional(),
  supplierId: z.string().optional(),
  notes: z.string().optional(),
});

type MaterialFormData = z.infer<typeof materialFormSchema>;

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
      const response = await apiRequest("POST", "/api/material-categories", { name: categoryName });
      return response.json();
    },
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: ["/api/material-categories"] });
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
          <DialogDescription>Create a new category for your materials.</DialogDescription>
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
  category: MaterialCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(category?.name || "");
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/material-categories/${category!.id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/material-categories"] });
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
      await apiRequest("DELETE", `/api/material-categories/${category!.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/material-categories"] });
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

function MaterialForm({
  material,
  suppliers,
  allMaterials,
  onSuccess,
  onCancel,
}: {
  material?: Material;
  suppliers: Supplier[];
  allMaterials: Material[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MaterialCategory | null>(null);
  const [showAddSupplier, setShowAddSupplier] = useState(false);

  const { data: customCategories } = useQuery<MaterialCategory[]>({
    queryKey: ["/api/material-categories"],
  });

  const allCategories = [
    ...defaultCategories,
    ...(customCategories?.map((c) => c.name) || []).filter(
      (name) => !defaultCategories.includes(name)
    ),
  ];

  const form = useForm<MaterialFormData>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      name: material?.name || "",
      category: material?.category || "",
      quantity: material?.quantity || "0",
      unit: material?.unit || "",
      pricePerUnit: material?.pricePerUnit || "",
      purchaseAmount: material?.purchaseAmount || "",
      supplierId: material?.supplierId || "none",
      notes: material?.notes || "",
    },
  });

  const watchName = form.watch("name") ?? "";

  const normalizedWatchName = watchName.toLowerCase().trim();
  const duplicateMaterial = normalizedWatchName ? allMaterials.find((m) => {
    if (material && m.id === material.id) return false;
    return m.name.toLowerCase().trim() === normalizedWatchName;
  }) : null;

  const createMutation = useMutation({
    mutationFn: async (data: MaterialFormData) => {
      await apiRequest("POST", "/api/materials", {
        ...data,
        category: data.category || null,
        purchaseAmount: data.purchaseAmount || null,
        supplierId: data.supplierId === "none" ? null : data.supplierId || null,
        notes: data.notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({ title: "Material added successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to add material", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: MaterialFormData) => {
      await apiRequest("PATCH", `/api/materials/${material!.id}`, {
        ...data,
        category: data.category || null,
        purchaseAmount: data.purchaseAmount || null,
        supplierId: data.supplierId === "none" ? null : data.supplierId || null,
        notes: data.notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({ title: "Material updated successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Failed to update material", variant: "destructive" });
    },
  });

  const onSubmit = (data: MaterialFormData) => {
    if (material) {
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
                    placeholder="Enter item name"
                    data-testid="input-material-name"
                    {...field}
                  />
                </FormControl>
                {duplicateMaterial && (
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 text-sm" data-testid="warning-duplicate-material">
                    <AlertTriangle className="h-4 w-4" />
                    <span>A material named "{duplicateMaterial.name}" already exists</span>
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
                  <FormLabel>Unit *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., pcs, box, pack"
                      data-testid="input-unit"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="pricePerUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price per Unit *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      data-testid="input-price-per-unit"
                      {...field}
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
                  <FormLabel>Purchase Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Total paid"
                      data-testid="input-purchase-amount"
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

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter any notes"
                    data-testid="input-notes"
                    {...field}
                  />
                </FormControl>
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
              disabled={isPending || !!duplicateMaterial}
              data-testid="button-submit-material"
            >
              {isPending ? "Saving..." : material ? "Update" : "Add"} Item
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

type SortField = "name" | "category" | "quantity" | "unit" | "pricePerUnit" | "purchaseAmount" | "supplier";
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

export default function Materials() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | undefined>();
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: materials, isLoading } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
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

  const filteredMaterials = materials?.filter((material) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const supplierName = getSupplierName(material.supplierId).toLowerCase();
    return (
      material.name.toLowerCase().includes(query) ||
      (material.category && material.category.toLowerCase().includes(query)) ||
      (material.unit && material.unit.toLowerCase().includes(query)) ||
      supplierName.includes(query)
    );
  });

  const sortedMaterials = filteredMaterials?.slice().sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;
    
    switch (sortField) {
      case "name":
        return direction * a.name.localeCompare(b.name);
      case "category":
        return direction * (a.category || "").localeCompare(b.category || "");
      case "quantity":
        return direction * (parseFloat(a.quantity) - parseFloat(b.quantity));
      case "unit":
        return direction * (a.unit || "").localeCompare(b.unit || "");
      case "pricePerUnit":
        return direction * (parseFloat(a.pricePerUnit) - parseFloat(b.pricePerUnit));
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
      await apiRequest("DELETE", `/api/materials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({ title: "Material deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete material", variant: "destructive" });
    },
  });

  const handleOpenDialog = (material?: Material) => {
    setEditingMaterial(material);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMaterial(undefined);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">
              Materials & Equipment Masterlist
            </h1>
            <p className="text-muted-foreground">
              Manage your packaging, equipment, and other materials
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
                  data-testid="button-add-material"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingMaterial ? "Edit Item" : "Add New Item"}
                </DialogTitle>
              </DialogHeader>
              <MaterialForm
                material={editingMaterial}
                suppliers={suppliers || []}
                allMaterials={materials || []}
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
              <Wrench className="h-5 w-5" />
              Materials & Equipment
              {filteredMaterials && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({filteredMaterials.length} {filteredMaterials.length === 1 ? "item" : "items"})
                </span>
              )}
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-materials"
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
            ) : sortedMaterials && sortedMaterials.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader label="Item Name" field="name" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                    <SortableHeader label="Category" field="category" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                    <SortableHeader label="Quantity" field="quantity" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} className="text-right" />
                    <SortableHeader label="Unit" field="unit" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                    <SortableHeader label="Price/Unit" field="pricePerUnit" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} className="text-right" />
                    <SortableHeader label="Purchase Amt" field="purchaseAmount" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} className="text-right" />
                    <SortableHeader label="Supplier" field="supplier" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMaterials.map((material) => (
                    <TableRow key={material.id} data-testid={`row-material-${material.id}`}>
                      <TableCell className="font-medium" data-testid={`text-material-name-${material.id}`}>
                        {material.name}
                      </TableCell>
                      <TableCell>{material.category || "-"}</TableCell>
                      <TableCell className="text-right">{material.quantity}</TableCell>
                      <TableCell>{material.unit}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(parseFloat(material.pricePerUnit).toFixed(2), user?.currency || "USD")}
                      </TableCell>
                      <TableCell className="text-right">
                        {material.purchaseAmount
                          ? formatCurrency(parseFloat(material.purchaseAmount).toFixed(2), user?.currency || "USD")
                          : "-"}
                      </TableCell>
                      <TableCell>{getSupplierName(material.supplierId)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenDialog(material)}
                            data-testid={`button-edit-material-${material.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(material.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-material-${material.id}`}
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
                <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No materials yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add packaging, equipment, and other materials you use
                </p>
                <Button onClick={() => handleOpenDialog()} data-testid="button-add-first-material">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
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
          queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
        }}
        existingIngredients={[]}
        existingMaterials={materials || []}
      />
    </AppLayout>
  );
}
