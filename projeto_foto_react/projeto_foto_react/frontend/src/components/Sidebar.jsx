// src/components/Sidebar.jsx
import React from 'react';
import styles from './Sidebar.module.css';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  // Função para determinar o tipo de usuário
  const getUserType = () => {
    if (user.tipo === 'PJ') return 'Fornecedor';
    if (user.tipo === 'PF') return 'Cliente';
    return 'Usuário';
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.profileContainer}>
        <img 
          src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&q=80" 
          alt="Perfil" 
          className={styles.profileImage}
        />
        <div className={styles.profileInfo}>
          <h3 className={styles.name}>{user.email.split('@')[0]}</h3>
          <p className={styles.role}>{getUserType()}</p>
        </div>
      </div>
      
      <div className={styles.descriptionContainer}>
        <p className={styles.description}>
          {user.interesses || 'Bem-vindo ao sistema de gerenciamento'}
        </p>
      </div>
      
      <footer className={styles.sidebarFooter}>
        <button className={styles.logoutButton} onClick={logout}>
          <i className="fas fa-sign-out-alt"></i>
          Sair
        </button>
      </footer>
    </aside>
  );
};

export default Sidebar;