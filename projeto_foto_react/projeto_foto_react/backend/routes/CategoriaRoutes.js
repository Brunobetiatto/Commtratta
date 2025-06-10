//backend/routes/categoriaRoutes.js
import express from "express";
import { getCategorias, getCategoriaById, getInteressesByUsuarioId } from "../controllers/CategoriaController.js";

const router = express.Router();

router.get("/", getCategorias);
router.get("/usuario/:id/interesses", getInteressesByUsuarioId);
router.get("/:id", getCategoriaById);

export default router;