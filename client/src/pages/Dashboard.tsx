import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Package, ChefHat, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type AnalyticsOverview = {
  totalRecipes: number;
  totalOrders: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: string;
  lowStockCount: number;
};

export default function Dashboard() {
  const { data: analytics, isLoading } = useQuery<AnalyticsOverview>({
    queryKey: ["/api/analytics/overview"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Revenue",
      value: `$${analytics?.totalRevenue.toFixed(2) || "0.00"}`,
      icon: DollarSign,
      description: `${analytics?.totalOrders || 0} orders`,
      testId: "stat-revenue",
    },
    {
      title: "Total Profit",
      value: `$${analytics?.totalProfit.toFixed(2) || "0.00"}`,
      icon: TrendingUp,
      description: `${analytics?.profitMargin || 0}% margin`,
      testId: "stat-profit",
    },
    {
      title: "Recipes",
      value: analytics?.totalRecipes || 0,
      icon: ChefHat,
      description: "Total recipes created",
      testId: "stat-recipes",
    },
    {
      title: "Low Stock Items",
      value: analytics?.lowStockCount || 0,
      icon: Package,
      description: "Need restocking",
      testId: "stat-low-stock",
      warning: (analytics?.lowStockCount || 0) > 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-dashboard">
          Dashboard
        </h1>
        <p className="text-muted-foreground" data-testid="text-dashboard-description">
          Overview of your kitchen management system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} data-testid={stat.testId}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`${stat.testId}-value`}>
                {stat.value}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground" data-testid={`${stat.testId}-description`}>
                  {stat.description}
                </p>
                {stat.warning && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Alert
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card data-testid="card-quick-insights">
        <CardHeader>
          <CardTitle>Quick Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Profitability</p>
              <p className="text-sm text-muted-foreground">
                Your current profit margin is {analytics?.profitMargin || 0}%.
                {Number(analytics?.profitMargin || 0) < 30 && 
                  " Consider reviewing recipe costs to improve margins."}
              </p>
            </div>
          </div>

          {(analytics?.lowStockCount || 0) > 0 && (
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-destructive/10 p-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium">Stock Alert</p>
                <p className="text-sm text-muted-foreground">
                  You have {analytics?.lowStockCount} ingredient(s) running low on stock.
                  Visit the Ingredients page to restock.
                </p>
              </div>
            </div>
          )}

          {analytics?.totalRecipes === 0 && (
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-accent/50 p-2">
                <ChefHat className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Get Started</p>
                <p className="text-sm text-muted-foreground">
                  Create your first recipe to start tracking costs and profitability.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
