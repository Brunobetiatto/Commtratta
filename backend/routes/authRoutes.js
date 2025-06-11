import express from 'express';
import { login, verifyToken, validateToken } from '../controllers/authController.js';

const router = express.Router();

// Rota de login (publica)
router.post('/login', login);

// Rota que apenas verifica o token (retorna 200 se válido, 401 se não for)
router.get('/validate', verifyToken, validateToken);

// Você pode ter outras rotas protegidas aqui, por exemplo:
/*
router.get('/protected', verifyToken, (req, res) => {
  res.json({ message: 'Acesso permitido', user: req.user });
});
*/

export default router;
