// src/context/AuthContext.js
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // 1. Verificar si hay token en la URL (redirección desde auth)
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');
       
        // 2. O verificar si hay token en localStorage
        const token = tokenFromUrl || localStorage.getItem('cuipoToken');
       
        if (token) {
          // Verificar con auth-api
          const response = await axios.get('http://10.125.8.55:5001/api/auth/verify', {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.data.valid) {
            const decoded = jwtDecode(token);
            const userData = {
              id: decoded.id,
              email: decoded.email,
              name: decoded.name,
              role: decoded.role,
              id_role_user: decoded.id_role_user // Añadido para compatibilidad
            };
            setUser(userData);
           
            // Guardar token si vino de URL
            if (tokenFromUrl) {
              localStorage.setItem('cuipoToken', token);
              // Limpiar URL
              window.history.replaceState({}, '', window.location.pathname);
            }
          } else {
            logout();
          }
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = (token) => {
    localStorage.setItem('cuipoToken', token);
    const decoded = jwtDecode(token);
    const userData = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      id_role_user: decoded.id_role_user
    };
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('cuipoToken');
    setUser(null);
    router.push('http://10.125.8.55:3000/login');
  };

  const redirectToAdminPanel = () => {
    window.location.href = 'http://10.125.8.55:3000/admin/users';
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

