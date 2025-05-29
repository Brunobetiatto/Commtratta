import db from '../db.js';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    // Buscar usuário pelo email
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
    
    // Validação simples da senha (sem hash)
    if (senha !== user.senha) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        tipo: user.tipo_usuario
      }, 
      process.env.JWT_SECRET || 'sua_chave_secreta',
      { expiresIn: '1d' }
    );

    // Remover senha da resposta
    const { senha: _, ...userData } = user;

    res.json({ token, user: userData });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Middleware de verificação de token
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'sua_chave_secreta'
    );
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token inválido:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
};