import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Recipe } from "@shared/schema";
import { Plus, Pencil, Trash2, Search, Eye, Copy, Grid, List } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/auth";

export default function Recipes() {
  const [location, setLocation] = useLocation();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "thumbnail">("list");
  const { toast } = useToast();
  const { user } = useAuth();

  const activeTab = location === "/library/bentohub-library" ? "library" : "my-recipes";

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: recipes, isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const { data: freeRecipes, isLoading: freeLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/free-recipes"],
    staleTime: 5 * 60 * 1000,
  });

  const myRecipes = useMemo(() => {
    if (!recipes) return [];
    return recipes
      .filter((r) => !r.isFreeRecipe)
      .filter((recipe) =>
        recipe.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [recipes, debouncedSearch]);

  const filteredFreeRecipes = useMemo(() => {
    if (!freeRecipes) return [];
    return freeRecipes
      .filter((recipe) =>
        recipe.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [freeRecipes, debouncedSearch]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/recipes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/free-recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/overview"] });
      setDeleteId(null);
      toast({
        title: "Success",
        description: "Recipe deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete recipe",
        variant: "destructive",
      });
    },
  });

  const cloneMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/recipes/${id}/clone`);
      return await response.json() as Recipe;
    },
    onSuccess: (cloned: Recipe) => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Success",
        description: "Recipe cloned! You can now edit your copy.",
      });
      setLocation(`/recipes/${cloned.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clone recipe",
        variant: "destructive",
      });
    },
  });

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
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-library">
            {activeTab === "my-recipes" ? "My Recipes" : "Bento Library"}
          </h1>
          <p className="text-muted-foreground" data-testid="text-library-description">
            {activeTab === "my-recipes" ? "Manage your recipes and calculate costs" : "Explore free recipe templates"}
          </p>
        </div>
        <div className="flex gap-2">
          {user?.role === "admin" && activeTab === "library" && (
            <Button
              onClick={() => setLocation("/recipes/new?template=true")}
              data-testid="button-create-free-recipe"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Free Recipe
            </Button>
          )}
          {activeTab === "my-recipes" && (
            <Button
              onClick={() => setLocation("/recipes/new")}
              data-testid="button-add-recipe"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Recipe
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recipes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 items-end">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                data-testid="input-search-recipes"
              />
            </div>
            {activeTab === "my-recipes" && (myRecipes && myRecipes.length > 0) && (
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant={viewMode === "list" ? "default" : "ghost"}
                  onClick={() => setViewMode("list")}
                  title="List view"
                  data-testid="button-view-list"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant={viewMode === "thumbnail" ? "default" : "ghost"}
                  onClick={() => setViewMode("thumbnail")}
                  title="Thumbnail view"
                  data-testid="button-view-thumbnail"
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {activeTab === "my-recipes" ? (
            !myRecipes || myRecipes.length === 0 ? (
              <div className="text-center py-12" data-testid="empty-state-my-recipes">
                <p className="text-muted-foreground mb-4">
                  No recipes yet. Create your first recipe to get started.
                </p>
                <Button onClick={() => setLocation("/recipes/new")}>
                  Create Recipe
                </Button>
                {freeRecipes && freeRecipes.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm text-muted-foreground mb-3">
                      Or start with a free BentoHub template
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setLocation("/library/bentohub-library")}
                    >
                      Browse Templates
                    </Button>
                  </div>
                )}
              </div>
            ) : viewMode === "list" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Servings</TableHead>
                    <TableHead>Target Margin</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myRecipes.map((recipe) => (
                    <TableRow key={recipe.id} data-testid={`row-recipe-${recipe.id}`}>
                      <TableCell className="font-medium" data-testid={`text-recipe-name-${recipe.id}`}>
                        {recipe.name}
                      </TableCell>
                      <TableCell data-testid={`text-recipe-category-${recipe.id}`}>
                        {recipe.category || "-"}
                      </TableCell>
                      <TableCell data-testid={`text-recipe-servings-${recipe.id}`}>
                        {recipe.servings}
                      </TableCell>
                      <TableCell data-testid={`text-recipe-margin-${recipe.id}`}>
                        <Badge variant="secondary">
                          {Number(recipe.targetMargin).toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setLocation(`/recipes/${recipe.id}/view`)}
                            title="View recipe"
                            data-testid={`button-view-recipe-${recipe.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setLocation(`/recipes/${recipe.id}`)}
                            data-testid={`button-edit-recipe-${recipe.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteId(recipe.id)}
                            data-testid={`button-delete-recipe-${recipe.id}`}
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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {myRecipes.map((recipe) => (
                  <Card key={recipe.id} data-testid={`card-recipe-${recipe.id}`} className="hover-elevate cursor-pointer overflow-hidden">
                    {recipe.coverImage && (
                      <div className="relative w-full h-40 bg-muted overflow-hidden">
                        <img
                          src={recipe.coverImage}
                          alt={recipe.name}
                          className="w-full h-full object-cover"
                          data-testid={`img-recipe-cover-${recipe.id}`}
                        />
                      </div>
                    )}
                    <CardHeader className={recipe.coverImage ? "pb-3" : ""}>
                      <CardTitle className="text-sm line-clamp-2">{recipe.name}</CardTitle>
                      {recipe.category && (
                        <Badge variant="outline" className="w-fit text-xs mt-2">
                          {recipe.category}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        <div>Servings: {recipe.servings}</div>
                        <div>Margin: <Badge variant="secondary" className="ml-1">{Number(recipe.targetMargin).toFixed(0)}%</Badge></div>
                      </div>
                      <div className="flex gap-1 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setLocation(`/recipes/${recipe.id}/view`)}
                          data-testid={`button-view-recipe-thumbnail-${recipe.id}`}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setLocation(`/recipes/${recipe.id}`)}
                          data-testid={`button-edit-recipe-thumbnail-${recipe.id}`}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setDeleteId(recipe.id)}
                          data-testid={`button-delete-recipe-thumbnail-${recipe.id}`}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            freeLoading ? (
              <Skeleton className="h-96 w-full" />
            ) : !filteredFreeRecipes || filteredFreeRecipes.length === 0 ? (
              <div className="text-center py-12" data-testid="empty-state-free-recipes">
                <p className="text-muted-foreground">
                  No free recipes available yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredFreeRecipes.map((recipe) => (
                  <Card key={recipe.id} data-testid={`card-free-recipe-${recipe.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-base">{recipe.name}</CardTitle>
                          <Badge className="mt-2" variant="outline">
                            FREE TEMPLATE
                          </Badge>
                        </div>
                        {user?.role === "admin" && (
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setLocation(`/recipes/${recipe.id}/view`)}
                              title="View recipe"
                              data-testid={`button-view-free-recipe-${recipe.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setLocation(`/recipes/${recipe.id}`)}
                              title="Edit recipe"
                              data-testid={`button-edit-free-recipe-${recipe.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteId(recipe.id)}
                              title="Delete recipe"
                              data-testid={`button-delete-free-recipe-${recipe.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {recipe.description && (
                        <p className="text-sm text-muted-foreground">
                          {recipe.description}
                        </p>
                      )}
                      {recipe.category && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Category: </span>
                          <span>{recipe.category}</span>
                        </div>
                      )}
                      {recipe.batchYield && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Yield: </span>
                          <span>{recipe.batchYield} units</span>
                        </div>
                      )}
                      {user?.role !== "admin" && (
                        <div className="space-y-2 pt-2">
                          <Button
                            onClick={() => setLocation(`/recipes/${recipe.id}/view`)}
                            variant="outline"
                            className="w-full"
                            data-testid={`button-view-free-recipe-${recipe.id}`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button
                            onClick={() => cloneMutation.mutate(recipe.id)}
                            disabled={cloneMutation.isPending}
                            className="w-full"
                            data-testid={`button-clone-recipe-${recipe.id}`}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Use this Recipe
                          </Button>
                        </div>
                      )}
                      {user?.role === "admin" && (
                        <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                          Access: {recipe.accessType === "admin" ? "Admin" : recipe.accessType === "all" ? "All Users" : recipe.accessType === "by-plan" ? "By Plan" : "Selected Users"}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent data-testid="dialog-delete-recipe">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this recipe? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
