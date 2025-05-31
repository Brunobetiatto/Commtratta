// backend/routes/UserRoutes.js
import express from "express";
import upload from "../multerConfig.js";
import { addUser, getUsers } from "../controllers/UserController.js";

const router = express.Router();

router.post("/", upload.single("imagem"), addUser);
router.get("/", getUsers);

export default router;