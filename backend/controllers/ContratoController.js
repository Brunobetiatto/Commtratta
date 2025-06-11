// backend/controllers/ContratoController.js
import db from '../db.js';

// Obter contratos abertos
export const getContratosAbertos = async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar interesses do usuário
    const [interesses] = await db.query(
      'SELECT categoria_id FROM usuario_interesses WHERE usuario_id = ?',
      [userId]
    );
    
    const interessesIds = interesses.map(i => i.categoria_id);

    // Buscar contratos abertos com contagem de interesses em comum
    const [contracts] = await db.query(`
      SELECT 
        c.id, 
        c.titulo, 
        c.descricao, 
        c.data_criacao, 
        c.data_validade, 
        c.status,
        c.contrato_img,
        u.email AS fornecedor_email,
        pj.cnpj AS fornecedor_cnpj,
        COUNT(cc.id_categoria) AS interesses_comum
      FROM contratos c
      JOIN pessoa_juridica pj ON c.id_fornecedor = pj.id
      JOIN usuarios u ON pj.id = u.id
      LEFT JOIN contrato_categorias cc 
        ON c.id = cc.id_contrato 
        AND cc.id_categoria IN (?) 
      WHERE c.status = 'ABERTO'
      GROUP BY c.id
      ORDER BY interesses_comum DESC, c.data_criacao DESC
    `, [interessesIds.length ? interessesIds : null]);

    res.json(contracts);
  } catch (error) {
    console.error('Erro ao buscar contratos abertos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const cadastrarContrato = async (req, res) => {
  try {
    // Verificar se o usuário é PJ
    if (req.user.tipo !== 'PJ') {
      return res.status(403).json({ 
        error: 'Apenas fornecedores podem cadastrar contratos' 
      });
    }

    const { titulo, descricao, dataValidade, categorias } = req.body;
    const imagem = req.files && req.files.imagem ? `/uploads/${req.files.imagem[0].filename}` : null;
    const arquivo = req.files && req.files.arquivo ? `/uploads/${req.files.arquivo[0].filename}` : null;
    // Iniciar transação
    await db.beginTransaction();

    // Inserir contrato
    const [result] = await db.query(
      `INSERT INTO contratos 
        (id_fornecedor, titulo, descricao, contrato_arquivo, contrato_img, data_validade, status) 
       VALUES (?, ?, ?, ?, ?, ?, "ABERTO")`,
      [req.user.id, titulo, descricao, arquivo, imagem, dataValidade]
    );
    
    const contratoId = result.insertId;
    const categoriasArray = JSON.parse(categorias);

    // Inserir categorias associadas
    if (categoriasArray && categoriasArray.length > 0) {
      for (const categoriaId of categoriasArray) {
        await db.query(
          `INSERT INTO contrato_categorias (id_contrato, id_categoria) 
           VALUES (?, ?)`,
          [contratoId, categoriaId]
        );
      }
    }

    // Commit da transação
    await db.commit();
    
    res.status(201).json({ 
      message: 'Contrato cadastrado com sucesso!',
      contratoId
    });
  } catch (error) {
    // Rollback em caso de erro
    await db.rollback();
    
    console.error('Erro ao cadastrar contrato:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// Obter todos os contratos
export const getContratos = async (req, res) => {
  try {
    const [contratos] = await db.query(`
      SELECT c.*, u.email AS fornecedor_email
      FROM contratos c
      JOIN usuarios u ON c.id_fornecedor = u.id
    `);
    res.status(200).json(contratos);
  } catch (error) {
    console.error('Erro ao buscar contratos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter contrato por ID
export const getContratoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Consulta principal corrigida
    const [contratos] = await db.query(
      `SELECT 
        c.*, 
        u.email AS fornecedor_email,
        u.telefone AS fornecedor_telefone,
        u.img AS fornecedor_img,
        pj.cnpj AS fornecedor_cnpj,
        pj.descricao AS fornecedor_descricao
      FROM contratos c
      JOIN pessoa_juridica pj ON c.id_fornecedor = pj.id  
      JOIN usuarios u ON pj.id = u.id  
      WHERE c.id = ?`,
      [id]
    );
    
    if (contratos.length === 0) {
      return res.status(404).json({ error: 'Contrato não encontrado' });
    }
    
    const contrato = contratos[0];
    
    // Obter categorias do contrato
    const [categorias] = await db.query(`
      SELECT cat.id, cat.nome 
      FROM contrato_categorias cc
      JOIN categorias cat ON cc.id_categoria = cat.id
      WHERE cc.id_contrato = ?
    `, [id]);
    
    contrato.categorias = categorias;
    
    res.status(200).json(contrato);
  } catch (error) {
    console.error('Erro ao buscar contrato:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const assinarContrato = async (req, res) => {
  const contractId = req.params.id;
  const userId = req.user.id; // ID do usuário logado

  try {
    // Verificar se o contrato existe e está aberto
    const [contract] = await db.query(
      `SELECT 
        c.id,
        c.id_fornecedor 
      FROM contratos c 
      WHERE c.id = ? AND c.status = "ABERTO"`,
      [contractId]
    );

    if (contract.length === 0) {
      return res.status(404).json({ message: 'Contrato não encontrado ou não está aberto' });
    }

    const contrato = contract[0];

    // Verificar se o usuário é o fornecedor do contrato
    if (contrato.id_fornecedor === userId) {
      return res.status(400).json({ 
        message: 'Você não pode assinar seu próprio contrato' 
      });
    }

    // Verificar se o usuário já assinou este contrato
    const [existing] = await db.query(
      'SELECT * FROM contrato_usuarios WHERE usuario_id = ? AND contrato_id = ?',
      [userId, contractId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Você já assinou este contrato' });
    }

    // Registrar a assinatura
    await db.query(
      'INSERT INTO contrato_usuarios (usuario_id, contrato_id) VALUES (?, ?)',
      [userId, contractId]
    );

    res.json({ message: 'Contrato assinado com sucesso' });
  } catch (error) {
    console.error('Erro ao assinar contrato:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
// Obter contratos do fornecedor logado
export const getContratosByFornecedor = async (req, res) => {
  try {
    // Obter ID do usuário logado (da tabela usuarios)
    const userId = req.user.id;

    // Primeiro, obter o ID da pessoa jurídica associada ao usuário
    const [pjRows] = await db.query(
      'SELECT id FROM pessoa_juridica WHERE id = ?',
      [userId]
    );

    if (pjRows.length === 0) {
      return res.status(403).json({ error: 'Usuário não é uma pessoa jurídica' });
    }

    const pjId = pjRows[0].id;

    // Agora buscar os contratos usando o ID da PJ
    const [contratos] = await db.query(
      `SELECT 
        c.id, 
        c.titulo, 
        c.descricao, 
        c.data_criacao, 
        c.data_validade, 
        c.status,
        COUNT(cu.id) AS assinaturas
      FROM contratos c
      LEFT JOIN contrato_usuarios cu ON c.id = cu.contrato_id
      WHERE c.id_fornecedor = ?
      GROUP BY c.id`,
      [pjId]
    );

    res.status(200).json(contratos);
  } catch (error) {
    console.error('Erro ao buscar contratos do fornecedor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter assinantes de um contrato
export const getAssinantesContrato = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar usuários que assinaram o contrato
    const [usuarios] = await db.query(
      `SELECT 
        u.id,
        u.email,
        cu.data_insercao
      FROM contrato_usuarios cu
      JOIN usuarios u ON cu.usuario_id = u.id
      WHERE cu.contrato_id = ?`,
      [id]
    );

    res.status(200).json({
      usuariosAssinantes: usuarios
    });
  } catch (error) {
    console.error('Erro ao buscar assinantes do contrato:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const getContratosAssinados = async (req, res) => {
  try {
    const userId = req.user.id;

    const [contratos] = await db.query(
      `SELECT 
        c.id,
        c.titulo,
        c.descricao,
        c.data_criacao,
        c.data_validade,
        c.status,
        c.contrato_img,
        u.email AS fornecedor_email,
        pj.cnpj AS fornecedor_cnpj,
        cu.data_insercao AS data_assinatura
      FROM contratos c
      JOIN contrato_usuarios cu ON c.id = cu.contrato_id
      JOIN pessoa_juridica pj ON c.id_fornecedor = pj.id
      JOIN usuarios u ON pj.id = u.id
      WHERE cu.usuario_id = ?`,
      [userId]
    );

    res.status(200).json(contratos);
  } catch (error) {
    console.error('Erro ao buscar contratos assinados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Excluir contrato
export const deleteContrato = async (req, res) => {
  try {
    const { id } = req.params;
    const fornecedorId = req.user.id;

    // Verificar se o contrato pertence ao fornecedor
    const [contrato] = await db.query(
      'SELECT * FROM contratos WHERE id = ? AND id_fornecedor = ?',
      [id, fornecedorId]
    );

    if (contrato.length === 0) {
      return res.status(404).json({ error: 'Contrato não encontrado ou você não tem permissão' });
    }

    // Excluir o contrato (o cascade excluirá os relacionados)
    await db.query('DELETE FROM contratos WHERE id = ?', [id]);

    res.status(200).json({ message: 'Contrato excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir contrato:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const fecharContrato = async (req, res) => {
  const contractId = req.params.id;
  const { clienteId } = req.body;
  const fornecedorId = req.user.id;

  try {
    // Verificar se o contrato pertence ao fornecedor
    const [contrato] = await db.query(
      'SELECT * FROM contratos WHERE id = ? AND id_fornecedor = ?',
      [contractId, fornecedorId]
    );

    if (contrato.length === 0) {
      return res.status(404).json({ message: 'Contrato não encontrado ou você não é o fornecedor' });
    }

    // Verificar se o cliente assinou o contrato
    const [assinatura] = await db.query(
      'SELECT * FROM contrato_usuarios WHERE contrato_id = ? AND usuario_id = ?',
      [contractId, clienteId]
    );

    if (assinatura.length === 0) {
      return res.status(400).json({ message: 'Este cliente não assinou o contrato' });
    }

    // Atualizar status do contrato
    await db.query(
      'UPDATE contratos SET status = "ASSINADO" WHERE id = ?',
      [contractId]
    );

    // Registrar na tabela contratos_assinados
    await db.query(
      'INSERT INTO contratos_assinados (id_contrato, id_cliente) VALUES (?, ?)',
      [contractId, clienteId]
    );

    res.json({ message: 'Contrato fechado com sucesso' });
  } catch (error) {
    console.error('Erro ao fechar contrato:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const getContratosFechados = async (req, res) => {
  try {
    const fornecedorId = req.user.id;

    const [contratos] = await db.query(
      `SELECT 
        c.id,
        c.titulo,
        c.descricao,
        c.data_criacao,
        c.data_validade,
        c.status,
        c.contrato_img,
        u.email AS cliente_email,
        ca.data_assinatura
      FROM contratos c
      JOIN contratos_assinados ca ON c.id = ca.id_contrato
      JOIN usuarios u ON ca.id_cliente = u.id
      WHERE c.id_fornecedor = ? AND c.status = 'ASSINADO'`,
      [fornecedorId]
    );

    res.status(200).json(contratos);
  } catch (error) {
    console.error('Erro ao buscar contratos fechados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};


// Filtrar contratos por categoria e/ou texto
export const filtrarContratos = async (req, res) => {
  const { categoriaId, search } = req.query;
  try {
    let sql = `
      SELECT DISTINCT c.*, u.email AS fornecedor_email, cc.id_categoria AS categoria_id
      FROM contratos c
      JOIN usuarios u        ON c.id_fornecedor = u.id
      LEFT JOIN contrato_categorias cc ON c.id = cc.id_contrato
      WHERE 1 = 1
    `;
    const params = [];

    if (categoriaId) {
      sql += ' AND cc.id_categoria = ?';
      params.push(categoriaId);
    }
    if (search) {
      sql += ' AND (c.titulo LIKE ? OR c.descricao LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY c.data_criacao DESC';

    const [contratos] = await db.query(sql, params);
    res.status(200).json(contratos);
  } catch (err) {
    console.error('Erro ao filtrar contratos:', err);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
