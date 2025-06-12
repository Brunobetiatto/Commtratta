import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import styles from './CadastroContrato.module.css';
import { FiSearch, FiX, FiChevronDown, FiChevronUp, FiCalendar, FiInfo, FiUploadCloud, FiRefreshCw, FiTrash2 } from 'react-icons/fi';

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
  const [arquivo, setPdfFile] = useState(null);
  const [filtroCategorias, setFiltroCategorias] = useState('');
  const [categoriasExpandidas, setCategoriasExpandidas] = useState(false);
  const categoriasContainerRef = useRef(null);
  const [touchedFields, setTouchedFields] = useState({
    dataValidade: false,
  });

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
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouchedFields(prev => ({ ...prev, [name]: true }));
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

  const handlePDFUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      setError('Por favor, selecione um arquivo PDF válido.');
    }
  };

  const removePDF = () => {
    setPdfFile(null);
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
      if (arquivo) formDataToSend.append('arquivo', arquivo);
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
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  const dataMinima = amanha.toISOString().split('T')[0];

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>CADASTRO DE UM NOVO CONTRATO</h2>

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
            <div className={styles.dateInputContainer}>
              <div className={styles.inputWrapper}>
                <FiCalendar className={styles.calendarIcon} />
                <input
                  type="date"
                  id="dataValidade"
                  name="dataValidade"
                  value={formData.dataValidade}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  min={dataMinima}
                  className={`${styles.input} ${styles.dateInput}`}
                />
              </div>
              {touchedFields.dataValidade && formData.dataValidade && (
                <div className={styles.datePreview}>
                  <span>Selecionado:</span>
                  {new Date(formData.dataValidade).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              )}
              {touchedFields.dataValidade && formData.dataValidade && (
                <div className={styles.dateInfo}>
                  <FiInfo />
                  <span>O contrato expirará nesta data</span>
                </div>
              )}
            </div>
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
            <label 
              htmlFor="imagem" 
              className={styles.uploadArea}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add(styles.dragOver);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove(styles.dragOver);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove(styles.dragOver);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  const file = e.dataTransfer.files[0];
                  if (file.type.startsWith('image/')) {
                    handleImageChange({ target: { files: [file] } });
                  } else {
                    setError('Por favor, selecione um arquivo de imagem válido (JPEG, PNG, etc).');
                  }
                }
              }}
            >
              {preview ? (
                <div className={styles.previewContainer}>
                  <img src={preview} alt="Preview do contrato" className={styles.preview} />
                  <div className={styles.overlay}>
                    <FiRefreshCw className={styles.replaceIcon} />
                    <span>Clique ou arraste para substituir</span>
                  </div>
                </div>
              ) : (
                <div className={styles.uploadPlaceholder}>
                  <FiUploadCloud className={styles.uploadIcon} />
                  <div className={styles.uploadText}>
                    <span className={styles.dragText}>Arraste e solte uma imagem aqui</span>
                    <span className={styles.orText}>ou</span>
                    <span className={styles.browseText}>Selecione do computador</span>
                  </div>
                  <div className={styles.fileInfo}>Formatos suportados: JPG, PNG, GIF • Máx. 5MB</div>
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
                <FiTrash2 className={styles.trashIcon} />
                Remover Imagem
              </button>
            )}

          </div>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="pdf-upload" className={styles.pdfUploadLabel}>
            Upload do PDF (opcional)
          </label>
          <div
            className={styles.pdfUploadArea}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add(styles.dragOver);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove(styles.dragOver);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove(styles.dragOver);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                const file = e.dataTransfer.files[0];
                if (file.type === 'application/pdf') {
                  handlePDFUpload({ target: { files: [file] } });
                } else {
                  setError('Por favor, selecione um arquivo PDF válido.');
                }
              }
            }}
          >
            {arquivo ? (
              <div className={styles.pdfPreviewContainer}>
                <span className={styles.pdfFileName}>{arquivo.name}</span>
                <button
                  type="button"
                  onClick={removePDF}
                  className={styles.removePDFButton}
                >
                  <FiTrash2 className={styles.trashIcon} />
                  Remover PDF
                </button>
              </div>
            ) : (
              <div className={styles.pdfUploadContent}>
                <FiUploadCloud className={styles.uploadIcon} />
                <p>Arraste e solte um PDF aqui ou clique para selecionar</p>
              </div>
            )}
            <input
              type="file"
              id="pdf-upload"
              name="pdf"
              accept="application/pdf"
              onChange={handlePDFUpload}
              className={styles.fileInput}
            />
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