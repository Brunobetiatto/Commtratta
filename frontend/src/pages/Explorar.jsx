//backend/pages/explorar.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'; 
import Listagem from './Listagem';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header'; 
import styles from './Explorar.module.css';



function Explorar() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState(''); 
  const [filters, setFilters] = useState({ categories: [] });

  const handleSearch = (term) => {
    setSearchTerm(term);
  };
  const handleFilter = (categories) => {
    setFilters({ ...filters, categories });
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Carregando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className={styles.appContainer}>
      <div className={styles.sidebarContainer}>
        <Sidebar user={user} logout={logout} />
      </div>
      
      <div className={styles.mainContent}>
        <Header user={user} onSearch={handleSearch} onFilter={handleFilter}/> 
        
        <main className={styles.appMainContent}>
          <div className={styles.contentContainer}>
            <Routes>
              <Route path="/" element={<Listagem searchTerm={searchTerm} filters={filters} />} />
            </Routes>
          </div>
        </main>
        <footer className={styles.appFooter}>
          <p>Commtratta © {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
}

export default Explorar;