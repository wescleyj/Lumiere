import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HttpError, pool, query, withTransaction } from '../db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SQL_DIR = resolve(__dirname, '../../../../sql');

const AVATAR_COLORS = ['red', 'amber', 'teal', 'cobalt', 'emerald', 'zinc'];

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function nowIsoDateTime() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toInt(value, fieldLabel) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    throw new HttpError(400, `Informe um identificador numérico válido para ${fieldLabel}.`);
  }
  return num;
}

function normalizeCpf(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length !== 11) {
    throw new HttpError(400, 'Informe um CPF válido com 11 dígitos.');
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

function normalizeGenreIds(raw) {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))];
}

function parseCompositeKey(key) {
  const parts = String(key || '').split('-').map(Number);
  if (parts.length !== 2 || !Number.isInteger(parts[0]) || !Number.isInteger(parts[1])) {
    throw new HttpError(400, 'Chave composta inválida (esperado: id_perfil-id_filme).');
  }
  return parts;
}

function serializeAssinatura(row) {
  return {
    ...row,
    data_fim: row.data_fim ?? '',
  };
}

async function fetchMovieWithGenres(client, idFilme) {
  const { rows } = await client.query(
    `SELECT f.*,
            COALESCE(ARRAY_AGG(pa.id_genero ORDER BY pa.id_genero)
                     FILTER (WHERE pa.id_genero IS NOT NULL), '{}') AS generos
     FROM filme f
     LEFT JOIN pertence_a pa ON pa.id_filme = f.id_filme
     WHERE f.id_filme = $1
     GROUP BY f.id_filme`,
    [idFilme]
  );
  return rows[0] || null;
}

export async function getFullState(client = pool) {
  const [
    planosRes,
    usuariosRes,
    assinaturasRes,
    perfisRes,
    generosRes,
    pessoasRes,
    filmesRes,
    atuaRes,
    visualizacoesRes,
    avaliacoesRes,
  ] = await Promise.all([
    client.query('SELECT * FROM plano ORDER BY id_plano ASC'),
    client.query('SELECT * FROM vw_usuario_detalhes ORDER BY id_usuario ASC'),
    client.query('SELECT * FROM assinatura ORDER BY id_assinatura ASC'),
    client.query('SELECT * FROM perfil ORDER BY id_perfil ASC'),
    client.query('SELECT * FROM genero ORDER BY id_genero ASC'),
    client.query('SELECT * FROM pessoa ORDER BY id_pessoa ASC'),
    client.query(
      `SELECT f.*,
              COALESCE(ARRAY_AGG(pa.id_genero ORDER BY pa.id_genero)
                       FILTER (WHERE pa.id_genero IS NOT NULL), '{}') AS generos
       FROM filme f
       LEFT JOIN pertence_a pa ON pa.id_filme = f.id_filme
       GROUP BY f.id_filme
       ORDER BY f.id_filme ASC`
    ),
    client.query('SELECT * FROM atua ORDER BY id_atua ASC'),
    client.query('SELECT * FROM visualizacao ORDER BY id_visualizacao ASC'),
    client.query('SELECT * FROM avalia ORDER BY id_perfil ASC, id_filme ASC'),
  ]);

  return {
    planos: planosRes.rows,
    usuarios: usuariosRes.rows,
    assinaturas: assinaturasRes.rows.map(serializeAssinatura),
    perfis: perfisRes.rows,
    generos: generosRes.rows,
    pessoas: pessoasRes.rows,
    filmes: filmesRes.rows,
    atua: atuaRes.rows,
    visualizacoes: visualizacoesRes.rows,
    avaliacoes: avaliacoesRes.rows,
  };
}

export async function resetDatabase() {
  const seedRaw = await readFile(resolve(SQL_DIR, '03_seed.sql'), 'utf8');
  const seedBody = seedRaw.replace(/^\s*(BEGIN|COMMIT)\s*;\s*$/gim, '');

  await withTransaction(async (client) => {
    await client.query(
      `TRUNCATE TABLE
          avalia, visualizacao, atua, pertence_a, filme,
          pessoa, genero, perfil, assinatura, usuario, plano
       RESTART IDENTITY CASCADE`
    );
    await client.query(seedBody);
  });

  return getFullState();
}

