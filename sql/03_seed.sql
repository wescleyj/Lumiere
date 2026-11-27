-- =============================================================================
-- LUMIERE — Sistema de Filmes On-line
-- Script 03: Povoamento Inicial (DML) — Mínimo de 5 registros por tabela
-- =============================================================================

BEGIN;

-- 1. Plano (5 registros)
INSERT INTO plano (id_plano, nome, preco_mensal, max_telas, qualidade_max) VALUES
    (1, 'Básico com Anúncios', 20.90, 1, 'HD'),
    (2, 'Básico',              29.90, 1, 'HD'),
    (3, 'Padrão',              44.90, 2, 'Full HD'),
    (4, 'Premium 4K',          59.90, 4, '4K'),
    (5, 'Família Ultra',       74.90, 6, '4K');

-- 2. Usuario (6 registros)
INSERT INTO usuario (id_usuario, nome, email, cpf, senha, data_nascimento, data_cadastro) VALUES
    (1, 'Mariana Oliveira Costa', 'mariana.costa@lumiere.br',   '124.589.310-04', '••••••••', '1994-05-18', '2025-02-10'),
    (2, 'Lucas Henrique Almeida', 'lucas.almeida@lumiere.br',   '238.941.672-19', '••••••••', '1988-11-03', '2025-04-22'),
    (3, 'Beatriz Ferreira Santos','beatriz.santos@lumiere.br',  '391.402.855-80', '••••••••', '1999-08-27', '2025-07-14'),
    (4, 'Rafael Souza Mendes',    'rafael.mendes@lumiere.br',   '472.118.904-32', '••••••••', '1982-01-15', '2025-09-01'),
    (5, 'Camila Ribeiro Duarte',  'camila.duarte@lumiere.br',   '519.630.247-61', '••••••••', '2001-03-09', '2026-01-19'),
    (6, 'Thiago Martins Rocha',   'thiago.rocha@lumiere.br',    '684.725.193-45', '••••••••', '1990-12-21', '2026-03-08');

-- 3. Assinatura (7 registros)
INSERT INTO assinatura (id_assinatura, id_usuario, id_plano, data_inicio, data_fim, situacao) VALUES
    (1, 1, 4, '2025-02-10', NULL,         'Ativa'),
    (2, 2, 3, '2025-04-22', '2026-01-22', 'Cancelada'),
    (3, 2, 5, '2026-02-01', NULL,         'Ativa'),
    (4, 3, 2, '2025-07-14', NULL,         'Ativa'),
    (5, 4, 4, '2025-09-01', '2026-06-01', 'Suspensa'),
    (6, 5, 1, '2026-01-19', NULL,         'Ativa'),
    (7, 6, 3, '2026-03-08', NULL,         'Ativa');

-- 4. Perfil (8 registros)
INSERT INTO perfil (id_perfil, id_usuario, nome, infantil, classificacao_max, avatar_color) VALUES
    (1, 1, 'Mariana',     FALSE, '18', 'red'),
    (2, 1, 'Helena Kids', TRUE,  'L',  'amber'),
    (3, 2, 'Lucas',       FALSE, '18', 'cobalt'),
    (4, 2, 'Pedro',       TRUE,  '10', 'teal'),
    (5, 3, 'Beatriz',     FALSE, '16', 'emerald'),
    (6, 4, 'Rafael',      FALSE, '18', 'zinc'),
    (7, 5, 'Camila',      FALSE, '14', 'red'),
    (8, 6, 'Thiago',      FALSE, '18', 'cobalt');

-- 5. Genero (7 registros)
INSERT INTO genero (id_genero, nome, descricao) VALUES
    (1, 'Ficção Científica', 'Narrativas especulativas sobre ciência, espaço, tempo e futuro.'),
    (2, 'Drama',             'Obras centradas em conflitos humanos, relações e transformações pessoais.'),
    (3, 'Suspense',          'Histórias de tensão crescente, mistério e reviravoltas psicológicas.'),
    (4, 'Animação',          'Produções animadas quadro a quadro ou digitais para diferentes públicos.'),
    (5, 'Ação',              'Filmes marcados por ritmo intenso, perseguições e sequências físicas.'),
    (6, 'Comédia',           'Obras construídas em torno de humor, sátira e situações cotidianas.'),
    (7, 'Documentário',      'Registros não ficcionais sobre eventos reais, sociedade e cultura.');

