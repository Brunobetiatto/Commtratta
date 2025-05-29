import db from "../db.js";

export const addUser = (req, res) => {
  const {email, telefone, senha_hash, interesses} = req.body
  const imagem = req.file ? `/uploads/${req.file.filename}` : null;
  const query = "INSERT INTO usuarios (imagem, email, telefone, senha_hash, interesses) VALUES (?, ?, ?, ?, ?)";
  db.query(query, [imagem, email, telefone, senha_hash, interesses], (err, result) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json({ message: "Usuário adicionado com sucesso" });
  });
};

export const addCPF = (req, res) => {
  const {email, telefone, senha_hash, interesses, cpf} = req.body;
  addUser({email , telefone, senha_hash, interesses}, res);
  const query = `INSERT INTO pessoa_fisica (id, cpf) VALUES ((SELECT id FROM usuarios WHERE email = ?), ?)`;
  db.query(query, [email, cpf], (err, results) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json({ message : `CPF adicionado com sucesso:`, affectedRows: results.affectedRows});
  });
};

export const addCNPJ = (req, res) =>{
  const {email, telefone, senha_hash, interesses, cnpj} = req.body;
  addUser({email , telefone, senha_hash, interesses}, res);
  const query = `INSERT INTO pessoa_juridica (id, cnpj) VALUES ((SELECT id FROM usuarios WHERE email = ?), ?)`;
  db.query(query, [email, cnpj], (err, results) =>{
    if (err) return res.status(500).json(err);
    return res.status(200).json({message: `CNPJ adicionado com sucesso:`, affectedRows: results.affectedRows});
  }); 
};

export const getUsers = (req, res) => {
  const query = "SELECT * FROM users";
  db.query(query, (err, results) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(results);
  });
};
