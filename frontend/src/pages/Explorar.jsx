// src/pages/Explorar.jsx
import React, { useEffect, useState, useMemo } from 'react';
import styles from './Explorar.module.css';
import api from '../services/api';
import { format } from 'date-fns';
import Modal from '../components/modal';             // (já utilizado em Listagem)

const formatDate = iso =>
  iso ? format(new Date(iso), 'dd/MM/yyyy') : '';

const Explorar = () => {
  const [categorias, setCategorias] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [search, setSearch] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContract, setSelectedContract] = useState(null);

  /* ---------- carregamento inicial ---------- */
  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [catRes, cRes] = await Promise.all([
          api.get('/categorias'),
          api.get('/contratos/filter'),           // nada filtrado = todos
        ]);
        setCategorias(catRes.data);
        setContracts(cRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Erro ao carregar dados.');
      } finally {
        setLoading(false);
      }
    };
    fetchInit();
  }, []);

  /* ---------- filtro MEMOIZADO ---------- */
  const contratosFiltrados = useMemo(() => {
    return contracts.filter(c => {
      const okSearch =
        !search ||
        c.titulo.toLowerCase().includes(search.toLowerCase()) ||
        c.descricao?.toLowerCase().includes(search.toLowerCase());
      const okCategoria =
        !categoriaId || String(c.categoria_id) === String(categoriaId);
      return okSearch && okCategoria;
    });
  }, [contracts, search, categoriaId]);

  /* ---------- handler disparando busca no backend ---------- */
  const atualizarContratos = async (catId, termo) => {
    setLoading(true);
    try {
      const { data } = await api.get('/contratos/filter', {
        params: { categoriaId: catId || '', search: termo || '' },
      });
      setContracts(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Falha ao filtrar contratos');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- eventos ---------- */
  const handleSearchChange = e => {
    const termo = e.target.value;
    setSearch(termo);
    atualizarContratos(categoriaId, termo);
  };

  const handleCategoriaChange = e => {
    const id = e.target.value;
    setCategoriaId(id);
    atualizarContratos(id, search);
  };

  /* ---------- render ---------- */
  if (loading) return <p className={styles.status}>Carregando…</p>;
  if (error)   return <p className={styles.statusErro}>{error}</p>;

  return (
    <section className={styles.container}>
      <h2 className={styles.titulo}>Explorar Contratos</h2>

      {/* Barra de pesquisa + filtro */}
      <div className={styles.ferramentas}>
        <input
          type="text"
          placeholder="Pesquisar contratos…"
          value={search}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />

        <select
          value={categoriaId}
          onChange={handleCategoriaChange}
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
        {contratosFiltrados.map(c => (
          <div
            key={c.id}
            className={styles.card}
            onClick={() => setSelectedContract(c)}
          >
            <img
              src={
                c.contrato_img?.includes('uploads')
                  ? `http://localhost:8800/uploads/${c.contrato_img.split('/').pop()}`
                  : c.contrato_img || '/default-contract.png'
              }
              alt={c.titulo}
              className={styles.img}
            />
            <h3>{c.titulo}</h3>
            <p className={styles.descricao}>
              {c.descricao?.slice(0, 80)}…
            </p>
            <span className={styles.data}>{formatDate(c.data_criacao)}</span>
          </div>
        ))}
      </div>

      {/* Modal de detalhes (mesmo componente utilizado em Listagem) */}
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
