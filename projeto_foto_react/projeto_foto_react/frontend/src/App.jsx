import { useState } from 'react';
import Listagem from './pages/Listagem';
import Cadastro from './pages/Cadastro';
import styles from './App.module.css';

function App() {
  const [view, setView] = useState('listagem');

  return (
    <div className={styles.appWrapper}>
      <header className={styles.appHeader}>
        <h1>Gerenciamento de Usuários</h1>
      </header>
      
      <main className={styles.appMainContent}>
        <div className={styles.contentContainer}>
          {view === 'listagem' ? (
            <Listagem onAddUser={() => setView('cadastro')} />
          ) : (
            <Cadastro 
              onCancel={() => setView('listagem')} 
              onSuccess={() => setView('listagem')} 
            />
          )}
        </div>
      </main>
      
      <footer className={styles.appFooter}>
        <p>Sistema de Usuários © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;