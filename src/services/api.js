// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api/v1/cuipo',
});

// Interceptor para mostrar detalles de las peticiones
api.interceptors.request.use(config => {
  console.log('Enviando petición a:', config.url);
  config.headers.Authorization = `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`;
  return config;
});

api.interceptors.response.use(
  response => {
    console.log('Respuesta recibida de:', response.config.url);
    return response;
  },
  error => {
    console.error('Error en la petición:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export default api;