import { Router } from 'express';
import pool from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Todas as rotas protegidas
router.use(requireAuth);

// GET /grupos - Listagem
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, descricao, created_at FROM grupos ORDER BY nome ASC'
    );
    res.render('grupos/index', {
      title: 'Grupos de Atendimento',
      grupos: result.rows,
      user: req.session.user,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) {
    console.error('Erro ao listar grupos:', err);
    res.status(500).send('Erro ao carregar grupos.');
  }
});

// GET /grupos/novo - Formulário de cadastro
router.get('/novo', (req, res) => {
  res.render('grupos/form', {
    title: 'Novo Grupo de Atendimento',
    grupo: null,
    user: req.session.user,
    error: null,
  });
});

// POST /grupos - Criar grupo
router.post('/', async (req, res) => {
  const { nome, descricao } = req.body;

  if (!nome || nome.trim() === '') {
    return res.render('grupos/form', {
      title: 'Novo Grupo de Atendimento',
      grupo: { nome, descricao },
      user: req.session.user,
      error: 'O nome do grupo é obrigatório.',
    });
  }

  try {
    await pool.query(
      'INSERT INTO grupos (nome, descricao) VALUES ($1, $2)',
      [nome.trim(), descricao ? descricao.trim() : null]
    );
    res.redirect('/grupos?success=Grupo cadastrado com sucesso!');
  } catch (err) {
    console.error('Erro ao cadastrar grupo:', err);
    res.render('grupos/form', {
      title: 'Novo Grupo de Atendimento',
      grupo: { nome, descricao },
      user: req.session.user,
      error: 'Erro ao cadastrar grupo. Tente novamente.',
    });
  }
});

// GET /grupos/:id/editar - Formulário de edição
router.get('/:id/editar', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, nome, descricao FROM grupos WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.redirect('/grupos?error=Grupo não encontrado.');
    }
    res.render('grupos/edit', {
      title: 'Editar Grupo de Atendimento',
      grupo: result.rows[0],
      user: req.session.user,
      error: null,
    });
  } catch (err) {
    console.error('Erro ao carregar grupo:', err);
    res.redirect('/grupos?error=Erro ao carregar grupo.');
  }
});

// POST /grupos/:id - Atualizar grupo
router.post('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, descricao } = req.body;

  if (!nome || nome.trim() === '') {
    return res.render('grupos/edit', {
      title: 'Editar Grupo de Atendimento',
      grupo: { id, nome, descricao },
      user: req.session.user,
      error: 'O nome do grupo é obrigatório.',
    });
  }

  try {
    const result = await pool.query(
      'UPDATE grupos SET nome = $1, descricao = $2 WHERE id = $3 RETURNING id',
      [nome.trim(), descricao ? descricao.trim() : null, id]
    );
    if (result.rows.length === 0) {
      return res.redirect('/grupos?error=Grupo não encontrado.');
    }
    res.redirect('/grupos?success=Grupo atualizado com sucesso!');
  } catch (err) {
    console.error('Erro ao atualizar grupo:', err);
    res.render('grupos/edit', {
      title: 'Editar Grupo de Atendimento',
      grupo: { id, nome, descricao },
      user: req.session.user,
      error: 'Erro ao atualizar grupo. Tente novamente.',
    });
  }
});

// POST /grupos/:id/excluir - Excluir grupo
router.post('/:id/excluir', async (req, res) => {
  const { id } = req.params;
  try {
    // Verifica se há clientes vinculados (ON DELETE RESTRICT já protege, mas tratamos a mensagem)
    const check = await pool.query(
      'SELECT COUNT(*) AS total FROM clientes WHERE grupo_id = $1',
      [id]
    );
    if (parseInt(check.rows[0].total, 10) > 0) {
      return res.redirect(
        '/grupos?error=Não é possível excluir o grupo. Existem clientes vinculados.'
      );
    }

    const result = await pool.query(
      'DELETE FROM grupos WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) {
      return res.redirect('/grupos?error=Grupo não encontrado.');
    }
    res.redirect('/grupos?success=Grupo excluído com sucesso!');
  } catch (err) {
    console.error('Erro ao excluir grupo:', err);
    if (err.code === '23503') {
      // Foreign key violation
      return res.redirect(
        '/grupos?error=Não é possível excluir o grupo. Existem clientes vinculados.'
      );
    }
    res.redirect('/grupos?error=Erro ao excluir grupo.');
  }
});

export default router;
