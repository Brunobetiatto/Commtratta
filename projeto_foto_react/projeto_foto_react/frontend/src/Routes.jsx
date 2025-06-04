import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import App from './App';
import LoginScreen from './components/LoginScreen';
import CadastroUsuario from './components/CadastroUsuario';
import CadastroContrato from './components/CadastroContrato';
import GerenciamentoContratos from './components/GerenciamentoContrato';

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // Se ainda estamos validando token, exibimos algo simples (você pode ter um Loader global)
    return <div>Carregando...</div>;
  }

  return (
    <Routes>
      {/* Se não estiver autenticado, redireciona ao login */}
      <Route
        path="/"
        element={
          isAuthenticated ? <App /> : <Navigate to="/login" replace />
        }
      />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/cadastro" element={<CadastroUsuario />} />

      {/* Rota protegida para cadastro de contrato */}
      <Route
        path="/cadastrar-contrato"
        element={
          isAuthenticated ? <CadastroContrato /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/gerenciamento-contratos"
        element={
          isAuthenticated ? <GerenciamentoContratos /> : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
};

export default AppRoutes;
