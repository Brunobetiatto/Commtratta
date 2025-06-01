import db from '../db.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    const [rows] = await db.query(`
      SELECT u.*, 
        IF(pf.id IS NOT NULL, 'PF', 'PJ') AS tipo_usuario
      FROM usuarios u
      LEFT JOIN pessoa_fisica pf ON u.id = pf.id
      LEFT JOIN pessoa_juridica pj ON u.id = pj.id
      WHERE u.email = ?
    `, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = rows[0];
    
    if (senha !== user.senha) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        tipo: user.tipo_usuario
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const { senha: _, ...userData } = user;

    res.json({ 
      token, 
      user: {
        ...userData,
        tipo_usuario: user.tipo_usuario
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token inválido:', error);
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};