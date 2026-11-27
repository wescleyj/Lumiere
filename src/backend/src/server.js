import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import { mapPgError } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api', apiRouter);

app.use('/api', (_req, res) => {
  res.status(404).json({ ok: false, error: 'Rota da API não encontrada.' });
});

const frontendDistDir = resolve(__dirname, '../../frontend/dist');
if (existsSync(frontendDistDir)) {
  app.use(express.static(frontendDistDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    return res.sendFile(resolve(frontendDistDir, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  const { status, message } = mapPgError(err);
  if (status >= 500) {
    console.error('[Lumiere API Error]', err);
  }
  res.status(status).json({ ok: false, error: message });
});

app.listen(PORT, () => {
  console.log(`Lumiere API em execução na porta http://localhost:${PORT}`);
});
