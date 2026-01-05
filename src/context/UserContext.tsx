import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, loginUser } from '../ui_components/api/auth';

export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        setIsLoading(false);
        setUser(null);
        return;
    }

    try {
      const data = await getCurrentUser();
      if (data && data.email) {
          setUser(data);
      } else {
          setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('isAuthenticated');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const data = await loginUser(email, password);
      if (data.token) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('authToken');
    setUser(null);
    window.location.href = '/login';
  };

  useEffect(() => {
    // Check for token in URL (from Google/OAuth redirect)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('authToken', token);
      // Clean URL without full reload
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.pathname);
    }

    refreshUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading, refreshUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

