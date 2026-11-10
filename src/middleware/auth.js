/**
 * Middleware de autenticação
 * Protege rotas verificando se existe sessão ativa.
 * Redireciona para /login caso o usuário não esteja autenticado.
 */
export function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/login');
}

/**
 * Middleware para redirecionar usuário já autenticado
 * (evita acessar /login quando já logado)
 */
export function redirectIfAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  return next();
}
