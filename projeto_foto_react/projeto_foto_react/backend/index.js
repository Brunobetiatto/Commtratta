// backend/index.js
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/UserRoutes.js';
import categoriaRoutes from './routes/CategoriaRoutes.js';
import contractRoutes from './routes/ContractRoutes.js'; 

const app = express();
const PORT = process.env.PORT || 8800;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); 

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/contratos', contractRoutes); 

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});