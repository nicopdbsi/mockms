import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";
import { type Recipe, type Order } from "@shared/schema";

type AnalyticsOverview = {
  totalRecipes: number;
  totalOrders: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: string;
  lowStockCount: number;
};

export default function Analytics() {
  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsOverview>({
    queryKey: ["/api/analytics/overview"],
  });

  const { data: recipes, isLoading: recipesLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const isLoading = analyticsLoading || recipesLoading || ordersLoading;

  const recipePerformance = recipes?.map((recipe) => {
    const recipeOrders = orders?.filter((o) => o.recipeId === recipe.id) || [];
    const revenue = recipeOrders.reduce((sum, o) => sum + Number(o.totalRevenue), 0);
    const cost = recipeOrders.reduce((sum, o) => sum + Number(o.totalCost), 0);
    const profit = revenue - cost;
    const margin = revenue > 0 ? ((profit / revenue) * 100) : 0;

    return {
      recipe,
      orderCount: recipeOrders.length,
      revenue,
      cost,
      profit,
      margin,
    };
  }).sort((a, b) => b.revenue - a.revenue) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-analytics">
          Analytics
        </h1>
        <p className="text-muted-foreground" data-testid="text-analytics-description">
          Profitability insights and performance metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              ${analytics?.totalRevenue.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              From {analytics?.totalOrders || 0} orders
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-profit">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-profit">
              ${analytics?.totalProfit.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              Net profit after costs
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-profit-margin">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-profit-margin">
              {analytics?.profitMargin || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across all orders
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-cost">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-cost">
              ${analytics?.totalCost.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              Total ingredient costs
            </p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-recipe-performance">
        <CardHeader>
          <CardTitle>Recipe Performance</CardTitle>
          <CardDescription>
            Revenue and profitability breakdown by recipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recipePerformance.length === 0 ? (
            <div className="text-center py-12" data-testid="empty-state-recipe-performance">
              <p className="text-muted-foreground">
                No recipe performance data yet. Create recipes and orders to see analytics.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recipePerformance.map((item) => (
                <div
                  key={item.recipe.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`recipe-performance-${item.recipe.id}`}
                >
                  <div className="space-y-1">
                    <p className="font-medium" data-testid={`recipe-name-${item.recipe.id}`}>
                      {item.recipe.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.orderCount} orders
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-8 text-right">
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="font-medium" data-testid={`recipe-revenue-${item.recipe.id}`}>
                        ${item.revenue.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Profit</p>
                      <p className="font-medium" data-testid={`recipe-profit-${item.recipe.id}`}>
                        ${item.profit.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Margin</p>
                      <p className="font-medium" data-testid={`recipe-margin-${item.recipe.id}`}>
                        {item.margin.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card data-testid="card-insights">
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Number(analytics?.profitMargin || 0) < 30 && (
              <div className="flex items-start gap-3">
                <TrendingDown className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Low Profit Margin</p>
                  <p className="text-sm text-muted-foreground">
                    Your overall margin is below 30%. Consider reviewing recipe costs or pricing.
                  </p>
                </div>
              </div>
            )}
            {Number(analytics?.profitMargin || 0) >= 30 && Number(analytics?.profitMargin || 0) < 50 && (
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Healthy Margin</p>
                  <p className="text-sm text-muted-foreground">
                    Your profit margin is in a good range. Keep monitoring costs to maintain profitability.
                  </p>
                </div>
              </div>
            )}
            {Number(analytics?.profitMargin || 0) >= 50 && (
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Excellent Margin</p>
                  <p className="text-sm text-muted-foreground">
                    Your profit margin is excellent! You're managing costs very effectively.
                  </p>
                </div>
              </div>
            )}
            {recipePerformance.length > 0 && (
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Top Performer</p>
                  <p className="text-sm text-muted-foreground">
                    "{recipePerformance[0].recipe.name}" generated the most revenue (${recipePerformance[0].revenue.toFixed(2)})
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-recommendations">
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Optimize Your Menu</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Focus on high-margin recipes</li>
                <li>Review low-performing items</li>
                <li>Track ingredient costs regularly</li>
                <li>Adjust pricing based on market trends</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
