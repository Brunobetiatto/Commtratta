import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';

const Header = ({ user }) => {
  return (
    <header className={styles.appHeader}>
      <div className={styles.headerLeft}>
        <img 
          src="/favicon.png" 
          alt="Favicon" 
          className={styles.favicon}
        />
      </div>
      
      <div className={styles.headerRight}>
        <Link 
          to="/gerenciamento-contratos" 
          className={styles.navButton}
        >
          Gerenciamento
        </Link>
        <div className={styles.userInfo}>
          <span>{user.name}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;