import { SEED_DATA } from './seedData.js';
import {
  AVATAR_COLORS,
  RATING_ORDER,
  canProfileWatch,
  normalizeCpf,
  nowIsoDateTime,
  todayIsoDate,
} from '../utils/formatters.js';

export const STORAGE_KEY = 'lumiere_db_v1';

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function createInitialState() {
  return clone(SEED_DATA);
}

export function loadState() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return createInitialState();
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    const requiredKeys = [
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
    for (const key of requiredKeys) {
      if (!Array.isArray(parsed[key])) {
        return createInitialState();
      }
    }
    return parsed;
  } catch {
    return createInitialState();
  }
}

export function saveState(state) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // Ignore storage quota issues gracefully
  }
}

export function resetState() {
  const fresh = createInitialState();
  saveState(fresh);
  return fresh;
}

function nextId(rows, field) {
  let max = 0;
  for (const row of rows) {
    const val = Number(row[field]) || 0;
    if (val > max) max = val;
  }
  return max + 1;
}

function ok(state, record = null) {
  return { ok: true, state, record };
}

function fail(error) {
  return { ok: false, error };
}

/**
 * Pure relational CRUD dispatcher for all 10 tables/relationships in Lumiere.
 * Enforces DER cardinality constraints and domain rules.
 */