export const crudServices = {
  planos: {
    async list() {
      const { rows } = await query('SELECT * FROM plano ORDER BY id_plano ASC');
      return rows;
    },
    async create(payload) {
      const nome = String(payload.nome || '').trim();
      const preco = Number(payload.preco_mensal);
      const telas = Number(payload.max_telas);
      const qualidade = String(payload.qualidade_max || '').trim();
      if (!nome) throw new HttpError(400, 'Informe o nome do plano.');
      if (!Number.isFinite(preco) || preco <= 0) {
        throw new HttpError(400, 'Preço mensal deve ser maior que zero.');
      }
      if (!Number.isInteger(telas) || telas < 1) {
        throw new HttpError(400, 'Quantidade máxima de telas deve ser no mínimo 1.');
      }
      const { rows } = await query(
        `INSERT INTO plano (nome, preco_mensal, max_telas, qualidade_max)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [nome, Number(preco.toFixed(2)), telas, qualidade]
      );
      return rows[0];
    },
    async update(key, payload) {
      const id = toInt(key, 'plano');
      const nome = String(payload.nome || '').trim();
      const preco = Number(payload.preco_mensal);
      const telas = Number(payload.max_telas);
      const qualidade = String(payload.qualidade_max || '').trim();
      if (!nome) throw new HttpError(400, 'Informe o nome do plano.');
      if (!Number.isFinite(preco) || preco <= 0) {
        throw new HttpError(400, 'Preço mensal deve ser maior que zero.');
      }
      if (!Number.isInteger(telas) || telas < 1) {
        throw new HttpError(400, 'Quantidade máxima de telas deve ser no mínimo 1.');
      }
      const { rows } = await query(
        `UPDATE plano
         SET nome = $1, preco_mensal = $2, max_telas = $3, qualidade_max = $4
         WHERE id_plano = $5
         RETURNING *`,
        [nome, Number(preco.toFixed(2)), telas, qualidade, id]
      );
      if (!rows[0]) throw new HttpError(404, 'Plano não encontrado.');
      return rows[0];
    },
    async remove(key) {
      const id = toInt(key, 'plano');
      const { rowCount } = await query('DELETE FROM plano WHERE id_plano = $1', [id]);
      if (rowCount === 0) throw new HttpError(404, 'Plano não encontrado.');
    },
  },

  usuarios: {
    async list() {
      const { rows } = await query('SELECT * FROM vw_usuario_detalhes ORDER BY id_usuario ASC');
      return rows;
    },
    async create(payload) {
      const nome = String(payload.nome || '').trim();
      const email = String(payload.email || '').trim().toLowerCase();
      const cpf = normalizeCpf(payload.cpf);
      const senha = String(payload.senha || '').trim() || '••••••••';
      const dataNascimento = String(payload.data_nascimento || '').trim();
      const dataCadastro = String(payload.data_cadastro || todayIsoDate()).trim();
      const perfilInicialNome =
        String(payload.perfil_inicial_nome || '').trim() || nome.split(' ')[0] || 'Principal';

      if (!nome) throw new HttpError(400, 'Informe o nome completo do usuário.');
      if (!email || !email.includes('@')) throw new HttpError(400, 'Informe um e-mail válido.');
      if (!dataNascimento) throw new HttpError(400, 'Informe a data de nascimento.');

      return withTransaction(async (client) => {
        const { rows } = await client.query(
          `INSERT INTO usuario (nome, email, cpf, senha, data_nascimento, data_cadastro)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id_usuario`,
          [nome, email, cpf, senha, dataNascimento, dataCadastro]
        );
        const idUsuario = rows[0].id_usuario;
        const avatarColor = AVATAR_COLORS[(idUsuario - 1) % AVATAR_COLORS.length];

        // Garante participação total (1,N) de Usuario em Possui -> Perfil na criação
        await client.query(
          `INSERT INTO perfil (id_usuario, nome, infantil, classificacao_max, avatar_color)
           VALUES ($1, $2, FALSE, '18', $3)`,
          [idUsuario, perfilInicialNome, avatarColor]
        );

        const viewRes = await client.query(
          'SELECT * FROM vw_usuario_detalhes WHERE id_usuario = $1',
          [idUsuario]
        );
        return viewRes.rows[0];
      });
    },
    async update(key, payload) {
      const id = toInt(key, 'usuário');
      const existing = await query('SELECT senha, data_cadastro FROM usuario WHERE id_usuario = $1', [id]);
      if (!existing.rows[0]) throw new HttpError(404, 'Usuário não encontrado.');

      const nome = String(payload.nome || '').trim();
      const email = String(payload.email || '').trim().toLowerCase();
      const cpf = normalizeCpf(payload.cpf);
      const senha = String(payload.senha || '').trim() || existing.rows[0].senha;
      const dataNascimento = String(payload.data_nascimento || '').trim();
      const dataCadastro = String(payload.data_cadastro || existing.rows[0].data_cadastro).trim();

      if (!nome) throw new HttpError(400, 'Informe o nome do usuário.');
      if (!email || !email.includes('@')) throw new HttpError(400, 'Informe um e-mail válido.');
      if (!dataNascimento) throw new HttpError(400, 'Informe a data de nascimento.');

      await query(
        `UPDATE usuario
         SET nome = $1, email = $2, cpf = $3, senha = $4, data_nascimento = $5, data_cadastro = $6
         WHERE id_usuario = $7`,
        [nome, email, cpf, senha, dataNascimento, dataCadastro, id]
      );
      const { rows } = await query('SELECT * FROM vw_usuario_detalhes WHERE id_usuario = $1', [id]);
      return rows[0];
    },
    async remove(key) {
      const id = toInt(key, 'usuário');
      const { rowCount } = await query('DELETE FROM usuario WHERE id_usuario = $1', [id]);
      if (rowCount === 0) throw new HttpError(404, 'Usuário não encontrado.');
    },
  },

  assinaturas: {
    async list() {
      const { rows } = await query('SELECT * FROM assinatura ORDER BY id_assinatura ASC');
      return rows.map(serializeAssinatura);
    },
    async create(payload) {
      const idUsuario = toInt(payload.id_usuario, 'usuário');
      const idPlano = toInt(payload.id_plano, 'plano');
      const dataInicio = String(payload.data_inicio || todayIsoDate()).trim();
      const dataFim = String(payload.data_fim || '').trim() || null;
      const situacao = String(payload.situacao || 'Ativa').trim();

      const { rows } = await query(
        `INSERT INTO assinatura (id_usuario, id_plano, data_inicio, data_fim, situacao)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [idUsuario, idPlano, dataInicio, dataFim, situacao]
      );
      return serializeAssinatura(rows[0]);
    },
    async update(key, payload) {
      const id = toInt(key, 'assinatura');
      const idUsuario = toInt(payload.id_usuario, 'usuário');
      const idPlano = toInt(payload.id_plano, 'plano');
      const dataInicio = String(payload.data_inicio || '').trim();
      const dataFim = String(payload.data_fim || '').trim() || null;
      const situacao = String(payload.situacao || 'Ativa').trim();

      if (!dataInicio) throw new HttpError(400, 'Informe a data de início.');
      const { rows } = await query(
        `UPDATE assinatura
         SET id_usuario = $1, id_plano = $2, data_inicio = $3, data_fim = $4, situacao = $5
         WHERE id_assinatura = $6
         RETURNING *`,
        [idUsuario, idPlano, dataInicio, dataFim, situacao, id]
      );
      if (!rows[0]) throw new HttpError(404, 'Assinatura não encontrada.');
      return serializeAssinatura(rows[0]);
    },
    async remove(key) {
      const id = toInt(key, 'assinatura');
      const { rowCount } = await query('DELETE FROM assinatura WHERE id_assinatura = $1', [id]);
      if (rowCount === 0) throw new HttpError(404, 'Assinatura não encontrada.');
    },
  },

  perfis: {
    async list() {
      const { rows } = await query('SELECT * FROM perfil ORDER BY id_perfil ASC');
      return rows;
    },
    async create(payload) {
      const idUsuario = toInt(payload.id_usuario, 'usuário titular');
      const nome = String(payload.nome || '').trim();
      const infantil = Boolean(payload.infantil);
      const classificacaoMax = String(payload.classificacao_max || (infantil ? 'L' : '18'));
      const avatarColor = String(payload.avatar_color || 'red');
      if (!nome) throw new HttpError(400, 'Informe o nome de exibição do perfil.');

      const { rows } = await query(
        `INSERT INTO perfil (id_usuario, nome, infantil, classificacao_max, avatar_color)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [idUsuario, nome, infantil, classificacaoMax, avatarColor]
      );
      return rows[0];
    },
    async update(key, payload) {
      const id = toInt(key, 'perfil');
      const idUsuario = toInt(payload.id_usuario, 'usuário titular');
      const nome = String(payload.nome || '').trim();
      const infantil = Boolean(payload.infantil);
      const classificacaoMax = String(payload.classificacao_max || '18');
      const avatarColor = String(payload.avatar_color || 'red');
      if (!nome) throw new HttpError(400, 'Informe o nome do perfil.');

      const { rows } = await query(
        `UPDATE perfil
         SET id_usuario = $1, nome = $2, infantil = $3, classificacao_max = $4, avatar_color = $5
         WHERE id_perfil = $6
         RETURNING *`,
        [idUsuario, nome, infantil, classificacaoMax, avatarColor, id]
      );
      if (!rows[0]) throw new HttpError(404, 'Perfil não encontrado.');
      return rows[0];
    },
    async remove(key) {
      const id = toInt(key, 'perfil');
      const { rowCount } = await query('DELETE FROM perfil WHERE id_perfil = $1', [id]);
      if (rowCount === 0) throw new HttpError(404, 'Perfil não encontrado.');
    },
  },

  generos: {
    async list() {
      const { rows } = await query('SELECT * FROM genero ORDER BY id_genero ASC');
      return rows;
    },
    async create(payload) {
      const nome = String(payload.nome || '').trim();
      const descricao = String(payload.descricao || '').trim();
      if (!nome) throw new HttpError(400, 'Informe o nome do gênero.');
      if (!descricao) throw new HttpError(400, 'Informe uma descrição para o gênero.');

      const { rows } = await query(
        `INSERT INTO genero (nome, descricao)
         VALUES ($1, $2)
         RETURNING *`,
        [nome, descricao]
      );
      return rows[0];
    },
    async update(key, payload) {
      const id = toInt(key, 'gênero');
      const nome = String(payload.nome || '').trim();
      const descricao = String(payload.descricao || '').trim();
      if (!nome) throw new HttpError(400, 'Informe o nome do gênero.');
      if (!descricao) throw new HttpError(400, 'Informe a descrição do gênero.');

      const { rows } = await query(
        `UPDATE genero SET nome = $1, descricao = $2 WHERE id_genero = $3 RETURNING *`,
        [nome, descricao, id]
      );
      if (!rows[0]) throw new HttpError(404, 'Gênero não encontrado.');
      return rows[0];
    },
    async remove(key) {
      const id = toInt(key, 'gênero');
      const { rowCount } = await query('DELETE FROM genero WHERE id_genero = $1', [id]);
      if (rowCount === 0) throw new HttpError(404, 'Gênero não encontrado.');
    },
  },

  pessoas: {
    async list() {
      const { rows } = await query('SELECT * FROM pessoa ORDER BY id_pessoa ASC');
      return rows;
    },
    async create(payload) {
      const nome = String(payload.nome || '').trim();
      const dataNascimento = String(payload.data_nascimento || '').trim();
      const nacionalidade = String(payload.nacionalidade || '').trim();
      if (!nome) throw new HttpError(400, 'Informe o nome da pessoa.');
      if (!dataNascimento) throw new HttpError(400, 'Informe a data de nascimento.');
      if (!nacionalidade) throw new HttpError(400, 'Informe a nacionalidade.');

      const { rows } = await query(
        `INSERT INTO pessoa (nome, data_nascimento, nacionalidade)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [nome, dataNascimento, nacionalidade]
      );
      return rows[0];
    },
    async update(key, payload) {
      const id = toInt(key, 'pessoa');
      const nome = String(payload.nome || '').trim();
      const dataNascimento = String(payload.data_nascimento || '').trim();
      const nacionalidade = String(payload.nacionalidade || '').trim();
      if (!nome) throw new HttpError(400, 'Informe o nome da pessoa.');
      if (!dataNascimento) throw new HttpError(400, 'Informe a data de nascimento.');
      if (!nacionalidade) throw new HttpError(400, 'Informe a nacionalidade.');

      const { rows } = await query(
        `UPDATE pessoa
         SET nome = $1, data_nascimento = $2, nacionalidade = $3
         WHERE id_pessoa = $4
         RETURNING *`,
        [nome, dataNascimento, nacionalidade, id]
      );
      if (!rows[0]) throw new HttpError(404, 'Pessoa não encontrada.');
      return rows[0];
    },
    async remove(key) {
      const id = toInt(key, 'pessoa');
      const { rowCount } = await query('DELETE FROM pessoa WHERE id_pessoa = $1', [id]);
      if (rowCount === 0) throw new HttpError(404, 'Pessoa não encontrada.');
    },
  },

  filmes: {
    async list() {
      const { rows } = await query(
        `SELECT f.*,
                COALESCE(ARRAY_AGG(pa.id_genero ORDER BY pa.id_genero)
                         FILTER (WHERE pa.id_genero IS NOT NULL), '{}') AS generos
         FROM filme f
         LEFT JOIN pertence_a pa ON pa.id_filme = f.id_filme
         GROUP BY f.id_filme
         ORDER BY f.id_filme ASC`
      );
      return rows;
    },
    async create(payload) {
      const titulo = String(payload.titulo || '').trim();
      const tituloOriginal = String(payload.titulo_original || '').trim() || titulo;
      const anoLancamento = Number(payload.ano_lancamento);
      const sinopse = String(payload.sinopse || '').trim();
      const duracaoMin = Number(payload.duracao_min);
      const classificacao = String(payload.classificacao || '12').trim();
      const dataInclusao = String(payload.data_inclusao || todayIsoDate()).trim();
      const idDiretor = toInt(payload.id_diretor, 'diretor');
      const generos = normalizeGenreIds(payload.generos);
      const capaUrl = String(payload.capa_url || '').trim();
      const capaTema = String(payload.capa_tema || 'noir').trim();

      if (!titulo) throw new HttpError(400, 'Informe o título do filme.');
      if (!sinopse) throw new HttpError(400, 'Informe a sinopse do filme.');
      if (!Number.isInteger(anoLancamento)) throw new HttpError(400, 'Ano de lançamento inválido.');
      if (!Number.isInteger(duracaoMin)) throw new HttpError(400, 'Duração inválida.');
      if (generos.length === 0) {
        throw new HttpError(
          400,
          'Selecione ao menos 1 gênero válido (participação total em Pertence_a).'
        );
      }

      return withTransaction(async (client) => {
        const { rows } = await client.query(
          `INSERT INTO filme (
              titulo, titulo_original, ano_lancamento, sinopse, duracao_min,
              classificacao, data_inclusao, id_diretor, capa_url, capa_tema
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id_filme`,
          [
            titulo,
            tituloOriginal,
            anoLancamento,
            sinopse,
            duracaoMin,
            classificacao,
            dataInclusao,
            idDiretor,
            capaUrl,
            capaTema,
          ]
        );
        const idFilme = rows[0].id_filme;

        for (const idGenero of generos) {
          await client.query('INSERT INTO pertence_a (id_filme, id_genero) VALUES ($1, $2)', [
            idFilme,
            idGenero,
          ]);
        }

        return fetchMovieWithGenres(client, idFilme);
      });
    },
    async update(key, payload) {
      const id = toInt(key, 'filme');
      const titulo = String(payload.titulo || '').trim();
      const tituloOriginal = String(payload.titulo_original || '').trim() || titulo;
      const anoLancamento = Number(payload.ano_lancamento);
      const sinopse = String(payload.sinopse || '').trim();
      const duracaoMin = Number(payload.duracao_min);
      const classificacao = String(payload.classificacao || '12').trim();
      const idDiretor = toInt(payload.id_diretor, 'diretor');
      const generos = normalizeGenreIds(payload.generos);
      const capaUrl = String(payload.capa_url || '').trim();
      const capaTema = String(payload.capa_tema || 'noir').trim();

      if (!titulo) throw new HttpError(400, 'Informe o título do filme.');
      if (!sinopse) throw new HttpError(400, 'Informe a sinopse do filme.');
      if (!Number.isInteger(anoLancamento)) throw new HttpError(400, 'Ano de lançamento inválido.');
      if (!Number.isInteger(duracaoMin)) throw new HttpError(400, 'Duração inválida.');
      if (generos.length === 0) {
        throw new HttpError(
          400,
          'Selecione ao menos 1 gênero válido (participação total em Pertence_a).'
        );
      }

      return withTransaction(async (client) => {
        const cur = await client.query('SELECT data_inclusao FROM filme WHERE id_filme = $1', [id]);
        if (!cur.rows[0]) throw new HttpError(404, 'Filme não encontrado.');

        const dataInclusao = String(payload.data_inclusao || cur.rows[0].data_inclusao).trim();

        await client.query(
          `UPDATE filme
           SET titulo = $1, titulo_original = $2, ano_lancamento = $3, sinopse = $4,
               duracao_min = $5, classificacao = $6, data_inclusao = $7, id_diretor = $8,
               capa_url = $9, capa_tema = $10
           WHERE id_filme = $11`,
          [
            titulo,
            tituloOriginal,
            anoLancamento,
            sinopse,
            duracaoMin,
            classificacao,
            dataInclusao,
            idDiretor,
            capaUrl,
            capaTema,
            id,
          ]
        );

        await client.query('DELETE FROM pertence_a WHERE id_filme = $1', [id]);
        for (const idGenero of generos) {
          await client.query('INSERT INTO pertence_a (id_filme, id_genero) VALUES ($1, $2)', [
            id,
            idGenero,
          ]);
        }

        return fetchMovieWithGenres(client, id);
      });
    },
    async remove(key) {
      const id = toInt(key, 'filme');
      const { rowCount } = await query('DELETE FROM filme WHERE id_filme = $1', [id]);
      if (rowCount === 0) throw new HttpError(404, 'Filme não encontrado.');
    },
  },

  pertence_a: {
    async list() {
      const { rows } = await query(
        'SELECT id_filme, id_genero FROM pertence_a ORDER BY id_filme ASC, id_genero ASC'
      );
      return rows;
    },
    async create(payload) {
      const idFilme = toInt(payload.id_filme, 'filme');
      const idGenero = toInt(payload.id_genero, 'gênero');
      const { rows } = await query(
        'INSERT INTO pertence_a (id_filme, id_genero) VALUES ($1, $2) RETURNING *',
        [idFilme, idGenero]
      );
      return rows[0];
    },
    async remove(idFilmeRaw, idGeneroRaw) {
      const idFilme = toInt(idFilmeRaw, 'filme');
      const idGenero = toInt(idGeneroRaw, 'gênero');
      const { rowCount } = await query(
        'DELETE FROM pertence_a WHERE id_filme = $1 AND id_genero = $2',
        [idFilme, idGenero]
      );
      if (rowCount === 0) {
        throw new HttpError(404, 'Associação Filme-Gênero não encontrada.');
      }
    },
  },

  atua: {
    async list() {
      const { rows } = await query('SELECT * FROM atua ORDER BY id_atua ASC');
      return rows;
    },
    async create(payload) {
      const idPessoa = toInt(payload.id_pessoa, 'profissional');
      const idFilme = toInt(payload.id_filme, 'filme');
      const funcao = String(payload.funcao || '').trim();
      const personagem = String(payload.personagem || '').trim();
      if (!funcao) throw new HttpError(400, 'Informe a função no elenco.');
      if (!personagem) throw new HttpError(400, 'Informe o nome do personagem.');

      const { rows } = await query(
        `INSERT INTO atua (id_pessoa, id_filme, funcao, personagem)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [idPessoa, idFilme, funcao, personagem]
      );
      return rows[0];
    },
    async update(key, payload) {
      const id = toInt(key, 'atuação');
      const idPessoa = toInt(payload.id_pessoa, 'profissional');
      const idFilme = toInt(payload.id_filme, 'filme');
      const funcao = String(payload.funcao || '').trim();
      const personagem = String(payload.personagem || '').trim();
      if (!funcao) throw new HttpError(400, 'Informe a função no elenco.');
      if (!personagem) throw new HttpError(400, 'Informe o nome do personagem.');

      const { rows } = await query(
        `UPDATE atua
         SET id_pessoa = $1, id_filme = $2, funcao = $3, personagem = $4
         WHERE id_atua = $5
         RETURNING *`,
        [idPessoa, idFilme, funcao, personagem, id]
      );
      if (!rows[0]) throw new HttpError(404, 'Registro de elenco não encontrado.');
      return rows[0];
    },
    async remove(key) {
      const id = toInt(key, 'atuação');
      const { rowCount } = await query('DELETE FROM atua WHERE id_atua = $1', [id]);
      if (rowCount === 0) throw new HttpError(404, 'Registro de elenco não encontrado.');
    },
  },

  visualizacoes: {
    async list() {
      const { rows } = await query('SELECT * FROM visualizacao ORDER BY id_visualizacao ASC');
      return rows;
    },
    async create(payload) {
      const idPerfil = toInt(payload.id_perfil, 'perfil');
      const idFilme = toInt(payload.id_filme, 'filme');
      const dataHoraInicio = String(payload.data_hora_inicio || nowIsoDateTime()).trim();
      const minutosAssistidos = Number(payload.minutos_assistidos);
      const conclusao = Boolean(payload.conclusao);

      if (!Number.isInteger(minutosAssistidos) || minutosAssistidos < 1) {
        throw new HttpError(400, 'Os minutos assistidos devem ser no mínimo 1.');
      }

      const { rows } = await query(
        `INSERT INTO visualizacao (id_perfil, id_filme, data_hora_inicio, minutos_assistidos, conclusao)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [idPerfil, idFilme, dataHoraInicio, minutosAssistidos, conclusao]
      );
      return rows[0];
    },
    async update(key, payload) {
      const id = toInt(key, 'visualização');
      const idPerfil = toInt(payload.id_perfil, 'perfil');
      const idFilme = toInt(payload.id_filme, 'filme');
      const dataHoraInicio = String(payload.data_hora_inicio || '').trim();
      const minutosAssistidos = Number(payload.minutos_assistidos);
      const conclusao = Boolean(payload.conclusao);

      if (!dataHoraInicio) throw new HttpError(400, 'Informe a data e hora de início.');
      if (!Number.isInteger(minutosAssistidos) || minutosAssistidos < 1) {
        throw new HttpError(400, 'Os minutos assistidos devem ser no mínimo 1.');
      }

      const { rows } = await query(
        `UPDATE visualizacao
         SET id_perfil = $1, id_filme = $2, data_hora_inicio = $3,
             minutos_assistidos = $4, conclusao = $5
         WHERE id_visualizacao = $6
         RETURNING *`,
        [idPerfil, idFilme, dataHoraInicio, minutosAssistidos, conclusao, id]
      );
      if (!rows[0]) throw new HttpError(404, 'Visualização não encontrada.');
      return rows[0];
    },
    async remove(key) {
      const id = toInt(key, 'visualização');
      const { rowCount } = await query('DELETE FROM visualizacao WHERE id_visualizacao = $1', [id]);
      if (rowCount === 0) throw new HttpError(404, 'Visualização não encontrada.');
    },
  },

  avaliacoes: {
    async list() {
      const { rows } = await query('SELECT * FROM avalia ORDER BY id_perfil ASC, id_filme ASC');
      return rows;
    },
    async create(payload) {
      const idPerfil = toInt(payload.id_perfil, 'perfil');
      const idFilme = toInt(payload.id_filme, 'filme');
      const nota = Number(payload.nota);
      const dataAvaliacao = String(payload.data_avaliacao || todayIsoDate()).trim();
      const comentario = String(payload.comentario || '').trim();

      if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
        throw new HttpError(400, 'A nota deve ser um número inteiro entre 1 e 5.');
      }

      const { rows } = await query(
        `INSERT INTO avalia (id_perfil, id_filme, nota, data_avaliacao, comentario)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [idPerfil, idFilme, nota, dataAvaliacao, comentario]
      );
      return rows[0];
    },
    async update(key, payload) {
      const [origPerfil, origFilme] = parseCompositeKey(key);
      const idPerfil = Number.isInteger(Number(payload.id_perfil))
        ? Number(payload.id_perfil)
        : origPerfil;
      const idFilme = Number.isInteger(Number(payload.id_filme))
        ? Number(payload.id_filme)
        : origFilme;
      const nota = Number(payload.nota);
      const dataAvaliacao = String(payload.data_avaliacao || todayIsoDate()).trim();
      const comentario = String(payload.comentario || '').trim();

      if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
        throw new HttpError(400, 'A nota deve ser um número inteiro entre 1 e 5.');
      }

      const { rows } = await query(
        `UPDATE avalia
         SET id_perfil = $1, id_filme = $2, nota = $3, data_avaliacao = $4, comentario = $5
         WHERE id_perfil = $6 AND id_filme = $7
         RETURNING *`,
        [idPerfil, idFilme, nota, dataAvaliacao, comentario, origPerfil, origFilme]
      );
      if (!rows[0]) throw new HttpError(404, 'Avaliação não encontrada.');
      return rows[0];
    },
    async remove(key) {
      const [idPerfil, idFilme] = parseCompositeKey(key);
      const { rowCount } = await query(
        'DELETE FROM avalia WHERE id_perfil = $1 AND id_filme = $2',
        [idPerfil, idFilme]
      );
      if (rowCount === 0) throw new HttpError(404, 'Avaliação não encontrada.');
    },
  },
};
