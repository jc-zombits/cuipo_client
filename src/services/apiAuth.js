import axios from 'axios';

const apiAuth = axios.create({
  baseURL: 'http://10.125.126.107:5001/api',
});

apiAuth.interceptors.request.use((config) => {
  const token = localStorage.getItem('cuipoToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiAuth;
