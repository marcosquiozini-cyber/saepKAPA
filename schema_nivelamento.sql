-- =====================================================
-- Schema: Nivelamento SAEP - Gestão de Clientes e Grupos
-- Clínica Pediátrica Infantil "Pequenos Passos"
-- =====================================================

-- Limpeza (caso exista)
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS grupos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- =====================================================
-- Tabela: usuarios (operadores do sistema)
-- =====================================================
CREATE TABLE usuarios (
    id          SERIAL PRIMARY KEY,
    cpf         VARCHAR(14) NOT NULL UNIQUE,
    senha       VARCHAR(255) NOT NULL,  -- hash bcrypt
    nome        VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Tabela: grupos (grupos de atendimento / categorias)
-- =====================================================
CREATE TABLE grupos (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL,
    descricao   TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Tabela: clientes (responsáveis pelas crianças)
-- =====================================================
CREATE TABLE clientes (
    id              SERIAL PRIMARY KEY,
    nome_completo   VARCHAR(150) NOT NULL,
    cpf             VARCHAR(14) NOT NULL UNIQUE,
    email           VARCHAR(100),
    telefone        VARCHAR(20),
    grupo_id        INTEGER NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_cliente_grupo
        FOREIGN KEY (grupo_id)
        REFERENCES grupos(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- =====================================================
-- Índices para performance de busca
-- =====================================================
CREATE INDEX idx_clientes_nome ON clientes (nome_completo);
CREATE INDEX idx_clientes_grupo ON clientes (grupo_id);
CREATE INDEX idx_usuarios_cpf ON usuarios (cpf);

-- =====================================================
-- Dados iniciais (DML)
-- =====================================================

-- Usuário administrador padrão
-- CPF: 000.000.000-00
-- Senha: admin123
-- Hash gerado com bcrypt (10 rounds)
INSERT INTO usuarios (cpf, senha, nome) VALUES
('000.000.000-00', '$2b$10$7j/woNslb38CIzMLS.Eny.b6KpTM9Ur2yXclpYWSXO/0k4U92H5mC', 'Administrador Sistema');

-- Grupos de atendimento iniciais
INSERT INTO grupos (nome, descricao) VALUES
('Convênio Bronze', 'Pacientes cobertos pelo plano de saúde Bronze'),
('Particular Especial', 'Atendimento particular com desconto especial'),
('Programa Neonatal', 'Bebês de 0 a 28 dias - acompanhamento intensivo'),
('Atendimento Social', 'Famílias em situação de vulnerabilidade social');

-- Clientes de exemplo
INSERT INTO clientes (nome_completo, cpf, email, telefone, grupo_id) VALUES
('Maria Silva Santos', '111.222.333-44', 'maria.silva@email.com', '(11) 98765-4321', 1),
('João Pedro Oliveira', '222.333.444-55', 'joao.oliveira@email.com', '(11) 91234-5678', 2),
('Ana Carolina Souza', '333.444.555-66', 'ana.souza@email.com', '(11) 99876-5432', 3),
('Carlos Eduardo Lima', '444.555.666-77', 'carlos.lima@email.com', '(11) 97654-3210', 4);

-- =====================================================
-- Verificação
-- =====================================================
-- SELECT * FROM usuarios;
-- SELECT * FROM grupos;
-- SELECT c.*, g.nome AS grupo_nome 
-- FROM clientes c 
-- LEFT JOIN grupos g ON c.grupo_id = g.id;
