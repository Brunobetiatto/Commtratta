import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8800/api',
});

// Interceptor para adicionar o header Authorization em todas as requisições, se existir token no localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Sempre enviar “Bearer <token>”
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para detectar 401 (token expirado ou inválido)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Se o servidor retornou 401, limpar dados e redirecionar para login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login'; // força redirecionamento
    }
    return Promise.reject(error);
  }
);

export default api;
