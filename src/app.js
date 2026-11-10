import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import gruposRoutes from './routes/grupos.js';
import clientesRoutes from './routes/clientes.js';
import { requireAuth } from './middleware/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Sessão
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'pequenos-passos-saep-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // true em produção com HTTPS
      maxAge: 1000 * 60 * 60 * 8, // 8 horas
    },
  })
);

// Disponibiliza o usuário logado em todas as views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Rotas
app.use('/', authRoutes);
app.use('/grupos', gruposRoutes);
app.use('/clientes', clientesRoutes);

// Dashboard (protegido)
app.get('/dashboard', requireAuth, (req, res) => {
  res.render('dashboard', {
    title: 'Dashboard - Pequenos Passos',
    user: req.session.user,
  });
});

// Rota raiz
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  return res.redirect('/login');
});

// 404
app.use((req, res) => {
  res.status(404).send('Página não encontrada.');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Erro interno do servidor.');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log('Login padrão: CPF 000.000.000-00 | Senha: admin123');
});
