// src/pages/Explorar.jsx
import React, { useEffect, useMemo, useState } from 'react';
import styles from './Explorar.module.css';
import api from '../services/api';
import { format } from 'date-fns';
import Modal from '../components/modal';

const formatDate = iso =>
  iso ? format(new Date(iso), 'dd/MM/yyyy') : '';

const Explorar = () => {
  const [categorias, setCategorias]   = useState([]);
  const [contracts, setContracts]     = useState([]);
  const [search, setSearch]           = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [selectedContract, setSelectedContract] = useState(null);

  /* ---------- carregamento inicial ---------- */
  useEffect(() => {
    (async () => {
      try {
        const [catRes, cRes] = await Promise.all([
          api.get('/categorias'),
          api.get('/contratos/filter'),      // todos
        ]);
        setCategorias(catRes.data);
        setContracts(cRes.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            'Falha ao carregar dados'
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getContractImageUrl = (rawUrl) => {
  if (!rawUrl) return 'http://localhost:8800/uploads/default-contract.png';
  
  if (rawUrl.includes('uploads')) {
    const filename = rawUrl.split('/').pop();
    return `http://localhost:8800/uploads/${filename}`;
  }

  return rawUrl;
};

  /* ---------- refiltra localmente  ---------- */
  const contratosFiltrados = useMemo(() => {
    const termo = search.toLowerCase();
    return contracts.filter(c => {
      const okBusca =
        !termo ||
        c.titulo.toLowerCase().includes(termo) ||
        c.descricao?.toLowerCase().includes(termo);
      return okBusca;
    });
  }, [contracts, search]);

  /* ---------- busca no backend apenas quando a categoria muda ---------- */
  useEffect(() => {
  setLoading(true);

  api
    .get('/contratos/filter', {
      // se for string vazia, não enviamos o parâmetro
      params: categoriaId ? { categoriaId } : {},
    })
    .then(res => setContracts(res.data))
    .catch(err =>
      setError(
        err.response?.data?.message ||
          'Erro ao filtrar contratos'
      )
    )
    .finally(() => setLoading(false));
}, [categoriaId]);

  /* ---------- render ---------- */
  if (loading) return <p className={styles.status}>Carregando…</p>;
  if (error)   return <p className={styles.statusErro}>{error}</p>;

  return (
    <section className={styles.container}>
      <h2 className={styles.titulo}>Explorar Contratos</h2>

      {/* Pesquisa + filtro */}
      <div className={styles.ferramentas}>
        {/* input NÃO está em <form>, portanto nada de reload */}
        <input
          type="text"
          placeholder="Pesquisar…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.searchInput}
        />

        <select
          value={categoriaId}
          onChange={e => setCategoriaId(e.target.value)}
          className={styles.select}
        >
          <option value="">Todas as categorias</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Cards */}
      <div className={styles.cardsGrid}>
        {contratosFiltrados.length === 0 && (
          <p className={styles.nada}>Nenhum contrato encontrado.</p>
        )}

        {contratosFiltrados.map(c => {
          const imgSrc =
            c.contrato_img?.startsWith('http')
              ? c.contrato_img
              : getContractImageUrl(c.contrato_img); // ← rota estática do backend

          return (
            <div
              key={c.id}
              className={styles.card}
              onClick={() => setSelectedContract(c)}
            >
              <img src={imgSrc} alt={c.titulo} className={styles.img} />
              <h3>{c.titulo}</h3>
              <p className={styles.descricao}>
                {c.descricao?.slice(0, 90)}…
              </p>
              <span className={styles.data}>{formatDate(c.data_criacao)}</span>
            </div>
          );
        })}
      </div>

      {/* Modal de detalhes */}
      {selectedContract && (
        <Modal
          onClose={() => setSelectedContract(null)}
          contractId={selectedContract.id}
          showAssinar
        />
      )}
    </section>
  );
};

export default Explorar;

