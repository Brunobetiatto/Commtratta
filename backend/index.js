// backend/index.js
import express from 'express';
import cors from 'cors';
import http from 'http'; // Importa o módulo HTTP
import { Server } from 'socket.io'; // Importa a classe Server do Socket.IO
import jwt from 'jsonwebtoken'; // Para verificar o token JWT no socket

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/UserRoutes.js';
import categoriaRoutes from './routes/CategoriaRoutes.js';
import contractRoutes from './routes/ContractRoutes.js';
import chatRoutes from './routes/ChatRoutes.js';
import { enviarMensagem } from './controllers/ChatController.js';


const app = express();
const server = http.createServer(app); // Cria um servidor HTTP a partir do Express
const PORT = process.env.PORT || 8800;

// Configuração do Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // URL do seu frontend React
    methods: ["GET", "POST"]
  }
});

// Middleware de autenticação JWT para Socket.IO
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: Token missing'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use sua secret
    socket.user = decoded; // Adiciona os dados do usuário ao objeto socket
    next(); // Permite a conexão do socket
  } catch (err) {
    console.error('Socket authentication error:', err.message);
    next(new Error('Authentication error: Invalid token'));
  }
});

// Lógica do Socket.IO
io.on('connection', (socket) => {
  console.log(`Usuário conectado via WebSocket: ${socket.id} (User ID: ${socket.user.id})`);

  // Entrar em uma sala de chat específica
  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
    console.log(`Usuário ${socket.user.id} (${socket.id}) entrou na sala: ${chatId}`);
  });

  // Sair de uma sala de chat
  socket.on('leaveChat', (chatId) => {
    socket.leave(chatId);
    console.log(`Usuário ${socket.user.id} (${socket.id}) saiu da sala: ${chatId}`);
  });

  // Receber mensagem do cliente e retransmitir
  socket.on('sendMessage', async (messageData) => {
    const { chatId, conteudo, tempId } = messageData; // Pega o tempId do cliente
    const remetente_id = socket.user.id; // Garante que o remetente é o usuário autenticado no socket

    try {
      // Chama a função enviarMensagem do ChatController para salvar no DB e obter os dados da mensagem
      const novaMensagem = await enviarMensagem(chatId, conteudo, remetente_id);

      // Adiciona o tempId de volta à mensagem para o remetente (confirmação)
      novaMensagem.tempId = tempId;

      // 2. Emitir a mensagem para todos os clientes na mesma sala (chat)
      io.to(chatId).emit('receiveMessage', novaMensagem);
      console.log(`Mensagem enviada para sala ${chatId} e salva no DB: ${novaMensagem.conteudo}`);


    } catch (error) {
      console.error('Erro ao processar mensagem via WebSocket:', error);
      // Envia uma mensagem de erro para o cliente que tentou enviar
      socket.emit('chatError', error.message || 'Erro ao enviar mensagem.');
    }
  });

  // Desconexão
  socket.on('disconnect', () => {
    console.log(`Usuário desconectado via WebSocket: ${socket.id}`);
  });
});

// Middlewares Express (mantidos)
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Rotas Express (mantidas)
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/contratos', contractRoutes);
app.use('/api/chats', chatRoutes); 

server.listen(PORT, () => {
  console.log(`Servidor HTTP e WebSocket rodando na porta ${PORT}`);
});