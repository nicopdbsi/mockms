import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronUp, ChevronDown, Trash2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  businessName: string | null;
  role: string;
  status: string;
  lastLogin: string | null;
  createdAt: string;
};

type SortConfig = {
  key: keyof User;
  direction: "asc" | "desc";
} | null;

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function getSortedUsers(users: User[], sortConfig: SortConfig): User[] {
  if (!sortConfig) return users;
  
  const sorted = [...users].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortConfig.direction === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortConfig.direction === "asc" ? -1 : 1;
  });
  
  return sorted;
}

export default function ReportsUsers() {
  const { toast } = useToast();
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ username: "", email: "", password: "", firstName: "" });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const handleSort = (key: keyof User) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const filteredUsers = (users || []).filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.firstName && u.firstName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedUsers = getSortedUsers(filteredUsers, sortConfig);

  const addUserMutation = useMutation({
    mutationFn: async (data: typeof newUserData) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ description: "User created successfully" });
      setNewUserData({ username: "", email: "", password: "", firstName: "" });
      setIsAddDialogOpen(false);
    },
    onError: () => {
      toast({ description: "Failed to create user", variant: "destructive" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ description: "User role updated" });
    },
    onError: () => {
      toast({ description: "Failed to update role", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ description: "User status updated" });
    },
    onError: () => {
      toast({ description: "Failed to update status", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", "/api/admin/stats"] });
      toast({ description: "User deleted" });
    },
    onError: () => {
      toast({ description: "Failed to delete user", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-users">
          User Management
        </h1>
        <p className="text-muted-foreground" data-testid="text-users-description">
          View, edit, and manage user accounts
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <div>
            <CardTitle>All Users</CardTitle>
            <CardDescription>{filteredUsers.length} users found</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-user">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={newUserData.username}
                    onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                    placeholder="username"
                    data-testid="input-username"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    placeholder="email@example.com"
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    placeholder="••••••••"
                    data-testid="input-password"
                  />
                </div>
                <div>
                  <Label htmlFor="firstName">First Name (Optional)</Label>
                  <Input
                    id="firstName"
                    value={newUserData.firstName}
                    onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                    placeholder="First Name"
                    data-testid="input-firstName"
                  />
                </div>
                <Button 
                  onClick={() => addUserMutation.mutate(newUserData)}
                  disabled={addUserMutation.isPending || !newUserData.username || !newUserData.email || !newUserData.password}
                  className="w-full"
                  data-testid="button-submit-user"
                >
                  {addUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by username, email, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9"
              data-testid="input-search-users"
            />
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort("username")} className="cursor-pointer hover:opacity-70" data-testid="header-username">
                    <div className="flex items-center gap-2">
                      Username
                      {sortConfig?.key === "username" && (sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("email")} className="cursor-pointer hover:opacity-70" data-testid="header-email">
                    <div className="flex items-center gap-2">
                      Email
                      {sortConfig?.key === "email" && (sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead onClick={() => handleSort("lastLogin")} className="cursor-pointer hover:opacity-70" data-testid="header-lastLogin">
                    <div className="flex items-center gap-2">
                      Last Login
                      {sortConfig?.key === "lastLogin" && (sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                    <TableCell className="font-medium" data-testid={`cell-username-${user.id}`}>{user.username}</TableCell>
                    <TableCell data-testid={`cell-email-${user.id}`}>{user.email}</TableCell>
                    <TableCell data-testid={`cell-name-${user.id}`}>{user.firstName || "-"}</TableCell>
                    <TableCell>
                      <Select value={user.role} onValueChange={(role) => updateRoleMutation.mutate({ userId: user.id, role })} data-testid={`select-role-${user.id}`}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="beta_tester">Beta</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={user.status} onValueChange={(status) => updateStatusMutation.mutate({ userId: user.id, status })} data-testid={`select-status-${user.id}`}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground" data-testid={`cell-lastLogin-${user.id}`}>
                      {user.lastLogin ? `${formatDate(user.lastLogin)} ${formatTime(user.lastLogin)}` : "Never"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Delete ${user.username}?`)) deleteUserMutation.mutate(user.id); }} data-testid={`button-delete-${user.id}`}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
