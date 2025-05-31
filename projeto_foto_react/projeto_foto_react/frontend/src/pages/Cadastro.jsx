//frontend/src/Cadastro.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Cadastro.module.css';
import axios from 'axios';

const Cadastro = () => {
  const [formData, setFormData] = useState({
    email: '',
    telefone: '',
    senha: '',
    confirmarSenha: '',
    interesses: '',
  });
  const [imagem, setImagem] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagem(file);
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validações básicas
    if (formData.senha !== formData.confirmarSenha) {
      return setError('As senhas não coincidem');
    }

    if (formData.senha.length < 6) {
      return setError('A senha deve ter pelo menos 6 caracteres');
    }

    try {
      setLoading(true);
      
      // Criar FormData para enviar a imagem
      const data = new FormData();
      data.append('email', formData.email);
      data.append('telefone', formData.telefone);
      data.append('senha', formData.senha);
      data.append('interesses', formData.interesses);
      if (imagem) {
        data.append('imagem', imagem);
      }

      const response = await axios.post('http://localhost:8800/api/users/add', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 200) {
        navigate('/login', { state: { success: 'Cadastro realizado com sucesso!' } });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao cadastrar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Cadastro de Usuário</h2>
        
        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email*</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="telefone">Telefone</label>
            <input
              type="tel"
              id="telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="senha">Senha*</label>
            <input
              type="password"
              id="senha"
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmarSenha">Confirmar Senha*</label>
            <input
              type="password"
              id="confirmarSenha"
              name="confirmarSenha"
              value={formData.confirmarSenha}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="interesses">Interesses</label>
            <textarea
              id="interesses"
              name="interesses"
              value={formData.interesses}
              onChange={handleChange}
              className={styles.textarea}
              rows="3"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="imagem">Foto de Perfil</label>
            <div className={styles.imageUpload}>
              <label htmlFor="imagem" className={styles.uploadLabel}>
                {preview ? (
                  <img src={preview} alt="Preview" className={styles.preview} />
                ) : (
                  <div className={styles.uploadPlaceholder}>
                    <i className="fas fa-camera"></i>
                    <span>Selecionar Imagem</span>
                  </div>
                )}
              </label>
              <input
                type="file"
                id="imagem"
                name="imagem"
                accept="image/*"
                onChange={handleImageChange}
                className={styles.fileInput}
              />
              {preview && (
                <button 
                  type="button" 
                  onClick={() => {
                    setPreview(null);
                    setImagem(null);
                  }}
                  className={styles.removeImage}
                >
                  Remover
                </button>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Cadastro;