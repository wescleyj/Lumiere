import { query } from '../db.js';

const ALLOWED_SITUACOES = new Set(['Todas', 'Ativa', 'Suspensa', 'Cancelada']);

const GENRE_REPORT_SQL = `SELECT g.id_genero, g.nome AS genero,
       COUNT(DISTINCT f.id_filme)::INTEGER AS qtd_filmes,
       COALESCE(SUM(vs.qtd_visualizacoes), 0)::INTEGER AS total_visualizacoes,
       COALESCE(SUM(vs.minutos_filme), 0)::INTEGER AS minutos_totais,
       ROUND(
         CASE
           WHEN COALESCE(SUM(av.qtd_notas), 0) > 0
           THEN SUM(av.soma_notas)::NUMERIC / SUM(av.qtd_notas)
           ELSE NULL
         END, 2
       ) AS nota_media
FROM genero g
LEFT JOIN pertence_a pa ON pa.id_genero = g.id_genero
LEFT JOIN filme f       ON f.id_filme   = pa.id_filme
LEFT JOIN (
  SELECT id_filme, COUNT(*) AS qtd_visualizacoes, SUM(minutos_assistidos) AS minutos_filme
  FROM visualizacao
  GROUP BY id_filme
) vs ON vs.id_filme = f.id_filme
LEFT JOIN (
  SELECT id_filme, SUM(nota) AS soma_notas, COUNT(*) AS qtd_notas
  FROM avalia
  GROUP BY id_filme
) av ON av.id_filme = f.id_filme
GROUP BY g.id_genero, g.nome`;

