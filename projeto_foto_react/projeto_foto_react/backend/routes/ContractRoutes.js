import express from 'express';
import db from '../db.js';

const router = express.Router();

// Obter contratos abertos
router.get('/open', async (req, res) => {
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
});

// Assinar contrato
router.post('/:id/sign', async (req, res) => {
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
});

export default router;