-- 6. Pessoa (12 registros)
INSERT INTO pessoa (id_pessoa, nome, data_nascimento, nacionalidade) VALUES
    (1,  'Denis Villeneuve',      '1967-10-03', 'Canadá'),
    (2,  'Kleber Mendonça Filho', '1968-11-22', 'Brasil'),
    (3,  'Hayao Miyazaki',        '1941-01-05', 'Japão'),
    (4,  'Christopher Nolan',     '1970-07-30', 'Reino Unido'),
    (5,  'Fernando Meirelles',    '1955-11-09', 'Brasil'),
    (6,  'Greta Gerwig',          '1983-08-04', 'Estados Unidos'),
    (7,  'Wagner Moura',          '1976-06-27', 'Brasil'),
    (8,  'Fernanda Torres',       '1965-09-15', 'Brasil'),
    (9,  'Cillian Murphy',        '1976-05-25', 'Irlanda'),
    (10, 'Zendaya',               '1996-09-01', 'Estados Unidos'),
    (11, 'Emma Stone',            '1988-11-06', 'Estados Unidos'),
    (12, 'Selton Mello',          '1972-12-30', 'Brasil');

-- 7. Filme (10 registros)
INSERT INTO filme (id_filme, titulo, titulo_original, ano_lancamento, sinopse, duracao_min, classificacao, data_inclusao, id_diretor, capa_url, capa_tema) VALUES
    (1,  'Duna: Parte Dois',     'Dune: Part Two',                 2024, 'Paul Atreides une forças com Chani e os Fremen enquanto busca vingança contra os conspiradores que destruíram sua família no planeta Arrakis.', 166, '14', '2025-05-12', 1, '', 'amber'),
    (2,  'Bacurau',              'Bacurau',                        2019, 'Pouco após a morte da matriarca Carmelita, os moradores de um pequeno povoado no sertão percebem que a comunidade desapareceu dos mapas digitais.', 131, '16', '2025-03-04', 2, '', 'crimson'),
    (3,  'A Viagem de Chihiro',  'Sen to Chihiro no Kamikakushi',  2001, 'Durante a mudança para uma nova cidade, Chihiro entra em um mundo habitado por espíritos e precisa trabalhar em uma casa de banhos para resgatar seus pais.', 125, 'L',  '2025-02-15', 3, '', 'emerald'),
    (4,  'Oppenheimer',          'Oppenheimer',                    2023, 'A trajetória do físico teórico J. Robert Oppenheimer na liderança do Projeto Manhattan e o dilema moral que marcou a era nuclear.', 180, '16', '2025-06-20', 4, '', 'noir'),
    (5,  'Cidade de Deus',       'Cidade de Deus',                 2002, 'Buscapé cresce no conjunto habitacional Cidade de Deus, no Rio de Janeiro, e usa a fotografia para registrar o avanço do crime ao longo de duas décadas.', 130, '18', '2025-02-10', 5, '', 'amber'),
    (6,  'Interestelar',         'Interstellar',                   2014, 'Com a Terra à beira do colapso agrícola, um ex-piloto integra uma missão interestelar através de um buraco de minhoca em busca de um novo lar.', 169, '10', '2025-04-08', 4, '', 'cyan'),
    (7,  'Adoráveis Mulheres',   'Little Women',                   2019, 'As quatro irmãs March atravessam a juventude após a Guerra Civil Americana defendendo suas vocações artísticas, afetos e independência.', 135, 'L',  '2025-08-19', 6, '', 'slate'),
    (8,  'A Chegada',            'Arrival',                        2016, 'Quando naves misteriosas pousam em diferentes pontos do planeta, uma linguista é recrutada para decifrar o idioma dos visitantes antes de um conflito global.', 116, '12', '2025-10-11', 1, '', 'cyan'),
    (9,  'Retratos Fantasmas',   'Retratos Fantasmas',             2023, 'Um ensaio cinematográfico sobre as antigas salas de cinema de rua do centro do Recife, memória urbana e transformação da paisagem brasileira.', 93,  '12', '2026-01-25', 2, '', 'slate'),
    (10, 'O Menino e a Garça',   'Kimitachi wa Do Ikiru ka',       2023, 'Após perder a mãe durante a guerra, o jovem Mahito segue uma garça falante até uma torre abandonada que conecta o mundo real a um reino fantástico.', 124, '12', '2026-04-02', 3, '', 'emerald');

-- 8. Pertence_a (19 registros — participação total 1,M de Filme)
INSERT INTO pertence_a (id_filme, id_genero) VALUES
    (1, 1), (1, 5),
    (2, 2), (2, 3),
    (3, 4), (3, 2),
    (4, 2), (4, 3),
    (5, 2), (5, 5),
    (6, 1), (6, 2),
    (7, 2), (7, 6),
    (8, 1), (8, 3),
    (9, 7), (9, 2),
    (10, 4);

