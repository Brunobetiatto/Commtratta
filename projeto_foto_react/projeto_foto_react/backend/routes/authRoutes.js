import express from 'express';
import { login, verifyToken } from '../controllers/authController.js';

const router = express.Router();

// Rota de login
router.post('/login', login);

// Rota protegida de exemplo
router.get('/protected', verifyToken, (req, res) => {
  res.json({ message: 'Acesso permitido', user: req.user });
});

export default router;