//backend/controllers/ CategoriaController.js
import db from "../db.js";

export const getCategorias = async (req, res) => {
  try {
    const [categorias] = await db.query('SELECT * FROM categorias');
    res.status(200).json(categorias);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params;
    const [categoria] = await db.query('SELECT * FROM categorias WHERE id = ?', [id]);
    
    if (categoria.length === 0) {
      return res.status(404).json({ message: 'Categoria não encontrada' });
    }
    
    res.status(200).json(categoria[0]);
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
export const getInteressesByUsuarioId = async (req, res) => {
  try {
    const { id } = req.params;

    const [interesses] = await db.query(`
      SELECT c.id, c.nome 
      FROM categorias c
      INNER JOIN usuario_interesses ui ON c.id = ui.categoria_id
      WHERE ui.usuario_id = ?
    `, [id]);

    res.status(200).json(interesses);
  } catch (error) {
    console.error('Erro ao buscar interesses do usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};