export function createRecord(state, table, payload) {
  const next = clone(state);

  switch (table) {
    case 'planos': {
      const nome = String(payload.nome || '').trim();
      const preco = Number(payload.preco_mensal);
      const telas = Number(payload.max_telas);
      const qualidade = String(payload.qualidade_max || '').trim();
      if (!nome) return fail('Informe o nome do plano.');
      if (!Number.isFinite(preco) || preco <= 0) return fail('Preço mensal deve ser maior que zero.');
      if (!Number.isInteger(telas) || telas < 1) return fail('Quantidade máxima de telas deve ser no mínimo 1.');
      if (!qualidade) return fail('Informe a qualidade máxima de exibição.');
      if (next.planos.some((p) => p.nome.toLowerCase() === nome.toLowerCase())) {
        return fail('Já existe um plano cadastrado com esse nome.');
      }
      const record = {
        id_plano: nextId(next.planos, 'id_plano'),
        nome,
        preco_mensal: Number(preco.toFixed(2)),
        max_telas: telas,
        qualidade_max: qualidade,
      };
      next.planos.push(record);
      return ok(next, record);
    }

    case 'usuarios': {
      const nome = String(payload.nome || '').trim();
      const email = String(payload.email || '').trim().toLowerCase();
      const cpf = normalizeCpf(payload.cpf);
      const senha = String(payload.senha || '').trim() || '••••••••';
      const dataNascimento = String(payload.data_nascimento || '').trim();
      const dataCadastro = String(payload.data_cadastro || todayIsoDate()).trim();
      const perfilInicialNome = String(payload.perfil_inicial_nome || '').trim() || nome.split(' ')[0] || 'Principal';

      if (!nome) return fail('Informe o nome completo do usuário.');
      if (!email || !email.includes('@')) return fail('Informe um endereço de e-mail válido.');
      if (cpf.replace(/\D/g, '').length !== 11) return fail('Informe um CPF válido com 11 dígitos.');
      if (!dataNascimento) return fail('Informe a data de nascimento.');
      if (next.usuarios.some((u) => u.email.toLowerCase() === email)) {
        return fail('Já existe um usuário cadastrado com este e-mail.');
      }
      if (next.usuarios.some((u) => normalizeCpf(u.cpf) === cpf)) {
        return fail('Já existe um usuário cadastrado com este CPF.');
      }

      const id_usuario = nextId(next.usuarios, 'id_usuario');
      const record = {
        id_usuario,
        nome,
        email,
        cpf,
        senha,
        data_nascimento: dataNascimento,
        data_cadastro: dataCadastro,
      };
      next.usuarios.push(record);

      // Enforces total participation (1,N) of Usuario in Possui -> Perfil
      const colorIndex = (id_usuario - 1) % AVATAR_COLORS.length;
      next.perfis.push({
        id_perfil: nextId(next.perfis, 'id_perfil'),
        id_usuario,
        nome: perfilInicialNome,
        infantil: false,
        classificacao_max: '18',
        avatar_color: AVATAR_COLORS[colorIndex].key,
      });

      return ok(next, record);
    }

    case 'assinaturas': {
      const id_usuario = Number(payload.id_usuario);
      const id_plano = Number(payload.id_plano);
      const data_inicio = String(payload.data_inicio || todayIsoDate()).trim();
      const data_fim = String(payload.data_fim || '').trim();
      const situacao = String(payload.situacao || 'Ativa').trim();

      if (!next.usuarios.some((u) => u.id_usuario === id_usuario)) {
        return fail('Selecione um usuário válido para a assinatura.');
      }
      if (!next.planos.some((p) => p.id_plano === id_plano)) {
        return fail('Selecione um plano válido para a assinatura.');
      }
      if (!data_inicio) return fail('Informe a data de início da assinatura.');
      if (data_fim && data_fim < data_inicio) {
        return fail('A data de encerramento não pode ser anterior à data de início.');
      }

      const record = {
        id_assinatura: nextId(next.assinaturas, 'id_assinatura'),
        id_usuario,
        id_plano,
        data_inicio,
        data_fim,
        situacao,
      };
      next.assinaturas.push(record);
      return ok(next, record);
    }

    case 'perfis': {
      const id_usuario = Number(payload.id_usuario);
      const nome = String(payload.nome || '').trim();
      const infantil = Boolean(payload.infantil);
      const classificacao_max = String(payload.classificacao_max || (infantil ? 'L' : '18'));
      const avatar_color = String(payload.avatar_color || 'red');

      if (!next.usuarios.some((u) => u.id_usuario === id_usuario)) {
        return fail('Selecione a conta titular do perfil.');
      }
      if (!nome) return fail('Informe o nome de exibição do perfil.');
      if (infantil && RATING_ORDER[classificacao_max] > 12) {
        return fail('Perfis infantis aceitam classificação máxima até 12 anos (L, 10 ou 12).');
      }

      const record = {
        id_perfil: nextId(next.perfis, 'id_perfil'),
        id_usuario,
        nome,
        infantil,
        classificacao_max,
        avatar_color,
      };
      next.perfis.push(record);
      return ok(next, record);
    }

    case 'generos': {
      const nome = String(payload.nome || '').trim();
      const descricao = String(payload.descricao || '').trim();
      if (!nome) return fail('Informe o nome do gênero.');
      if (!descricao) return fail('Informe uma breve descrição para o gênero.');
      if (next.generos.some((g) => g.nome.toLowerCase() === nome.toLowerCase())) {
        return fail('Já existe um gênero com esse nome.');
      }
      const record = {
        id_genero: nextId(next.generos, 'id_genero'),
        nome,
        descricao,
      };
      next.generos.push(record);
      return ok(next, record);
    }

    case 'pessoas': {
      const nome = String(payload.nome || '').trim();
      const data_nascimento = String(payload.data_nascimento || '').trim();
      const nacionalidade = String(payload.nacionalidade || '').trim();
      if (!nome) return fail('Informe o nome da pessoa.');
      if (!data_nascimento) return fail('Informe a data de nascimento.');
      if (!nacionalidade) return fail('Informe a nacionalidade.');
      const record = {
        id_pessoa: nextId(next.pessoas, 'id_pessoa'),
        nome,
        data_nascimento,
        nacionalidade,
      };
      next.pessoas.push(record);
      return ok(next, record);
    }

    case 'filmes': {
      const titulo = String(payload.titulo || '').trim();
      const titulo_original = String(payload.titulo_original || '').trim() || titulo;
      const ano_lancamento = Number(payload.ano_lancamento);
      const sinopse = String(payload.sinopse || '').trim();
      const duracao_min = Number(payload.duracao_min);
      const classificacao = String(payload.classificacao || '12');
      const data_inclusao = String(payload.data_inclusao || todayIsoDate()).trim();
      const id_diretor = Number(payload.id_diretor);
      const generos = Array.isArray(payload.generos)
        ? [...new Set(payload.generos.map(Number).filter(Boolean))]
        : [];
      const capa_url = String(payload.capa_url || '').trim();
      const capa_tema = String(payload.capa_tema || 'noir').trim();

      if (!titulo) return fail('Informe o título do filme.');
      if (!Number.isInteger(ano_lancamento) || ano_lancamento < 1895 || ano_lancamento > 2035) {
        return fail('Informe um ano de lançamento válido (1895 a 2035).');
      }
      if (!sinopse) return fail('Informe a sinopse do filme.');
      if (!Number.isInteger(duracao_min) || duracao_min <= 0) {
        return fail('A duração em minutos deve ser maior que zero.');
      }
      if (!next.pessoas.some((p) => p.id_pessoa === id_diretor)) {
        return fail('Todo filme exige um diretor válido (participação total em Direção).');
      }
      if (generos.length === 0 || !generos.every((gid) => next.generos.some((g) => g.id_genero === gid))) {
        return fail('Selecione ao menos 1 gênero válido (participação total em Pertence_a).');
      }

      const record = {
        id_filme: nextId(next.filmes, 'id_filme'),
        titulo,
        titulo_original,
        ano_lancamento,
        sinopse,
        duracao_min,
        classificacao,
        data_inclusao,
        id_diretor,
        generos,
        capa_url,
        capa_tema,
      };
      next.filmes.push(record);
      return ok(next, record);
    }

    case 'atua': {
      const id_pessoa = Number(payload.id_pessoa);
      const id_filme = Number(payload.id_filme);
      const funcao = String(payload.funcao || '').trim();
      const personagem = String(payload.personagem || '').trim();

      if (!next.pessoas.some((p) => p.id_pessoa === id_pessoa)) {
        return fail('Selecione um profissional válido.');
      }
      if (!next.filmes.some((f) => f.id_filme === id_filme)) {
        return fail('Selecione um filme válido.');
      }
      if (!funcao) return fail('Informe a função no elenco (ex.: Protagonista, Coadjuvante).');
      if (!personagem) return fail('Informe o nome do personagem.');
      if (
        next.atua.some(
          (a) =>
            a.id_pessoa === id_pessoa &&
            a.id_filme === id_filme &&
            a.personagem.toLowerCase() === personagem.toLowerCase()
        )
      ) {
        return fail('Esta pessoa já possui este personagem cadastrado no filme selecionado.');
      }

      const record = {
        id_atua: nextId(next.atua, 'id_atua'),
        id_pessoa,
        id_filme,
        funcao,
        personagem,
      };
      next.atua.push(record);
      return ok(next, record);
    }

    case 'visualizacoes': {
      const id_perfil = Number(payload.id_perfil);
      const id_filme = Number(payload.id_filme);
      const data_hora_inicio = String(payload.data_hora_inicio || nowIsoDateTime()).trim();
      const minutos_assistidos = Number(payload.minutos_assistidos);
      const conclusao = Boolean(payload.conclusao);

      const perfil = next.perfis.find((p) => p.id_perfil === id_perfil);
      const filme = next.filmes.find((f) => f.id_filme === id_filme);

      if (!perfil) return fail('Selecione um perfil válido.');
      if (!filme) return fail('Selecione um filme válido.');
      if (!canProfileWatch(perfil, filme)) {
        return fail(
          `Controle parental: o perfil "${perfil.nome}" (até ${perfil.classificacao_max}) não tem permissão para assistir "${filme.titulo}" (${filme.classificacao}).`
        );
      }
      if (!Number.isInteger(minutos_assistidos) || minutos_assistidos < 1 || minutos_assistidos > filme.duracao_min) {
        return fail(`Os minutos assistidos devem estar entre 1 e ${filme.duracao_min} min.`);
      }

      const record = {
        id_visualizacao: nextId(next.visualizacoes, 'id_visualizacao'),
        id_perfil,
        id_filme,
        data_hora_inicio,
        minutos_assistidos,
        conclusao,
      };
      next.visualizacoes.push(record);
      return ok(next, record);
    }

    case 'avaliacoes': {
      const id_perfil = Number(payload.id_perfil);
      const id_filme = Number(payload.id_filme);
      const nota = Number(payload.nota);
      const data_avaliacao = String(payload.data_avaliacao || todayIsoDate()).trim();
      const comentario = String(payload.comentario || '').trim();

      const perfil = next.perfis.find((p) => p.id_perfil === id_perfil);
      const filme = next.filmes.find((f) => f.id_filme === id_filme);

      if (!perfil) return fail('Selecione um perfil válido.');
      if (!filme) return fail('Selecione um filme válido.');
      if (!canProfileWatch(perfil, filme)) {
        return fail(
          `Controle parental: o perfil "${perfil.nome}" não pode avaliar obras acima de sua classificação (${perfil.classificacao_max}).`
        );
      }
      if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
        return fail('A nota deve ser um número inteiro entre 1 e 5.');
      }
      if (next.avaliacoes.some((a) => a.id_perfil === id_perfil && a.id_filme === id_filme)) {
        return fail('Este perfil já avaliou este filme (chave composta Perfil + Filme). Edite a avaliação existente.');
      }

      const record = {
        id_perfil,
        id_filme,
        nota,
        data_avaliacao,
        comentario,
      };
      next.avaliacoes.push(record);
      return ok(next, record);
    }

    default:
      return fail(`Tabela desconhecida: ${table}`);
  }
}

