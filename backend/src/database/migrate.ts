import fs from 'fs';
import path from 'path';
import { pool } from '../config/db.js';

async function runMigration() {
  try {
    const schemaPath = path.resolve(process.cwd(), 'src/database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Impartim comenzile dupa punct si virgula
    const queries = schemaSql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    console.log('Se ruleaza migrarea pas cu pas...');

    for (const query of queries) {
      await pool.query(query);
    }

    console.log('Toate tabelele si extensia PostGIS au fost create cu succes!');
  } catch (error: any) {
    console.error('Eroare detaliata la comanda SQL:', error.message);
  } finally {
    await pool.end();
  }
}

runMigration();