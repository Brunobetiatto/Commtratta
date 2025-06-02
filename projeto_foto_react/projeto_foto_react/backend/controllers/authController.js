import db from '../db.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Login: checa email/senha, gera token e devolve user + token.
export const login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    // Consulta no banco para buscar dados do usuário
    const [rows] = await db.query(
      `
      SELECT u.*, 
        IF(pf.id IS NOT NULL, 'PF', 'PJ') AS tipo_usuario
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

    // Atenção: em produção, use hash (bcrypt) em vez de comparar texto puro
    if (senha !== user.senha) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Cria payload do JWT
    const payload = {
      id: user.id,
      email: user.email,
      tipo: user.tipo_usuario,
    };

    // Gera token com validade de 1 dia
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // Remove o campo `senha` do objeto que vamos retornar
    const { senha: _, ...userData } = user;

    // Envia token + dados do usuário (sem senha)
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
    // Decodifica e verifica o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // deixar disponível em req.user
    next();
  } catch (error) {
    console.error('Token inválido ou expirado:', error);
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

// Handler para a rota GET /auth/validate
export const validateToken = (req, res) => {
  // Se chegou aqui, o verifyToken já rodou e garantiu que o token é válido
  // O decoded JWT está disponível em req.user
  return res.json({
    valid: true,
    user: req.user, // id, email, tipo
  });
};
