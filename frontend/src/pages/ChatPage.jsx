import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './ChatPage.module.css'; 
import layoutStyles from './ChatListPage.module.css'; 
import Sidebar from '../components/Sidebar'; 
import Header from '../components/Header'; 
import { io } from 'socket.io-client'; 


const SOCKET_SERVER_URL = 'http://localhost:8800'; // Ajuste para a URL do seu backend
let socket; // Declara a variável do socket fora do componente para persistência

const ChatPage = () => {
  const { chatId } = useParams();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Função para adicionar mensagens de forma otimista
  const addMessageOptimistically = useCallback((message) => {
    setMessages((prevMessages) => {
      // Evita duplicatas se a mensagem for recebida via socket e já estiver no estado
      if (message.id && prevMessages.some(msg => msg.id === message.id)) {
        return prevMessages;
      }
      return [...prevMessages, message];
    });
  }, []);

  // Efeito para conectar/desconectar o socket e manipular eventos de mensagens
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Certifique-se de que o usuário está carregado antes de tentar conectar o socket
    if (user && user.id) {
      socket = io(SOCKET_SERVER_URL, {
        query: { userId: user.id, chatId: chatId }, // Envia dados do usuário e chat
        auth: {
          token: localStorage.getItem('token') // Envia o token para autenticação no socket
        }
      });

      socket.on('connect', () => {
        console.log('Conectado ao servidor Socket.IO');
        socket.emit('joinChat', chatId); // Ao conectar, entrar em uma sala específica do chat
      });

      socket.on('disconnect', () => {
        console.log('Desconectado do servidor Socket.IO');
      });

      socket.on('receiveMessage', (message) => {
        console.log('Mensagem recebida em tempo real:', message);

        // Se a mensagem foi enviada pelo próprio usuário
        if (message.remetente_id === user.id) {
          // Substitui a mensagem otimista (mesmo conteúdo e horário aproximado)
          setMessages((prevMessages) => {
            const exists = prevMessages.some((msg) =>
              msg.remetente_id === user.id &&
              msg.conteudo === message.conteudo &&
              Math.abs(new Date(msg.data_envio) - new Date(message.data_envio)) < 2000 // tolerância de 2s
            );

            if (exists) return prevMessages; // já temos a versão otimista, não adiciona

            return [...prevMessages, message];
          });
        } else {
          // Mensagem de outro usuário, adiciona normalmente
          addMessageOptimistically(message);
        }
      });

      socket.on('messageSentConfirmation', (message) => {
        console.log('Confirmação de mensagem enviada:', message);
        // Atualiza a mensagem otimista com o ID real do banco de dados
        setMessages((prevMessages) =>
          prevMessages.map((msg) => (msg.tempId === message.tempId ? { ...msg, id: message.id } : msg))
        );
      });

      socket.on('chatError', (errorMessage) => {
        console.error('Erro no chat via socket:', errorMessage);
        setError(errorMessage);
      });

      // Limpeza ao desmontar o componente ou mudar de chat/usuário
      return () => {
        if (socket) {
          console.log('Saindo do chat:', chatId);
          socket.emit('leaveChat', chatId); // Informa ao servidor que está saindo da sala
          socket.disconnect(); // Desconecta o socket
        }
      };
    }
  }, [isAuthenticated, navigate, user, chatId, addMessageOptimistically]); // Dependências

  // Efeito para buscar mensagens iniciais (histórico)
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user || !user.id) return; // Espera o user carregar

      try {
        setLoading(true);
        setError(''); // Limpa erros anteriores
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
  }, [chatId, user]); // Depende de chatId e user

  // Efeito para rolar para a última mensagem
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return; // Garante que o socket está conectado e a mensagem não está vazia

    const messageContent = newMessage.trim();
    const tempId = Date.now(); // ID temporário para otimismo na UI

    const messageToSend = {
      chatId: chatId,
      conteudo: messageContent,
      remetente_id: user.id, // ID do remetente
      remetente_email: user.email, // Email do remetente para exibição na UI
      data_envio: new Date().toISOString(), // Data atual para exibição otimista
      tempId: tempId, // ID temporário para a mensagem otimista
    };

    // Adiciona a mensagem otimisticamente à UI
    addMessageOptimistically(messageToSend);
    setNewMessage(''); // Limpa o input imediatamente

    try {
      // Emite a mensagem via WebSocket para o servidor
      socket.emit('sendMessage', messageToSend);
      // O servidor Socket.IO será responsável por salvar no banco e emitir para todos na sala
    } catch (err) {
      console.error('Erro ao enviar mensagem via Socket.IO:', err);
      setError('Erro ao enviar mensagem em tempo real. Tente novamente.');
      // Opcional: Reverter a mensagem otimista se o envio falhar (pode ser complexo dependendo do seu fluxo)
      setMessages((prevMessages) => prevMessages.filter((msg) => msg.tempId !== tempId));
      setNewMessage(messageContent); // Coloca a mensagem de volta no input
    }
  };

  // Renderização
  if (loading) {
    return (
      <div className={layoutStyles.loadingScreen}>
        <div className={layoutStyles.loadingSpinner}></div>
        <p className={layoutStyles.loadingText}>Carregando mensagens...</p>
      </div>
    );
  }

  return (
    <div className={layoutStyles.appContainer}>
      <div className={layoutStyles.sidebarContainer}>
        <Sidebar user={user} logout={logout} />
      </div>

      <div className={layoutStyles.mainContent}>
        <Header user={user} />

        <main className={layoutStyles.appMainContent}>
          <div className={layoutStyles.contentContainer}>
            {/* Conteúdo específico da página de chat */}
            <div className={styles.chatPageInnerContainer}>
              {error && <div className={styles.errorMessage}>{error}</div>}

              <div className={styles.messagesContainer}>
                {messages.length === 0 && !loading ? (
                  <div className={styles.emptyChatState}>
                    <i className="fas fa-comments"></i>
                    <p>Nenhuma mensagem ainda. Quebre o gelo!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id || message.tempId} // Usa id real ou temporário para a key
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
                  ))
                )}
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
          </div>
        </main>

        <footer className={layoutStyles.appFooter}>
          <p>Commtratta © {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
};

export default ChatPage;