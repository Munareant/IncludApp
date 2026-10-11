import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';

export const pool = new Pool({
  user: process.env.DB_USER || 'includadmin',
  password: String(process.env.DB_PASSWORD || 'devpassword123'),
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'includapp',
});

pool.on('connect', () => {
  console.log('Conexiune reusita la baza de date PostgreSQL!');
});

pool.on('error', (err) => {
  console.error('Eroare conexiune DB:', err);
});