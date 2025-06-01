import React, { useState, useEffect } from 'react';
import styles from './Listagem.module.css';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Listagem = ({ onAddContract }) => {
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

  const handleSignContract = async (contractId) => {
    try {
      const response = await axios.post(
        `http://localhost:8800/api/contratos/${contractId}/sign`,
        { userId: user.id },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data) {
        // Atualizar a lista de contratos
        setContracts(contracts.filter(contract => contract.id !== contractId));
        alert('Contrato assinado com sucesso!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao assinar contrato');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Carregando contratos...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      
      <div className={styles.contractsGrid}>
        {contracts.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="fas fa-file-contract"></i>
            <p>Não há contratos abertos no momento</p>
          </div>
        ) : (
          contracts.map(contract => (
            <div key={contract.id} className={styles.contractCard}>
              <div className={styles.cardHeader}>
                <h3>{contract.titulo}</h3>
                <span className={`${styles.status} ${styles[contract.status.toLowerCase()]}`}>
                  {contract.status}
                </span>
              </div>
              
              <p className={styles.description}>{contract.descricao}</p>
              
              <div className={styles.cardDetails}>
                <div className={styles.detailItem}>
                  <i className="fas fa-building"></i>
                  <span>{contract.fornecedor_email}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <i className="fas fa-calendar-alt"></i>
                  <span>
                    {new Date(contract.data_criacao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <div className={styles.detailItem}>
                  <i className="fas fa-clock"></i>
                  <span>
                    Validade: {new Date(contract.data_validade).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              
        
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Listagem;