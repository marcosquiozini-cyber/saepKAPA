import { Router } from 'express';
import pool from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Todas as rotas protegidas
router.use(requireAuth);

// GET /clientes - Listagem com filtro de busca (RF05)
router.get('/', async (req, res) => {
  const busca = req.query.busca ? req.query.busca.trim() : '';

  try {
    let query;
    let params;

    if (busca) {
      // Busca parcial por nome com ILIKE (RF05)
      query = `
        SELECT c.id, c.nome_completo, c.cpf, c.email, c.telefone, c.grupo_id,
               g.nome AS grupo_nome
        FROM clientes c
        LEFT JOIN grupos g ON c.grupo_id = g.id
        WHERE c.nome_completo ILIKE $1
        ORDER BY c.nome_completo ASC
      `;
      params = [`%${busca}%`];
    } else {
      query = `
        SELECT c.id, c.nome_completo, c.cpf, c.email, c.telefone, c.grupo_id,
               g.nome AS grupo_nome
        FROM clientes c
        LEFT JOIN grupos g ON c.grupo_id = g.id
        ORDER BY c.nome_completo ASC
      `;
      params = [];
    }

    const result = await pool.query(query, params);

    res.render('clientes/index', {
      title: 'Clientes / Responsáveis',
      clientes: result.rows,
      busca,
      user: req.session.user,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) {
    console.error('Erro ao listar clientes:', err);
    res.status(500).send('Erro ao carregar clientes.');
  }
});

// GET /clientes/novo - Formulário de cadastro
router.get('/novo', async (req, res) => {
  try {
    // Carrega grupos para o <select> (RF04)
    const gruposResult = await pool.query(
      'SELECT id, nome FROM grupos ORDER BY nome ASC'
    );
    res.render('clientes/form', {
      title: 'Novo Cliente / Responsável',
      cliente: null,
      grupos: gruposResult.rows,
      user: req.session.user,
      error: null,
    });
  } catch (err) {
    console.error('Erro ao carregar formulário de cliente:', err);
    res.redirect('/clientes?error=Erro ao carregar formulário.');
  }
});

// POST /clientes - Criar cliente
router.post('/', async (req, res) => {
  const { nome_completo, cpf, email, telefone, grupo_id } = req.body;

  // Validação básica
  if (!nome_completo || !cpf || !grupo_id) {
    const gruposResult = await pool.query(
      'SELECT id, nome FROM grupos ORDER BY nome ASC'
    );
    return res.render('clientes/form', {
      title: 'Novo Cliente / Responsável',
      cliente: { nome_completo, cpf, email, telefone, grupo_id },
      grupos: gruposResult.rows,
      user: req.session.user,
      error: 'Nome completo, CPF e Grupo são obrigatórios.',
    });
  }

  try {
    await pool.query(
      `INSERT INTO clientes (nome_completo, cpf, email, telefone, grupo_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        nome_completo.trim(),
        cpf.trim(),
        email ? email.trim() : null,
        telefone ? telefone.trim() : null,
        parseInt(grupo_id, 10),
      ]
    );
    res.redirect('/clientes?success=Cliente cadastrado com sucesso!');
  } catch (err) {
    console.error('Erro ao cadastrar cliente:', err);
    const gruposResult = await pool.query(
      'SELECT id, nome FROM grupos ORDER BY nome ASC'
    );
    let mensagem = 'Erro ao cadastrar cliente. Tente novamente.';
    if (err.code === '23505') {
      mensagem = 'CPF já cadastrado no sistema.';
    }
    res.render('clientes/form', {
      title: 'Novo Cliente / Responsável',
      cliente: { nome_completo, cpf, email, telefone, grupo_id },
      grupos: gruposResult.rows,
      user: req.session.user,
      error: mensagem,
    });
  }
});

// GET /clientes/:id/editar - Formulário de edição
router.get('/:id/editar', async (req, res) => {
  const { id } = req.params;
  try {
    const [clienteResult, gruposResult] = await Promise.all([
      pool.query(
        'SELECT id, nome_completo, cpf, email, telefone, grupo_id FROM clientes WHERE id = $1',
        [id]
      ),
      pool.query('SELECT id, nome FROM grupos ORDER BY nome ASC'),
    ]);

    if (clienteResult.rows.length === 0) {
      return res.redirect('/clientes?error=Cliente não encontrado.');
    }

    res.render('clientes/edit', {
      title: 'Editar Cliente / Responsável',
      cliente: clienteResult.rows[0],
      grupos: gruposResult.rows,
      user: req.session.user,
      error: null,
    });
  } catch (err) {
    console.error('Erro ao carregar cliente:', err);
    res.redirect('/clientes?error=Erro ao carregar cliente.');
  }
});

// POST /clientes/:id - Atualizar cliente
router.post('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome_completo, cpf, email, telefone, grupo_id } = req.body;

  if (!nome_completo || !cpf || !grupo_id) {
    const gruposResult = await pool.query(
      'SELECT id, nome FROM grupos ORDER BY nome ASC'
    );
    return res.render('clientes/edit', {
      title: 'Editar Cliente / Responsável',
      cliente: { id, nome_completo, cpf, email, telefone, grupo_id },
      grupos: gruposResult.rows,
      user: req.session.user,
      error: 'Nome completo, CPF e Grupo são obrigatórios.',
    });
  }

  try {
    const result = await pool.query(
      `UPDATE clientes
       SET nome_completo = $1, cpf = $2, email = $3, telefone = $4, grupo_id = $5
       WHERE id = $6
       RETURNING id`,
      [
        nome_completo.trim(),
        cpf.trim(),
        email ? email.trim() : null,
        telefone ? telefone.trim() : null,
        parseInt(grupo_id, 10),
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.redirect('/clientes?error=Cliente não encontrado.');
    }
    res.redirect('/clientes?success=Cliente atualizado com sucesso!');
  } catch (err) {
    console.error('Erro ao atualizar cliente:', err);
    const gruposResult = await pool.query(
      'SELECT id, nome FROM grupos ORDER BY nome ASC'
    );
    let mensagem = 'Erro ao atualizar cliente. Tente novamente.';
    if (err.code === '23505') {
      mensagem = 'CPF já cadastrado no sistema.';
    }
    res.render('clientes/edit', {
      title: 'Editar Cliente / Responsável',
      cliente: { id, nome_completo, cpf, email, telefone, grupo_id },
      grupos: gruposResult.rows,
      user: req.session.user,
      error: mensagem,
    });
  }
});

// POST /clientes/:id/excluir - Excluir cliente
router.post('/:id/excluir', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM clientes WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) {
      return res.redirect('/clientes?error=Cliente não encontrado.');
    }
    res.redirect('/clientes?success=Cliente excluído com sucesso!');
  } catch (err) {
    console.error('Erro ao excluir cliente:', err);
    res.redirect('/clientes?error=Erro ao excluir cliente.');
  }
});

export default router;