-- 9. Atua (12 registros; Filme 10 sem elenco para evidenciar participação parcial 0,M)
INSERT INTO atua (id_atua, id_pessoa, id_filme, funcao, personagem) VALUES
    (1,  10, 1, 'Protagonista',          'Chani'),
    (2,  9,  4, 'Protagonista',          'J. Robert Oppenheimer'),
    (3,  7,  5, 'Participação Especial', 'Jornalista Convidado'),
    (4,  8,  2, 'Coadjuvante',           'Teresa'),
    (5,  12, 2, 'Coadjuvante',           'Lunga (Voz Adicional)'),
    (6,  11, 7, 'Protagonista',          'Meg March'),
    (7,  9,  6, 'Coadjuvante',           'Dr. Mann'),
    (8,  10, 8, 'Coadjuvante',           'Hannah'),
    (9,  12, 9, 'Participação Especial', 'Narrador Convidado'),
    (10, 7,  2, 'Participação Especial', 'Morador do Sertão'),
    (11, 8,  9, 'Participação Especial', 'Entrevistada'),
    (12, 11, 4, 'Coadjuvante',           'Jean Tatlock');

-- 10. Visualizacao (12 registros; Filme 9 sem visualizações para demonstrar LEFT JOIN)
INSERT INTO visualizacao (id_visualizacao, id_perfil, id_filme, data_hora_inicio, minutos_assistidos, conclusao) VALUES
    (1,  1, 1,  '2026-08-12 20:15:00', 166, TRUE),
    (2,  1, 2,  '2026-08-18 21:40:00', 131, TRUE),
    (3,  2, 3,  '2026-08-20 15:10:00', 125, TRUE),
    (4,  3, 4,  '2026-09-02 22:00:00', 145, FALSE),
    (5,  3, 1,  '2026-09-05 19:30:00', 166, TRUE),
    (6,  4, 3,  '2026-09-10 16:45:00', 90,  FALSE),
    (7,  4, 6,  '2026-09-14 18:00:00', 169, TRUE),
    (8,  5, 7,  '2026-10-01 20:05:00', 135, TRUE),
    (9,  6, 5,  '2026-10-06 23:10:00', 130, TRUE),
    (10, 7, 8,  '2026-10-12 21:00:00', 116, TRUE),
    (11, 8, 6,  '2026-10-18 19:45:00', 169, TRUE),
    (12, 5, 10, '2026-11-02 17:20:00', 124, TRUE);

-- 11. Avalia (9 registros)
INSERT INTO avalia (id_perfil, id_filme, nota, data_avaliacao, comentario) VALUES
    (1, 1, 5, '2026-08-12', 'Fotografia monumental e desenho de som impecável.'),
    (1, 2, 5, '2026-08-19', 'Cinema brasileiro autoral com tensão do início ao fim.'),
    (2, 3, 5, '2026-08-20', 'Mundo mágico cheio de criaturas inesquecíveis.'),
    (3, 4, 4, '2026-09-03', 'Ritmo denso e atuação marcante de Cillian Murphy.'),
    (3, 1, 5, '2026-09-05', 'Escala épica rara na ficção científica recente.'),
    (4, 6, 4, '2026-09-14', 'Cenas espaciais impressionantes e trilha envolvente.'),
    (5, 7, 4, '2026-10-01', 'Adaptação sensível com excelente química entre as irmãs.'),
    (6, 5, 5, '2026-10-07', 'Montagem ágil e retrato impactante que atravessa gerações.'),
    (7, 8, 3, '2026-10-12', 'Premissa linguística original, ritmo contemplativo.');

-- Sincronização de todas as sequences IDENTITY após inserções com ID explícito
SELECT setval(pg_get_serial_sequence('plano', 'id_plano'),               COALESCE(MAX(id_plano), 1),        TRUE) FROM plano;
SELECT setval(pg_get_serial_sequence('usuario', 'id_usuario'),           COALESCE(MAX(id_usuario), 1),      TRUE) FROM usuario;
SELECT setval(pg_get_serial_sequence('assinatura', 'id_assinatura'),     COALESCE(MAX(id_assinatura), 1),   TRUE) FROM assinatura;
SELECT setval(pg_get_serial_sequence('perfil', 'id_perfil'),             COALESCE(MAX(id_perfil), 1),       TRUE) FROM perfil;
SELECT setval(pg_get_serial_sequence('genero', 'id_genero'),             COALESCE(MAX(id_genero), 1),       TRUE) FROM genero;
SELECT setval(pg_get_serial_sequence('pessoa', 'id_pessoa'),             COALESCE(MAX(id_pessoa), 1),       TRUE) FROM pessoa;
SELECT setval(pg_get_serial_sequence('filme', 'id_filme'),               COALESCE(MAX(id_filme), 1),        TRUE) FROM filme;
SELECT setval(pg_get_serial_sequence('atua', 'id_atua'),                 COALESCE(MAX(id_atua), 1),         TRUE) FROM atua;
SELECT setval(pg_get_serial_sequence('visualizacao', 'id_visualizacao'), COALESCE(MAX(id_visualizacao), 1), TRUE) FROM visualizacao;

COMMIT;
