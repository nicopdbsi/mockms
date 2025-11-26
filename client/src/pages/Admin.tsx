import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    
    if (typeof aValue === "string") {
      return sortConfig.direction === "asc" 
        ? aValue.localeCompare(bValue as string)
        : (bValue as string).localeCompare(aValue);
    }
    
    return sortConfig.direction === "asc" 
      ? (aValue < bValue ? -1 : 1)
      : (bValue < aValue ? -1 : 1);
  });
  
  return sorted;
}

export default function Admin() {
  const { toast } = useToast();
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">Manage user roles and permissions</p>
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
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => handleSort("createdAt")}
                      data-testid="button-sort-date-confirmed"
                    >
                      Date Confirmed
                      {sortConfig?.key === "createdAt" && (
                        sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Time Confirmed</TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => handleSort("firstName")}
                      data-testid="button-sort-first-name"
                    >
                      First Name
                      {sortConfig?.key === "firstName" && (
                        sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => handleSort("username")}
                      data-testid="button-sort-username"
                    >
                      Username
                      {sortConfig?.key === "username" && (
                        sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => handleSort("email")}
                      data-testid="button-sort-email"
                    >
                      Email
                      {sortConfig?.key === "email" && (
                        sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => handleSort("businessName")}
                      data-testid="button-sort-business"
                    >
                      Business
                      {sortConfig?.key === "businessName" && (
                        sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Role</TableHead>
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
