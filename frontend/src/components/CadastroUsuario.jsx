//frontend/components/CadastroUsuario.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './CadastroUsuario.module.css';
import { FiSearch, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const CadastroUsuario = () => {
  const navigate = useNavigate();
  const [tipoPessoa, setTipoPessoa] = useState('fisica');
  const [formData, setFormData] = useState({
    username: '',
    pf_name: '',
    pf_surname: '',
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
  const [filtroInteresses, setFiltroInteresses] = useState('');
  const [interessesExpandidos, setInteressesExpandidos] = useState(false);
  const interessesContainerRef = useRef(null);

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

  const cpfValid = (cpf) => {
    const cpf_seq = cpf.split("");
    var sum1 = 0;
    var sum2 = 0;

    var j0 = 10;
    var j1 = 11;
    for (let i = 0; i < cpf_seq.length - 1; i++){
      var idx = parseInt(cpf_seq[i]);
      if (i < cpf_seq.length - 2) {
        sum1 += idx * j0;
        j0--;
      }
      sum2 += idx * j1;
      j1--;
    }
    var digit0 = 11 - (sum1 % 11);
    var digit1 = 11 - (sum2 % 11);
    
    if (
      parseInt(cpf_seq[9])  === (digit0 < 10 ? digit0 : 0) &&
      parseInt(cpf_seq[10]) === (digit1 < 10 ? digit1 : 0)
    ) {
      return true;
    }
    
    return false;
  }

  const cnpjValid = (cnpj) => {
    const seq = cnpj.split("");
    if (seq.length !== 14) return false;

    let sum1 = 0, sum2 = 0;
    let w1 = 5, w2 = 6;

    for (let i = 0; i < 13; i++) {
      const n = parseInt(seq[i], 10);

      if (i < 12) {
        sum1 += n * w1;
        w1 = w1 > 2 ? w1 - 1 : 9;
      }

      sum2 += n * w2;
      w2 = w2 > 2 ? w2 - 1 : 9;
    }

    let d0 = 11 - (sum1 % 11);
    d0 = d0 < 10 ? d0 : 0;

    let d1 = 11 - (sum2 % 11);
    d1 = d1 < 10 ? d1 : 0;

    return (
      d0 === parseInt(seq[12], 10) &&
      d1 === parseInt(seq[13], 10)
    );
  }


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
      if (prev.includes(categoriaId)) {
        return prev.filter(id => id !== categoriaId);
      }
      else if (prev.length < 5) {
        return [...prev, categoriaId];
      }
      return prev;
    });
  };

  const limparFiltro = () => {
    setFiltroInteresses('');
  };

  const toggleExpandirInteresses = () => {
    setInteressesExpandidos(!interessesExpandidos);
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

    if (tipoPessoa === 'fisica') {
      if (!formData.cpf){
        setError('CPF é obrigatório');
        return;
      }
      if (formData.cpf.length !== 11){
        setError('CPF precisa ter 11 digitos');
        return;
      }
      if (!cpfValid(formData.cpf)) {
        setError('CPF inválido');
        return;
      }
    }

    if (tipoPessoa === 'juridica') {
      if (!formData.cnpj){
        setError('CNPJ é obrigatório');
        return;
      }
      if (formData.cnpj.length != 14) {
        setError('CNPJ precisa ter 14 digitos');
        return;
      }
      if (!cnpjValid(formData.cnpj)) {
        setError('CNPJ inválido');
        return;
      }
    }

    if (interessesSelecionados.length === 0) {
      setError('Selecione pelo menos 1 interesse');
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.username);
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
        formDataToSend.append('pf_name', formData.pf_name);
        formDataToSend.append('pf_surname', formData.pf_surname);
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

  // Filtrar categorias baseado no termo de busca
  const categoriasFiltradas = categorias.filter(categoria => 
    categoria.nome.toLowerCase().includes(filtroInteresses.toLowerCase())
  );

  // Efeito para rolar para baixo quando expandido
  useEffect(() => {
    if (interessesExpandidos && interessesContainerRef.current) {
      interessesContainerRef.current.scrollTop = 0;
    }
  }, [interessesExpandidos]);

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

          {tipoPessoa === 'fisica' ? (
            <>
            <div className={styles.formGroup}>
              <label htmlfor="pf_name">Nome:</label>
              <input
                type="text"
                id="pf_name"
                name="pf_name"
                value={formData.pf_name}
                onChange={handleChange}
                placeholder="Digite seu nome"
              />
              <label htmlfor="pf_surname">Sobrenome:</label>
              <input
                type="text"
                id="pf_surname"
                name="pf_surname"
                value={formData.pf_surname}
                onChange={handleChange}
                placeholder="Digite seu sobrenome completo"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="username">Apelido:</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Digite um apelido para sua conta"
              />
            </div>
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
            </>
          ) : (
            <>
              <div className={styles.formGroup}>
                <label htmlFor="username">Empresa:</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Digite o nome da sua empresa"
                />
              </div>
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
            
            <div className={styles.interessesWrapper}>
              <div className={styles.interessesHeader}>
                <div className={styles.buscaContainer}>
                  <FiSearch className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Buscar interesses..."
                    value={filtroInteresses}
                    onChange={(e) => setFiltroInteresses(e.target.value)}
                    className={styles.buscaInput}
                  />
                  {filtroInteresses && (
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
                  onClick={toggleExpandirInteresses}
                  className={styles.expandirBotao}
                >
                  {interessesExpandidos ? <FiChevronUp /> : <FiChevronDown />}
                </button>
              </div>
              
              <div 
                ref={interessesContainerRef}
                className={`${styles.interessesContainer} ${interessesExpandidos ? styles.expandido : ''}`}
              >
                {categoriasFiltradas.length === 0 ? (
                  <div className={styles.semResultados}>
                    Nenhum interesse encontrado para "{filtroInteresses}"
                  </div>
                ) : (
                  categoriasFiltradas.map(categoria => (
                    <div key={categoria.id} className={styles.interesseItem}>
                      <input
                        type="checkbox"
                        id={`interesse-${categoria.id}`}
                        checked={interessesSelecionados.includes(categoria.id)}
                        onChange={() => handleInteresseChange(categoria.id)}
                        disabled={interessesSelecionados.length >= 5 && !interessesSelecionados.includes(categoria.id)}
                        className={styles.interesseCheckbox}
                      />
                      <label 
                        htmlFor={`interesse-${categoria.id}`} 
                        className={`${styles.interesseLabel} ${interessesSelecionados.includes(categoria.id) ? styles.interesseSelecionado : ''} ${interessesSelecionados.length >= 5 && !interessesSelecionados.includes(categoria.id) ? styles.interesseDesabilitado : ''}`}
                      >
                        {categoria.nome}
                      </label>
                    </div>
                  ))
                )}
              </div>
              
              <div className={styles.interessesFooter}>
                <div className={styles.interesseContador}>
                  {interessesSelecionados.length} de 5 selecionados
                </div>
                
                {interessesSelecionados.length > 0 && (
                  <div className={styles.interessesSelecionadosPreview}>
                    {categorias
                      .filter(cat => interessesSelecionados.includes(cat.id))
                      .map(cat => (
                        <span key={cat.id} className={styles.interesseTag}>
                          {cat.nome}
                          <button 
                            type="button" 
                            className={styles.removerTag}
                            onClick={() => handleInteresseChange(cat.id)}
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