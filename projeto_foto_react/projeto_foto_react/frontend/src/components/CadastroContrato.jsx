import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import styles from './CadastroContrato.module.css';
import { FiSearch, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const CadastrarContrato = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    dataValidade: '',
    imagem: null,
  });
  const [categorias, setCategorias] = useState([]);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagemPreview, setImagemPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [filtroCategorias, setFiltroCategorias] = useState('');
  const [categoriasExpandidas, setCategoriasExpandidas] = useState(false);
  const categoriasContainerRef = useRef(null);

  // Verificar autenticação e tipo de usuário
  useEffect(() => {
    if (!isAuthenticated || user?.tipo_usuario !== 'PJ') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  // Carregar categorias disponíveis
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await api.get('/categorias');
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

  const handleCategoriaChange = (categoriaId) => {
    setCategoriasSelecionadas(prev => 
      prev.includes(categoriaId) 
        ? prev.filter(id => id !== categoriaId) 
        : [...prev, categoriaId]
    );
  };

  const limparFiltro = () => {
    setFiltroCategorias('');
  };

  const toggleExpandirCategorias = () => {
    setCategoriasExpandidas(!categoriasExpandidas);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validações
    if (!formData.titulo.trim()) {
      setError('Título é obrigatório');
      return;
    }
    
    if (!formData.descricao.trim()) {
      setError('Descrição é obrigatória');
      return;
    }
    
    if (!formData.dataValidade) {
      setError('Data de validade é obrigatória');
      return;
    }
    
    if (categoriasSelecionadas.length === 0) {
      setError('Selecione pelo menos uma categoria');
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('titulo', formData.titulo);
      formDataToSend.append('descricao', formData.descricao);
      formDataToSend.append('dataValidade', formData.dataValidade);
      formDataToSend.append('categorias', JSON.stringify(categoriasSelecionadas));
      
      if (formData.imagem) {
        formDataToSend.append('imagem', formData.imagem);
      }

      const response = await api.post('/contratos', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 201) {
        alert('Contrato cadastrado com sucesso!');
        navigate('/');
      }
    } catch (err) {
      console.error('Erro ao cadastrar contrato:', err);
      setError(err.response?.data?.error || 'Erro ao cadastrar contrato');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrar categorias baseado no termo de busca
  const categoriasFiltradas = categorias.filter(categoria => 
    categoria.nome.toLowerCase().includes(filtroCategorias.toLowerCase())
  );

  // Efeito para rolar para baixo quando expandido
  useEffect(() => {
    if (categoriasExpandidas && categoriasContainerRef.current) {
      categoriasContainerRef.current.scrollTop = 0;
    }
  }, [categoriasExpandidas]);

  if (!isAuthenticated || user?.tipo_usuario !== 'PJ') {
    return null; // Ou redirecionar para uma página de não autorizado
  }

  return (
    <div className={styles.cadastroContainer}>
      <div className={styles.cadastroCard}>
        <h2>Cadastrar Novo Contrato</h2>
        
        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.cadastroForm}>
          <div className={styles.formGroup}>
            <label htmlFor="titulo">Título *</label>
            <input
              type="text"
              id="titulo"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              required
              maxLength={140}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="descricao">Descrição *</label>
            <textarea
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              required
              rows={5}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="dataValidade">Data de Validade *</label>
            <input
              type="date"
              id="dataValidade"
              name="dataValidade"
              value={formData.dataValidade}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Categorias *</label>
            
            <div className={styles.categoriasWrapper}>
              <div className={styles.categoriasHeader}>
                <div className={styles.buscaContainer}>
                  <FiSearch className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Buscar categorias..."
                    value={filtroCategorias}
                    onChange={(e) => setFiltroCategorias(e.target.value)}
                    className={styles.buscaInput}
                  />
                  {filtroCategorias && (
                    <button 
                      type="button" 
                      onClick={limparFiltro}
                      className={styles.limparBotao}
                    >
                      <FiX />
                    </button>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={toggleExpandirCategorias}
                  className={styles.expandirBotao}
                >
                  {categoriasExpandidas ? <FiChevronUp /> : <FiChevronDown />}
                </button>
              </div>
              
              <div 
                ref={categoriasContainerRef}
                className={`${styles.categoriasContainer} ${categoriasExpandidas ? styles.expandido : ''}`}
              >
                {categoriasFiltradas.length === 0 ? (
                  <div className={styles.semResultados}>
                    Nenhuma categoria encontrada para "{filtroCategorias}"
                  </div>
                ) : (
                  categoriasFiltradas.map(categoria => (
                    <div key={categoria.id} className={styles.categoriaItem}>
                      <input
                        type="checkbox"
                        id={`categoria-${categoria.id}`}
                        checked={categoriasSelecionadas.includes(categoria.id)}
                        onChange={() => handleCategoriaChange(categoria.id)}
                        className={styles.categoriaCheckbox}
                      />
                      <label 
                        htmlFor={`categoria-${categoria.id}`} 
                        className={`${styles.categoriaLabel} ${categoriasSelecionadas.includes(categoria.id) ? styles.categoriaSelecionada : ''}`}
                      >
                        {categoria.nome}
                      </label>
                    </div>
                  ))
                )}
              </div>
              
              <div className={styles.categoriasFooter}>
                <div className={styles.categoriaContador}>
                  {categoriasSelecionadas.length} selecionada(s)
                </div>
                
                {categoriasSelecionadas.length > 0 && (
                  <div className={styles.categoriasSelecionadasPreview}>
                    {categorias
                      .filter(cat => categoriasSelecionadas.includes(cat.id))
                      .map(cat => (
                        <span key={cat.id} className={styles.categoriaTag}>
                          {cat.nome}
                          <button 
                            type="button" 
                            className={styles.removerTag}
                            onClick={() => handleCategoriaChange(cat.id)}
                          >
                            <FiX size={12} />
                          </button>
                        </span>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Imagem do Contrato (opcional):</label>
            
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

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Cadastrando...' : 'Cadastrar Contrato'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CadastrarContrato;