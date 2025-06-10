import express from 'express';
import multer from 'multer';
import { 
  getContratosAbertos,
  assinarContrato,
  cadastrarContrato,
  getContratos,
  getContratoById, 
  getAssinantesContrato,
  getContratosByFornecedor,
  deleteContrato, 
  getContratosAssinados,
  fecharContrato, 
  getContratosFechados
} from '../controllers/ContratoController.js';
import { verifyToken } from '../controllers/authController.js';
import upload from '../multerConfig.js';

const router = express.Router();

// const contratoUpload = multer({
//   storage: upload.storage,
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Apenas imagens são permitidas'), false);
//     }
//   },
//   limits: { fileSize: 5 * 1024 * 1024 } // 5MB
// });





// Rotas protegidas
router.use(verifyToken);

router.post(
  '/', 
  upload.fields([
    { name: 'imagem',  maxCount: 1 },
    { name: 'arquivo', maxCount: 1 }
  ]),
  cadastrarContrato
);
router.get('/open', getContratosAbertos);
router.get('/', getContratos);
router.get('/meus-contratos', getContratosByFornecedor); 
router.get('/assinados', verifyToken, getContratosAssinados);
router.post('/:id/fechar', verifyToken, fecharContrato);
router.get('/fechados', verifyToken, getContratosFechados);
router.get('/:id', getContratoById);
router.get('/:id/assinantes', getAssinantesContrato);
router.post('/:id/sign', assinarContrato);
router.delete('/:id', deleteContrato);



export default router;
