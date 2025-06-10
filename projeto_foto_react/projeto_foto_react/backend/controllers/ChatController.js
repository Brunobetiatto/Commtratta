import db from '../db.js';

// Iniciar um chat (apenas fornecedor)
export const iniciarChat = async (req, res) => {
  try {
    const { contrato_id, cliente_id } = req.body;
    const fornecedor_id = req.user.userId;

    // Verificar se o usuário logado é o fornecedor do contrato
    const [contrato] = await db.query(
      `SELECT id_fornecedor FROM contratos 
       WHERE id = ? AND id_fornecedor = ?`,
      [contrato_id, fornecedor_id]
    );

    if (contrato.length === 0) {
      return res.status(403).json({ 
        message: 'Apenas o fornecedor do contrato pode iniciar um chat' 
      });
    }

    // Verificar se o cliente assinou o contrato
    const [assinatura] = await db.query(
      `SELECT * FROM contrato_usuarios 
       WHERE contrato_id = ? AND usuario_id = ?`,
      [contrato_id, cliente_id]
    );

    if (assinatura.length === 0) {
      return res.status(400).json({ 
        message: 'Este cliente não assinou o contrato' 
      });
    }

    // Verificar se já existe um chat para esse contrato e cliente
    const [existingChat] = await db.query(
      `SELECT * FROM chats 
       WHERE contrato_id = ? AND cliente_id = ?`,
      [contrato_id, cliente_id]
    );

    if (existingChat.length > 0) {
      return res.status(200).json({ 
        chat_id: existingChat[0].id,
        message: 'Chat já existe'
      });
    }

    // Criar novo chat
    const [result] = await db.query(
      `INSERT INTO chats (contrato_id, fornecedor_id, cliente_id)
       VALUES (?, ?, ?)`,
      [contrato_id, fornecedor_id, cliente_id]
    );

    res.status(201).json({ 
      message: 'Chat iniciado com sucesso',
      chat_id: result.insertId 
    });
  } catch (error) {
    console.error('Erro ao iniciar chat:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Enviar uma mensagem
export const enviarMensagem = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { conteudo } = req.body;
    
    const remetente_id = req.user.userId;
    const remetente_tipo = req.user.tipo;

    console.log(
    `Verificando acesso: chatId=${chatId}, userId=${remetente_id}, userType=${remetente_tipo}`
    );


    // Verificar se o remetente é participante do chat
    const [chat] = await db.query(
      `SELECT * FROM chats 
       WHERE id = ? AND (fornecedor_id = ? OR cliente_id = ?)`,
      [chatId, remetente_id, remetente_id]
    );

    if (chat.length === 0) {
      return res.status(403).json({ 
        message: 'Você não tem permissão para enviar mensagens neste chat' 
      });
    }

    // Inserir mensagem
    await db.query(
      `INSERT INTO mensagens (chat_id, remetente_id, conteudo)
       VALUES (?, ?, ?)`,
      [chatId, remetente_id, conteudo]
    );

    res.status(201).json({ message: 'Mensagem enviada com sucesso' });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Listar chats de um usuário
export const listarChats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [chats] = await db.query(
      `SELECT 
        c.id AS chat_id,
        c.contrato_id,
        c.fornecedor_id,
        c.cliente_id,
        c.data_criacao,
        cont.titulo AS contrato_titulo,
        uf.email AS fornecedor_email,
        uc.email AS cliente_email,
        (SELECT conteudo FROM mensagens WHERE chat_id = c.id ORDER BY data_envio DESC LIMIT 1) AS ultima_mensagem,
        (SELECT data_envio FROM mensagens WHERE chat_id = c.id ORDER BY data_envio DESC LIMIT 1) AS data_ultima_mensagem
      FROM chats c
      JOIN contratos cont ON c.contrato_id = cont.id
      JOIN usuarios uf ON c.fornecedor_id = uf.id
      JOIN usuarios uc ON c.cliente_id = uc.id
      WHERE c.fornecedor_id = ? OR c.cliente_id = ?
      ORDER BY data_ultima_mensagem DESC`,
      [userId, userId]
    );

    res.status(200).json(chats);
  } catch (error) {
    console.error('Erro ao listar chats:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Listar mensagens de um chat
export const listarMensagens = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;

    // Verificar se o usuário pertence ao chat
    const [chat] = await db.query(
      `SELECT * FROM chats 
       WHERE id = ? AND (fornecedor_id = ? OR cliente_id = ?)`,
      [chatId, userId, userId]
    );

   
    // Buscar mensagens
    const [mensagens] = await db.query(
      `SELECT 
        m.id,
        m.remetente_id,
        m.conteudo,
        m.data_envio,
        m.lida,
        u.email AS remetente_email
      FROM mensagens m
      JOIN usuarios u ON m.remetente_id = u.id
      WHERE m.chat_id = ?
      ORDER BY m.data_envio ASC`,
      [chatId]
    );

    // Marcar mensagens como lidas (se for o destinatário)
    await db.query(
      `UPDATE mensagens 
       SET lida = 1 
       WHERE chat_id = ? AND remetente_id != ? AND lida = 0`,
      [chatId, userId]
    );

    res.status(200).json(mensagens);
  } catch (error) {
    console.error('Erro ao listar mensagens:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};