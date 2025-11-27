import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Users, ChefHat, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ReportsExport() {
  const { toast } = useToast();

  const handleExportUsers = async () => {
    try {
      const response = await fetch("/api/admin/export/users");
      if (!response.ok) throw new Error("Export failed");
      const csv = await response.text();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "users.csv";
      a.click();
      window.URL.revokeObjectURL(url);
      toast({ description: "Users exported successfully" });
    } catch (error) {
      toast({ description: "Failed to export users", variant: "destructive" });
    }
  };

  const handleExportRecipes = async () => {
    try {
      const response = await fetch("/api/admin/export/recipes");
      if (!response.ok) throw new Error("Export failed");
      const csv = await response.text();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "recipes.csv";
      a.click();
      window.URL.revokeObjectURL(url);
      toast({ description: "Recipes exported successfully" });
    } catch (error) {
      toast({ description: "Failed to export recipes", variant: "destructive" });
    }
  };

  const handleExportIngredients = async () => {
    try {
      const response = await fetch("/api/admin/export/ingredients");
      if (!response.ok) throw new Error("Export failed");
      const csv = await response.text();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ingredients.csv";
      a.click();
      window.URL.revokeObjectURL(url);
      toast({ description: "Ingredients exported successfully" });
    } catch (error) {
      toast({ description: "Failed to export ingredients", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-export">
          Export Center
        </h1>
        <p className="text-muted-foreground" data-testid="text-export-description">
          Export data and generate reports for analysis
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card data-testid="card-export-users">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Users</CardTitle>
                <CardDescription>Export all user accounts</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Download a CSV file containing all registered users, their roles, status, and account information.
            </p>
            <Button onClick={handleExportUsers} className="w-full" data-testid="button-export-users">
              <Download className="w-4 h-4 mr-2" />
              Export Users CSV
            </Button>
          </CardContent>
        </Card>

        <Card data-testid="card-export-recipes">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ChefHat className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Recipes</CardTitle>
                <CardDescription>Export all platform recipes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Download a CSV file containing all recipes created on the platform with cost and margin data.
            </p>
            <Button onClick={handleExportRecipes} className="w-full" data-testid="button-export-recipes">
              <Download className="w-4 h-4 mr-2" />
              Export Recipes CSV
            </Button>
          </CardContent>
        </Card>

        <Card data-testid="card-export-ingredients">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Ingredients</CardTitle>
                <CardDescription>Export all ingredients data</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Download a CSV file containing all ingredients across the platform with pricing information.
            </p>
            <Button onClick={handleExportIngredients} className="w-full" data-testid="button-export-ingredients">
              <Download className="w-4 h-4 mr-2" />
              Export Ingredients CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-export-info">
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
            <CardTitle>Export Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            All exports are generated as CSV files that can be opened in spreadsheet applications like Excel, Google Sheets, or Numbers.
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Exports include all records from the database</li>
            <li>Sensitive information like passwords are excluded</li>
            <li>Date and time values are formatted for easy reading</li>
            <li>CSV files are compatible with most data analysis tools</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
