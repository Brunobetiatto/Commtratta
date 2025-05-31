// frontend/App.jsx
import React from 'react';
import { useAuth } from './contexts/AuthContext';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Listagem from './pages/Listagem';
import Sidebar from './components/Sidebar';
import CadastroContrato from './components/CadastroUsuario';
import styles from './App.module.css';

function App() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Carregando...</p>
      </div>
    );
  }

  // Se não estiver autenticado, redireciona para login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className={styles.appContainer}>
      <Sidebar user={user} logout={logout} />
      
      <div className={styles.mainContent}>
        <header className={styles.appHeader}>
          <h1>Contratos</h1>
        </header>
        
        <main className={styles.appMainContent}>
          <div className={styles.contentContainer}>
            <Routes>
              <Route path="/" element={<Listagem />} />
              <Route path="/cadastro-contrato" element={<CadastroContrato />} />
            </Routes>
          </div>
        </main>
        
        <footer className={styles.appFooter}>
          <p>Sistema de Contratos © {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
}

export default App;