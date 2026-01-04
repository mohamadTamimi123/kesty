"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import apiClient from "../lib/api";
import logger from "../utils/logger";

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
          // Normalize role to ensure consistency
          if (userData.role) {
            userData.role = normalizeRole(userData.role);
          }
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        // Silently handle localStorage errors - these are internal and shouldn't be shown to users
        logger.error("Error reading auth data", error);
        setUser(null);
        // Clear potentially corrupted data
        try {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        } catch (clearError) {
          logger.error("Error clearing corrupted auth data", clearError);
        }
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

    // Listen for custom auth events (for same-tab updates)
    // This is triggered by window.dispatchEvent(new Event("auth-change"))
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth-change", handleAuthChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);

  const login = async (userData: User, token?: string) => {
    // Normalize role before storing
    const normalizedUserData = {
      ...userData,
      role: normalizeRole(userData.role || ""),
    };
    
    // Set user state first
    setUser(normalizedUserData);
    
    // Store in localStorage
    localStorage.setItem("user", JSON.stringify(normalizedUserData));
    
    // Ensure token is also set if provided
    if (token) {
      localStorage.setItem("accessToken", token);
      
      // Also set cookie for middleware with proper timing
      const expires = new Date();
      expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000));
      const cookieValue = `accessToken=${token}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
      document.cookie = cookieValue;
      
      if (window.location.protocol === 'https:') {
        document.cookie = `${cookieValue}; Secure`;
      }
      
      // Wait a bit to ensure cookie is set before continuing
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    // Wait a bit more to ensure state is fully updated
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event("auth-change"));
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      // Log error but don't block logout - always clear local state
      logger.error("Logout error", error);
      // Note: We don't show toast here because logout should always succeed locally
      // even if the API call fails (e.g., network issues)
    } finally {
      // Always clear user data and redirect, even if API call failed
      setUser(null);
      try {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
      } catch (clearError) {
        logger.error("Error clearing auth data on logout", clearError);
      }
      
      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new Event("auth-change"));
      
      // Redirect to home
      router.push("/");
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("auth-change"));
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

