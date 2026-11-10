import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'nivelamento_saep',
  password: process.env.DB_PASSWORD || 'senai',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

pool.on('connect', () => {
  console.log('✓ Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool do PostgreSQL:', err);
  process.exit(-1);
});

export default pool;
