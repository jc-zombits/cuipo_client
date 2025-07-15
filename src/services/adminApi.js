// src/services/adminApi.js
import axios from 'axios';

const adminApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_AUTH_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para añadir el token
adminApi.interceptors.request.use(config => {
  const token = localStorage.getItem('cuipoToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getUsers = async () => {
  try {
    const response = await adminApi.get('/api/auth/admin/users');
    return response.data;
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const response = await adminApi.post('/api/auth/admin/users', {
      ...userData,
      program: 'cuipo',
      dependency: 'cuipo'
    });
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await adminApi.put(`/api/auth/admin/users/${id}`, userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await adminApi.delete(`/api/auth/admin/users/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};
