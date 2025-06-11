import db from '../db.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Login: checa email/senha, gera token e devolve user + token.
export const login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    const [rows] = await db.query(
      `
      SELECT u.*, 
        IF(pf.id IS NOT NULL, 'PF', 'PJ') AS tipo_usuario,
        COALESCE(pf.id, pj.id) AS pessoa_id
      FROM usuarios u
      LEFT JOIN pessoa_fisica pf ON u.id = pf.id
      LEFT JOIN pessoa_juridica pj ON u.id = pj.id
      WHERE u.email = ?
    `,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = rows[0];

    if (senha !== user.senha) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Usar pessoa_id em vez de user.id para PJ
    const payload = {
      id: user.id, 
      email: user.email,
      tipo: user.tipo_usuario,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    const { senha: _, ...userData } = user;

    return res.json({
      token,
      user: {
        ...userData,
        tipo_usuario: user.tipo_usuario,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Middleware para verificar se o token é válido
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Adicionar o ID original do usuário
    req.user = {
      ...decoded,
      userId: decoded.id, 
    };
    
    next();
  } catch (error) {
    console.error('Token inválido ou expirado:', error);
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

// Handler para a rota GET /auth/validate
export const validateToken = (req, res) => {
  return res.json({
    valid: true,
    user: req.user,
  });
};
