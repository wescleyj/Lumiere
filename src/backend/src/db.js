import pg from 'pg';
import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

// Preserva DATE ('YYYY-MM-DD') e TIMESTAMP ('YYYY-MM-DDTHH:MM') sem conversão de fuso horário
pg.types.setTypeParser(1082, (val) => val);
pg.types.setTypeParser(1114, (val) => (val ? val.replace(' ', 'T').slice(0, 16) : val));
pg.types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));
pg.types.setTypeParser(20, (val) => (val === null ? null : parseInt(val, 10)));

const connectionString =
  process.env.DATABASE_URL || 'postgresql://lumiere:lumiere@localhost:5432/lumiere';

export const pool = new pg.Pool({ connectionString });

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function query(sql, params = []) {
  return pool.query(sql, params);
}

export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

const UNIQUE_MESSAGES = {
  plano_nome_key: 'Já existe um plano cadastrado com esse nome.',
  usuario_email_key: 'Já existe um usuário cadastrado com este e-mail.',
  usuario_cpf_key: 'Já existe um usuário cadastrado com este CPF.',
  genero_nome_key: 'Já existe um gênero cadastrado com esse nome.',
  uq_atua_pessoa_filme_personagem:
    'Esta pessoa já possui este personagem cadastrado no filme selecionado.',
  avalia_pkey: 'Este perfil já avaliou este filme (chave composta Perfil + Filme). Edite a avaliação existente.',
  pertence_a_pkey: 'Este filme já está associado ao gênero selecionado.',
};

const CHECK_MESSAGES = {
  plano_preco_mensal_check: 'O preço mensal do plano deve ser maior que zero.',
  plano_max_telas_check: 'A quantidade máxima de telas deve ser no mínimo 1.',
  plano_qualidade_max_check: 'Qualidade máxima inválida (use HD, Full HD ou 4K).',
  usuario_email_check: 'Informe um endereço de e-mail válido.',
  usuario_cpf_check: 'Informe um CPF válido no formato 000.000.000-00.',
  ck_usuario_datas: 'A data de cadastro não pode ser anterior à data de nascimento.',
  assinatura_situacao_check: 'Situação da assinatura inválida (Ativa, Cancelada ou Suspensa).',
  ck_assinatura_vigencia: 'A data de encerramento não pode ser anterior à data de início.',
  perfil_classificacao_max_check: 'Classificação máxima inválida (L, 10, 12, 14, 16 ou 18).',
  perfil_avatar_color_check: 'Cor de avatar inválida (red, amber, teal, cobalt, emerald ou zinc).',
  ck_perfil_infantil_class: 'Perfis infantis aceitam classificação máxima até 12 anos (L, 10 ou 12).',
  filme_ano_lancamento_check: 'Informe um ano de lançamento válido (entre 1895 e 2035).',
  filme_duracao_min_check: 'A duração do filme em minutos deve ser maior que zero.',
  filme_classificacao_check: 'Classificação indicativa inválida (L, 10, 12, 14, 16 ou 18).',
  filme_capa_tema_check: 'Tema de capa inválido (noir, amber, cyan, emerald, crimson ou slate).',
  visualizacao_minutos_assistidos_check: 'Os minutos assistidos devem ser maiores que zero.',
  avalia_nota_check: 'A nota da avaliação deve ser um inteiro entre 1 e 5.',
};

/**
 * Converte erros do PostgreSQL (triggers, constraints e sintaxe) em status HTTP e mensagens claras.
 */
export function mapPgError(err) {
  if (err instanceof HttpError) {
    return { status: err.status, message: err.message };
  }

  switch (err?.code) {
    case 'P0001':
      return { status: 400, message: err.message };

    case '23505':
      return {
        status: 409,
        message: UNIQUE_MESSAGES[err.constraint] || 'Registro duplicado: valor único já existente.',
      };

    case '23503': {
      const detail = String(err.detail || '');
      const isReferenced =
        detail.includes('still referenced') || detail.includes('ainda é referenciada');
      if (isReferenced) {
        return {
          status: 409,
          message: `Integridade referencial: existem registros vinculados na tabela "${err.table || 'dependente'}" que impedem a exclusão.`,
        };
      }
      return {
        status: 400,
        message: 'Referência inválida: um dos registros relacionados informados não existe.',
      };
    }

    case '23514':
      return {
        status: 400,
        message:
          CHECK_MESSAGES[err.constraint] ||
          'Os dados informados violam uma restrição de domínio do banco.',
      };

    case '23502':
      return {
        status: 400,
        message: `Campo obrigatório não informado: ${err.column || 'campo requerido'}.`,
      };

    case '22P02':
    case '22007':
    case '22008':
      return {
        status: 400,
        message: 'Formato de dado, número ou data inválido.',
      };

    default:
      return {
        status: 500,
        message: 'Erro interno ao processar operação no banco de dados.',
      };
  }
}
