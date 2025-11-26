import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ChevronUp, ChevronDown, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UserWithRole = {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  businessName: string | null;
  role: string;
  createdAt: string;
};

type SortConfig = {
  key: keyof UserWithRole;
  direction: "asc" | "desc";
} | null;

// Format date to Philippines time (UTC+8)
function formatPhilippinesDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatPhilippinesTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function getSortedUsers(users: UserWithRole[], sortConfig: SortConfig): UserWithRole[] {
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
    
    const aNum = aValue as any;
    const bNum = bValue as any;
    return sortConfig.direction === "asc" 
      ? (aNum < bNum ? -1 : 1)
      : (bNum < aNum ? -1 : 1);
  });
  
  return sorted;
}

export default function Admin() {
  const { toast } = useToast();
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ username: "", email: "", password: "", firstName: "", businessName: "" });

  const { data: users, isLoading } = useQuery<UserWithRole[]>({
    queryKey: ["/api/admin/users"],
  });

  const handleSort = (key: keyof UserWithRole) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const sortedUsers = users ? getSortedUsers(users, sortConfig) : [];

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ description: "User role updated successfully" });
    },
    onError: () => {
      toast({ description: "Failed to update user role", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ description: "User deleted successfully" });
    },
    onError: () => {
      toast({ description: "Failed to delete user", variant: "destructive" });
    },
  });

  const addUserMutation = useMutation({
    mutationFn: async (data: typeof newUserData) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsAddDialogOpen(false);
      setNewUserData({ username: "", email: "", password: "", firstName: "", businessName: "" });
      toast({ description: "User added successfully" });
    },
    onError: (error: any) => {
      toast({ description: error.message || "Failed to add user", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
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
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new user account</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                  placeholder="username"
                  data-testid="input-add-username"
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
                  data-testid="input-add-email"
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
                  data-testid="input-add-password"
                />
              </div>
              <div>
                <Label htmlFor="firstName">First Name (Optional)</Label>
                <Input
                  id="firstName"
                  value={newUserData.firstName}
                  onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                  placeholder="First Name"
                  data-testid="input-add-first-name"
                />
              </div>
              <div>
                <Label htmlFor="businessName">Business Name (Optional)</Label>
                <Input
                  id="businessName"
                  value={newUserData.businessName}
                  onChange={(e) => setNewUserData({ ...newUserData, businessName: e.target.value })}
                  placeholder="Business Name"
                  data-testid="input-add-business-name"
                />
              </div>
              <Button 
                onClick={() => addUserMutation.mutate(newUserData)}
                disabled={addUserMutation.isPending || !newUserData.username || !newUserData.email || !newUserData.password}
                className="w-full"
                data-testid="button-submit-add-user"
              >
                {addUserMutation.isPending ? "Adding..." : "Add User"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>View and manage user roles</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div 
                      onClick={() => handleSort("createdAt")}
                      className="flex items-center gap-2 cursor-pointer hover:opacity-70"
                      data-testid="button-sort-date-confirmed"
                    >
                      Date Confirmed
                      {sortConfig?.key === "createdAt" && (
                        sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Time Confirmed</TableHead>
                  <TableHead>
                    <div 
                      onClick={() => handleSort("firstName")}
                      className="flex items-center gap-2 cursor-pointer hover:opacity-70"
                      data-testid="button-sort-first-name"
                    >
                      First Name
                      {sortConfig?.key === "firstName" && (
                        sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>
                    <div 
                      onClick={() => handleSort("username")}
                      className="flex items-center gap-2 cursor-pointer hover:opacity-70"
                      data-testid="button-sort-username"
                    >
                      Username
                      {sortConfig?.key === "username" && (
                        sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>
                    <div 
                      onClick={() => handleSort("email")}
                      className="flex items-center gap-2 cursor-pointer hover:opacity-70"
                      data-testid="button-sort-email"
                    >
                      Email
                      {sortConfig?.key === "email" && (
                        sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>
                    <div 
                      onClick={() => handleSort("businessName")}
                      className="flex items-center gap-2 cursor-pointer hover:opacity-70"
                      data-testid="button-sort-business"
                    >
                      Business
                      {sortConfig?.key === "businessName" && (
                        sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-sm text-muted-foreground" data-testid={`text-date-confirmed-${user.id}`}>{formatPhilippinesDate(user.createdAt)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground" data-testid={`text-time-confirmed-${user.id}`}>{formatPhilippinesTime(user.createdAt)}</TableCell>
                    <TableCell data-testid={`text-first-name-${user.id}`}>{user.firstName || "-"}</TableCell>
                    <TableCell data-testid={`text-username-${user.id}`}>{user.username}</TableCell>
                    <TableCell data-testid={`text-email-${user.id}`}>{user.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.businessName || "-"}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(role) =>
                          updateRoleMutation.mutate({ userId: user.id, role })
                        }
                        data-testid={`select-role-${user.id}`}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="beta_tester">Beta Tester</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (window.confirm(`Delete user ${user.username}?`)) {
                            deleteUserMutation.mutate(user.id);
                          }
                        }}
                        data-testid={`button-delete-user-${user.id}`}
                      >
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
