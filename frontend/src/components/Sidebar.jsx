import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCategories, setUserCategories] = useState([]);

  if (!user) return null;

  const getImageUrl = () => {
    if (!user.img) return 'http://localhost:8800/uploads/defaut.png';
    
    if (user.img.includes('uploads')) {
      const filename = user.img.split('/').pop();
      return `http://localhost:8800/uploads/${filename}`;
    }
    
    return user.img;
  };


  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`http://localhost:8800/api/categorias/usuario/${user.id}/interesses`);

        setCategories(response.data);
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [user.id]);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarContent}>
        <div className={styles.profileContainer}>
          <img 
            src={getImageUrl()}
            alt="Perfil" 
            className={styles.profileImage}
          />
          <div className={styles.profileInfo}>
            {user.tipo === "PF" ? (
              <h3 className={styles.name}>
                {user.pf_name} 
                <span style={{ fontSize: '0.8em', color: 'rgb(230, 230, 230)', fontStyle: 'italic' }}>
                  <br />a.k.a. {user.username}
                </span>
              </h3>
            ) : (
              <h3 className={styles.name}>{user.username}</h3>
            )}
          </div>
        </div>

        {user.tipo === "PF" ? (
          <>
            <div className={styles.descriptionContainer}>
              <p className={styles.description}>
                {user.interesses || `Bem-vindo(a), ${user.pf_name} ${user.pf_surname}`}
              </p>
            </div>
            {categories.length > 0 && (
              <div className={styles.categoriesSection}>
                <h4 className={styles.sectionTitle}>Interesses</h4>
                <div className={styles.categoriesContainer}>
                  {categories.map((category) => (
                    <span key={category.id} className={styles.categoryTag}>
                      {category.nome}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className={styles.descriptionContainer}>
              <p className={styles.description}>
                {user.descricao}
              </p>
            </div>
            {categories.length > 0 && (
              <div className={styles.categoriesSection}>
                <h4 className={styles.sectionTitle}>Interesses</h4>
                <div className={styles.categoriesContainer}>
                  {categories.map((category) => (
                    <span key={category.id} className={styles.categoryTag}>
                      {category.nome}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className={styles.menuSection}>
              <button 
                className={styles.menuButton}
                onClick={() => navigate('/cadastrar-contrato')}
              >
                <i className="fas fa-file-contract"></i>
                Cadastrar Contrato
              </button>
            </div>
          </>
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