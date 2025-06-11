import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Importe useLocation e useNavigate
import styles from './Header.module.css';

const Header = ({ user }) => {
  const location = useLocation(); // Hook para acessar a localização atual da rota
  const navigate = useNavigate(); // Hook para navegação programática

  const handleSearchClick = () => {
    // Verifica se a rota atual JÁ é '/explorar'
    if (location.pathname !== '/explorar') {
      navigate('/explorar'); // Navega para /explorar apenas se não estiver lá
    }
    // Se já estiver em /explorar, não faz nada
  };

  return (
    <header className={styles.appHeader}>
      <div className={styles.headerLeft}>
        <img
          src="/favicon.png"
          alt="Favicon"
          className={styles.favicon}
        />
        <div className={styles.searchBar} onClick={handleSearchClick}>
          <input
            type="text"
            placeholder="Pesquisar..."
            className={styles.searchInput}
            readOnly 
          />
          <i className={`fas fa-search ${styles.searchIcon}`}></i>
        </div>
      </div>

      <div className={styles.headerRight}>
        <Link to="/" className={styles.navButton}>HOME</Link>
        <Link to="/explorar" className={styles.navButton}>EXPLORAR</Link>
        <Link to="/gerenciamento-contratos" className={styles.navButton}>CONTRATOS</Link>
        <Link to="/chats" className={styles.navButton}>CHAT</Link>
        <div className={styles.userInfo}>
          <span>{user.name}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;