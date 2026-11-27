export const EMPTY_DB = {
  planos: [],
  usuarios: [],
  assinaturas: [],
  perfis: [],
  generos: [],
  pessoas: [],
  filmes: [],
  atua: [],
  visualizacoes: [],
  avaliacoes: [],
};

const API_BASE = '/api';

async function requestJson(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return {
        ok: false,
        error:
          data?.error ||
          `Erro HTTP ${response.status} ao comunicar com o servidor Lumiere.`,
      };
    }

    return data || { ok: true };
  } catch {
    return {
      ok: false,
      error:
        'Não foi possível conectar ao servidor back-end (/api). Verifique se a API Node.js e o PostgreSQL estão em execução.',
    };
  }
}

export async function fetchState() {
  return requestJson('/state', { method: 'GET' });
}

export async function createRecordApi(table, payload) {
  return requestJson(`/${encodeURIComponent(table)}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateRecordApi(table, key, payload) {
  return requestJson(`/${encodeURIComponent(table)}/${encodeURIComponent(String(key))}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteRecordApi(table, key) {
  return requestJson(`/${encodeURIComponent(table)}/${encodeURIComponent(String(key))}`, {
    method: 'DELETE',
  });
}

export async function resetDatabaseApi() {
  return requestJson('/reset', { method: 'POST' });
}

export async function fetchReportsApi({ situacaoFilter = 'Todas', minViews = 2 } = {}) {
  const params = new URLSearchParams({
    situacao: String(situacaoFilter || 'Todas'),
    minViews: String(Number.isFinite(Number(minViews)) ? Number(minViews) : 2),
  });
  return requestJson(`/reports?${params.toString()}`, { method: 'GET' });
}
