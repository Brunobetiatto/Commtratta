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

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className={styles.appContainer}>
      <div className={styles.sidebarContainer}>
        <Sidebar user={user} logout={logout} />
      </div>
      
      <div className={styles.mainContent}>
        <header className={styles.appHeader}>
          <div className={styles.headerLeft}>
            <img 
              src="/favicon.ico" 
              alt="Favicon" 
              className={styles.favicon}
            />
            <h1>Contratos</h1>
          </div>
          <div className={styles.userInfo}>
            <span>{user.name}</span>
            <button onClick={logout} className={styles.logoutBtn}>
              Sair
            </button>
          </div>
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