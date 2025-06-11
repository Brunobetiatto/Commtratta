import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api.js'; // A instância que criamos acima

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);      // obj com dados do usuário
  const [loading, setLoading] = useState(true); // enquanto checamos se o token é válido
  const [error, setError] = useState('');       // exibe erro de login, por exemplo

  // Ao montar o provedor, tentamos recuperar token + usuário do localStorage
  useEffect(() => {
    const initializeAuth = async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Atualizar para usar o novo endpoint de validação
        const response = await api.get('/auth/validate');
        
        // Atualizar o usuário com dados do token validado
        setUser({
          ...JSON.parse(storedUser),
          id: response.data.user.id, // Usar o ID do token (PJ/PF)
          tipo: response.data.user.tipo,
        });
      } catch (err) {
        logout();
      }
    }

    setLoading(false);
  };

    initializeAuth();
  }, []);

  // Função de login: envia email/senha, recebe token+dados do usuário
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        senha: password,
      });

      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Atualizar com o ID correto (PJ/PF)
      const validated = await api.get('/auth/validate');
      setUser({
        ...userData,
        id: validated.data.user.id,
        tipo: validated.data.user.tipo,
      });
      
      setError('');
      return userData;
    } catch (err) {
      setError(err.response?.data?.error || 'Email ou senha incorretos');
      throw err;
    }
  };

  // Função de logout: limpa tudo
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        error,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
