import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "./queryClient";

type User = {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  businessName: string | null;
  role: string;
  createdAt: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, firstName?: string, businessName?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ user: User } | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: Infinity,
  });

  const user = data?.user ?? null;

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ username, email, password, firstName, businessName }: { 
      username: string; 
      email: string;
      password: string; 
      firstName?: string;
      businessName?: string;
    }) => {
      const response = await apiRequest("POST", "/api/auth/register", { 
        username, 
        email, 
        password, 
        firstName,
        businessName 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.removeQueries({ queryKey: ["/api/recipes"] });
      queryClient.removeQueries({ queryKey: ["/api/ingredients"] });
      queryClient.removeQueries({ queryKey: ["/api/orders"] });
      queryClient.removeQueries({ queryKey: ["/api/analytics"] });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        login: async (username, password) => {
          await loginMutation.mutateAsync({ username, password });
        },
        register: async (username, email, password, firstName, businessName) => {
          await registerMutation.mutateAsync({ username, email, password, firstName, businessName });
        },
        logout: async () => {
          await logoutMutation.mutateAsync();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
