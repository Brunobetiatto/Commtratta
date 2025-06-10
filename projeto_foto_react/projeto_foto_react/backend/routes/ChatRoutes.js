import express from 'express';
import { 
  iniciarChat, 
  enviarMensagem, 
  listarChats, 
  listarMensagens 
} from '../controllers/ChatController.js';
import { verifyToken } from '../controllers/authController.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', iniciarChat);
router.post('/:chatId/mensagens', enviarMensagem);
router.get('/', listarChats);
router.get('/:chatId/mensagens', listarMensagens);

export default router;