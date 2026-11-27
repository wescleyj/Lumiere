import express from 'express';
import { query } from '../db.js';
import {
  crudServices,
  getFullState,
  resetDatabase,
} from '../services/databaseService.js';
import { getReports } from '../services/reportsService.js';

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    const { rows } = await query('SELECT current_database() AS db, NOW()::TEXT AS timestamp');
    res.json({ ok: true, database: rows[0].db, timestamp: rows[0].timestamp });
  })
);

router.get(
  '/state',
  asyncHandler(async (_req, res) => {
    const state = await getFullState();
    res.json({ ok: true, state });
  })
);

router.post(
  '/reset',
  asyncHandler(async (_req, res) => {
    const state = await resetDatabase();
    res.json({ ok: true, state });
  })
);

router.get(
  '/reports',
  asyncHandler(async (req, res) => {
    const reports = await getReports({
      situacaoFilter: req.query.situacao,
      minViews: req.query.minViews,
    });
    res.json({ ok: true, reports });
  })
);

router.get(
  '/reports/:id',
  asyncHandler(async (req, res) => {
    const reports = await getReports({
      situacaoFilter: req.query.situacao,
      minViews: req.query.minViews,
    });
    const report = reports.find((r) => r.id === req.params.id);
    if (!report) {
      return res.status(404).json({ ok: false, error: 'Relatório não encontrado.' });
    }
    return res.json({ ok: true, report });
  })
);

// Rotas específicas para a tabela associativa Pertence_a (chave composta id_filme + id_genero)
router.get(
  '/pertence-a',
  asyncHandler(async (_req, res) => {
    const rows = await crudServices.pertence_a.list();
    res.json({ ok: true, rows });
  })
);

router.post(
  '/pertence-a',
  asyncHandler(async (req, res) => {
    const record = await crudServices.pertence_a.create(req.body || {});
    const state = await getFullState();
    res.status(201).json({ ok: true, record, state });
  })
);

router.delete(
  '/pertence-a/:id_filme/:id_genero',
  asyncHandler(async (req, res) => {
    await crudServices.pertence_a.remove(req.params.id_filme, req.params.id_genero);
    const state = await getFullState();
    res.json({ ok: true, state });
  })
);

// Rotas REST uniformes para as 10 entidades/relacionamentos do CRUD
const CRUD_TABLES = [
  'planos',
  'usuarios',
  'assinaturas',
  'perfis',
  'generos',
  'pessoas',
  'filmes',
  'atua',
  'visualizacoes',
  'avaliacoes',
];

for (const table of CRUD_TABLES) {
  const service = crudServices[table];

  router.get(
    `/${table}`,
    asyncHandler(async (_req, res) => {
      const rows = await service.list();
      res.json({ ok: true, rows });
    })
  );

  router.post(
    `/${table}`,
    asyncHandler(async (req, res) => {
      const record = await service.create(req.body || {});
      const state = await getFullState();
      res.status(201).json({ ok: true, record, state });
    })
  );

  router.put(
    `/${table}/:key`,
    asyncHandler(async (req, res) => {
      const record = await service.update(req.params.key, req.body || {});
      const state = await getFullState();
      res.json({ ok: true, record, state });
    })
  );

  router.delete(
    `/${table}/:key`,
    asyncHandler(async (req, res) => {
      await service.remove(req.params.key);
      const state = await getFullState();
      res.json({ ok: true, state });
    })
  );
}

// Suporte adicional à chave composta de Avalia via /:id_perfil/:id_filme
router.put(
  '/avaliacoes/:id_perfil/:id_filme',
  asyncHandler(async (req, res) => {
    const key = `${req.params.id_perfil}-${req.params.id_filme}`;
    const record = await crudServices.avaliacoes.update(key, req.body || {});
    const state = await getFullState();
    res.json({ ok: true, record, state });
  })
);

router.delete(
  '/avaliacoes/:id_perfil/:id_filme',
  asyncHandler(async (req, res) => {
    const key = `${req.params.id_perfil}-${req.params.id_filme}`;
    await crudServices.avaliacoes.remove(key);
    const state = await getFullState();
    res.json({ ok: true, state });
  })
);

export default router;
