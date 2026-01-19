// File: context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import type { User, AuthResponse } from "../services/api";

export interface AuthContextType {
  user: User | null;
  loading: boolean; // ✅ Added loading state
  login: (authData: AuthResponse) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // ✅ Default is TRUE (Loading)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem("authUser");
        const storedToken = localStorage.getItem("authToken");

        if (storedUser && storedToken) {
          // I-restore ang user data
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Auth restoration failed", error);
        localStorage.removeItem("authUser");
        localStorage.removeItem("authToken");
      } finally {
        setLoading(false); // ✅ Tapos na mag-load, pwede na mag-render
      }
    };

    initAuth();
  }, []);

  const login = (authData: AuthResponse) => {
    const { user, token } = authData;
    setUser(user);
    localStorage.setItem("authUser", JSON.stringify(user));
    localStorage.setItem("authToken", token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("authUser");
    localStorage.removeItem("authToken");
    window.location.href = "/"; // Force redirect to home
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
