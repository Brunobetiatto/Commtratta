import React, { useState, useEffect } from 'react';
import styles from './Listagem.module.css';
import { useAuth } from '../contexts/AuthContext';

const Listagem = ({ onAddContract }) => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchOpenContracts = async () => {
      try {
        const response = await fetch('http://localhost:8800/api/contracts/open');
        const data = await response.json();
        
        if (response.ok) {
          setContracts(data);
        } else {
          setError(data.message || 'Erro ao carregar contratos');
        }
      } catch (err) {
        setError('Falha na conexão com o servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchOpenContracts();
  }, []);

  const handleSignContract = async (contractId) => {
    try {
      const response = await fetch(`http://localhost:8800/api/contracts/${contractId}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        // Atualizar a lista de contratos
        setContracts(contracts.filter(contract => contract.id !== contractId));
        alert('Contrato assinado com sucesso!');
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao assinar contrato');
      }
    } catch (err) {
      setError(err.message);
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
      <div className={styles.header}>
        <h2>Contratos Abertos</h2>
        {user.tipo === 'PJ' && (
          <button onClick={onAddContract} className={styles.addButton}>
            Criar Novo Contrato
          </button>
        )}
      </div>

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
                  <span>{contract.fornecedor_nome}</span>
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
              
              {user.tipo === 'PF' && (
                <button 
                  onClick={() => handleSignContract(contract.id)} 
                  className={styles.signButton}
                >
                  <i className="fas fa-signature"></i> Assinar Contrato
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Listagem;