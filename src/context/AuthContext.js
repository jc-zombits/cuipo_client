// src/context/AuthContext.js
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import apiAuth from '@/services/apiAuth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');

        const token = tokenFromUrl || localStorage.getItem('cuipoToken');

        if (token) {
          // Si el token viene en la URL, lo guardamos antes de verificar
          if (tokenFromUrl) {
            localStorage.setItem('cuipoToken', token);
            window.history.replaceState({}, '', window.location.pathname);
          }

          // Verificar con auth-api (apiAuth ya pone el Authorization header)
          const response = await apiAuth.get('/auth/verify');

          if (response.data.valid) {
            const decoded = jwtDecode(token);
            setUser({
              id: decoded.id,
              email: decoded.email,
              name: decoded.name,
              role: decoded.role,
              id_role_user: decoded.id_role_user,
              dependencyName: decoded.dependencyName
            });
          } else {
            localStorage.removeItem('cuipoToken');
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        localStorage.removeItem('cuipoToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = (token) => {
    localStorage.setItem('cuipoToken', token);
    const decoded = jwtDecode(token);
    setUser({
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      id_role_user: decoded.id_role_user,
      dependencyName: decoded.dependencyName
    });
  };

  const logout = () => {
    localStorage.removeItem('cuipoToken');
    setUser(null);
    window.location.replace('http://10.125.126.107:3000/login');
  };

  const redirectToAdminPanel = () => {
    window.location.href = 'http://10.125.126.107:3000/admin/users';
  };

  // Funciones para verificación de roles
  const isAdmin = () => [1, 2].includes(user?.id_role_user);
  const isStrictAdmin = () => user?.id_role_user === 2;
  const isJuanLaver = () => user?.id_role_user === 1;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      redirectToAdminPanel,
      isAuthenticated: !!user,
      isAdmin,
      isStrictAdmin,
      isJuanLaver
    }}>
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
