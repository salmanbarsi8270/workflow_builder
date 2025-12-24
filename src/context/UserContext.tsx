import React, { createContext, useContext, useState, useEffect } from 'react';
import { getdata } from '../ui_components/api/userdeatails';

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
      const data = await getdata();
      // Basic validation or casting
      if (data && data.email) {
          setUser(data);
      } else {
          setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};
