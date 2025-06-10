import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import styles from './ChatListPage.module.css';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const ChatListPage = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          'http://localhost:8800/api/chats',
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setChats(response.data);
      } catch (err) {
        setError('Erro ao carregar chats');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [user]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className={styles.chatListContainer}>
      <h1>Conversas</h1>
      
      {chats.length === 0 ? (
        <div className={styles.emptyState}>
          <i className="fas fa-comments"></i>
          <h3>Nenhuma conversa encontrada</h3>
          <p>Você ainda não iniciou nenhuma conversa.</p>
        </div>
      ) : (
        <div className={styles.chatList}>
          {chats.map(chat => (
            <Link 
              to={`/chats/${chat.chat_id}`} 
              key={chat.chat_id}
              className={styles.chatItem}
            >
              <div className={styles.chatHeader}>
                <h3>
                  {user.id === chat.fornecedor_id ? 
                    (chat.cliente_email || 'Cliente') : 
                    (chat.fornecedor_email || 'Fornecedor')
                  }
                </h3>
                <span className={styles.contractTitle}>{chat.contrato_titulo}</span>
              </div>
              
              <div className={styles.lastMessage}>
                <p>{chat.ultima_mensagem || 'Nenhuma mensagem ainda'}</p>
                {chat.data_ultima_mensagem && (
                  <span className={styles.messageTime}>
                    {formatDate(chat.data_ultima_mensagem)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatListPage;