import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { AppLayout } from "@/components/AppLayout";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Recipes from "@/pages/Recipes";
import RecipeForm from "@/pages/RecipeForm";
import Ingredients from "@/pages/Ingredients";
import Materials from "@/pages/Materials";
import Suppliers from "@/pages/Suppliers";
import Analytics from "@/pages/Analytics";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import ReportsUsers from "@/pages/ReportsUsers";
import ReportsExport from "@/pages/ReportsExport";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/dashboard">
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </Route>
      <Route path="/recipes" component={() => (
        <AppLayout>
          <Recipes />
        </AppLayout>
      )} />
      <Route path="/library/my-recipes" component={() => (
        <AppLayout>
          <Recipes />
        </AppLayout>
      )} />
      <Route path="/library/bentohub-library" component={() => (
        <AppLayout>
          <Recipes />
        </AppLayout>
      )} />
      <Route path="/recipes/:id/view">
        <AppLayout>
          <RecipeForm viewOnly={true} />
        </AppLayout>
      </Route>
      <Route path="/recipes/:id">
        <AppLayout>
          <RecipeForm />
        </AppLayout>
      </Route>
      <Route path="/library/:id/view">
        <AppLayout>
          <RecipeForm viewOnly={true} />
        </AppLayout>
      </Route>
      <Route path="/library/:id">
        <AppLayout>
          <RecipeForm />
        </AppLayout>
      </Route>
      <Route path="/pantry/ingredients" component={Ingredients} />
      <Route path="/pantry/materials" component={Materials} />
      <Route path="/pantry/suppliers" component={Suppliers} />
      <Route path="/analytics">
        <AppLayout>
          <Analytics />
        </AppLayout>
      </Route>
      <Route path="/profile">
        <AppLayout>
          <Profile />
        </AppLayout>
      </Route>
      <Route path="/settings">
        <AppLayout>
          <Settings />
        </AppLayout>
      </Route>
      <Route path="/reports/users">
        <AppLayout>
          <ReportsUsers />
        </AppLayout>
      </Route>
      <Route path="/reports/export">
        <AppLayout>
          <ReportsExport />
        </AppLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
