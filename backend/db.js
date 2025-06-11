//backend/db.js
import mysql from "mysql2/promise"; // Alterado para a versão promise

const db = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Papelhigienico1!", 
  database: "commtratta" 
});

export default db;