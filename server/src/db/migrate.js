import fs from 'node:fs/promises';
import { pool } from './pool.js';
try {
  await pool.query(await fs.readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
  console.log('Database migration complete.');
} finally { await pool.end(); }
