import React from 'react';
import styles from './Sidebar.module.css';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getUserType = () => {
    if (user.tipo === 'PJ') return 'Fornecedor';
    if (user.tipo === 'PF') return 'Cliente';
    return 'Usuário';
  };

  // Função para construir a URL correta da imagem
  const getImageUrl = () => {
    if (!user.img) return '/default-profile.png';
    
    // Se a imagem já vem com o caminho /uploads da API
    if (user.img.includes('uploads')) {
      // Extrai apenas o nome do arquivo
      const filename = user.img.split('/').pop();
      return `http://localhost:8800/uploads/${filename}`;
    }
    
    return user.img;
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarContent}>
        <div className={styles.profileContainer}>
          <img 
            src={getImageUrl()}
            alt="Perfil" 
            className={styles.profileImage}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default-profile.png';
            }}
          />
          <div className={styles.profileInfo}>
            <h3 className={styles.name}>{user.email.split('@')[0]}</h3>
            <p className={styles.role}>{getUserType()}</p>
          </div>
        </div>
        
        <div className={styles.descriptionContainer}>
          <p className={styles.description}>
            {user.interesses || 'Bem-vindo'}
          </p>
        </div>
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