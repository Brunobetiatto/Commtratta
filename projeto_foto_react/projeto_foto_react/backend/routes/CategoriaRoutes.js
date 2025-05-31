import express from "express";
import { getCategorias, getCategoriaById } from "../controllers/CategoriaController.js";

const router = express.Router();

router.get("/", getCategorias);
router.get("/:id", getCategoriaById);

export default router;