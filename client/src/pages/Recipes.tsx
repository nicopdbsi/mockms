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
import { type Recipe } from "@shared/schema";
import { Plus, Pencil, Trash2, Search, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";

export default function Recipes() {
  const [, setLocation] = useLocation();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: recipes, isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const filteredAndSortedRecipes = useMemo(() => {
    if (!recipes) return [];
    return recipes
      .filter((recipe) =>
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [recipes, searchQuery]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/recipes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
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
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-recipes">
            Recipes
          </h1>
          <p className="text-muted-foreground" data-testid="text-recipes-description">
            Manage your recipes and calculate costs
          </p>
        </div>
        <Button
          onClick={() => setLocation("/recipes/new")}
          data-testid="button-add-recipe"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Recipe
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Recipes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recipes by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              data-testid="input-search-recipes"
            />
          </div>
          {!recipes || recipes.length === 0 ? (
            <div className="text-center py-12" data-testid="empty-state-recipes">
              <p className="text-muted-foreground">
                No recipes yet. Create your first recipe to get started.
              </p>
            </div>
          ) : filteredAndSortedRecipes.length === 0 ? (
            <div className="text-center py-12" data-testid="empty-state-search-recipes">
              <p className="text-muted-foreground">
                No recipes match your search.
              </p>
            </div>
          ) : (
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
                {filteredAndSortedRecipes.map((recipe) => (
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