export function updateRecord(state, table, key, payload) {
  const next = clone(state);

  switch (table) {
    case 'planos': {
      const idx = next.planos.findIndex((p) => p.id_plano === Number(key));
      if (idx === -1) return fail('Plano não encontrado.');
      const nome = String(payload.nome || '').trim();
      const preco = Number(payload.preco_mensal);
      const telas = Number(payload.max_telas);
      const qualidade = String(payload.qualidade_max || '').trim();
      if (!nome) return fail('Informe o nome do plano.');
      if (!Number.isFinite(preco) || preco <= 0) return fail('Preço mensal deve ser maior que zero.');
      if (!Number.isInteger(telas) || telas < 1) return fail('Quantidade máxima de telas deve ser no mínimo 1.');
      if (!qualidade) return fail('Informe a qualidade máxima.');
      if (next.planos.some((p) => p.id_plano !== Number(key) && p.nome.toLowerCase() === nome.toLowerCase())) {
        return fail('Já existe outro plano com esse nome.');
      }
      next.planos[idx] = {
        id_plano: Number(key),
        nome,
        preco_mensal: Number(preco.toFixed(2)),
        max_telas: telas,
        qualidade_max: qualidade,
      };
      return ok(next, next.planos[idx]);
    }

    case 'usuarios': {
      const idx = next.usuarios.findIndex((u) => u.id_usuario === Number(key));
      if (idx === -1) return fail('Usuário não encontrado.');
      const nome = String(payload.nome || '').trim();
      const email = String(payload.email || '').trim().toLowerCase();
      const cpf = normalizeCpf(payload.cpf);
      const senha = String(payload.senha || '').trim() || next.usuarios[idx].senha;
      const data_nascimento = String(payload.data_nascimento || '').trim();
      const data_cadastro = String(payload.data_cadastro || next.usuarios[idx].data_cadastro).trim();

      if (!nome) return fail('Informe o nome do usuário.');
      if (!email || !email.includes('@')) return fail('Informe um e-mail válido.');
      if (cpf.replace(/\D/g, '').length !== 11) return fail('Informe um CPF válido com 11 dígitos.');
      if (!data_nascimento) return fail('Informe a data de nascimento.');
      if (next.usuarios.some((u) => u.id_usuario !== Number(key) && u.email.toLowerCase() === email)) {
        return fail('E-mail já utilizado por outro usuário.');
      }
      if (next.usuarios.some((u) => u.id_usuario !== Number(key) && normalizeCpf(u.cpf) === cpf)) {
        return fail('CPF já utilizado por outro usuário.');
      }

      next.usuarios[idx] = {
        id_usuario: Number(key),
        nome,
        email,
        cpf,
        senha,
        data_nascimento,
        data_cadastro,
      };
      return ok(next, next.usuarios[idx]);
    }

    case 'assinaturas': {
      const idx = next.assinaturas.findIndex((a) => a.id_assinatura === Number(key));
      if (idx === -1) return fail('Assinatura não encontrada.');
      const id_usuario = Number(payload.id_usuario);
      const id_plano = Number(payload.id_plano);
      const data_inicio = String(payload.data_inicio || '').trim();
      const data_fim = String(payload.data_fim || '').trim();
      const situacao = String(payload.situacao || 'Ativa').trim();

      if (!next.usuarios.some((u) => u.id_usuario === id_usuario)) return fail('Usuário inválido.');
      if (!next.planos.some((p) => p.id_plano === id_plano)) return fail('Plano inválido.');
      if (!data_inicio) return fail('Informe a data de início.');
      if (data_fim && data_fim < data_inicio) {
        return fail('A data de encerramento não pode ser anterior à data de início.');
      }

      next.assinaturas[idx] = {
        id_assinatura: Number(key),
        id_usuario,
        id_plano,
        data_inicio,
        data_fim,
        situacao,
      };
      return ok(next, next.assinaturas[idx]);
    }

    case 'perfis': {
      const idx = next.perfis.findIndex((p) => p.id_perfil === Number(key));
      if (idx === -1) return fail('Perfil não encontrado.');
      const id_usuario = Number(payload.id_usuario);
      const nome = String(payload.nome || '').trim();
      const infantil = Boolean(payload.infantil);
      const classificacao_max = String(payload.classificacao_max || '18');
      const avatar_color = String(payload.avatar_color || next.perfis[idx].avatar_color || 'red');

      if (!next.usuarios.some((u) => u.id_usuario === id_usuario)) return fail('Conta titular inválida.');
      if (!nome) return fail('Informe o nome do perfil.');
      if (infantil && RATING_ORDER[classificacao_max] > 12) {
        return fail('Perfis infantis aceitam classificação máxima até 12 anos (L, 10 ou 12).');
      }

      // Ensure old owner doesn't end up with 0 profiles if id_usuario changed
      const previousOwner = next.perfis[idx].id_usuario;
      if (previousOwner !== id_usuario) {
        const remaining = next.perfis.filter((p) => p.id_usuario === previousOwner && p.id_perfil !== Number(key));
        if (remaining.length === 0) {
          return fail('Não é possível transferir este perfil pois o usuário original ficaria sem nenhum perfil (regra 1,N).');
        }
      }

      next.perfis[idx] = {
        id_perfil: Number(key),
        id_usuario,
        nome,
        infantil,
        classificacao_max,
        avatar_color,
      };
      return ok(next, next.perfis[idx]);
    }

    case 'generos': {
      const idx = next.generos.findIndex((g) => g.id_genero === Number(key));
      if (idx === -1) return fail('Gênero não encontrado.');
      const nome = String(payload.nome || '').trim();
      const descricao = String(payload.descricao || '').trim();
      if (!nome) return fail('Informe o nome do gênero.');
      if (!descricao) return fail('Informe a descrição do gênero.');
      if (next.generos.some((g) => g.id_genero !== Number(key) && g.nome.toLowerCase() === nome.toLowerCase())) {
        return fail('Já existe outro gênero com esse nome.');
      }
      next.generos[idx] = { id_genero: Number(key), nome, descricao };
      return ok(next, next.generos[idx]);
    }

    case 'pessoas': {
      const idx = next.pessoas.findIndex((p) => p.id_pessoa === Number(key));
      if (idx === -1) return fail('Pessoa não encontrada.');
      const nome = String(payload.nome || '').trim();
      const data_nascimento = String(payload.data_nascimento || '').trim();
      const nacionalidade = String(payload.nacionalidade || '').trim();
      if (!nome) return fail('Informe o nome da pessoa.');
      if (!data_nascimento) return fail('Informe a data de nascimento.');
      if (!nacionalidade) return fail('Informe a nacionalidade.');
      next.pessoas[idx] = { id_pessoa: Number(key), nome, data_nascimento, nacionalidade };
      return ok(next, next.pessoas[idx]);
    }

    case 'filmes': {
      const idx = next.filmes.findIndex((f) => f.id_filme === Number(key));
      if (idx === -1) return fail('Filme não encontrado.');
      const titulo = String(payload.titulo || '').trim();
      const titulo_original = String(payload.titulo_original || '').trim() || titulo;
      const ano_lancamento = Number(payload.ano_lancamento);
      const sinopse = String(payload.sinopse || '').trim();
      const duracao_min = Number(payload.duracao_min);
      const classificacao = String(payload.classificacao || '12');
      const data_inclusao = String(payload.data_inclusao || next.filmes[idx].data_inclusao).trim();
      const id_diretor = Number(payload.id_diretor);
      const generos = Array.isArray(payload.generos)
        ? [...new Set(payload.generos.map(Number).filter(Boolean))]
        : [];
      const capa_url = String(payload.capa_url || '').trim();
      const capa_tema = String(payload.capa_tema || next.filmes[idx].capa_tema || 'noir').trim();

      if (!titulo) return fail('Informe o título do filme.');
      if (!Number.isInteger(ano_lancamento) || ano_lancamento < 1895 || ano_lancamento > 2035) {
        return fail('Informe um ano de lançamento válido.');
      }
      if (!sinopse) return fail('Informe a sinopse.');
      if (!Number.isInteger(duracao_min) || duracao_min <= 0) {
        return fail('A duração em minutos deve ser maior que zero.');
      }
      if (!next.pessoas.some((p) => p.id_pessoa === id_diretor)) {
        return fail('Selecione um diretor válido.');
      }
      if (generos.length === 0 || !generos.every((gid) => next.generos.some((g) => g.id_genero === gid))) {
        return fail('Selecione ao menos 1 gênero.');
      }

      next.filmes[idx] = {
        id_filme: Number(key),
        titulo,
        titulo_original,
        ano_lancamento,
        sinopse,
        duracao_min,
        classificacao,
        data_inclusao,
        id_diretor,
        generos,
        capa_url,
        capa_tema,
      };
      return ok(next, next.filmes[idx]);
    }

    case 'atua': {
      const idx = next.atua.findIndex((a) => a.id_atua === Number(key));
      if (idx === -1) return fail('Registro de elenco não encontrado.');
      const id_pessoa = Number(payload.id_pessoa);
      const id_filme = Number(payload.id_filme);
      const funcao = String(payload.funcao || '').trim();
      const personagem = String(payload.personagem || '').trim();
      if (!next.pessoas.some((p) => p.id_pessoa === id_pessoa)) return fail('Pessoa inválida.');
      if (!next.filmes.some((f) => f.id_filme === id_filme)) return fail('Filme inválido.');
      if (!funcao) return fail('Informe a função.');
      if (!personagem) return fail('Informe o personagem.');
      if (
        next.atua.some(
          (a) =>
            a.id_atua !== Number(key) &&
            a.id_pessoa === id_pessoa &&
            a.id_filme === id_filme &&
            a.personagem.toLowerCase() === personagem.toLowerCase()
        )
      ) {
        return fail('Participação duplicada para esta pessoa neste filme.');
      }
      next.atua[idx] = { id_atua: Number(key), id_pessoa, id_filme, funcao, personagem };
      return ok(next, next.atua[idx]);
    }

    case 'visualizacoes': {
      const idx = next.visualizacoes.findIndex((v) => v.id_visualizacao === Number(key));
      if (idx === -1) return fail('Visualização não encontrada.');
      const id_perfil = Number(payload.id_perfil);
      const id_filme = Number(payload.id_filme);
      const data_hora_inicio = String(payload.data_hora_inicio || '').trim();
      const minutos_assistidos = Number(payload.minutos_assistidos);
      const conclusao = Boolean(payload.conclusao);

      const perfil = next.perfis.find((p) => p.id_perfil === id_perfil);
      const filme = next.filmes.find((f) => f.id_filme === id_filme);
      if (!perfil) return fail('Perfil inválido.');
      if (!filme) return fail('Filme inválido.');
      if (!canProfileWatch(perfil, filme)) {
        return fail(
          `Controle parental: o perfil "${perfil.nome}" (até ${perfil.classificacao_max}) não pode assistir "${filme.titulo}" (${filme.classificacao}).`
        );
      }
      if (!Number.isInteger(minutos_assistidos) || minutos_assistidos < 1 || minutos_assistidos > filme.duracao_min) {
        return fail(`Os minutos assistidos devem estar entre 1 e ${filme.duracao_min} min.`);
      }

      next.visualizacoes[idx] = {
        id_visualizacao: Number(key),
        id_perfil,
        id_filme,
        data_hora_inicio,
        minutos_assistidos,
        conclusao,
      };
      return ok(next, next.visualizacoes[idx]);
    }

    case 'avaliacoes': {
      // key is `${id_perfil}-${id_filme}`
      const [origPerfil, origFilme] = String(key).split('-').map(Number);
      const idx = next.avaliacoes.findIndex(
        (a) => a.id_perfil === origPerfil && a.id_filme === origFilme
      );
      if (idx === -1) return fail('Avaliação não encontrada.');
      const id_perfil = Number(payload.id_perfil);
      const id_filme = Number(payload.id_filme);
      const nota = Number(payload.nota);
      const data_avaliacao = String(payload.data_avaliacao || todayIsoDate()).trim();
      const comentario = String(payload.comentario || '').trim();

      const perfil = next.perfis.find((p) => p.id_perfil === id_perfil);
      const filme = next.filmes.find((f) => f.id_filme === id_filme);
      if (!perfil || !filme) return fail('Perfil ou filme inválido.');
      if (!canProfileWatch(perfil, filme)) {
        return fail('Controle parental impede avaliação desta obra pelo perfil selecionado.');
      }
      if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
        return fail('A nota deve ser um número inteiro de 1 a 5.');
      }
      if (
        (id_perfil !== origPerfil || id_filme !== origFilme) &&
        next.avaliacoes.some((a) => a.id_perfil === id_perfil && a.id_filme === id_filme)
      ) {
        return fail('Já existe avaliação para esta combinação de Perfil e Filme.');
      }

      next.avaliacoes[idx] = { id_perfil, id_filme, nota, data_avaliacao, comentario };
      return ok(next, next.avaliacoes[idx]);
    }

    default:
      return fail(`Tabela desconhecida: ${table}`);
  }
}

