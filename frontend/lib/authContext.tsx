// Auth Context - Gestión de autenticación global con React Context

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from './apiClient';

interface User {
  userId: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'ADMIN' | 'SUPERVISOR' | 'USUARIO';
  activo: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    telefono?: string;
    direccion?: string;
  }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Cargar usuario del localStorage al iniciar
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Verificar que el token siga siendo válido
          try {
            const response = await authApi.verifyToken();
            if (response.success) {
              setUser(response.data);
              localStorage.setItem('user', JSON.stringify(response.data));
            } else {
              // Token inválido, limpiar
              logout();
            }
          } catch (error) {
            // Token expirado o inválido
            logout();
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login
  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);

      if (response.success && response.data) {
        const { token: newToken, user: newUser } = response.data;

        // Guardar en localStorage
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));

        // Actualizar estado
        setToken(newToken);
        setUser(newUser);

        // Redirigir al dashboard
        router.push('/dashboard');
      } else {
        throw new Error(response.message || 'Error al iniciar sesión');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(
        error.response?.data?.message || error.message || 'Error al iniciar sesión'
      );
    }
  };

  // Logout
  const logout = () => {
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Limpiar estado
    setToken(null);
    setUser(null);

    // Redirigir al login
    router.push('/login');
  };

  // Register
  const register = async (data: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    telefono?: string;
    direccion?: string;
  }) => {
    try {
      const response = await authApi.register(data);

      if (response.success && response.data) {
        const { token: newToken, user: newUser } = response.data;

        // Guardar en localStorage
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));

        // Actualizar estado
        setToken(newToken);
        setUser(newUser);

        // Redirigir al dashboard
        router.push('/dashboard');
      } else {
        throw new Error(response.message || 'Error al registrarse');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      throw new Error(
        error.response?.data?.message || error.message || 'Error al registrarse'
      );
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      if (!token) return;

      const response = await authApi.verifyToken();

      if (response.success && response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    register,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC para proteger rutas
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredRole?: 'ADMIN' | 'SUPERVISOR' | 'USUARIO';
    redirectTo?: string;
  }
) => {
  return function WithAuthComponent(props: P) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading) {
        if (!isAuthenticated) {
          router.push(options?.redirectTo || '/login');
        } else if (options?.requiredRole && user?.rol !== options.requiredRole) {
          // No tiene el rol requerido
          router.push('/dashboard');
        }
      }
    }, [isLoading, isAuthenticated, user, router]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    if (options?.requiredRole && user?.rol !== options.requiredRole) {
      return null;
    }

    return <Component {...props} />;
  };
};