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
  });
  const [categorias, setCategorias] = useState([]);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagem, setImagem] = useState(null);
  const [preview, setPreview] = useState(null);
  const [filtroCategorias, setFiltroCategorias] = useState('');
  const [categoriasExpandidas, setCategoriasExpandidas] = useState(false);
  const categoriasContainerRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || user?.tipo_usuario !== 'PJ') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await api.get('/categorias');
        setCategorias(response.data);
      } catch (err) {
        setError('Erro ao carregar categorias. Tente recarregar a página.');
        console.error("Erro ao buscar categorias:", err);
      }
    };

    fetchCategorias();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagem(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagem(null);
      setPreview(null);
    }
  };

  const handleCategoriaChange = (categoriaId) => {
    setCategoriasSelecionadas(prev =>
      prev.includes(categoriaId)
        ? prev.filter(id => id !== categoriaId)
        : [...prev, categoriaId]
    );
  };

  const limparFiltro = () => setFiltroCategorias('');
  const toggleExpandirCategorias = () => setCategoriasExpandidas(!categoriasExpandidas);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.titulo.trim()) return setError('Título é obrigatório');
    if (!formData.descricao.trim()) return setError('Descrição é obrigatória');
    if (!formData.dataValidade) return setError('Data de validade é obrigatória');
    
    const dataValidadeObj = new Date(formData.dataValidade);
    const hoje = new Date();
    hoje.setHours(0,0,0,0); // Normalizar para comparar apenas a data
    if (dataValidadeObj <= hoje) {
        return setError('Data de validade deve ser futura.');
    }
    if (categoriasSelecionadas.length === 0) return setError('Selecione pelo menos uma categoria');

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('titulo', formData.titulo);
      formDataToSend.append('descricao', formData.descricao);
      formDataToSend.append('dataValidade', formData.dataValidade);
      formDataToSend.append('categorias', JSON.stringify(categoriasSelecionadas));
      if (imagem) formDataToSend.append('imagem', imagem);
      if (user?.id) {
        formDataToSend.append('empresa_id', user.id); // Ajuste 'empresa_id' conforme seu backend
      }

      const response = await api.post('/contratos', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 201) {
        alert('Contrato cadastrado com sucesso!');
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Erro ao cadastrar contrato. Verifique os dados e tente novamente.');
      console.error("Erro ao cadastrar contrato:", err.response || err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoriasFiltradas = categorias.filter(categoria =>
    categoria.nome.toLowerCase().includes(filtroCategorias.toLowerCase())
  );

  useEffect(() => {
    if (categoriasExpandidas && categoriasContainerRef.current) {
      categoriasContainerRef.current.scrollTop = 0;
    }
  }, [categoriasExpandidas]);

  if (!isAuthenticated || user?.tipo_usuario !== 'PJ') {
    return null; // Ou um componente de carregamento/acesso negado
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Cadastrar Novo Contrato</h2>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
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
              className={styles.input}
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
              className={styles.textarea}
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
              min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0]} // Data mínima é amanhã
              className={styles.input}
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
                      aria-label="Limpar filtro de categorias"
                    >
                      <FiX />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={toggleExpandirCategorias}
                  className={styles.expandirBotao}
                  aria-expanded={categoriasExpandidas}
                  aria-label={categoriasExpandidas ? "Recolher categorias" : "Expandir categorias"}
                >
                  {categoriasExpandidas ? <FiChevronUp /> : <FiChevronDown />}
                </button>
              </div>

              <div
                ref={categoriasContainerRef}
                className={`${styles.categoriasContainer} ${categoriasExpandidas ? styles.expandido : ''}`}
              >
                {categorias.length === 0 && !error && <div className={styles.semResultados}>Carregando categorias...</div>}
                {categorias.length > 0 && categoriasFiltradas.length === 0 && filtroCategorias && (
                  <div className={styles.semResultados}>
                    Nenhuma categoria encontrada para "{filtroCategorias}"
                  </div>
                )}
                 {categorias.length > 0 && categoriasFiltradas.length === 0 && !filtroCategorias && (
                  <div className={styles.semResultados}>
                    Nenhuma categoria disponível.
                  </div>
                )}
                {categoriasFiltradas.map(categoria => (
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
                ))}
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
                            aria-label={`Remover categoria ${cat.nome}`}
                          >
                            <FiX size={12} />
                          </button>
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="imagem" className={styles.imageUploadLabel}>Imagem do Contrato (opcional)</label>
            <div className={styles.imageUpload}>
              <label htmlFor="imagem" className={styles.uploadArea}>
                {preview ? (
                  <img src={preview} alt="Preview do contrato" className={styles.preview} />
                ) : (
                  <div className={styles.uploadPlaceholder}>
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
                    const fileInput = document.getElementById('imagem');
                    if (fileInput) {
                      fileInput.value = "";
                    }
                  }}
                  className={styles.removeImageButton}
                >
                  Remover Imagem
                </button>
              )}
            </div>
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