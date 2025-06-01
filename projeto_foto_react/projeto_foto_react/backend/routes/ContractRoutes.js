import express from 'express';
import multer from 'multer';
import { 
  getContratosAbertos,
  assinarContrato,
  cadastrarContrato,
  getContratos,
  getContratoById
} from '../controllers/ContratoController.js';
import { verifyToken } from '../controllers/authController.js';
import upload from '../multerConfig.js';

const router = express.Router();

const contratoUpload = multer({
  storage: upload.storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Rota pública
router.get('/open', getContratosAbertos);

// Rotas protegidas
router.use(verifyToken);

router.post('/', contratoUpload.single('imagem'), cadastrarContrato);
router.get('/', getContratos);
router.get('/:id', getContratoById);
router.post('/:id/sign', assinarContrato);

export default router;