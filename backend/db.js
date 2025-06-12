//backend/db.js
import mysql from "mysql2/promise"; // Alterado para a versão promise

const db = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", 
  database: "commtratta" 
});

export default db;