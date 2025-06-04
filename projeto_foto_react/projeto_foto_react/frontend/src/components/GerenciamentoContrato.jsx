import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import styles from './GerenciamentoContratos.module.css';
import Sidebar from '../components/Sidebar';
import { format } from 'date-fns';

const GerenciamentoContratos = () => {
  const { user, logout } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  const formatDate = (isoString) => {
    if (!isoString) return '';
    return format(new Date(isoString), 'dd/MM/yyyy');
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'ABERTO': return styles.tagAberto;
      case 'CADASTRADO': return styles.tagCadastrado;
      case 'ASSINADO': return styles.tagAssinado;
      case 'APROVADO': return styles.tagAprovado;
      default: return '';
    }
  };

  const fetchContracts = async () => {
    try {
      const response = await axios.get(
        'http://localhost:8800/api/contratos/meus-contratos', 
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setContracts(response.data);
    } catch (err) {
      setError('Erro ao carregar contratos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchContractSignatures = async (contractId) => {
    try {
      const response = await axios.get(
        `http://localhost:8800/api/contratos/${contractId}/assinantes`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setSelectedContract(prev => ({
        ...prev,
        usuariosAssinantes: response.data.usuariosAssinantes
      }));
    } catch (err) {
      console.error('Erro ao buscar assinaturas:', err);
      alert('Falha ao carregar assinaturas');
    }
  };

  useEffect(() => {
    if (user && user.tipo_usuario === 'PJ') {
      fetchContracts();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleDeleteContract = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este contrato?')) {
      try {
        await axios.delete(
          `http://localhost:8800/api/contratos/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        fetchContracts();
      } catch (err) {
        alert('Erro ao excluir contrato');
        console.error(err);
      }
    }
  };

  const handleViewSignatures = async (contract) => {
    setSelectedContract(contract);
    setShowModal(true);
    if (contract.assinaturas > 0) {
      await fetchContractSignatures(contract.id);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedContract(null);
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Carregando contratos...</p>
      </div>
    );
  }

  if (!user || user.tipo_usuario !== 'PJ') {
    return (
      <div className={styles.errorContainer}>
        <i className="fas fa-exclamation-triangle"></i>
        <h3>Acesso restrito</h3>
        <p>Esta funcionalidade está disponível apenas para empresas (pessoas jurídicas).</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <i className="fas fa-exclamation-triangle"></i>
        <p>{error}</p>
        <button onClick={fetchContracts} className={styles.retryButton}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className={styles.appContainer}>
      <div className={styles.sidebarContainer}>
        <Sidebar user={user} logout={logout} />
      </div>
      
      <div className={styles.mainContent}>
        <header className={styles.appHeader}>
          <div className={styles.headerLeft}>
            <img 
              src="/favicon.ico" 
              alt="Favicon" 
              className={styles.favicon}
            />
            <h1>Gerenciamento de Contratos</h1>
          </div>
          
          <div className={styles.headerRight}>
            <div className={styles.userInfo}>
              <span>{user.email.split('@')[0]}</span>
            </div>
          </div>
        </header>
        
        <main className={styles.appMainContent}>
          <div className={styles.contentContainer}>
            <div className={styles.header}>
              <h1>Contratos Publicados</h1>
              <p>Gerencie os contratos publicados pela sua empresa</p>
            </div>

            {contracts.length === 0 ? (
              <div className={styles.emptyState}>
                <i className="fas fa-file-contract"></i>
                <h3>Nenhum contrato encontrado</h3>
                <p>Você ainda não publicou nenhum contrato.</p>
              </div>
            ) : (
              <div className={styles.contractsTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Título</th>
                      <th>Status</th>
                      <th>Data de Criação</th>
                      <th>Data de Validade</th>
                      <th>Assinaturas</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map(contract => (
                      <tr key={contract.id}>
                        <td>{contract.titulo}</td>
                        <td>
                          <span className={`${styles.tag} ${getStatusClass(contract.status)}`}>
                            {contract.status}
                          </span>
                        </td>
                        <td>{formatDate(contract.data_criacao)}</td>
                        <td>
                          {contract.data_validade 
                            ? formatDate(contract.data_validade) 
                            : 'Sem validade'}
                        </td>
                        <td>
                          {contract.assinaturas > 0 ? (
                            <button 
                              className={styles.signaturesButton}
                              onClick={() => handleViewSignatures(contract)}
                            >
                              {contract.assinaturas} assinatura(s)
                            </button>
                          ) : (
                            'Nenhuma'
                          )}
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <button 
                              className={styles.actionButton}
                              onClick={() => handleViewSignatures(contract)}
                              title="Ver assinaturas"
                            >
                              <i className="fas fa-signature"></i>
                            </button>
                            <button 
                              className={styles.actionButton}
                              title="Editar"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              className={`${styles.actionButton} ${styles.deleteButton}`}
                              onClick={() => handleDeleteContract(contract.id)}
                              title="Excluir"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Modal para ver assinaturas */}
            {showModal && selectedContract && (
              <div className={styles.modalBackdrop} onClick={closeModal}>
                <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                  <div className={styles.modalHeader}>
                    <h2>Assinaturas do Contrato</h2>
                    <button className={styles.closeButton} onClick={closeModal}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  
                  <div className={styles.modalBody}>
                    <h3>{selectedContract.titulo}</h3>
                    
                    {selectedContract.assinaturas > 0 ? (
                      <table className={styles.signaturesTable}>
                        <thead>
                          <tr>
                            <th>Usuário</th>
                            <th>Email</th>
                            <th>Data da Assinatura</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedContract.usuariosAssinantes && 
                          selectedContract.usuariosAssinantes.map(user => (
                            <tr key={user.id}>
                              <td>{user.nome || user.email.split('@')[0]}</td>
                              <td>{user.email}</td>
                              <td>{formatDate(user.data_insercao)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className={styles.noSignatures}>
                        <i className="fas fa-file-signature"></i>
                        <p>Este contrato ainda não possui assinaturas</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
        
        <footer className={styles.appFooter}>
          <p>Commtratta © {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
};

export default GerenciamentoContratos;