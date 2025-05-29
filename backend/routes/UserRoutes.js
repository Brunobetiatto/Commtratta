import express from "express";
import upload from "../multerConfig.js"; // Aqui você importa já configurado
import { addUser, getUsers } from "../controllers/UserController.js";

const router = express.Router();

router.post("/add", upload.single("imagem"), addUser);
router.get("/usuarios", getUsers);

export default router;
