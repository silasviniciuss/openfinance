import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, UserProfile } from '../types.ts';

interface AuthContextType {
  user: AuthUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  token: string | null;
  login: (username: string, pass: string) => Promise<void>;
  loginWithEmail: (emailOrUser: string, pass: string) => Promise<void>;
  loginWithGoogle?: () => Promise<void>;
  logout: () => Promise<void>;
  fetchApi: (url: string, options?: RequestInit) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_TOKEN_KEY = 'financeiro_auth_token';
const STORAGE_USER_KEY = 'financeiro_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize session from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem(STORAGE_TOKEN_KEY);
        const savedUserStr = localStorage.getItem(STORAGE_USER_KEY);

        if (savedToken && savedUserStr) {
          const parsedUser = JSON.parse(savedUserStr);
          setUser(parsedUser);
          setToken(savedToken);

          // Verify token validity with backend
          try {
            const res = await fetch('/api/auth/me', {
              headers: {
                Authorization: `Bearer ${savedToken}`,
              },
            });
            if (res.ok) {
              const data = await res.json();
              setUser(data.user);
              localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
            } else if (res.status === 401) {
              localStorage.removeItem(STORAGE_TOKEN_KEY);
              localStorage.removeItem(STORAGE_USER_KEY);
              setUser(null);
              setToken(null);
            }
          } catch (netErr) {
            console.warn('Backend verification offline, using cached credentials', netErr);
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, pass: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password: pass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao realizar login');
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (emailOrUser: string, pass: string) => {
    return login(emailOrUser, pass);
  };

  const logout = async () => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    setUser(null);
    setToken(null);
    setUserProfile(null);
  };

  // Authenticated fetch wrapper
  const fetchApi = async (url: string, options: RequestInit = {}) => {
    const currentToken = token || localStorage.getItem(STORAGE_TOKEN_KEY);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        logout();
      }
      const errorData = await response.json().catch(() => ({ error: 'Erro inesperado' }));
      throw new Error(errorData.error || `Erro ${response.status}`);
    }

    return await response.json();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        token,
        login,
        loginWithEmail,
        logout,
        fetchApi,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

