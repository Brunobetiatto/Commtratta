import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

const Header = ({ user, onSearch }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchClick = () => {
    if (location.pathname !== '/Explorar') {
      navigate('/Explorar');
    }
    onSearch(searchTerm); // dispara busca
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (location.pathname === '/Explorar') {
      onSearch(e.target.value); // filtra ao digitar se já estiver na rota
    }
  };

  return (
    <header className={styles.appHeader}>
      <div className={styles.headerLeft}>
        <img src="/favicon.png" alt="Favicon" className={styles.favicon} />
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Pesquisar..."
            className={styles.searchInput}
          
            onChange={handleInputChange}
          />
          <i
            className={`fas fa-search ${styles.searchIcon}`}
            onClick={handleSearchClick}
          ></i>
        </div>
      </div>

      <div className={styles.headerRight}>
        <Link to="/" className={styles.navButton}>HOME</Link>
        <Link to="/Explorar" className={styles.navButton}>EXPLORAR</Link>
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
