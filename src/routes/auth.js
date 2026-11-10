import { Router } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { redirectIfAuthenticated } from '../middleware/auth.js';

const router = Router();

// GET /login - Formulário de login
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('auth/login', {
    title: 'Login - Pequenos Passos',
    error: null,
  });
});

// POST /login - Processar autenticação
router.post('/login', redirectIfAuthenticated, async (req, res) => {
  const { cpf, senha } = req.body;

  if (!cpf || !senha) {
    return res.render('auth/login', {
      title: 'Login - Pequenos Passos',
      error: 'CPF e senha são obrigatórios.',
    });
  }

  try {
    const result = await pool.query(
      'SELECT id, cpf, senha, nome FROM usuarios WHERE cpf = $1',
      [cpf.trim()]
    );

    if (result.rows.length === 0) {
      return res.render('auth/login', {
        title: 'Login - Pequenos Passos',
        error: 'CPF ou senha inválidos.',
      });
    }

    const usuario = result.rows[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.render('auth/login', {
        title: 'Login - Pequenos Passos',
        error: 'CPF ou senha inválidos.',
      });
    }

    // Grava usuário na sessão
    req.session.user = {
      id: usuario.id,
      cpf: usuario.cpf,
      nome: usuario.nome,
    };

    return res.redirect('/dashboard');
  } catch (err) {
    console.error('Erro no login:', err);
    return res.render('auth/login', {
      title: 'Login - Pequenos Passos',
      error: 'Erro interno. Tente novamente.',
    });
  }
});

// GET /logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao destruir sessão:', err);
    }
    res.redirect('/login');
  });
});

export default router;
