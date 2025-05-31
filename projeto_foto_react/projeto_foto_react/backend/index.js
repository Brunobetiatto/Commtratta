// backend/index.js
import express from "express";
import cors from "cors";
import path from "path";
import userRoutes from "./routes/UserRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import contractRoutes from './routes/ContractRoutes.js';
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.resolve("uploads")));
app.use("/api/usuarios", userRoutes); // Atualizado para /api/usuarios
app.use("/auth", authRoutes);
app.use("/api/contracts", contractRoutes);

// Testar conexão com o banco
import db from "./db.js";

db.connect()
  .then(() => {
    console.log("Conectado ao MySQL!");
    app.listen(8800, () => console.log("Servidor rodando na porta 8800"));
  })
  .catch(err => {
    console.error("Erro ao conectar ao MySQL:", err);
    process.exit(1);
  });