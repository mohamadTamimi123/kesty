"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import apiClient from "../lib/api";

interface User {
  id: string;
  phone: string;
  role: "CUSTOMER" | "SUPPLIER" | "ADMIN" | "customer" | "supplier" | "admin";
  fullName?: string;
  name?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User, token?: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check for stored auth data
    const checkAuth = () => {
      try {
        const token = localStorage.getItem("accessToken");
        const storedUser = localStorage.getItem("user");
        
        if (token && storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error reading auth data:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for storage changes (for multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "accessToken" || e.key === "user") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = async (userData: User, token?: string) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    
    // Ensure token is also set if provided
    if (token) {
      localStorage.setItem("accessToken", token);
      
      // Also set cookie for middleware
      const expires = new Date();
      expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000));
      const cookieValue = `accessToken=${token}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
      document.cookie = cookieValue;
      
      if (window.location.protocol === 'https:') {
        document.cookie = `${cookieValue}; Secure`;
      }
    }
    
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event("storage"));
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      
      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new Event("storage"));
      
      // Redirect to home
      router.push("/");
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("storage"));
    }
  };

  // Helper to map backend role to frontend role
  const normalizeRole = (role: string): "customer" | "supplier" | "admin" => {
    const upperRole = role.toUpperCase();
    if (upperRole === "CUSTOMER") return "customer";
    if (upperRole === "SUPPLIER") return "supplier";
    if (upperRole === "ADMIN") return "admin";
    return role as "customer" | "supplier" | "admin";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

