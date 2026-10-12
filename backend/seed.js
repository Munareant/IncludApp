require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
});

async function seed() {
  try {
    // 1. Verificam ce utilizatori exista deja in baza de date
    const res = await pool.query(`SELECT id, full_name, email, role FROM users LIMIT 5;`);
    console.log('Utilizatori gasiti in baza de date:');
    console.table(res.rows);

    // 2. Asiguram existenta utilizatorului cu ID-ul fixat stergand duplicatul vechi dupa email daca e cazul
    await pool.query(`DELETE FROM users WHERE email IN ('beneficiar@test.com', 'voluntar@test.com');`);
    
    await pool.query(`
      INSERT INTO users (id, full_name, email, phone, role)
      VALUES 
        ('00000000-0000-0000-0000-000000000001', 'Beneficiar Test', 'beneficiar@test.com', '0700000001', 'BENEFICIARY'),
        ('00000000-0000-0000-0000-000000000002', 'Voluntar Test', 'voluntar@test.com', '0700000002', 'VOLUNTEER');
    `);
    
    console.log('✅ Utilizatorii de test cu ID-urile corecte au fost configurati cu succes!');
  } catch (err) {
    console.error('Eroare:', err.message);
  } finally {
    await pool.end();
  }
}

seed();