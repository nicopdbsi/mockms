import { useEffect, useState, type ReactNode } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, TrendingUp, LogOut, ChevronDown, Building2, Wrench, Warehouse, UtensilsCrossed, User, Settings as SettingsIcon, FileText, Users, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import bentoLogo from "@assets/BentoHubLogo_1764103927788.png";

interface AppLayoutProps {
  children: ReactNode;
}

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: TrendingUp,
  },
];

const libraryItems = [
  {
    title: "My Recipes",
    url: "/library/my-recipes",
  },
  {
    title: "Bento Library",
    url: "/library/bentohub-library",
  },
];

const pantryItems = [
  {
    title: "Ingredients",
    url: "/pantry/ingredients",
    icon: Package,
  },
  {
    title: "Materials & Equipment",
    url: "/pantry/materials",
    icon: Wrench,
  },
  {
    title: "Suppliers",
    url: "/pantry/suppliers",
    icon: Building2,
  },
];

const reportsItems = [
  {
    title: "Users",
    url: "/reports/users",
    icon: Users,
  },
  {
    title: "Export",
    url: "/reports/export",
    icon: Download,
  },
];

function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [pantryOpen, setPantryOpen] = useState(location.startsWith("/pantry"));
  const [libraryOpen, setLibraryOpen] = useState(location.startsWith("/library"));
  const [reportsOpen, setReportsOpen] = useState(location.startsWith("/reports"));

  const getUserInitials = () => {
    if (!user?.username) return "U";
    return user.username.substring(0, 2).toUpperCase();
  };

  const isPantryActive = location.startsWith("/pantry");
  const isLibraryActive = location.startsWith("/library");
  const isReportsActive = location.startsWith("/reports");
  const isAdmin = user?.role === "admin";

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <img src={bentoLogo} alt="BentoHub Logo" className="h-6 w-auto" data-testid="logo-icon" />
          <span className="text-lg font-semibold" data-testid="text-app-name">BentoHub</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild data-active={isActive}>
                      <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              <Collapsible open={libraryOpen} onOpenChange={setLibraryOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton data-active={isLibraryActive} data-testid="button-library">
                      <UtensilsCrossed />
                      <span>Library</span>
                      <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${libraryOpen ? "rotate-180" : ""}`} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {libraryItems.map((item) => {
                        const isActive = location === item.url;
                        return (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild data-active={isActive}>
                              <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/ /g, "-")}`}>
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible open={pantryOpen} onOpenChange={setPantryOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton data-active={isPantryActive} data-testid="button-pantry">
                      <Warehouse />
                      <span>Pantry</span>
                      <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${pantryOpen ? "rotate-180" : ""}`} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {pantryItems.map((item) => {
                        const isActive = location === item.url;
                        return (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild data-active={isActive}>
                              <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/ & /g, "-")}`}>
                                <item.icon className="h-4 w-4" />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {isAdmin && (
                <Collapsible open={reportsOpen} onOpenChange={setReportsOpen}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton data-active={isReportsActive} data-testid="button-reports">
                        <FileText />
                        <span>Reports</span>
                        <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${reportsOpen ? "rotate-180" : ""}`} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {reportsItems.map((item) => {
                          const isActive = location === item.url;
                          return (
                            <SidebarMenuSubItem key={item.title}>
                              <SidebarMenuSubButton asChild data-active={isActive}>
                                <Link href={item.url} data-testid={`link-reports-${item.title.toLowerCase()}`}>
                                  <item.icon className="h-4 w-4" />
                                  <span>{item.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton asChild data-active={location === "/profile"}>
                  <Link href="/profile" data-testid="link-profile">
                    <User />
                    <span>Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild data-active={location === "/settings"}>
                  <Link href="/settings" data-testid="link-settings">
                    <SettingsIcon />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-8 w-8" data-testid="avatar-user">
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate" data-testid="text-username">
                {user?.username}
              </span>
              {user?.businessName && (
                <span className="text-xs text-muted-foreground truncate" data-testid="text-business-name">
                  {user.businessName}
                </span>
              )}
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => logout()}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto p-6" data-testid="main-content">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
