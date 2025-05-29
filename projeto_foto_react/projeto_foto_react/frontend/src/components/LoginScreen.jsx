// src/components/LoginScreen.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from '../App.module.css';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <h2 className={styles.loginTitle}>Acesso ao Sistema</h2>
        
        {error && <div className={styles.loginError}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.formInput}
              placeholder="exemplo@email.com"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.formInput}
              placeholder="••••••"
            />
          </div>
          
          <button type="submit" className={styles.loginButton}>
            Entrar
          </button>
        </form>
        
        <div className={styles.loginFooter}>
          <p>Dica: Use qualquer email do seed com senha "123456"</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;