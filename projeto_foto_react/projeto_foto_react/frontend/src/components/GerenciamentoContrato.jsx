import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import styles from './GerenciamentoContratos.module.css';
import Sidebar from '../components/Sidebar';
import { format } from 'date-fns';

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
  const getContractImageUrl = (imagePath) => {
    if (!imagePath) return 'http://localhost:8800/uploads/default-contract.jpg';
    return `http://localhost:8800${imagePath}`;
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
        <header className={styles.appHeader}>
          <div className={styles.headerLeft}>
            <img 
              src="../favicon.png" 
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
              <div className={styles.modalBackdrop} onClick={closeAllModals}>
                <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                  <div className={styles.modalHeader}>
                    <h2>Assinaturas do Contrato</h2>
                    <button className={styles.closeButton} onClick={closeAllModals}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  
                  <div className={styles.modalBody2}>
                    <h3>{selectedContract.titulo}</h3>
                    
                    {selectedContract.assinaturas > 0 ? (
                      <table className={styles.signaturesTable}>
                        <thead>
                          <tr>
                            <th>Usuário</th>
                            <th>Email</th>
                            <th>Data da Assinatura</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedContract.usuariosAssinantes && 
                          selectedContract.usuariosAssinantes.map(user => (
                            <tr key={user.id}>
                              <td>{user.nome || user.email.split('@')[0]}</td>
                              <td>{user.email}</td>
                              <td>{formatDate(user.data_insercao)}</td>
                              <td>
                                <button 
                                  className={styles.viewUserButton}
                                  onClick={() => handleViewUserInfo(user)}
                                >
                                  <i className="fas fa-user"></i> Ver perfil
                                </button>
                              </td>
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

            {/* Modal para informações do usuário */}
            {showUserInfoModal && selectedUser && (
              <div className={styles.modalBackdrop} onClick={closeAllModals}>
                <div className={styles.userModalContent} onClick={e => e.stopPropagation()}>
                  <div className={styles.modalHeader}>
                    <h2>Perfil do Usuário</h2>
                    <button className={styles.closeButton} onClick={closeAllModals}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  
                  <div className={styles.userModalBody}>
                    <div className={styles.userProfile}>
                      <img 
                        src={selectedUser.img || 'http://localhost:8800/uploads/defaut2.png'} 
                        alt="Perfil" 
                        className={styles.userAvatar}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/default-profile.png';
                        }}
                      />
                      <h3 className={styles.userName}>
                        {selectedUser.nome || selectedUser.email.split('@')[0]}
                      </h3>
                      <p className={styles.userEmail}>{selectedUser.email}</p>
                    </div>
                    
                    <div className={styles.userDetails}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Telefone</span>
                        <p className={styles.detailValue}>
                          {selectedUser.telefone || 'Não informado'}
                        </p>
                      </div>
                      
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Data de Cadastro</span>
                        <p className={styles.detailValue}>
                          {formatDate(selectedUser.criado_em)}
                        </p>
                      </div>
                      
                      {selectedUser.interesses && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Interesses</span>
                          <p className={styles.detailValue}>{selectedUser.interesses}</p>
                        </div>
                      )}
                    </div>
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
                        <button className={styles.closeButton} onClick={closeContractDetailsModal}>
                          <i className="fas fa-times"></i>
                        </button>
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
                        <h3 className={styles.termsTitle}>Termos do Contrato</h3>
                        <div className={styles.termsContent}>
                          <p>Ao assinar este contrato, você concorda com os seguintes termos:</p>
                          <p>1. O fornecedor compromete-se a prestar os serviços descritos no contrato dentro do prazo estabelecido.</p>
                          <p>2. O cliente compromete-se a efetuar o pagamento conforme as condições acordadas.</p>
                          <p>3. Qualquer alteração nos termos deste contrato deverá ser feita por escrito e assinada por ambas as partes.</p>
                          <p>4. O contrato terá validade a partir da data de assinatura até a data de validade especificada.</p>
                          <p>5. Em caso de rescisão antecipada, aplicam-se as penalidades previstas na cláusula de rescisão.</p>
                        </div>

                      </div>

                      
                      <div className={styles.supplierInfo}>
                        <h3>Fornecedor</h3>
                        <div className={styles.supplierHeader}>
                          <img 
                            src={contractDetails.fornecedor_img || 'http://localhost:8800/uploads/defaut2.png'} 
                            alt="Fornecedor" 
                            className={styles.supplierAvatar}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'http://localhost:8800/uploads/defaut2.png';
                            }}
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