export async function getReports(options = {}) {
  const situacaoFilter = ALLOWED_SITUACOES.has(options.situacaoFilter)
    ? options.situacaoFilter
    : 'Todas';
  const parsedMinViews = Number(options.minViews);
  const minViews =
    Number.isFinite(parsedMinViews) && parsedMinViews >= 0 ? Math.floor(parsedMinViews) : 2;

  const innerWhere = situacaoFilter !== 'Todas' ? 'WHERE a.situacao = $1' : '';
  const innerParams = situacaoFilter !== 'Todas' ? [situacaoFilter] : [];

  const [r1Res, r2Res, r3Res, r4Res, r5Res, avgRes] = await Promise.all([
    query(
      `SELECT a.id_assinatura, u.nome AS titular, u.email,
              p.nome AS plano, p.preco_mensal, p.qualidade_max,
              a.data_inicio, a.situacao
       FROM assinatura a
       INNER JOIN usuario u ON u.id_usuario = a.id_usuario
       INNER JOIN plano p   ON p.id_plano   = a.id_plano
       ${innerWhere}
       ORDER BY a.id_assinatura ASC`,
      innerParams
    ),
    query(
      `SELECT f.id_filme, f.titulo, f.ano_lancamento,
              d.nome AS diretor,
              COUNT(v.id_visualizacao)::INTEGER AS total_visualizacoes,
              COALESCE(SUM(CASE WHEN v.conclusao THEN 1 ELSE 0 END), 0)::INTEGER AS concluidas,
              COALESCE(SUM(v.minutos_assistidos), 0)::INTEGER AS minutos_totais
       FROM filme f
       INNER JOIN pessoa d      ON d.id_pessoa = f.id_diretor
       LEFT JOIN visualizacao v ON v.id_filme  = f.id_filme
       GROUP BY f.id_filme, f.titulo, f.ano_lancamento, d.nome
       ORDER BY total_visualizacoes DESC, f.id_filme ASC`
    ),
    query(`${GENRE_REPORT_SQL}\nORDER BY total_visualizacoes DESC, g.nome ASC`),
    query(
      `${GENRE_REPORT_SQL}\nHAVING COALESCE(SUM(vs.qtd_visualizacoes), 0) >= $1\nORDER BY total_visualizacoes DESC, g.nome ASC`,
      [minViews]
    ),
    query(
      `SELECT f.id_filme, f.titulo, d.nome AS diretor,
              COUNT(a.id_perfil)::INTEGER AS qtd_avaliacoes,
              ROUND(AVG(a.nota), 2) AS nota_media,
              ROUND(AVG(a.nota) - (SELECT AVG(nota) FROM avalia), 2) AS diferenca_media
       FROM filme f
       INNER JOIN pessoa d ON d.id_pessoa = f.id_diretor
       INNER JOIN avalia a ON a.id_filme  = f.id_filme
       GROUP BY f.id_filme, f.titulo, d.nome
       HAVING AVG(a.nota) > (SELECT AVG(nota) FROM avalia)
       ORDER BY nota_media DESC, qtd_avaliacoes DESC, f.id_filme ASC`
    ),
    query(
      `SELECT COUNT(*)::INTEGER AS total_reviews,
              COALESCE(ROUND(AVG(nota), 2), 0) AS global_avg
       FROM avalia`
    ),
  ]);

  const genreColumns = [
    { key: 'genero', label: 'Gênero' },
    { key: 'qtd_filmes', label: 'Filmes' },
    { key: 'total_visualizacoes', label: 'Visualizações' },
    { key: 'minutos_totais', label: 'Minutos totais' },
    { key: 'nota_media', label: 'Nota média', format: 'rating' },
  ];

  const report1 = {
    id: 'inner_join',
    badge: '1 · INNER JOIN',
    title: 'Assinaturas com titular e detalhes do plano',
    description:
      'Junção interna entre Usuario, Assinatura e Plano, exibindo contratos, valores mensais e qualidade máxima contratada.',
    sql: `SELECT a.id_assinatura, u.nome AS titular, u.email,
       p.nome AS plano, p.preco_mensal, p.qualidade_max,
       a.data_inicio, a.situacao
FROM assinatura a
INNER JOIN usuario u ON u.id_usuario = a.id_usuario
INNER JOIN plano p   ON p.id_plano   = a.id_plano${
      situacaoFilter !== 'Todas' ? `\nWHERE a.situacao = '${situacaoFilter}'` : ''
    }
ORDER BY a.id_assinatura;`,
    columns: [
      { key: 'id_assinatura', label: 'ID' },
      { key: 'titular', label: 'Titular' },
      { key: 'plano', label: 'Plano' },
      { key: 'preco_mensal', label: 'Mensalidade', format: 'currency' },
      { key: 'qualidade_max', label: 'Qualidade' },
      { key: 'data_inicio', label: 'Início', format: 'date' },
      { key: 'situacao', label: 'Situação' },
    ],
    rows: r1Res.rows,
    meta: { count: r1Res.rows.length },
  };

  const report2 = {
    id: 'left_join',
    badge: '2 · LEFT JOIN',
    title: 'Catálogo completo e sessões de visualização (inclui obras sem exibição)',
    description:
      'Junção externa à esquerda preservando todos os filmes do catálogo mesmo quando ainda não possuem registros na tabela Visualizacao.',
    sql: `SELECT f.id_filme, f.titulo, f.ano_lancamento,
       d.nome AS diretor,
       COUNT(v.id_visualizacao) AS total_visualizacoes,
       COALESCE(SUM(CASE WHEN v.conclusao THEN 1 ELSE 0 END), 0) AS concluidas,
       COALESCE(SUM(v.minutos_assistidos), 0) AS minutos_totais
FROM filme f
INNER JOIN pessoa d      ON d.id_pessoa = f.id_diretor
LEFT JOIN visualizacao v ON v.id_filme  = f.id_filme
GROUP BY f.id_filme, f.titulo, f.ano_lancamento, d.nome
ORDER BY total_visualizacoes DESC, f.id_filme ASC;`,
    columns: [
      { key: 'titulo', label: 'Filme' },
      { key: 'ano_lancamento', label: 'Ano' },
      { key: 'diretor', label: 'Direção' },
      { key: 'total_visualizacoes', label: 'Visualizações' },
      { key: 'concluidas', label: 'Concluídas' },
      { key: 'minutos_totais', label: 'Minutos assistidos' },
    ],
    rows: r2Res.rows,
    meta: {
      zeroViewsCount: r2Res.rows.filter((r) => r.total_visualizacoes === 0).length,
    },
  };

  const report3 = {
    id: 'group_by',
    badge: '3 · GROUP BY',
    title: 'Desempenho do catálogo agrupado por gênero',
    description:
      'Agrupamento combinando Genero, Pertence_a, Filme, Visualizacao e Avalia para consolidar volume de exibição e nota média por categoria.',
    sql: `${GENRE_REPORT_SQL}\nORDER BY total_visualizacoes DESC, g.nome ASC;`,
    columns: genreColumns,
    rows: r3Res.rows,
    meta: { count: r3Res.rows.length },
  };

  const report4 = {
    id: 'having',
    badge: '4 · HAVING',
    title: `Gêneros com pelo menos ${minViews} visualização(ões)`,
    description:
      'Filtra os grupos da consulta anterior usando a cláusula HAVING sobre a contagem agregada de visualizações.',
    sql: `${GENRE_REPORT_SQL}\nHAVING COALESCE(SUM(vs.qtd_visualizacoes), 0) >= ${minViews}\nORDER BY total_visualizacoes DESC, g.nome ASC;`,
    columns: genreColumns,
    rows: r4Res.rows,
    meta: { minViews, count: r4Res.rows.length },
  };

  const report5 = {
    id: 'subconsulta',
    badge: '5 · SUBCONSULTA',
    title: 'Filmes com nota média acima da média global do catálogo',
    description:
      'Subconsulta escalar que calcula a média global de Avalia e retorna apenas filmes cuja média supera esse patamar.',
    sql: `SELECT f.id_filme, f.titulo, d.nome AS diretor,
       COUNT(a.id_perfil) AS qtd_avaliacoes,
       ROUND(AVG(a.nota), 2) AS nota_media,
       ROUND(AVG(a.nota) - (SELECT AVG(nota) FROM avalia), 2) AS diferenca_media
FROM filme f
INNER JOIN pessoa d ON d.id_pessoa = f.id_diretor
INNER JOIN avalia a ON a.id_filme  = f.id_filme
GROUP BY f.id_filme, f.titulo, d.nome
HAVING AVG(a.nota) > (
  SELECT AVG(nota) FROM avalia
)
ORDER BY nota_media DESC, qtd_avaliacoes DESC;`,
    columns: [
      { key: 'titulo', label: 'Filme' },
      { key: 'diretor', label: 'Direção' },
      { key: 'qtd_avaliacoes', label: 'Avaliações' },
      { key: 'nota_media', label: 'Nota média', format: 'rating' },
      { key: 'diferenca_media', label: 'Acima da média' },
    ],
    rows: r5Res.rows,
    meta: {
      globalAvg: Number(avgRes.rows[0]?.global_avg ?? 0),
      totalReviews: Number(avgRes.rows[0]?.total_reviews ?? 0),
    },
  };

  return [report1, report2, report3, report4, report5];
}
