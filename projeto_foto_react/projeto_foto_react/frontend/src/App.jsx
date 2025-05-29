import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Listagem from './pages/Listagem';
import Cadastro from './pages/Cadastro';
import Sidebar from './components/Sidebar';
import LoginScreen from './components/LoginScreen';
import styles from './App.module.css';


function App() {
  const [view, setView] = useState('listagem');
  const { user, isAuthenticated, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Carregando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className={styles.appContainer}>
      <Sidebar user={user} />
      
      <div className={styles.mainContent}>
        <header className={styles.appHeader}>
          <h1>Contratos</h1>
        </header>
        
        <main className={styles.appMainContent}>
          <div className={styles.contentContainer}>
            {view === 'listagem' ? (
              <Listagem onAddContract={() => setView('cadastro')} />
            ) : (
              <Cadastro 
                onCancel={() => setView('listagem')} 
                onSuccess={() => setView('listagem')} 
              />
            )}
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