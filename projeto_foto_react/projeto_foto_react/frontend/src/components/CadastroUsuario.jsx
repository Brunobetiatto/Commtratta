// frontend/components/CadastroUsuario.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './CadastroUsuario.module.css';

const CadastroUsuario = () => {
  const navigate = useNavigate();
  const [tipoPessoa, setTipoPessoa] = useState('fisica');
  const [formData, setFormData] = useState({
    email: '',
    telefone: '',
    senha: '',
    confirmarSenha: '',
    imagem: null,
    cpf: '',
    cnpj: '',
    descricao: ''
  });
  const [categorias, setCategorias] = useState([]);
  const [interessesSelecionados, setInteressesSelecionados] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagemPreview, setImagemPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Buscar categorias do backend
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await axios.get('http://localhost:8800/api/categorias');
        setCategorias(response.data);
      } catch (err) {
        console.error('Erro ao buscar categorias:', err);
        setError('Erro ao carregar categorias. Tente recarregar a página.');
      }
    };

    fetchCategorias();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        imagem: file
      }));

      // Criar preview da imagem
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagemPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagemPreview(null);
    }
  };

  const handleTipoPessoaChange = (tipo) => {
    setTipoPessoa(tipo);
  };

  const handleInteresseChange = (categoriaId) => {
    setInteressesSelecionados(prev => {
      // Se já está selecionado, remove
      if (prev.includes(categoriaId)) {
        return prev.filter(id => id !== categoriaId);
      }
      // Se não está selecionado e ainda não atingiu o limite, adiciona
      else if (prev.length < 5) {
        return [...prev, categoriaId];
      }
      // Se atingiu o limite, retorna sem alterações
      return prev;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validações
    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }
    
    if (formData.senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (tipoPessoa === 'fisica' && !formData.cpf) {
      setError('CPF é obrigatório');
      return;
    }

    if (tipoPessoa === 'juridica' && !formData.cnpj) {
      setError('CNPJ é obrigatório');
      return;
    }

    if (interessesSelecionados.length === 0) {
      setError('Selecione pelo menos 1 interesse');
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('email', formData.email);
      formDataToSend.append('telefone', formData.telefone);
      formDataToSend.append('senha', formData.senha);
      formDataToSend.append('interesses', interessesSelecionados.join(','));
      formDataToSend.append('tipo', tipoPessoa);
      
      if (formData.imagem) {
        formDataToSend.append('imagem', formData.imagem);
      }

      // Adiciona campos específicos
      if (tipoPessoa === 'fisica') {
        formDataToSend.append('cpf', formData.cpf);
      } else {
        formDataToSend.append('cnpj', formData.cnpj);
        formDataToSend.append('descricao', formData.descricao);
      }

      const response = await axios.post('http://localhost:8800/api/usuarios', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 201) {
        alert('Cadastro realizado com sucesso!');
        navigate('/login');
      }
    } catch (err) {
      console.error('Erro ao cadastrar usuário:', err);
      setError(err.response?.data?.message || 'Erro ao cadastrar usuário');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.cadastroContainer}>
      <div className={styles.cadastroCard}>
        <h2>Criar Nova Conta</h2>
        
        {/* Botões de seleção de tipo de pessoa */}
        <div className={styles.tipoPessoaContainer}>
          <button
            type="button"
            className={`${styles.tipoPessoaButton} ${tipoPessoa === 'fisica' ? styles.active : ''}`}
            onClick={() => handleTipoPessoaChange('fisica')}
          >
            Pessoa Física
          </button>
          <button
            type="button"
            className={`${styles.tipoPessoaButton} ${tipoPessoa === 'juridica' ? styles.active : ''}`}
            onClick={() => handleTipoPessoaChange('juridica')}
          >
            Pessoa Jurídica
          </button>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.cadastroForm}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="telefone">Telefone:</label>
            <input
              type="text"
              id="telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="senha">Senha:</label>
            <input
              type="password"
              id="senha"
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmarSenha">Confirmar Senha:</label>
            <input
              type="password"
              id="confirmarSenha"
              name="confirmarSenha"
              value={formData.confirmarSenha}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Interesses (selecione até 5):</label>
            <div className={styles.interessesContainer}>
              {categorias.map(categoria => (
                <div key={categoria.id} className={styles.interesseItem}>
                  <input
                    type="checkbox"
                    id={`interesse-${categoria.id}`}
                    checked={interessesSelecionados.includes(categoria.id)}
                    onChange={() => handleInteresseChange(categoria.id)}
                    disabled={interessesSelecionados.length >= 5 && !interessesSelecionados.includes(categoria.id)}
                  />
                  <label 
                    htmlFor={`interesse-${categoria.id}`} 
                    className={`${styles.interesseLabel} ${interessesSelecionados.includes(categoria.id) ? styles.interesseSelecionado : ''}`}
                  >
                    {categoria.nome}
                  </label>
                </div>
              ))}
            </div>
            <div className={styles.interesseContador}>
              {interessesSelecionados.length} de 5 selecionados
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Foto de Perfil (opcional):</label>
            
            {/* Pré-visualização da imagem */}
            {imagemPreview && (
              <div className={styles.imagemPreviewContainer}>
                <img 
                  src={imagemPreview} 
                  alt="Preview" 
                  className={styles.imagemPreview} 
                />
              </div>
            )}
            
            <label className={styles.uploadButton}>
              {formData.imagem ? 'Alterar Imagem' : 'Selecionar Imagem'}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </label>
            {formData.imagem && (
              <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                {formData.imagem.name}
              </p>
            )}
          </div>

          {tipoPessoa === 'fisica' ? (
            <div className={styles.formGroup}>
              <label htmlFor="cpf">CPF:</label>
              <input
                type="text"
                id="cpf"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                placeholder="Digite seu CPF (apenas números)"
                maxLength={11}
              />
            </div>
          ) : (
            <>
              <div className={styles.formGroup}>
                <label htmlFor="cnpj">CNPJ:</label>
                <input
                  type="text"
                  id="cnpj"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleChange}
                  placeholder="Digite seu CNPJ (apenas números)"
                  maxLength={14}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="descricao">Descrição da Empresa:</label>
                <textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleChange}
                  placeholder="Descreva sua empresa..."
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Cadastrando...' : 'Criar Conta'}
          </button>
        </form>

        <div className={styles.loginLink}>
          <p>Já tem uma conta? <a href="/login">Faça login</a></p>
        </div>
      </div>
    </div>
  );
};

export default CadastroUsuario;