export function deleteRecord(state, table, key) {
  const next = clone(state);

  switch (table) {
    case 'planos': {
      const id = Number(key);
      const deps = next.assinaturas.filter((a) => a.id_plano === id).length;
      if (deps > 0) {
        return fail(`Integridade referencial: este plano possui ${deps} assinatura(s) vinculada(s).`);
      }
      next.planos = next.planos.filter((p) => p.id_plano !== id);
      return ok(next);
    }

    case 'usuarios': {
      const id = Number(key);
      const assins = next.assinaturas.filter((a) => a.id_usuario === id).length;
      const perfs = next.perfis.filter((p) => p.id_usuario === id).length;
      if (assins > 0 || perfs > 0) {
        return fail(
          `Integridade referencial: remova antes ${perfs} perfil(is) e ${assins} assinatura(s) vinculados ao usuário.`
        );
      }
      next.usuarios = next.usuarios.filter((u) => u.id_usuario !== id);
      return ok(next);
    }

    case 'assinaturas': {
      const id = Number(key);
      next.assinaturas = next.assinaturas.filter((a) => a.id_assinatura !== id);
      return ok(next);
    }

    case 'perfis': {
      const id = Number(key);
      const target = next.perfis.find((p) => p.id_perfil === id);
      if (!target) return fail('Perfil não encontrado.');
      const userProfiles = next.perfis.filter((p) => p.id_usuario === target.id_usuario);
      if (userProfiles.length <= 1) {
        return fail('Regra 1,N: todo usuário precisa manter ao menos 1 perfil ativo.');
      }
      const views = next.visualizacoes.filter((v) => v.id_perfil === id).length;
      const reviews = next.avaliacoes.filter((a) => a.id_perfil === id).length;
      if (views > 0 || reviews > 0) {
        return fail(
          `Integridade referencial: perfil possui ${views} visualização(ões) e ${reviews} avaliação(ões).`
        );
      }
      next.perfis = next.perfis.filter((p) => p.id_perfil !== id);
      return ok(next);
    }

    case 'generos': {
      const id = Number(key);
      const linkedMovies = next.filmes.filter((f) => f.generos.includes(id)).length;
      if (linkedMovies > 0) {
        return fail(
          `Integridade referencial: ${linkedMovies} filme(s) utilizam este gênero em Pertence_a.`
        );
      }
      next.generos = next.generos.filter((g) => g.id_genero !== id);
      return ok(next);
    }

    case 'pessoas': {
      const id = Number(key);
      const directed = next.filmes.filter((f) => f.id_diretor === id).length;
      const acted = next.atua.filter((a) => a.id_pessoa === id).length;
      if (directed > 0 || acted > 0) {
        return fail(
          `Integridade referencial: pessoa vinculada a ${directed} direção(ões) e ${acted} atuação(ões).`
        );
      }
      next.pessoas = next.pessoas.filter((p) => p.id_pessoa !== id);
      return ok(next);
    }

    case 'filmes': {
      const id = Number(key);
      const views = next.visualizacoes.filter((v) => v.id_filme === id).length;
      const reviews = next.avaliacoes.filter((a) => a.id_filme === id).length;
      const cast = next.atua.filter((a) => a.id_filme === id).length;
      if (views > 0 || reviews > 0 || cast > 0) {
        return fail(
          `Integridade referencial: filme possui ${cast} crédito(s) de elenco, ${views} visualização(ões) e ${reviews} avaliação(ões).`
        );
      }
      next.filmes = next.filmes.filter((f) => f.id_filme !== id);
      return ok(next);
    }

    case 'atua': {
      const id = Number(key);
      next.atua = next.atua.filter((a) => a.id_atua !== id);
      return ok(next);
    }

    case 'visualizacoes': {
      const id = Number(key);
      next.visualizacoes = next.visualizacoes.filter((v) => v.id_visualizacao !== id);
      return ok(next);
    }

    case 'avaliacoes': {
      const [id_perfil, id_filme] = String(key).split('-').map(Number);
      next.avaliacoes = next.avaliacoes.filter(
        (a) => !(a.id_perfil === id_perfil && a.id_filme === id_filme)
      );
      return ok(next);
    }

    default:
      return fail(`Tabela desconhecida: ${table}`);
  }
}

