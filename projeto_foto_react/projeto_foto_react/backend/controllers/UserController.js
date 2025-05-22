import db from "../db.js";

export const addUser = (req, res) => {
  const nome = req.body.nome;
  const imagem = req.file ? `/uploads/${req.file.filename}` : null;

  const query = "INSERT INTO users (nome, imagem) VALUES (?, ?)";
  db.query(query, [nome, imagem], (err, result) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json({ message: "Usuário adicionado com sucesso" });
  });
};

export const getUsers = (req, res) => {
  const query = "SELECT * FROM users";
  db.query(query, (err, results) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(results);
  });
};
