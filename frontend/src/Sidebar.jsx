import React from 'react';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.profileContainer}>
        <img 
          src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&q=80" 
          alt="Perfil" 
          className={styles.profileImage}
        />
        <div className={styles.profileInfo}>
          <h3 className={styles.name}>Alexandre Silva</h3>
          <p className={styles.role}>Tech lider da Google</p>
        </div>
      </div>
      
      <div className={styles.descriptionContainer}>
        <p className={styles.description}>
          Descrição breve da sua empresa ou usuario.
        </p>
      </div>
      
      
      <footer className={styles.sidebarFooter}>
        <button className={styles.logoutButton}>
          <i className="fas fa-sign-out-alt"></i>
          Criar contrato +
        </button>
      </footer>
    </aside>
  );
};

export default Sidebar;