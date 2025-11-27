import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Package, ChefHat } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AnalyticsOverview = {
  totalRecipes: number;
  totalOrders: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: string;
  totalIngredients: number;
};

type AdminStats = {
  totalUsers: number;
  activeUsers7d: number;
  activeUsers30d: number;
  newSignupsToday: number;
  trialUsers: number;
  totalRecipes: number;
};

function StatCard({ label, value, subtext }: { label: string; value: string | number; subtext?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-3xl font-bold text-primary mb-2">{value}</div>
        <p className="text-sm text-muted-foreground">{label}</p>
        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
      </CardContent>
    </Card>
  );
}

function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2" data-testid="admin-title">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and system health</p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {statsLoading ? (
              <>
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </>
            ) : stats ? (
              <>
                <StatCard label="Total Users" value={stats.totalUsers} data-testid="stat-total-users" />
                <StatCard label="Active (7 Days)" value={stats.activeUsers7d} subtext={`${Math.round((stats.activeUsers7d / Math.max(stats.totalUsers, 1)) * 100)}%`} />
                <StatCard label="Active (30 Days)" value={stats.activeUsers30d} subtext={`${Math.round((stats.activeUsers30d / Math.max(stats.totalUsers, 1)) * 100)}%`} />
                <StatCard label="New Today" value={stats.newSignupsToday} />
                <StatCard label="Trial Users" value={stats.trialUsers} />
                <StatCard label="Total Recipes" value={stats.totalRecipes} />
              </>
            ) : null}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Overall system status and metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <span className="text-sm font-medium">System Status</span>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">Healthy</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <span className="text-sm font-medium">Database</span>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Connected</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage & Engagement</CardTitle>
              <CardDescription>Feature adoption and user behavior metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Recipe Costing Usage</span>
                  <span className="text-sm font-semibold">75%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: "75%" }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Baker's Math Usage</span>
                  <span className="text-sm font-semibold">52%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: "52%" }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Scaling Tools Usage</span>
                  <span className="text-sm font-semibold">41%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: "41%" }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RegularDashboard() {
  const { user } = useAuth();
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
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-dashboard">
          Welcome back, {user?.firstName || user?.username}
        </h1>
        <p className="text-muted-foreground" data-testid="text-dashboard-description">
          Here's an overview of your kitchen operations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-recipes">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipes</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-recipe-count">
              {analytics?.totalRecipes || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Recipes in your library
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-revenue">
              {formatCurrency(analytics?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {analytics?.totalOrders || 0} orders
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-profit-margin">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-margin">
              {analytics?.profitMargin || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across orders
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-ingredients">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingredients</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-ingredients">
              {analytics?.totalIngredients || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              In your pantry
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card data-testid="card-quick-actions">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="/library/my-recipes" className="block p-3 rounded-lg border hover:bg-accent transition-colors" data-testid="link-new-recipe">
              <div className="flex items-center gap-3">
                <ChefHat className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">View Recipes</p>
                  <p className="text-sm text-muted-foreground">Browse your recipe library</p>
                </div>
              </div>
            </a>
            <a href="/pantry/ingredients" className="block p-3 rounded-lg border hover:bg-accent transition-colors" data-testid="link-ingredients">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Manage Ingredients</p>
                  <p className="text-sm text-muted-foreground">Update your pantry inventory</p>
                </div>
              </div>
            </a>
            <a href="/analytics" className="block p-3 rounded-lg border hover:bg-accent transition-colors" data-testid="link-analytics">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">View Analytics</p>
                  <p className="text-sm text-muted-foreground">Check your profitability</p>
                </div>
              </div>
            </a>
          </CardContent>
        </Card>

        <Card data-testid="card-getting-started">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Tips to get the most out of BentoHub</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">1</div>
              <div>
                <p className="font-medium">Add your ingredients</p>
                <p className="text-sm text-muted-foreground">Start by adding the ingredients you use in your recipes</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">2</div>
              <div>
                <p className="font-medium">Create recipes</p>
                <p className="text-sm text-muted-foreground">Build your recipe library with accurate costings</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">3</div>
              <div>
                <p className="font-medium">Track orders</p>
                <p className="text-sm text-muted-foreground">Log orders to monitor your revenue and profits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  
  if (user?.role === "admin") {
    return <AdminDashboard />;
  }
  
  return <RegularDashboard />;
}
