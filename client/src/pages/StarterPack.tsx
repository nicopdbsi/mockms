import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, Package, Wrench, Gift, FolderPlus } from "lucide-react";
import { type StarterIngredient, type StarterMaterial } from "@shared/schema";
import { formatCurrency } from "@/lib/currency";
import { useAuth } from "@/lib/auth";

const DEFAULT_INGREDIENT_CATEGORIES = [
  "Dairy", "Eggs", "Flour & Grains", "Sugar & Sweeteners", "Fats & Oils",
  "Leavening", "Chocolate & Cocoa", "Nuts & Seeds", "Fruits", "Spices & Flavorings",
  "Milk & Cream", "Other"
];

const DEFAULT_MATERIAL_CATEGORIES = [
  "Packaging", "Containers", "Labels", "Equipment", "Utensils", "Other"
];

const UNITS = ["g", "kg", "ml", "L", "pcs", "tray", "dozen", "box"];

function StarterPackContent() {
  const { user } = useAuth();
  const currency = user?.currency || "PHP";
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("ingredients");
  
  // Custom categories (user-added)
  const [customIngredientCategories, setCustomIngredientCategories] = useState<string[]>([]);
  const [customMaterialCategories, setCustomMaterialCategories] = useState<string[]>([]);
  
  // Add category mode state
  const [addingIngredientCategory, setAddingIngredientCategory] = useState(false);
  const [newIngredientCategory, setNewIngredientCategory] = useState("");
  const [addingMaterialCategory, setAddingMaterialCategory] = useState(false);
  const [newMaterialCategory, setNewMaterialCategory] = useState("");
  
  // Ingredient form state
  const [ingredientDialogOpen, setIngredientDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<StarterIngredient | null>(null);
  const [ingredientForm, setIngredientForm] = useState({
    name: "",
    category: "",
    pricePerGram: "",
    quantity: "0",
    unit: "g",
    purchaseAmount: "",
    isCountBased: false,
    purchaseUnit: "",
    piecesPerPurchaseUnit: "",
    weightPerPiece: "",
  });

  // Material form state
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<StarterMaterial | null>(null);
  const [materialForm, setMaterialForm] = useState({
    name: "",
    category: "",
    quantity: "",
    unit: "pcs",
    pricePerUnit: "",
    purchaseAmount: "",
    notes: "",
  });

  // Queries
  const { data: starterIngredients, isLoading: ingredientsLoading } = useQuery<StarterIngredient[]>({
    queryKey: ["/api/starter-pack/ingredients"],
  });

  const { data: starterMaterials, isLoading: materialsLoading } = useQuery<StarterMaterial[]>({
    queryKey: ["/api/starter-pack/materials"],
  });
  
  // Combine default and custom categories, plus any existing categories from data
  const allIngredientCategories = useMemo(() => {
    const existingCategories = starterIngredients
      ?.map(i => i.category)
      .filter((c): c is string => !!c && !DEFAULT_INGREDIENT_CATEGORIES.includes(c) && !customIngredientCategories.includes(c)) || [];
    const combined = [...DEFAULT_INGREDIENT_CATEGORIES, ...customIngredientCategories, ...existingCategories];
    return Array.from(new Set(combined)).sort();
  }, [starterIngredients, customIngredientCategories]);
  
  const allMaterialCategories = useMemo(() => {
    const existingCategories = starterMaterials
      ?.map(m => m.category)
      .filter((c): c is string => !!c && !DEFAULT_MATERIAL_CATEGORIES.includes(c) && !customMaterialCategories.includes(c)) || [];
    const combined = [...DEFAULT_MATERIAL_CATEGORIES, ...customMaterialCategories, ...existingCategories];
    return Array.from(new Set(combined)).sort();
  }, [starterMaterials, customMaterialCategories]);

  // Ingredient mutations
  const createIngredientMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/starter-pack/ingredients", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/starter-pack/ingredients"] });
      setIngredientDialogOpen(false);
      resetIngredientForm();
      toast({ title: "Success", description: "Starter ingredient created" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create ingredient", variant: "destructive" });
    },
  });

  const updateIngredientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/starter-pack/ingredients/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/starter-pack/ingredients"] });
      setIngredientDialogOpen(false);
      setEditingIngredient(null);
      resetIngredientForm();
      toast({ title: "Success", description: "Starter ingredient updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update ingredient", variant: "destructive" });
    },
  });

  const deleteIngredientMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/starter-pack/ingredients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/starter-pack/ingredients"] });
      toast({ title: "Success", description: "Starter ingredient deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete ingredient", variant: "destructive" });
    },
  });

  // Material mutations
  const createMaterialMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/starter-pack/materials", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/starter-pack/materials"] });
      setMaterialDialogOpen(false);
      resetMaterialForm();
      toast({ title: "Success", description: "Starter material created" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create material", variant: "destructive" });
    },
  });

  const updateMaterialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/starter-pack/materials/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/starter-pack/materials"] });
      setMaterialDialogOpen(false);
      setEditingMaterial(null);
      resetMaterialForm();
      toast({ title: "Success", description: "Starter material updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update material", variant: "destructive" });
    },
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/starter-pack/materials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/starter-pack/materials"] });
      toast({ title: "Success", description: "Starter material deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete material", variant: "destructive" });
    },
  });

  const resetIngredientForm = () => {
    setIngredientForm({
      name: "",
      category: "",
      pricePerGram: "",
      quantity: "0",
      unit: "g",
      purchaseAmount: "",
      isCountBased: false,
      purchaseUnit: "",
      piecesPerPurchaseUnit: "",
      weightPerPiece: "",
    });
    setAddingIngredientCategory(false);
    setNewIngredientCategory("");
  };

  const resetMaterialForm = () => {
    setMaterialForm({
      name: "",
      category: "",
      quantity: "",
      unit: "pcs",
      pricePerUnit: "",
      purchaseAmount: "",
      notes: "",
    });
    setAddingMaterialCategory(false);
    setNewMaterialCategory("");
  };
  
  const handleAddIngredientCategory = () => {
    const trimmed = newIngredientCategory.trim();
    if (trimmed && !allIngredientCategories.includes(trimmed)) {
      setCustomIngredientCategories(prev => [...prev, trimmed]);
      setIngredientForm({ ...ingredientForm, category: trimmed });
      toast({ title: "Category added", description: `"${trimmed}" added to ingredient categories` });
    } else if (trimmed) {
      setIngredientForm({ ...ingredientForm, category: trimmed });
    }
    setAddingIngredientCategory(false);
    setNewIngredientCategory("");
  };
  
  const handleAddMaterialCategory = () => {
    const trimmed = newMaterialCategory.trim();
    if (trimmed && !allMaterialCategories.includes(trimmed)) {
      setCustomMaterialCategories(prev => [...prev, trimmed]);
      setMaterialForm({ ...materialForm, category: trimmed });
      toast({ title: "Category added", description: `"${trimmed}" added to material categories` });
    } else if (trimmed) {
      setMaterialForm({ ...materialForm, category: trimmed });
    }
    setAddingMaterialCategory(false);
    setNewMaterialCategory("");
  };

  const openEditIngredient = (item: StarterIngredient) => {
    setEditingIngredient(item);
    setIngredientForm({
      name: item.name,
      category: item.category || "",
      pricePerGram: item.pricePerGram,
      quantity: item.quantity,
      unit: item.unit,
      purchaseAmount: item.purchaseAmount || "",
      isCountBased: item.isCountBased || false,
      purchaseUnit: item.purchaseUnit || "",
      piecesPerPurchaseUnit: item.piecesPerPurchaseUnit || "",
      weightPerPiece: item.weightPerPiece || "",
    });
    setIngredientDialogOpen(true);
  };

  const openEditMaterial = (item: StarterMaterial) => {
    setEditingMaterial(item);
    setMaterialForm({
      name: item.name,
      category: item.category || "",
      quantity: item.quantity || "",
      unit: item.unit || "pcs",
      pricePerUnit: item.pricePerUnit || "",
      purchaseAmount: item.purchaseAmount || "",
      notes: item.notes || "",
    });
    setMaterialDialogOpen(true);
  };

  const handleIngredientSubmit = () => {
    // Calculate price per gram from quantity and purchase amount
    const pricePerGram = 
      ingredientForm.quantity && ingredientForm.purchaseAmount
        ? String(parseFloat(ingredientForm.purchaseAmount) / parseFloat(ingredientForm.quantity))
        : ingredientForm.pricePerGram;

    const data = {
      name: ingredientForm.name,
      category: ingredientForm.category || null,
      pricePerGram,
      quantity: ingredientForm.quantity || "0",
      unit: ingredientForm.unit || null,
      purchaseAmount: ingredientForm.purchaseAmount || null,
      isCountBased: ingredientForm.isCountBased,
      purchaseUnit: ingredientForm.isCountBased ? ingredientForm.purchaseUnit : null,
      piecesPerPurchaseUnit: ingredientForm.isCountBased ? ingredientForm.piecesPerPurchaseUnit : null,
      weightPerPiece: ingredientForm.isCountBased ? ingredientForm.weightPerPiece : null,
    };

    if (editingIngredient) {
      updateIngredientMutation.mutate({ id: editingIngredient.id, data });
    } else {
      createIngredientMutation.mutate(data);
    }
  };

  const handleMaterialSubmit = () => {
    const data = {
      name: materialForm.name,
      category: materialForm.category || null,
      quantity: materialForm.quantity || null,
      unit: materialForm.unit || null,
      pricePerUnit: materialForm.pricePerUnit || null,
      purchaseAmount: materialForm.purchaseAmount || null,
      notes: materialForm.notes || null,
    };

    if (editingMaterial) {
      updateMaterialMutation.mutate({ id: editingMaterial.id, data });
    } else {
      createMaterialMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2" data-testid="heading-starter-pack">
          <Gift className="h-8 w-8" />
          Bento Starter Pack
        </h1>
        <p className="text-muted-foreground" data-testid="text-starter-pack-description">
          Manage template ingredients and materials for new users. These items will be available for all users to import into their pantry.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ingredients" data-testid="tab-ingredients">
            <Package className="h-4 w-4 mr-2" />
            Ingredients ({starterIngredients?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="materials" data-testid="tab-materials">
            <Wrench className="h-4 w-4 mr-2" />
            Materials ({starterMaterials?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ingredients" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle>Starter Ingredients</CardTitle>
                <CardDescription>Template ingredients for new users</CardDescription>
              </div>
              <Dialog open={ingredientDialogOpen} onOpenChange={(open) => {
                setIngredientDialogOpen(open);
                if (!open) {
                  setEditingIngredient(null);
                  resetIngredientForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-ingredient">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Ingredient
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingIngredient ? "Edit" : "Add"} Starter Ingredient</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="ing-name">Name *</Label>
                      <Input
                        id="ing-name"
                        value={ingredientForm.name}
                        onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                        placeholder="e.g., All-Purpose Flour"
                        data-testid="input-ingredient-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ing-category">Category</Label>
                      {addingIngredientCategory ? (
                        <div className="flex gap-2">
                          <Input
                            value={newIngredientCategory}
                            onChange={(e) => setNewIngredientCategory(e.target.value)}
                            placeholder="Enter new category name"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddIngredientCategory();
                              } else if (e.key === "Escape") {
                                setAddingIngredientCategory(false);
                                setNewIngredientCategory("");
                              }
                            }}
                            autoFocus
                            data-testid="input-new-ingredient-category"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleAddIngredientCategory}
                            disabled={!newIngredientCategory.trim()}
                            data-testid="button-confirm-ingredient-category"
                          >
                            Add
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAddingIngredientCategory(false);
                              setNewIngredientCategory("");
                            }}
                            data-testid="button-cancel-ingredient-category"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Select
                          value={ingredientForm.category}
                          onValueChange={(v) => {
                            if (v === "__add_new__") {
                              setAddingIngredientCategory(true);
                            } else {
                              setIngredientForm({ ...ingredientForm, category: v });
                            }
                          }}
                        >
                          <SelectTrigger data-testid="select-ingredient-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__add_new__" className="text-primary font-medium">
                              <span className="flex items-center gap-2">
                                <FolderPlus className="h-4 w-4" />
                                Add New Category...
                              </span>
                            </SelectItem>
                            <Separator className="my-1" />
                            {allIngredientCategories.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ing-quantity">Quantity (g) *</Label>
                        <Input
                          id="ing-quantity"
                          type="number"
                          step="0.01"
                          value={ingredientForm.quantity}
                          onChange={(e) => setIngredientForm({ ...ingredientForm, quantity: e.target.value })}
                          placeholder="1000"
                          data-testid="input-ingredient-quantity"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ing-purchase">Purchase Cost *</Label>
                        <Input
                          id="ing-purchase"
                          type="number"
                          step="0.01"
                          value={ingredientForm.purchaseAmount}
                          onChange={(e) => setIngredientForm({ ...ingredientForm, purchaseAmount: e.target.value })}
                          placeholder="100"
                          data-testid="input-ingredient-purchase"
                        />
                      </div>
                    </div>
                    {ingredientForm.quantity && ingredientForm.purchaseAmount && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Calculated</p>
                        <p className="text-lg font-semibold">
                          Price per gram: {formatCurrency(parseFloat(ingredientForm.purchaseAmount) / parseFloat(ingredientForm.quantity), currency)}
                        </p>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="ing-unit">Unit</Label>
                      <Select
                        value={ingredientForm.unit}
                        onValueChange={(v) => setIngredientForm({ ...ingredientForm, unit: v })}
                      >
                        <SelectTrigger data-testid="select-ingredient-unit">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNITS.map((u) => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="ing-count-based"
                        checked={ingredientForm.isCountBased}
                        onCheckedChange={(checked) => setIngredientForm({ ...ingredientForm, isCountBased: checked as boolean })}
                        data-testid="checkbox-count-based"
                      />
                      <Label htmlFor="ing-count-based" className="cursor-pointer">Count-based ingredient (e.g., eggs)</Label>
                    </div>
                    {ingredientForm.isCountBased && (
                      <div className="grid grid-cols-3 gap-2 p-3 bg-muted rounded-lg">
                        <div>
                          <Label className="text-xs">Purchase Unit</Label>
                          <Input
                            value={ingredientForm.purchaseUnit}
                            onChange={(e) => setIngredientForm({ ...ingredientForm, purchaseUnit: e.target.value })}
                            placeholder="tray"
                            data-testid="input-purchase-unit"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Pcs per Unit</Label>
                          <Input
                            type="number"
                            value={ingredientForm.piecesPerPurchaseUnit}
                            onChange={(e) => setIngredientForm({ ...ingredientForm, piecesPerPurchaseUnit: e.target.value })}
                            placeholder="30"
                            data-testid="input-pieces-per-unit"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Weight/pc (g)</Label>
                          <Input
                            type="number"
                            value={ingredientForm.weightPerPiece}
                            onChange={(e) => setIngredientForm({ ...ingredientForm, weightPerPiece: e.target.value })}
                            placeholder="55"
                            data-testid="input-weight-per-piece"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                      onClick={handleIngredientSubmit}
                      disabled={!ingredientForm.name || !ingredientForm.quantity || !ingredientForm.purchaseAmount || createIngredientMutation.isPending || updateIngredientMutation.isPending}
                      data-testid="button-save-ingredient"
                    >
                      {(createIngredientMutation.isPending || updateIngredientMutation.isPending) ? "Saving..." : "Save"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {ingredientsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : starterIngredients && starterIngredients.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Price/g</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {starterIngredients.map((item) => (
                      <TableRow key={item.id} data-testid={`row-ingredient-${item.id}`}>
                        <TableCell className="font-medium">
                          {item.name}
                          {item.isCountBased && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Count</span>
                          )}
                        </TableCell>
                        <TableCell>{item.category || "-"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(parseFloat(item.pricePerGram), currency)}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditIngredient(item)}
                              data-testid={`button-edit-ingredient-${item.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  data-testid={`button-delete-ingredient-${item.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Starter Ingredient</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{item.name}"? This will not affect users who have already imported this ingredient.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteIngredientMutation.mutate(item.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No starter ingredients yet.</p>
                  <p className="text-sm">Add common ingredients that new users can import to get started quickly.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle>Starter Materials</CardTitle>
                <CardDescription>Template materials and equipment for new users</CardDescription>
              </div>
              <Dialog open={materialDialogOpen} onOpenChange={(open) => {
                setMaterialDialogOpen(open);
                if (!open) {
                  setEditingMaterial(null);
                  resetMaterialForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-material">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Material
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingMaterial ? "Edit" : "Add"} Starter Material</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="mat-name">Name *</Label>
                      <Input
                        id="mat-name"
                        value={materialForm.name}
                        onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                        placeholder="e.g., Paper Box 6x6"
                        data-testid="input-material-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="mat-category">Category</Label>
                      {addingMaterialCategory ? (
                        <div className="flex gap-2">
                          <Input
                            value={newMaterialCategory}
                            onChange={(e) => setNewMaterialCategory(e.target.value)}
                            placeholder="Enter new category name"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddMaterialCategory();
                              } else if (e.key === "Escape") {
                                setAddingMaterialCategory(false);
                                setNewMaterialCategory("");
                              }
                            }}
                            autoFocus
                            data-testid="input-new-material-category"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleAddMaterialCategory}
                            disabled={!newMaterialCategory.trim()}
                            data-testid="button-confirm-material-category"
                          >
                            Add
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAddingMaterialCategory(false);
                              setNewMaterialCategory("");
                            }}
                            data-testid="button-cancel-material-category"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Select
                          value={materialForm.category}
                          onValueChange={(v) => {
                            if (v === "__add_new__") {
                              setAddingMaterialCategory(true);
                            } else {
                              setMaterialForm({ ...materialForm, category: v });
                            }
                          }}
                        >
                          <SelectTrigger data-testid="select-material-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__add_new__" className="text-primary font-medium">
                              <span className="flex items-center gap-2">
                                <FolderPlus className="h-4 w-4" />
                                Add New Category...
                              </span>
                            </SelectItem>
                            <Separator className="my-1" />
                            {allMaterialCategories.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="mat-price">Price per Unit</Label>
                        <Input
                          id="mat-price"
                          type="number"
                          step="0.01"
                          value={materialForm.pricePerUnit}
                          onChange={(e) => setMaterialForm({ ...materialForm, pricePerUnit: e.target.value })}
                          placeholder="5.00"
                          data-testid="input-material-price"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mat-unit">Unit</Label>
                        <Select
                          value={materialForm.unit}
                          onValueChange={(v) => setMaterialForm({ ...materialForm, unit: v })}
                        >
                          <SelectTrigger data-testid="select-material-unit">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNITS.map((u) => (
                              <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="mat-notes">Notes</Label>
                      <Input
                        id="mat-notes"
                        value={materialForm.notes}
                        onChange={(e) => setMaterialForm({ ...materialForm, notes: e.target.value })}
                        placeholder="Additional notes..."
                        data-testid="input-material-notes"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                      onClick={handleMaterialSubmit}
                      disabled={!materialForm.name || createMaterialMutation.isPending || updateMaterialMutation.isPending}
                      data-testid="button-save-material"
                    >
                      {(createMaterialMutation.isPending || updateMaterialMutation.isPending) ? "Saving..." : "Save"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {materialsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : starterMaterials && starterMaterials.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Price/Unit</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {starterMaterials.map((item) => (
                      <TableRow key={item.id} data-testid={`row-material-${item.id}`}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category || "-"}</TableCell>
                        <TableCell className="text-right">
                          {item.pricePerUnit ? formatCurrency(parseFloat(item.pricePerUnit), currency) : "-"}
                        </TableCell>
                        <TableCell>{item.unit || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditMaterial(item)}
                              data-testid={`button-edit-material-${item.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  data-testid={`button-delete-material-${item.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Starter Material</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{item.name}"? This will not affect users who have already imported this material.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMaterialMutation.mutate(item.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No starter materials yet.</p>
                  <p className="text-sm">Add common packaging and equipment that new users can import.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function StarterPack() {
  return (
    <AppLayout>
      <StarterPackContent />
    </AppLayout>
  );
}
