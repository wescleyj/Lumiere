import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SQL_DIR = resolve(__dirname, '../../../sql');

const SCRIPTS = ['01_ddl.sql', '02_triggers.sql', '03_seed.sql'];

async function main() {
  try {
    for (const file of SCRIPTS) {
      const sql = await readFile(resolve(SQL_DIR, file), 'utf8');
      console.log(`Executando sql/${file}...`);
      await pool.query(sql);
    }
    console.log('Banco de dados Lumiere inicializado e povoado com sucesso.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Falha ao inicializar banco de dados:', err);
  process.exit(1);
});
