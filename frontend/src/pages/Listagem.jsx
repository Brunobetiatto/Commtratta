// src/pages/Listagem.js
import React, { useState, useEffect } from 'react';
import styles from './Listagem.module.css';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Modal from '../components/modal';
import { format } from 'date-fns';
import { Document, Page, pdfjs } from 'react-pdf';

import workerSrc from 'pdfjs-dist/build/pdf.worker.min.js?url'; 

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;


// Função utilitária para formatar datas no formato DD/MM/AAAA
const formatDate = (isoString) => {
  if (!isoString) return '';
  return format(new Date(isoString), 'dd/MM/yyyy');
};


const getContractImageUrl = (rawUrl) => {
  if (!rawUrl) return 'http://localhost:8800/uploads/default-contract.png';
  
  if (rawUrl.includes('uploads')) {
    const filename = rawUrl.split('/').pop();
    return `http://localhost:8800/uploads/${filename}`;
  }

  return rawUrl;
};

const getFornecedorImageUrl = (rawUrl) => {
  if (!rawUrl) return 'http://localhost:8800/uploads/default-avatar.png';

  if (rawUrl.includes('uploads')) {
    const filename = rawUrl.split('/').pop();
    return `http://localhost:8800/uploads/${filename}`;
  }
  return rawUrl;
}

const Listagem = ( {searchTerm} ) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContract, setSelectedContract] = useState(null);
  const [contractDetails, setContractDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [allContracts, setAllContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const { user } = useAuth();
  console.log('searchTerm:', searchTerm);

  useEffect(() => {
  const fetchOpenContracts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          'http://localhost:8800/api/contratos/open', 
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        if (response.data) {
          // Ordena por interesses em comum (já vem ordenado do backend)
          setAllContracts(response.data);
          setFilteredContracts(response.data);
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

  useEffect(() => {
    if (!searchTerm) {
      setFilteredContracts(allContracts);
      return;
    }
    
    const term = typeof searchTerm === 'object' 
        ? searchTerm.searchTerm || ''
        : searchTerm || '';
      
      const normalizedTerm = term.toLowerCase().trim();

      if (!normalizedTerm) {
        setFilteredContracts(allContracts);
        return;
      }
   
    const filtered = allContracts.filter(contract => {
      return (
        (contract.titulo && contract.titulo.toLowerCase().includes(term)) ||
        (contract.descricao && contract.descricao.toLowerCase().includes(term)) ||
        (contract.categorias && contract.categorias.some(
          cat => cat.nome.toLowerCase().includes(term)
        ))
      );
    });

    setFilteredContracts(filtered);
  }, [searchTerm, allContracts]);


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

  const handleContractClick = async (contractId) => {
    setLoadingDetails(true);
    try {
      const response = await axios.get(`http://localhost:8800/api/contratos/${contractId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setContractDetails(response.data);
      setSelectedContract(contractId);
    } catch (err) {
      console.error('Erro ao buscar detalhes do contrato:', err);
      setError('Falha ao carregar detalhes do contrato');
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setSelectedContract(null);
    setContractDetails(null);
  };

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
      <Modal isOpen={!!selectedContract} onClose={closeModal}>
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
              
              <div className={styles.signatureSection}>
                <button className={styles.signButton} onClick={handleSignContract}>
                  <i className="fas fa-signature"></i> Assinar Contrato
                </button>
              </div>
            </div>
  
            
            <div className={styles.supplierInfo}>
              <h3>Fornecedor</h3>
              <div className={styles.supplierHeader}>
                <img 
                  src={getFornecedorImageUrl(contractDetails.fornecedor_img) || '/default-avatar.png'} 
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
          </div>
        )}
      </Modal>

      <div className={styles.header}>
        <h1>Sugestões para você</h1>
      </div>

      <div className={styles.contractsList}>
        {filteredContracts.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="fas fa-file-contract"></i>
            <h3>Não há contratos abertos no momento</h3>
            <p>Quando novos contratos forem cadastrados, eles aparecerão aqui</p>
          </div>
        ) : (
          filteredContracts.map((contract) => (
            <div
              key={contract.id}
              className={styles.contractCard}
              style={{
                backgroundImage: `url(${getContractImageUrl(contract.contrato_img)})`,
              }}
              onClick={() => handleContractClick(contract.id)}
            >
              <div className={styles.overlay}></div>

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

              <h3 className={styles.cardTitle}>{contract.titulo}</h3>

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