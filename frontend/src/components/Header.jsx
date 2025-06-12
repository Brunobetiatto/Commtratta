import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import axios from 'axios'

const Header = ({ user, onSearch, onFilter }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Determinar se estamos na página Explorar
  const isExplorarPage = location.pathname === '/Explorar';

  useEffect(() => {
    if (isExplorarPage) {
      const fetchCategories = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get('http://localhost:8800/api/categorias', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          setCategories(response.data);
        } catch (err) {
          console.error('Erro ao buscar categorias:', err);
        }
      };
      fetchCategories();
    }
  }, [isExplorarPage]);

  const handleSearchClick = () => {
    if (location.pathname !== '/Explorar') {
      navigate('/Explorar');
    } else {
      onSearch(searchTerm);
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (location.pathname === '/Explorar') {
      onSearch(e.target.value); 
    }
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const applyFilters = () => {
    onFilter(selectedCategories);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    onFilter([]);
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
            value={searchTerm}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchClick()}
          />
          <i
            className={`fas fa-search ${styles.searchIcon}`}
            onClick={handleSearchClick}
          ></i>
          
          {/* Botão de filtro dentro da barra de pesquisa (só mostra em Explorar) */}
          {isExplorarPage && (
            <button 
              className={styles.filterButton}
              onClick={() => setIsFilterModalOpen(true)}
            >
              <i className="fas fa-filter"></i>
            </button>
          )}
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
      
      {/* Modal de Filtros (só mostra em Explorar) */}
      {isExplorarPage && isFilterModalOpen && (
        <div className={styles.filterModal}>
          <div className={styles.modalContent}>
            <h2>Filtrar por Categorias</h2>
            
            <div className={`${styles.categoriasContainer} ${styles.expandido}`}>
              {categories.length === 0 ? (
                <div className={styles.semResultados}>
                  Nenhuma categoria encontrada
                </div>
              ) : (
                categories.map(category => (
                  <div key={category.id} className={styles.categoriaItem}>
                    <input
                      type="checkbox"
                      id={`category-${category.id}`}
                      className={styles.categoriaCheckbox}
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => handleCategoryChange(category.id)}
                    />
                    <label 
                      htmlFor={`category-${category.id}`} 
                      className={`${styles.categoriaLabel} ${selectedCategories.includes(category.id) ? styles.categoriaSelecionada : ''}`}
                    >
                      {category.nome}
                    </label>
                  </div>
                ))
              )}
            </div>
            
            <div className={styles.categoriasFooter}>
              <div className={styles.categoriaContador}>
                {selectedCategories.length} categoria(s) selecionada(s)
              </div>
              <div className={styles.categoriasSelecionadasPreview}>
                {selectedCategories.map(catId => {
                  const cat = categories.find(c => c.id === catId);
                  return cat ? (
                    <span key={catId} className={styles.categoriaTag}>
                      {cat.nome}
                      <button 
                        className={styles.removerTag}
                        onClick={() => handleCategoryChange(catId)}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            <div className={styles.modalActions}>
              <button 
                onClick={clearFilters} 
                className={styles.secondaryButton}
              >
                Limpar Filtros
              </button>
              <button 
                onClick={applyFilters} 
                className={styles.primaryButton}
              >
                Aplicar Filtros
              </button>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className={styles.cancelButton}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;