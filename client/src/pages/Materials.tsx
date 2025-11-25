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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Wrench } from "lucide-react";
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
import type { Material, Supplier } from "@shared/schema";
import { AppLayout } from "@/components/AppLayout";

const materialCategories = [
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

function MaterialForm({
  material,
  suppliers,
  onSuccess,
  onCancel,
}: {
  material?: Material;
  suppliers: Supplier[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();

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
                  placeholder="Enter item name"
                  data-testid="input-material-name"
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
                  {materialCategories.map((cat) => (
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
            disabled={isPending}
            data-testid="button-submit-material"
          >
            {isPending ? "Saving..." : material ? "Update" : "Add"} Item
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function Materials() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | undefined>();
  const { toast } = useToast();

  const { data: materials, isLoading } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
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
              Materials & Equipment Masterlist
            </h1>
            <p className="text-muted-foreground">
              Manage your packaging, equipment, and other materials
            </p>
          </div>
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
                onSuccess={handleCloseDialog}
                onCancel={handleCloseDialog}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Materials & Equipment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : materials && materials.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Price/Unit</TableHead>
                    <TableHead className="text-right">Purchase Amt</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow key={material.id} data-testid={`row-material-${material.id}`}>
                      <TableCell className="font-medium" data-testid={`text-material-name-${material.id}`}>
                        {material.name}
                      </TableCell>
                      <TableCell>{material.category || "-"}</TableCell>
                      <TableCell className="text-right">{material.quantity}</TableCell>
                      <TableCell>{material.unit}</TableCell>
                      <TableCell className="text-right">
                        ${parseFloat(material.pricePerUnit).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {material.purchaseAmount
                          ? `$${parseFloat(material.purchaseAmount).toFixed(2)}`
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
    </AppLayout>
  );
}
