// backend/controllers/UserController.js
import db from "../db.js";

export const addUser = async (req, res) => {
  try {
    // Inicia a transação diretamente na conexão existente
    await db.beginTransaction();

    const { email, telefone, senha, interesses, tipo, cpf, cnpj, descricao } = req.body;
    const imagem = req.file ? `/uploads/${req.file.filename}` : null;

    // Verificar se o email já existe
    const [existingUser] = await db.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Inserir novo usuário
    const [result] = await db.query(
      'INSERT INTO usuarios (email, telefone, senha, img) VALUES (?, ?, ?, ?)',
      [email, telefone, senha, imagem]
    );
    const userId = result.insertId;

    // Inserir interesses na tabela de relação usuario_interesses
    if (interesses && interesses.length > 0) {
      const interessesArray = interesses.split(',');
      for (const categoriaId of interessesArray) {
        await db.query(
          'INSERT INTO usuario_interesses (usuario_id, categoria_id) VALUES (?, ?)',
          [userId, categoriaId]
        );
      }
    }

    // Inserir na tabela específica
    if (tipo === 'fisica') {
      // Verificar se CPF já existe
      const [existingCPF] = await db.query(
        'SELECT * FROM pessoa_fisica WHERE cpf = ?',
        [cpf]
      );

      if (existingCPF.length > 0) {
        await db.rollback();
        return res.status(400).json({ message: 'CPF já cadastrado' });
      }

      await db.query(
        'INSERT INTO pessoa_fisica (id, cpf) VALUES (?, ?)',
        [userId, cpf]
      );
    } else if (tipo === 'juridica') {
      // Verificar se CNPJ já existe
      const [existingCNPJ] = await db.query(
        'SELECT * FROM pessoa_juridica WHERE cnpj = ?',
        [cnpj]
      );

      if (existingCNPJ.length > 0) {
        await db.rollback();
        return res.status(400).json({ message: 'CNPJ já cadastrado' });
      }

      await db.query(
        'INSERT INTO pessoa_juridica (id, cnpj, descricao) VALUES (?, ?, ?)',
        [userId, cnpj, descricao]
      );
    } else {
      throw new Error('Tipo de pessoa inválido');
    }

    await db.commit();
    res.status(201).json({ 
      message: 'Usuário cadastrado com sucesso',
      userId
    });

  } catch (error) {
    await db.rollback();
    console.error('Erro ao cadastrar usuário:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};


export const getUsers = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, email, telefone, interesses, img FROM usuarios');
    res.status(200).json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}; 