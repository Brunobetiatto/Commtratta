import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import styles from './GerenciamentoContratos.module.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { format } from 'date-fns';
import { Document, Page, pdfjs } from 'react-pdf';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.js?url'; 

const GerenciamentoContratos = () => {
  const { user, logout } = useAuth();
  const [publishedContracts, setPublishedContracts] = useState([]);
  const [signedContracts, setSignedContracts] = useState([]);
  const [closedContracts, setClosedContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSignaturesModal, setShowSignaturesModal] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [showCloseContractModal, setShowCloseContractModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeTab, setActiveTab] = useState('publicados'); // 'publicados', 'assinados' ou 'fechados'
  const [showContractDetailsModal, setShowContractDetailsModal] = useState(false);
  const [contractDetails, setContractDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const formatDate = (isoString) => {
    if (!isoString) return '';
    return format(new Date(isoString), 'dd/MM/yyyy');
  };

  

  const getStatusClass = (status) => {
    switch (status) {
      case 'ABERTO': return styles.tagAberto;
      case 'ASSINADO': return styles.tagAssinado;
      default: return '';
    }
  };

  const handleStartChat = async (contratoId, clienteId) => {
    try {
      const response = await axios.post(
        'http://localhost:8800/api/chats',
        { contrato_id: contratoId, cliente_id: clienteId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      alert('Chat iniciado com sucesso!');
      closeAllModals();
    } catch (error) {
      console.error('Erro ao iniciar chat:', error);
      alert(error.response?.data?.message || 'Erro ao iniciar chat');
    }
  };

  const fetchPublishedContracts = async () => {
    try {
      const response = await axios.get(
        'http://localhost:8800/api/contratos/meus-contratos', 
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setPublishedContracts(response.data);
    } catch (err) {
      setError('Erro ao carregar contratos publicados');
      console.error(err);
    }
  };

  const fetchSignedContracts = async () => {
    try {
      const response = await axios.get(
        'http://localhost:8800/api/contratos/assinados',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setSignedContracts(response.data);
    } catch (err) {
      setError('Erro ao carregar contratos assinados');
      console.error(err);
    }
  };

  const fetchClosedContracts = async () => {
    try {
      const response = await axios.get(
        'http://localhost:8800/api/contratos/fechados',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setClosedContracts(response.data);
    } catch (err) {
      setError('Erro ao carregar contratos fechados');
      console.error(err);
    }
  };
  const handleSignContract = async () => {
    if (!user || !contractDetails) return;

    try {
      await axios.post(
        `http://localhost:8800/api/contratos/${contractDetails.id}/sign`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      alert('Contrato assinado com sucesso!');
      closeModal();
      
      // Atualizar lista de contratos
      const response = await axios.get('http://localhost:8800/api/contratos/open');
      setContracts(response.data);
    } catch (err) {
      console.error('Erro ao assinar contrato:', err);
      alert(err.response?.data?.message || 'Falha ao assinar contrato');
    }
  };

  const handleOpenContractDetails = async (contract) => {
    setSelectedContract(contract);
    setShowContractDetailsModal(true);
    setLoadingDetails(true);
    
    try {
      const response = await axios.get(
        `http://localhost:8800/api/contratos/${contract.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setContractDetails(response.data);
    } catch (err) {
      console.error('Erro ao buscar detalhes do contrato:', err);
      setContractDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeContractDetailsModal = () => {
    setShowContractDetailsModal(false);
    setContractDetails(null);
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

  const fetchUserDetails = async (userId) => {
    try {
      const response = await axios.get(
        `http://localhost:8800/api/usuarios/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setSelectedUser(response.data);
    } catch (err) {
      console.error('Erro ao buscar detalhes do usuário:', err);
      alert('Falha ao carregar informações do usuário');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (user && user.tipo_usuario === 'PJ') {
          await fetchPublishedContracts();
          await fetchClosedContracts();
        }
        
        if (user) {
          await fetchSignedContracts();
        }
        
      } catch (err) {
        setError('Erro ao carregar dados');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
        fetchPublishedContracts();
      } catch (err) {
        alert('Erro ao excluir contrato');
        console.error(err);
      }
    }
  };

  const handleViewSignatures = async (contract) => {
    setSelectedContract(contract);
    setShowSignaturesModal(true);
    if (contract.assinaturas > 0) {
      await fetchContractSignatures(contract.id);
    }
  };

  const handleViewUserInfo = async (user) => {
    setSelectedUser(null);
    setShowUserInfoModal(true);
    await fetchUserDetails(user.id);
  };

  const handleOpenCloseContractModal = (contract) => {
    setSelectedContract(contract);
    setShowCloseContractModal(true);
    if (contract.assinaturas > 0) {
      fetchContractSignatures(contract.id);
    }
  };
  const getContractImageUrl = (rawUrl) => {
    if (!rawUrl) return 'http://localhost:8800/uploads/default-contract.png';
    
    if (rawUrl.includes('uploads')) {
      const filename = rawUrl.split('/').pop();
      return `http://localhost:8800/uploads/${filename}`;
    }

    return rawUrl;
  };

  const handleCloseContract = async () => {
    if (!selectedContract || !selectedClient) return;
    
    try {
      await axios.post(
        `http://localhost:8800/api/contratos/${selectedContract.id}/fechar`,
        { clienteId: selectedClient.id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      alert('Contrato fechado com sucesso!');
      setShowCloseContractModal(false);
      setSelectedClient(null);
      
      // Atualizar listas
      await fetchPublishedContracts();
      await fetchClosedContracts();
      
    } catch (err) {
      console.error('Erro ao fechar contrato:', err);
      alert(err.response?.data?.message || 'Falha ao fechar contrato');
    }
  };

  const closeAllModals = () => {
    setShowSignaturesModal(false);
    setShowUserInfoModal(false);
    setShowCloseContractModal(false);
    setSelectedContract(null);
    setSelectedUser(null);
    setShowContractDetailsModal(false);
    setSelectedClient(null);
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Carregando contratos...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <i className="fas fa-exclamation-triangle"></i>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className={styles.retryButton}>
          Tentar novamente
        </button>
      </div>
    );
  }

  const renderContractsTable = (contracts, showActions = true, showCloseButton = false ) => {
    return (
      <div className={styles.contractsTable}>
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Status</th>
              <th>Data de Criação</th>
              <th>Data de Validade</th>
              <th>Assinaturas</th>
              {showActions && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {contracts.map(contract => (
              <tr key={contract.id} onClick={() => handleOpenContractDetails(contract)}className={styles.clickableRow} >
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
                      
                      onClick={(e) => {
                        e.stopPropagation(); 
                        handleViewSignatures(contract);
                      }}
                    >
                      {contract.assinaturas} assinatura(s)
                    </button>
                  ) : (
                    'Nenhuma'
                  )}
                </td>
                {showActions && (
                  <td>
                    <div className={styles.actions}>
                      {/* Ver assinaturas */}
                      <button 
                        className={styles.actionButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewSignatures(contract)}}
                        title="Ver assinaturas"
                      >
                        <i className="fas fa-pen-nib"></i> {/* Ícone de assinatura */}
                      </button>

                      {/* Fechar contrato */}
                      {showCloseButton && contract.status === 'ABERTO' && contract.assinaturas > 0 && (
                        <button 
                          className={`${styles.actionButton} ${styles.closeContractButton}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCloseContractModal(contract)}}
                          title="Fechar contrato"
                        >
                          <i className="fas fa-lock"></i> {/* Ícone de cadeado para "fechar" */}
                        </button>
                      )}

                      {/* Excluir contrato */}
                      {contract.status !== 'ASSINADO' && (
                        <button 
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          onClick={() => handleDeleteContract(contract.id)}
                          title="Excluir"
                        >
                          <i className="fas fa-trash-alt"></i> {/* Ícone de lixeira */}
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={styles.appContainer}>
      <div className={styles.sidebarContainer}>
        <Sidebar user={user} logout={logout} />
      </div>
      
      <div className={styles.mainContent}>
        <Header user={user} />
        
        <main className={styles.appMainContent}>
          <div className={styles.contentContainer}>
            <div className={styles.header}>
              <h1>
                {activeTab === 'publicados' && 'Contratos Publicados'}
                {activeTab === 'assinados' && 'Contratos Assinados'}
                {activeTab === 'fechados' && 'Contratos Fechados'}
              </h1>
              <p>
                {activeTab === 'publicados' && 'Gerencie os contratos publicados pela sua empresa'}
                {activeTab === 'assinados' && 'Contratos que sua empresa assinou'}
                {activeTab === 'fechados' && 'Contratos fechados com clientes'}
              </p>
            </div>

            {/* Abas para alternar entre tipos de contratos */}
            <div className={styles.tabs}>
              <button 
                className={`${styles.tab} ${activeTab === 'publicados' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('publicados')}
              >
                Publicados
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'assinados' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('assinados')}
              >
                Assinados
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'fechados' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('fechados')}
              >
                Fechados
              </button>
            </div>

            {activeTab === 'publicados' ? (
              publishedContracts.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className="fas fa-file-contract"></i>
                  <h3>Nenhum contrato encontrado</h3>
                  <p>Você ainda não publicou nenhum contrato.</p>
                </div>
              ) : (
                renderContractsTable(publishedContracts, true, true)
              )
            ) : activeTab === 'assinados' ? (
              signedContracts.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className="fas fa-file-signature"></i>
                  <h3>Nenhum contrato assinado</h3>
                  <p>Sua empresa ainda não assinou nenhum contrato.</p>
                </div>
              ) : (
                renderContractsTable(signedContracts, false)
              )
            ) : (
              closedContracts.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className="fas fa-file-contract"></i>
                  <h3>Nenhum contrato fechado</h3>
                  <p>Você ainda não fechou nenhum contrato com clientes.</p>
                </div>
              ) : (
                renderContractsTable(closedContracts, false)
              )
            )}

            {/* Modal para ver assinaturas */}
            {showSignaturesModal && selectedContract && (
              <div className={styles.modalOverlay1} onClick={closeAllModals}>
                <div className={styles.signaturesModal} onClick={e => e.stopPropagation()}>
                  {/* Cabeçalho */}
                  <div className={styles.modalHeader}>
                    <div className={styles.headerContent}>
                      <i className="fas fa-signature"></i>
                      <h2>Assinaturas do Contrato</h2>
                    </div>
                    <button className={styles.closeBtn} onClick={closeAllModals} aria-label="Fechar">
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  
                  {/* Corpo */}
                  <div className={styles.modalBody}>
                    <div className={styles.contractHeader}>
                      <h3 className={styles.contractTitle}>
                        <i className="fas fa-file-contract"></i> {selectedContract.titulo}
                      </h3>
                      <div className={styles.signatureCount}>
                        <span className={styles.countBadge}>
                          {selectedContract.assinaturas} {selectedContract.assinaturas === 1 ? 'assinatura' : 'assinaturas'}
                        </span>
                      </div>
                    </div>

                    {/* Lista de assinaturas */}
                    {selectedContract.assinaturas > 0 ? (
                      <div className={styles.signaturesContainer}>
                        <div className={styles.signaturesGrid}>
                          {/* CORREÇÃO DO ERRO: Verificação segura antes do map */}
                          {(selectedContract.usuariosAssinantes || []).map(user => (
                            <div key={user.id} className={styles.signatureCard}>
                              <div className={styles.userInfo}>
                                <div className={styles.userAvatar}>
                                  <img 
                                    src={getContractImageUrl(user.img) || '/default-profile.png'} 
                                    alt={`${user.nome || user.email.split('@')[0]}`}
                                    onError={(e) => e.target.src = '/default-profile.png'}
                                  />
                                </div>
                                <div className={styles.userDetails}>
                                  <h4 className={styles.userName}>
                                    {user.nome || user.email.split('@')[0]}
                                  </h4>
                                  <p className={styles.userEmail}>{user.email}</p>
                                  <div className={styles.signatureDate}>
                                    <i className="fas fa-calendar-check"></i> 
                                    {formatDate(user.data_insercao)}
                                  </div>
                                </div>
                              </div>
                              
                              <div className={styles.actionButtons}>
                                <button 
                                  className={`${styles.actionBtn} ${styles.profileBtn}`}
                                  onClick={() => handleViewUserInfo(user)}
                                >
                                  <i className="fas fa-user"></i> Perfil
                                </button>
                                <button 
                                  className={`${styles.actionBtn} ${styles.chatBtn}`}
                                  onClick={() => handleStartChat(selectedContract.id, user.id)}
                                >
                                  <i className="fas fa-comment-dots"></i> Chat
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className={styles.emptyState}>
                        <div className={styles.emptyIllustration}>
                          <i className="fas fa-file-signature"></i>
                        </div>
                        <h3>Nenhuma assinatura encontrada</h3>
                        <p>Este contrato ainda não possui assinaturas registradas</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Modal para informações do usuário */}
            {showUserInfoModal && selectedUser && (
              <div className={styles.modalBackdrop} onClick={closeAllModals}>
                <div className={styles.userModalContent} onClick={e => e.stopPropagation()}>
                  {/* Cabeçalho */}
                  <div className={styles.modalHeader}>
                    <h2>Detalhes do Usuário</h2>
                    <button className={styles.closeButton} onClick={closeAllModals} aria-label="Fechar">
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  
                  {/* Corpo */}
                  <div className={styles.userModalBody}>
                    {/* Perfil */}
                    <div className={styles.userProfile}>
                      <img 
                        src={getContractImageUrl(selectedUser.img) || 'http://localhost:8800/uploads/defaut2.png'} 
                        alt={`Avatar de ${selectedUser.nome || selectedUser.username}`} 
                        className={styles.userAvatar}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/default-profile.png';
                        }}
                      />
                      <div className={styles.profileInfo}>
                        <h3 className={styles.userName}>
                          {selectedUser.nome || selectedUser.username || selectedUser.email.split('@')[0]}
                        </h3>
                        <p className={styles.userEmail}>
                          <i className="fas fa-envelope"></i> {selectedUser.email}
                        </p>
                        {selectedUser.username && (
                          <p className={styles.userUsername}>
                            <i className="fas fa-user"></i> {selectedUser.username}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Informações principais */}
                    <div className={styles.infoGrid}>
                      
                      <div className={styles.infoCard}>
                        <h4><i className="fas fa-phone"></i> Contato</h4>
                        <div className={styles.detailItem}>
                          <span>Telefone:</span>
                          <p>{selectedUser.telefone || 'Não informado'}</p>
                        </div>
                        <div className={styles.detailItem}>
                          <span>Telefone:</span>
                          <p>{selectedUser.email || 'Não informado'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Interesses */}
                    {selectedUser.interesses && (
                      <div className={styles.interestsSection}>
                        <h4><i></i> Interesses</h4>
                        <div className={styles.interestsContainer}>
                          {Array.isArray(selectedUser.interesses) && selectedUser.interesses.length > 0 ? (
                            selectedUser.interesses.map((interesse, index) => (
                              <span key={index} className={styles.categoriaTag}>
                                {interesse.nome}
                              </span>
                            ))
                          ) : (
                            <p className={styles.noInterests}>Nenhum interesse informado</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Modal para fechar contrato */}
            {showCloseContractModal && selectedContract && (
              <div className={styles.modalBackdrop} onClick={closeAllModals}>
                <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                  <div className={styles.modalHeader}>
                    <h2>Fechar Contrato</h2>
                    <button className={styles.closeButton} onClick={closeAllModals}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  
                  <div className={styles.modalBody}>
                    <h3>{selectedContract.titulo}</h3>
                    <p className={styles.modalDescription}>
                      Selecione o cliente com quem deseja fechar este contrato:
                    </p>
                    
                    {selectedContract.assinaturas > 0 ? (
                      <div className={styles.clientList}>
                        {selectedContract.usuariosAssinantes && 
                        selectedContract.usuariosAssinantes.map(user => (
                          <div 
                            key={user.id} 
                            className={`${styles.clientCard} ${selectedClient?.id === user.id ? styles.selectedClient : ''}`}
                            onClick={() => setSelectedClient(user)}
                          >
                            <div className={styles.clientInfo}>
                              <span className={styles.clientName}>
                                {user.nome || user.email.split('@')[0]}
                              </span>
                              <span className={styles.clientEmail}>{user.email}</span>
                              <span className={styles.clientSignDate}>
                                Assinado em: {formatDate(user.data_insercao)}
                              </span>
                            </div>
                            {selectedClient?.id === user.id && (
                              <i className="fas fa-check-circle"></i>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.noSignatures}>
                        <i className="fas fa-exclamation-triangle"></i>
                        <p>Este contrato não possui assinaturas para fechar</p>
                      </div>
                    )}
                    
                    <div className={styles.modalActions}>
                      <button 
                        className={styles.cancelButton}
                        onClick={closeAllModals}
                      >
                        Cancelar
                      </button>
                      <button 
                        className={styles.confirmButton}
                        onClick={handleCloseContract}
                        disabled={!selectedClient}
                      >
                        <i className="fas fa-file-contract"></i> Fechar Contrato
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {showContractDetailsModal && (
              <div className={styles.modalBackdrop} onClick={closeContractDetailsModal}>
                <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', width: '90%' }}>
                  {loadingDetails ? (
                    <div className={styles.loadingDetails}>
                      <div className={styles.spinner}></div>
                      <p>Carregando detalhes...</p>
                    </div>
                  ) : contractDetails ? (
                    <div className={styles.modalLayout}>
                                <div className={styles.modalHeader}>
                                  <h2 className={styles.modalTitle}>{contractDetails.titulo}</h2>
                                </div>
                                
                                <div className={styles.modalBody}>
                                  <div className={styles.contractImage}>
                                    <img 
                                      src={getContractImageUrl(contractDetails.contrato_img)} 
                                      alt={contractDetails.titulo} 
                                    />
                                  </div>
                                  
                                  <div className={styles.contractDetails}>
                                    <div className={styles.detailItem}>
                                      <span className={styles.detailLabel}>Descrição</span>
                                      <p className={styles.detailValue}>{contractDetails.descricao}</p>
                                    </div>
                                    
                                    <div className={styles.detailItem}>
                                      <span className={styles.detailLabel}>Data de criação</span>
                                      <p className={styles.detailValue}>
                                        {formatDate(contractDetails.data_criacao)}
                                      </p>
                                    </div>
                                    
                                    <div className={styles.detailItem}>
                                      <span className={styles.detailLabel}>Data de validade</span>
                                      <p className={styles.detailValue}>
                                        {contractDetails.data_validade 
                                          ? formatDate(contractDetails.data_validade) 
                                          : 'Sem data de validade'}
                                      </p>
                                    </div>
                                    
                                    {contractDetails.categorias?.length > 0 && (
                                      <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Categorias</span>
                                        <div className={styles.categoriesContainer}>
                                          {contractDetails.categorias.map(categoria => (
                                            <span key={categoria.id} className={styles.categoryTag}>
                                              {categoria.nome}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                    
                                <div className={styles.contractTerms}>
                                  <div
                                    className={styles.pdfPreview}
                                    onClick={() =>
                                      window.open(
                                        getContractImageUrl(contractDetails.contrato_arquivo),
                                        '_blank'
                                      )
                                    }
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <Document
                                      file={getContractImageUrl(contractDetails.contrato_arquivo)}
                                      onLoadError={(err) =>
                                        console.error('Erro ao carregar PDF:', err)
                                      }
                                    >
                                      <Page pageNumber={1} 
                                            width={500} 
                                            className="pdfPageWrapper"
                                            renderTextLayer={false}          
                                            renderAnnotationLayer={false}   
                                            />   {/* mostra a 1ª página */}
                                    </Document>
                                  </div>
                                </div>
                      
                                
                                <div className={styles.supplierInfo}>
                                  <h3>Fornecedor</h3>
                                  <div className={styles.supplierHeader}>
                                    <img 
                                      src={getContractImageUrl(contractDetails.fornecedor_img) || '/default-avatar.png'} 
                                      alt="Fornecedor" 
                                      className={styles.supplierAvatar}
                                    />
                                    <div>
                                      <h4 className={styles.supplierName}>{contractDetails.fornecedor_email}</h4>
                                    </div>
                                  </div>
                                  
                                  <div className={styles.supplierDetails}>
                                    <div className={styles.detailItem}>
                                      <span className={styles.detailLabel}>CNPJ</span>
                                      <p className={styles.detailValue}>
                                        {contractDetails.fornecedor_cnpj || 'Não informado'}
                                      </p>
                                    </div>
                                    
                                    <div className={styles.detailItem}>
                                      <span className={styles.detailLabel}>Telefone</span>
                                      <p className={styles.detailValue}>
                                        {contractDetails.fornecedor_telefone || 'Não informado'}
                                      </p>
                                    </div>
                                    
                                    <div className={styles.detailItem}>
                                      <span className={styles.detailLabel}>Descrição</span>
                                      <p className={styles.detailValue}>
                                        {contractDetails.fornecedor_descricao || 'Nenhuma descrição fornecida'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                  ) : (
                    <div className={styles.errorModal}>
                      <i className="fas fa-exclamation-triangle"></i>
                      <p>Não foi possível carregar os detalhes do contrato</p>
                      <button onClick={closeContractDetailsModal} className={styles.retryButton}>
                        Fechar
                      </button>
                    </div>
                  )}
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