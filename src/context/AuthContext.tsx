import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { api } from "../services/api";

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  userName: string;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const trustedOrigins = (import.meta.env.VITE_TRUSTED_ORIGINS || "")
  .split(",")
  .map((o: string) => o.trim())
  .filter(Boolean);

const isTrustedOrigin = trustedOrigins.includes(window.location.origin);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(isTrustedOrigin);
  const [user, setUser] = useState<User | null>(
    isTrustedOrigin ? { id: 0, email: "", name: "Visitante" } : null,
  );
  const [loading, setLoading] = useState(!isTrustedOrigin);

  useEffect(() => {
    if (isTrustedOrigin) return;

    // Register callback for forced logout (when refresh token fails)
    api.onLogout(() => {
      setIsAuthenticated(false);
      setUser(null);
    });

    async function checkAuth() {
      try {
        const storedUser = localStorage.getItem("user");
        const hasToken = api.getToken();

        // Restore session from localStorage if we have valid data
        if (storedUser && hasToken) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }

        // Try to refresh tokens in background (optional - won't logout on failure)
        const response = await api.silentRefresh();
        if (response && response.user) {
          setUser(response.user);
          setIsAuthenticated(true);
          localStorage.setItem("user", JSON.stringify(response.user));
        }
        // If silentRefresh fails but we have tokens, keep the session
        // The request mechanism will handle token refresh when needed
      } catch (err) {
        console.error("Error checking auth on startup:", err);
        // Don't logout on error - existing tokens may still be valid
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  async function login(email: string, password: string): Promise<boolean> {
    try {
      const response = await api.login(email, password);
      if (response && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(response.user));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  function logout() {
    api.logout();
    setIsAuthenticated(false);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        userName: user?.name || "",
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
