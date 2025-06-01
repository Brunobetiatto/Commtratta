import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api.js'; // Importe sua instância do axios configurada

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          // Verificar se o token ainda é válido
          await api.get('/auth/validate', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          setUser(JSON.parse(storedUser));
        } catch (err) {
          // Token inválido ou expirado - fazer logout
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        senha: password
      });

      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      setError('');
      
      // Configura o token no axios para as próximas requisições
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return user;
    } catch (err) {
      setError(err.response?.data?.error || 'Email ou senha incorretos');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading,
      error,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);