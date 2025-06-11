// backend/routes/ChatRoutes.js
import express from 'express';
import {
  iniciarChat,
  enviarMensagemHttp, // Importa a nova função para a rota HTTP
  listarChats,
  listarMensagens
} from '../controllers/ChatController.js';
import { verifyToken } from '../controllers/authController.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', iniciarChat);
router.post('/:chatId/mensagens', enviarMensagemHttp); // Usa a nova função para a rota HTTP
router.get('/', listarChats);
router.get('/:chatId/mensagens', listarMensagens);

export default router;