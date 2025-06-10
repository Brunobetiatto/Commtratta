import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './ChatPage.module.css';

const ChatPage = () => {
  const { chatId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:8800/api/chats/${chatId}/mensagens`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setMessages(response.data);
      } catch (err) {
        setError('Erro ao carregar mensagens');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      // Enviar mensagem
      await axios.post(
        `http://localhost:8800/api/chats/${chatId}/mensagens`,
        { conteudo: newMessage },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Atualizar a lista de mensagens
      const response = await axios.get(
        `http://localhost:8800/api/chats/${chatId}/mensagens`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setMessages(response.data);
      setNewMessage('');
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      alert('Erro ao enviar mensagem');
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messagesContainer}>
        {messages.map((message) => (
          <div 
            key={message.id}
            className={`${styles.message} ${
              message.remetente_id === user.id ? styles.sent : styles.received
            }`}
          >
            <div className={styles.messageHeader}>
              <span className={styles.sender}>
                {message.remetente_id === user.id ? 'Você' : message.remetente_email}
              </span>
              <span className={styles.time}>
                {new Date(message.data_envio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className={styles.content}>{message.conteudo}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className={styles.messageForm}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className={styles.messageInput}
        />
        <button 
          type="submit"
          className={styles.sendButton}
          disabled={!newMessage.trim()}
        >
          Enviar
        </button>
      </form>
    </div>
  );
};

export default ChatPage;