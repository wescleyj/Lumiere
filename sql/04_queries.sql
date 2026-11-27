-- =============================================================================
-- LUMIERE — Sistema de Filmes On-line
-- Script 04: Consultas SQL Analíticas (Relatórios Obrigatórios)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Junção Interna (INNER JOIN de no mínimo duas tabelas)
--    Lista as assinaturas com o respectivo titular e os detalhes do plano.
-- -----------------------------------------------------------------------------
SELECT
    a.id_assinatura,
    u.nome        AS titular,
    u.email,
    p.nome        AS plano,
    p.preco_mensal,
    p.qualidade_max,
    a.data_inicio,
    a.situacao
FROM assinatura a
INNER JOIN usuario u ON u.id_usuario = a.id_usuario
INNER JOIN plano p   ON p.id_plano   = a.id_plano
ORDER BY a.id_assinatura ASC;

-- -----------------------------------------------------------------------------
-- 2. Junção Externa (LEFT JOIN de no mínimo duas tabelas)
--    Lista todos os filmes do catálogo e suas visualizações, preservando obras
--    que ainda não possuem nenhuma exibição registrada (ex.: Retratos Fantasmas).
-- -----------------------------------------------------------------------------
SELECT
    f.id_filme,
    f.titulo,
    f.ano_lancamento,
    d.nome                                         AS diretor,
    COUNT(v.id_visualizacao)::INTEGER              AS total_visualizacoes,
    COALESCE(SUM(CASE WHEN v.conclusao THEN 1 ELSE 0 END), 0)::INTEGER AS concluidas,
    COALESCE(SUM(v.minutos_assistidos), 0)::INTEGER AS minutos_totais
FROM filme f
INNER JOIN pessoa d      ON d.id_pessoa = f.id_diretor
LEFT JOIN visualizacao v ON v.id_filme  = f.id_filme
GROUP BY f.id_filme, f.titulo, f.ano_lancamento, d.nome
ORDER BY total_visualizacoes DESC, f.id_filme ASC;

-- -----------------------------------------------------------------------------
-- 3. Sentença de Grupo (GROUP BY) envolvendo as junções anteriores
--    Consolida desempenho do catálogo por gênero usando subconsultas agregadas
--    por filme para evitar multiplicação cartesiana entre visualizações e notas.
-- -----------------------------------------------------------------------------
SELECT
    g.id_genero,
    g.nome                                             AS genero,
    COUNT(DISTINCT f.id_filme)::INTEGER                AS qtd_filmes,
    COALESCE(SUM(vs.qtd_visualizacoes), 0)::INTEGER    AS total_visualizacoes,
    COALESCE(SUM(vs.minutos_filme), 0)::INTEGER        AS minutos_totais,
    ROUND(
        CASE
            WHEN COALESCE(SUM(av.qtd_notas), 0) > 0
            THEN SUM(av.soma_notas)::NUMERIC / SUM(av.qtd_notas)
            ELSE NULL
        END,
        2
    )                                                  AS nota_media
FROM genero g
LEFT JOIN pertence_a pa ON pa.id_genero = g.id_genero
LEFT JOIN filme f       ON f.id_filme   = pa.id_filme
LEFT JOIN (
    SELECT
        id_filme,
        COUNT(*)                AS qtd_visualizacoes,
        SUM(minutos_assistidos) AS minutos_filme
    FROM visualizacao
    GROUP BY id_filme
) vs ON vs.id_filme = f.id_filme
LEFT JOIN (
    SELECT
        id_filme,
        SUM(nota) AS soma_notas,
        COUNT(*)  AS qtd_notas
    FROM avalia
    GROUP BY id_filme
) av ON av.id_filme = f.id_filme
GROUP BY g.id_genero, g.nome
ORDER BY total_visualizacoes DESC, g.nome ASC;

-- -----------------------------------------------------------------------------
-- 4. Sentença com Cláusula HAVING derivada da consulta de grupo anterior
--    Retorna apenas os gêneros que atingiram pelo menos 2 visualizações.
-- -----------------------------------------------------------------------------
SELECT
    g.id_genero,
    g.nome                                             AS genero,
    COUNT(DISTINCT f.id_filme)::INTEGER                AS qtd_filmes,
    COALESCE(SUM(vs.qtd_visualizacoes), 0)::INTEGER    AS total_visualizacoes,
    COALESCE(SUM(vs.minutos_filme), 0)::INTEGER        AS minutos_totais,
    ROUND(
        CASE
            WHEN COALESCE(SUM(av.qtd_notas), 0) > 0
            THEN SUM(av.soma_notas)::NUMERIC / SUM(av.qtd_notas)
            ELSE NULL
        END,
        2
    )                                                  AS nota_media
FROM genero g
LEFT JOIN pertence_a pa ON pa.id_genero = g.id_genero
LEFT JOIN filme f       ON f.id_filme   = pa.id_filme
LEFT JOIN (
    SELECT
        id_filme,
        COUNT(*)                AS qtd_visualizacoes,
        SUM(minutos_assistidos) AS minutos_filme
    FROM visualizacao
    GROUP BY id_filme
) vs ON vs.id_filme = f.id_filme
LEFT JOIN (
    SELECT
        id_filme,
        SUM(nota) AS soma_notas,
        COUNT(*)  AS qtd_notas
    FROM avalia
    GROUP BY id_filme
) av ON av.id_filme = f.id_filme
GROUP BY g.id_genero, g.nome
HAVING COALESCE(SUM(vs.qtd_visualizacoes), 0) >= 2
ORDER BY total_visualizacoes DESC, g.nome ASC;

-- -----------------------------------------------------------------------------
-- 5. Sentença envolvendo Subconsulta a partir das consultas anteriores
--    Retorna os filmes cuja nota média supera estritamente a média global.
-- -----------------------------------------------------------------------------
SELECT
    f.id_filme,
    f.titulo,
    d.nome                                                            AS diretor,
    COUNT(a.id_perfil)::INTEGER                                       AS qtd_avaliacoes,
    ROUND(AVG(a.nota), 2)                                             AS nota_media,
    ROUND(AVG(a.nota) - (SELECT AVG(nota) FROM avalia), 2)            AS diferenca_media
FROM filme f
INNER JOIN pessoa d ON d.id_pessoa = f.id_diretor
INNER JOIN avalia a ON a.id_filme  = f.id_filme
GROUP BY f.id_filme, f.titulo, d.nome
HAVING AVG(a.nota) > (
    SELECT AVG(nota)
    FROM avalia
)
ORDER BY nota_media DESC, qtd_avaliacoes DESC, f.id_filme ASC;
