// frontend/Routes.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import App from './App';
import LoginScreen from './components/LoginScreen';
import CadastroUsuario from './components/CadastroUsuario';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/cadastro" element={<CadastroUsuario />} />
    </Routes>
  );
};

export default AppRoutes;