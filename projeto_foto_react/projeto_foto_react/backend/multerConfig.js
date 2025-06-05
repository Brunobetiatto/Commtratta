// backend/multerConfig.js
import multer from 'multer';
import path   from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename:    (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname}`)
});

// aceita imagem (jpeg/png/gif/…) e PDF
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'imagem'  && file.mimetype.startsWith('image/'))       return cb(null, true);
  if (file.fieldname === 'arquivo' && file.mimetype === 'application/pdf')      return cb(null, true);

  // qualquer outro campo → erro
  cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname), false);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

export default multer({ storage });