// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL ||
  'http://10.125.126.107:5005/api/v1/cuipo';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Variable para controlar redirecciones múltiples
let isRedirecting = false;

// Interceptor para añadir el token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cuipoToken');
    console.log('[API DEBUG] Token leído:', token ? `${token.substring(0, 20)}...` : 'No token');
    
    if (token) {
      try {
        // Intentar decodificar el token para verificar su estructura
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        const decodedToken = JSON.parse(jsonPayload);
        
        console.log('[API DEBUG] Token payload:', {
          id_role_user: decodedToken.id_role_user,
          role: decodedToken.role,
          dependencyName: decodedToken.dependencyName
        });
        
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API DEBUG] Request URL:', config.url);
        console.log('[API DEBUG] Authorization header configurado correctamente');
      } catch (e) {
        console.error('[API DEBUG] Error al decodificar token:', e);
        localStorage.removeItem('cuipoToken');
      }
    } else {
      console.log('[API DEBUG] No se encontró token en localStorage');
    }
    return config;
  },
  (error) => {
    console.error('[API DEBUG] Error en interceptor de solicitud:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('cuipoToken');
      const requestUrl = error.config?.url || '';
      
      // Evitar redirección en endpoints de autenticación
      const isAuthRoute = requestUrl.includes('/auth/');
      const isPublicRoute = requestUrl.includes('/public/');
      
      // Solo proceder si hay token, no es una ruta de auth, y no estamos ya redirigiendo
      if (token && !isAuthRoute && !isPublicRoute && !isRedirecting) {
        console.warn('[API DEBUG] Token inválido o expirado (401), limpiando sesión...');
        
        // Marcar que estamos redirigiendo
        isRedirecting = true;
        
        // Limpiar token
        localStorage.removeItem('cuipoToken');
        
        // Redirigir al login
        if (typeof window !== 'undefined') {
          window.location.replace('http://10.125.126.107:3000/login');
        }
        
        // Reset después de un tiempo para futuros casos
        setTimeout(() => {
          isRedirecting = false;
        }, 2000);
      }
    }
    return Promise.reject(error);
  }
);

export default api;