import mysql from "mysql2";

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // sua senha
  database: "usuarios"
});

export default db;
