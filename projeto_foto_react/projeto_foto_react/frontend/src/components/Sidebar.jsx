import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

 

  const getImageUrl = () => {
    if (!user.img) return 'http://localhost:8800/uploads/defaut2.png';
    
    if (user.img.includes('uploads')) {
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
          </div>
        </div>
        
        <div className={styles.descriptionContainer}>
          <p className={styles.description}>
            {user.interesses || 'Bem-vindo'}
          </p>
        </div>

        {/* Botão visível apenas para PJ */}
        {user.tipo_usuario === "PJ" && (
          <div className={styles.menuSection}>
            <button 
              className={styles.menuButton}
              onClick={() => navigate('/cadastrar-contrato')}
            >
              <i className="fas fa-file-contract"></i>
              Cadastrar Contrato
            </button>
          </div>
        )}
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