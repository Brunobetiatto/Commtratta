import express from "express";
import cors from "cors";
import path from "path";
import userRoutes from "./routes/UserRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.resolve("uploads")));
app.use("/api", userRoutes);

app.listen(8800, () => console.log("Servidor rodando na porta 8800"));
