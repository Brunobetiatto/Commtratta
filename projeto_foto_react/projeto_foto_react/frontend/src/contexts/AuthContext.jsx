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
          // Configura o header do Axios para TODAS as requisições daqui em diante
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Chama rota de validação do back-end
          await api.get('/auth/validate');
          
          // Se deu certo, mantemos o usuário logado
          setUser(JSON.parse(storedUser));
        } catch (err) {
          // Token inválido ou expirado → limpa e faz logout
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

      // Salva no localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      // Configura o header para próximas requisições
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Seta estado interno do contexto
      setUser(userData);
      setError('');

      return userData;
    } catch (err) {
      // Se o back-end enviar err.response.data.error, exibe essa mensagem
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
