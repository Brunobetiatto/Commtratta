import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';

// Mantendo os imports da Sidebar e Header, como solicitado.
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

// O CSS agora precisa conter os estilos de layout também.
import styles from './ChatListPage.module.css';

const ChatListPage = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // A lógica de verificação de autenticação e busca de dados permanece a mesma.
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchChats = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8800/api/chats', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setChats(response.data);
      } catch (err) {
        setError('Erro ao carregar conversas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [user, isAuthenticated, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  };

  // Usando a tela de loading de App.js para consistência
  if (loading && !chats.length) { // Mostra o loading de tela cheia apenas na primeira carga
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Carregando...</p>
      </div>
    );
  }

  // A estrutura do JSX agora imita a do App.js
  return (
    <div className={styles.appContainer}>
      <div className={styles.sidebarContainer}>
        <Sidebar user={user} logout={logout} />
      </div>

      <div className={styles.mainContent}>
        <Header user={user} />

        <main className={styles.appMainContent}>
          <div className={styles.contentContainer}>
            {/* O conteúdo específico da página é renderizado aqui dentro */}
            <div className={styles.chatListInnerContainer}>
              <h1>Conversas</h1>

              {error ? (
                <div className={styles.errorState}>
                  <i className="fas fa-exclamation-circle"></i>
                  <h3>{error}</h3>
                  <p>Tente recarregar a página</p>
                </div>
              ) : chats.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className="fas fa-comments"></i>
                  <h3>Nenhuma conversa encontrada</h3>
                  <p>Você ainda não iniciou nenhuma conversa.</p>
                </div>
              ) : (
                <div className={styles.chatList}>
                  {chats.map((chat) => (
                    <Link
                      to={`/chats/${chat.chat_id}`}
                      key={chat.chat_id}
                      className={styles.chatItem}
                    >
                      <div className={styles.chatHeader}>
                        <h3>
                          {user.id === chat.fornecedor_id
                            ? chat.cliente_email || 'Cliente'
                            : chat.fornecedor_email || 'Fornecedor'}
                        </h3>
                        <span className={styles.contractTitle}>
                          {chat.contrato_titulo}
                        </span>
                      </div>
                      <div className={styles.lastMessage}>
                        <p>{chat.ultima_mensagem || 'Nenhuma mensagem ainda'}</p>
                        {chat.data_ultima_mensagem && (
                          <span className={styles.messageTime}>
                            {formatDate(chat.data_ultima_mensagem)}
                          </span>
                        )}
                      </div>
                      <div className={styles.unreadIndicator}>
                        {chat.mensagens_nao_lidas > 0 && (
                          <span className={styles.unreadCount}>
                            {chat.mensagens_nao_lidas}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className={styles.appFooter}>
          <p>Commtratta © {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
};

export default ChatListPage;