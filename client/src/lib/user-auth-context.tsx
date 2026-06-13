import React, { createContext, useContext, useState, useEffect, ReactNode, FC } from 'react';
import { API_BASE_URL } from './queryClient';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  created_at?: string;
}

interface UserAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => void;
  loginWithPhone: (name: string, phone: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export const UserAuthProvider: FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Check if already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('userToken');
        const userData = localStorage.getItem('userData');

        if (token) {
          try {
            // Verify token is still valid
            const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
              const data = await response.json();
              setIsAuthenticated(true);
              setUser(data.user || (userData ? JSON.parse(userData) : null));
            } else if (response.status === 401 || response.status === 403) {
              // Token actually rejected by server — clear it
              localStorage.removeItem('userToken');
              localStorage.removeItem('userData');
              setIsAuthenticated(false);
              setUser(null);
            } else {
              // Server error or network issue — trust localStorage to keep user logged in
              if (userData) {
                setIsAuthenticated(true);
                setUser(JSON.parse(userData));
              }
            }
          } catch {
            // Network error — don't log out the user, trust localStorage
            if (userData) {
              setIsAuthenticated(true);
              setUser(JSON.parse(userData));
            }
          }
        }
      } catch (err) {
        // Outer error — keep silent
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('userToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      setIsAuthenticated(true);
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    }
  };

  const register = async (data: { name: string; email: string; password: string; phone?: string }) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const result = await response.json();
      localStorage.setItem('userToken', result.token);
      localStorage.setItem('userData', JSON.stringify(result.user));
      setIsAuthenticated(true);
      setUser(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    }
  };

  const loginWithPhone = async (name: string, phone: string) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, phone }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('userToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      setIsAuthenticated(true);
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    }
  };

  const loginWithGoogle = async (credential: string) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
        credentials: 'include',
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Google sign-in failed');
      }
      const data = await response.json();
      localStorage.setItem('userToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      setIsAuthenticated(true);
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
  };

  return (
    <UserAuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      error,
      user,
      login,
      register,
      logout,
      loginWithPhone,
      loginWithGoogle,
    }}>
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (context === undefined) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
};