/**
 * Computes all 5 analytical SQL reports dynamically from current database state.
 */
export function computeReports(state, options = {}) {
  const situacaoFilter = options.situacaoFilter || 'Todas';
  const minViews = Number.isFinite(Number(options.minViews)) ? Number(options.minViews) : 2;

  // 1. INNER JOIN (Usuario + Assinatura + Plano)
  const report1Rows = state.assinaturas
    .map((a) => {
      const usuario = state.usuarios.find((u) => u.id_usuario === a.id_usuario);
      const plano = state.planos.find((p) => p.id_plano === a.id_plano);
      if (!usuario || !plano) return null;
      return {
        id_assinatura: a.id_assinatura,
        titular: usuario.nome,
        email: usuario.email,
        plano: plano.nome,
        preco_mensal: plano.preco_mensal,
        qualidade_max: plano.qualidade_max,
        data_inicio: a.data_inicio,
        situacao: a.situacao,
      };
    })
    .filter(Boolean)
    .filter((row) => situacaoFilter === 'Todas' || row.situacao === situacaoFilter)
    .sort((a, b) => a.id_assinatura - b.id_assinatura);

  const report1 = {
    id: 'inner_join',
    badge: '1 · INNER JOIN',
    title: 'Assinaturas com titular e detalhes do plano',
    description:
      'Junção interna entre Usuario, Assinatura e Plano, exibindo contratos, valores mensais e qualidade máxima contratada.',
    sql: `SELECT a.id_assinatura, u.nome AS titular, u.email,
       p.nome AS plano, p.preco_mensal, p.qualidade_max,
       a.data_inicio, a.situacao
FROM Assinatura a
INNER JOIN Usuario u ON u.id_usuario = a.id_usuario
INNER JOIN Plano p   ON p.id_plano   = a.id_plano${
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
    rows: report1Rows,
    meta: { count: report1Rows.length },
  };

  // 2. LEFT JOIN (Filme + Pessoa diretor + Visualizacao)
  const report2Rows = state.filmes
    .map((f) => {
      const diretor = state.pessoas.find((p) => p.id_pessoa === f.id_diretor);
      const views = state.visualizacoes.filter((v) => v.id_filme === f.id_filme);
      const totalMinutos = views.reduce((acc, v) => acc + v.minutos_assistidos, 0);
      const concluidas = views.filter((v) => v.conclusao).length;
      return {
        id_filme: f.id_filme,
        titulo: f.titulo,
        ano_lancamento: f.ano_lancamento,
        diretor: diretor ? diretor.nome : '-',
        total_visualizacoes: views.length,
        concluidas,
        minutos_totais: totalMinutos,
      };
    })
    .sort((a, b) => b.total_visualizacoes - a.total_visualizacoes || a.id_filme - b.id_filme);

  const report2 = {
    id: 'left_join',
    badge: '2 · LEFT JOIN',
    title: 'Catálogo completo e sessões de visualização (inclui obras sem exibição)',
    description:
      'Junção externa à esquerda preservando todos os filmes do catálogo mesmo quando ainda não possuem registros na tabela Visualizacao.',
    sql: `SELECT f.id_filme, f.titulo, f.ano_lancamento,
       d.nome AS diretor,
       COUNT(v.id_visualizacao) AS total_visualizacoes,
       SUM(CASE WHEN v.conclusao THEN 1 ELSE 0 END) AS concluidas,
       COALESCE(SUM(v.minutos_assistidos), 0) AS minutos_totais
FROM Filme f
INNER JOIN Pessoa d       ON d.id_pessoa = f.id_diretor
LEFT JOIN Visualizacao v  ON v.id_filme  = f.id_filme
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
    rows: report2Rows,
    meta: { zeroViewsCount: report2Rows.filter((r) => r.total_visualizacoes === 0).length },
  };

  // 3. GROUP BY (Genero + Pertence_a + Filme + Visualizacao + Avalia)
  const genreAggregates = state.generos
    .map((g) => {
      const filmesDoGenero = state.filmes.filter((f) => f.generos.includes(g.id_genero));
      const movieIds = new Set(filmesDoGenero.map((f) => f.id_filme));
      const views = state.visualizacoes.filter((v) => movieIds.has(v.id_filme));
      const reviews = state.avaliacoes.filter((a) => movieIds.has(a.id_filme));
      const avgNota =
        reviews.length > 0
          ? Number((reviews.reduce((sum, r) => sum + r.nota, 0) / reviews.length).toFixed(2))
          : null;
      return {
        id_genero: g.id_genero,
        genero: g.nome,
        qtd_filmes: filmesDoGenero.length,
        total_visualizacoes: views.length,
        minutos_totais: views.reduce((sum, v) => sum + v.minutos_assistidos, 0),
        nota_media: avgNota,
      };
    })
    .sort((a, b) => b.total_visualizacoes - a.total_visualizacoes || a.genero.localeCompare(b.genero));

  const report3 = {
    id: 'group_by',
    badge: '3 · GROUP BY',
    title: 'Desempenho do catálogo agrupado por gênero',
    description:
      'Agrupamento combinando Genero, Pertence_a, Filme, Visualizacao e Avalia para consolidar volume de exibição e nota média por categoria.',
    sql: `SELECT g.nome AS genero,
       COUNT(DISTINCT f.id_filme) AS qtd_filmes,
       COUNT(DISTINCT v.id_visualizacao) AS total_visualizacoes,
       COALESCE(SUM(v.minutos_assistidos), 0) AS minutos_totais,
       ROUND(AVG(a.nota), 2) AS nota_media
FROM Genero g
LEFT JOIN Pertence_a pa   ON pa.id_genero = g.id_genero
LEFT JOIN Filme f         ON f.id_filme   = pa.id_filme
LEFT JOIN Visualizacao v  ON v.id_filme   = f.id_filme
LEFT JOIN Avalia a        ON a.id_filme   = f.id_filme
GROUP BY g.id_genero, g.nome
ORDER BY total_visualizacoes DESC;`,
    columns: [
      { key: 'genero', label: 'Gênero' },
      { key: 'qtd_filmes', label: 'Filmes' },
      { key: 'total_visualizacoes', label: 'Visualizações' },
      { key: 'minutos_totais', label: 'Minutos totais' },
      { key: 'nota_media', label: 'Nota média', format: 'rating' },
    ],
    rows: genreAggregates,
    meta: { count: genreAggregates.length },
  };

  // 4. HAVING (derived from report 3)
  const havingRows = genreAggregates.filter((row) => row.total_visualizacoes >= minViews);

  const report4 = {
    id: 'having',
    badge: '4 · HAVING',
    title: `Gêneros com pelo menos ${minViews} visualização(ões)`,
    description:
      'Filtra os grupos da consulta anterior usando a cláusula HAVING sobre a contagem agregada de visualizações.',
    sql: `SELECT g.nome AS genero,
       COUNT(DISTINCT f.id_filme) AS qtd_filmes,
       COUNT(DISTINCT v.id_visualizacao) AS total_visualizacoes,
       COALESCE(SUM(v.minutos_assistidos), 0) AS minutos_totais,
       ROUND(AVG(a.nota), 2) AS nota_media
FROM Genero g
LEFT JOIN Pertence_a pa   ON pa.id_genero = g.id_genero
LEFT JOIN Filme f         ON f.id_filme   = pa.id_filme
LEFT JOIN Visualizacao v  ON v.id_filme   = f.id_filme
LEFT JOIN Avalia a        ON a.id_filme   = f.id_filme
GROUP BY g.id_genero, g.nome
HAVING COUNT(DISTINCT v.id_visualizacao) >= ${minViews}
ORDER BY total_visualizacoes DESC;`,
    columns: report3.columns,
    rows: havingRows,
    meta: { minViews, count: havingRows.length },
  };

  // 5. SUBCONSULTA (films rated strictly above global average)
  const totalReviews = state.avaliacoes.length;
  const globalAvg =
    totalReviews > 0
      ? Number((state.avaliacoes.reduce((sum, a) => sum + a.nota, 0) / totalReviews).toFixed(2))
      : 0;

  const subqueryRows = state.filmes
    .map((f) => {
      const reviews = state.avaliacoes.filter((a) => a.id_filme === f.id_filme);
      if (reviews.length === 0) return null;
      const avg = Number((reviews.reduce((sum, r) => sum + r.nota, 0) / reviews.length).toFixed(2));
      if (avg <= globalAvg) return null;
      const diretor = state.pessoas.find((p) => p.id_pessoa === f.id_diretor);
      return {
        id_filme: f.id_filme,
        titulo: f.titulo,
        diretor: diretor ? diretor.nome : '-',
        qtd_avaliacoes: reviews.length,
        nota_media: avg,
        diferenca_media: Number((avg - globalAvg).toFixed(2)),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.nota_media - a.nota_media || b.qtd_avaliacoes - a.qtd_avaliacoes);

  const report5 = {
    id: 'subconsulta',
    badge: '5 · SUBCONSULTA',
    title: 'Filmes com nota média acima da média global do catálogo',
    description:
      'Subconsulta escalar que calcula a média global de Avalia e retorna apenas filmes cuja média supera esse patamar.',
    sql: `SELECT f.id_filme, f.titulo, d.nome AS diretor,
       COUNT(a.id_perfil) AS qtd_avaliacoes,
       ROUND(AVG(a.nota), 2) AS nota_media
FROM Filme f
INNER JOIN Pessoa d ON d.id_pessoa = f.id_diretor
INNER JOIN Avalia a ON a.id_filme  = f.id_filme
GROUP BY f.id_filme, f.titulo, d.nome
HAVING AVG(a.nota) > (
  SELECT AVG(nota) FROM Avalia
)
ORDER BY nota_media DESC, qtd_avaliacoes DESC;`,
    columns: [
      { key: 'titulo', label: 'Filme' },
      { key: 'diretor', label: 'Direção' },
      { key: 'qtd_avaliacoes', label: 'Avaliações' },
      { key: 'nota_media', label: 'Nota média', format: 'rating' },
      { key: 'diferenca_media', label: 'Acima da média' },
    ],
    rows: subqueryRows,
    meta: { globalAvg, totalReviews },
  };

  return [report1, report2, report3, report4, report5];
}
