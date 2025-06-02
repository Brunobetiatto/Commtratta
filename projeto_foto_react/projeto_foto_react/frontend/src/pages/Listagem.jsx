import React, { useState, useEffect } from 'react';
import styles from './Listagem.module.css';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

// Função utilitária para formatar datas no formato DD/MM/AAAA
const formatDate = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// Nova função para retornar a URL da imagem do contrato
const getContractImageUrl = (rawUrl) => {
  // Se não existir nada em contract.contrato_img, retorna uma imagem default
  if (!rawUrl) {
    return '/default-contract.png'; 
  }

  // Se a string contiver "uploads", extraímos somente o nome do arquivo
  // e montamos a URL para http://localhost:8800/uploads/filename.ext
  if (rawUrl.includes('uploads')) {
    const filename = rawUrl.split('/').pop();
    return `http://localhost:8800/uploads/${filename}`;
  }

  // Caso contrário, assume-se que rawUrl já é a URL completa (externa)
  return rawUrl;
};

const Listagem = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchOpenContracts = async () => {
      try {
        const response = await axios.get('http://localhost:8800/api/contratos/open');
        if (response.data) {
          setContracts(response.data);
        } else {
          setError('Erro ao carregar contratos');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Falha na conexão com o servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchOpenContracts();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando contratos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <i className="fas fa-exclamation-triangle"></i>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className={styles.retryButton}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Sugestões para você</h1>
      </div>

      <div className={styles.contractsList}>
        {contracts.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="fas fa-file-contract"></i>
            <h3>Não há contratos abertos no momento</h3>
            <p>Quando novos contratos forem cadastrados, eles aparecerão aqui</p>
          </div>
        ) : (
          contracts.map((contract) => (
            <div
              key={contract.id}
              className={styles.contractCard}
              style={{
                backgroundImage: `url(${getContractImageUrl(contract.contrato_img)})`,
              }}
            >
              {/* Overlay para contraste */}
              <div className={styles.overlay}></div>

              {/* STATUS como tag */}
              {contract.status && (
                <span
                  className={`${styles.tag} ${
                    contract.status === 'ABERTO'
                      ? styles.tagAberto
                      : contract.status === 'CADASTRADO'
                      ? styles.tagCadastrado
                      : contract.status === 'ASSINADO'
                      ? styles.tagAssinado
                      : styles.tagAprovado
                  }`}
                >
                  {contract.status}
                </span>
              )}

              {/* TÍTULO DO CONTRATO (sem quebra de linha) */}
              <h3 className={styles.cardTitle}>{contract.titulo}</h3>

              {/* RODAPÉ COM DATAS E DESCRIÇÃO (até 80 chars) */}
              <div className={styles.cardFooter}>
                {contract.descricao && (
                  <p className={styles.servicoDescription}>
                    {contract.descricao.length > 80
                      ? contract.descricao.substring(0, 80).trim() + '...'
                      : contract.descricao}
                  </p>
                )}
                <p className={styles.fechaCriacao}>
                  Publicado em: {formatDate(contract.data_criacao)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Listagem;
