import { createContext, useContext, useState, type ReactNode } from 'react';
import { MOCK_USER } from '../data/mockData';

interface AuthContextType {
  isAuthenticated: boolean;
  userName: string;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');

  function login(email: string, password: string): boolean {
    if (email === MOCK_USER.email && password === MOCK_USER.password) {
      setIsAuthenticated(true);
      setUserName(MOCK_USER.name);
      return true;
    }
    return false;
  }

  function logout() {
    setIsAuthenticated(false);
    setUserName('');
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
