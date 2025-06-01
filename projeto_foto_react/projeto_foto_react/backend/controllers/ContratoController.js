// backend/controllers/ContratoController.js
import db from '../db.js';

// Obter contratos abertos
export const getContratosAbertos = async (req, res) => {
  try {
    const [contracts] = await db.query(`
      SELECT 
        c.id, 
        c.titulo, 
        c.descricao, 
        c.data_criacao, 
        c.data_validade, 
        c.status,
        u.email AS fornecedor_email,
        pj.cnpj AS fornecedor_cnpj
      FROM contratos c
      JOIN pessoa_juridica pj ON c.id_fornecedor = pj.id
      JOIN usuarios u ON pj.id = u.id
      WHERE c.status = 'ABERTO'
    `);
    res.json(contracts);
  } catch (error) {
    console.error('Erro ao buscar contratos abertos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Assinar contrato
export const assinarContrato = async (req, res) => {
  const contractId = req.params.id;
  const { userId } = req.body;

  try {
    // Verificar se o contrato existe e está aberto
    const [contract] = await db.query(
      'SELECT * FROM contratos WHERE id = ? AND status = "ABERTO"',
      [contractId]
    );

    if (contract.length === 0) {
      return res.status(404).json({ message: 'Contrato não encontrado ou não está aberto' });
    }

    // Atualizar status do contrato
    await db.query(
      'UPDATE contratos SET status = "ASSINADO" WHERE id = ?',
      [contractId]
    );

    // Registrar a assinatura
    await db.query(
      'INSERT INTO contratos_assinados (id_contrato, id_cliente) VALUES (?, ?)',
      [contractId, userId]
    );

    res.json({ message: 'Contrato assinado com sucesso' });
  } catch (error) {
    console.error('Erro ao assinar contrato:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Cadastrar novo contrato
export const cadastrarContrato = async (req, res) => {
  try {
    // Verificar se o usuário é PJ
    if (req.user.tipo !== 'PJ') {
      return res.status(403).json({ 
        error: 'Apenas fornecedores podem cadastrar contratos' 
      });
    }

    const { titulo, descricao, dataValidade, categorias } = req.body;
    const imagem = req.file ? `/uploads/${req.file.filename}` : null;
    
    // Iniciar transação
    await db.beginTransaction();

    // Inserir contrato
    const [result] = await db.query(
      `INSERT INTO contratos 
        (id_fornecedor, titulo, descricao, contrato_img, data_validade, status) 
       VALUES (?, ?, ?, ?, ?, "ABERTO")`,
      [req.user.id, titulo, descricao, imagem, dataValidade]
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
    const [contratos] = await db.query(`
      SELECT c.*, u.email AS fornecedor_email
      FROM contratos c
      JOIN usuarios u ON c.id_fornecedor = u.id
      WHERE c.id = ?
    `, [id]);
    
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