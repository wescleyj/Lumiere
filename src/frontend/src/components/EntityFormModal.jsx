import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import MoviePoster from './MoviePoster.jsx';
import {
  AVATAR_COLORS,
  POSTER_THEMES,
  RATINGS,
  nowIsoDateTime,
  todayIsoDate,
} from '../utils/formatters.js';

const TABLE_LABELS = {
  filmes: 'Filme',
  generos: 'Gênero',
  pessoas: 'Pessoa (Diretor / Elenco)',
  atua: 'Participação no Elenco (Atua)',
  usuarios: 'Usuário Titular',
  perfis: 'Perfil de Acesso',
  planos: 'Plano Comercial',
  assinaturas: 'Assinatura',
  visualizacoes: 'Visualização',
  avaliacoes: 'Avaliação (Avalia)',
};

function buildInitialForm(table, db, record) {
  if (record) return { ...record };

  switch (table) {
    case 'filmes':
      return {
        titulo: '',
        titulo_original: '',
        ano_lancamento: 2026,
        sinopse: '',
        duracao_min: 110,
        classificacao: '12',
        data_inclusao: todayIsoDate(),
        id_diretor: db.pessoas[0]?.id_pessoa || '',
        generos: db.generos[0] ? [db.generos[0].id_genero] : [],
        capa_url: '',
        capa_tema: 'noir',
      };
    case 'generos':
      return { nome: '', descricao: '' };
    case 'pessoas':
      return { nome: '', data_nascimento: '1985-01-01', nacionalidade: 'Brasil' };
    case 'atua':
      return {
        id_pessoa: db.pessoas[0]?.id_pessoa || '',
        id_filme: db.filmes[0]?.id_filme || '',
        funcao: 'Protagonista',
        personagem: '',
      };
    case 'usuarios':
      return {
        nome: '',
        email: '',
        cpf: '',
        senha: '••••••••',
        data_nascimento: '1995-01-01',
        data_cadastro: todayIsoDate(),
        perfil_inicial_nome: '',
      };
    case 'perfis':
      return {
        id_usuario: db.usuarios[0]?.id_usuario || '',
        nome: '',
        infantil: false,
        classificacao_max: '18',
        avatar_color: 'red',
      };
    case 'planos':
      return { nome: '', preco_mensal: 39.9, max_telas: 2, qualidade_max: 'Full HD' };
    case 'assinaturas':
      return {
        id_usuario: db.usuarios[0]?.id_usuario || '',
        id_plano: db.planos[0]?.id_plano || '',
        data_inicio: todayIsoDate(),
        data_fim: '',
        situacao: 'Ativa',
      };
    case 'visualizacoes':
      return {
        id_perfil: db.perfis[0]?.id_perfil || '',
        id_filme: db.filmes[0]?.id_filme || '',
        data_hora_inicio: nowIsoDateTime(),
        minutos_assistidos: 60,
        conclusao: false,
      };
    case 'avaliacoes':
      return {
        id_perfil: db.perfis[0]?.id_perfil || '',
        id_filme: db.filmes[0]?.id_filme || '',
        nota: 5,
        data_avaliacao: todayIsoDate(),
        comentario: '',
      };
    default:
      return {};
  }
}

export default function EntityFormModal({
  open,
  table,
  record,
  db,
  onSubmit,
  onClose,
}) {
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(record);

  useEffect(() => {
    if (open) {
      setForm(buildInitialForm(table, db, record));
      setError('');
      setSubmitting(false);
    }
  }, [open, table, record]);

  if (!open) return null;

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleMovieGenre = (idGenero) => {
    const current = Array.isArray(form.generos) ? form.generos : [];
    if (current.includes(idGenero)) {
      setField(
        'generos',
        current.filter((id) => id !== idGenero)
      );
    } else {
      setField('generos', [...current, idGenero]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await onSubmit(table, form, record);
      if (res && !res.ok) {
        setError(res.error || 'Erro ao salvar registro.');
      } else {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDirectorName =
    db.pessoas.find((p) => p.id_pessoa === Number(form.id_diretor))?.nome || '';

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="entity-form-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal-dialog ${table === 'filmes' ? 'modal-dialog-lg' : ''}`}>
        <div className="modal-header">
          <h2 id="entity-form-title" className="modal-title">
            {isEditing ? 'Editar' : 'Novo'} {TABLE_LABELS[table] || table}
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar formulário">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}

            {table === 'filmes' && (
              <div className="movie-form-split">
                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="f-titulo" className="field-label">Título *</label>
                    <input
                      id="f-titulo"
                      className="input-control"
                      value={form.titulo || ''}
                      onChange={(e) => setField('titulo', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="f-orig" className="field-label">Título original</label>
                    <input
                      id="f-orig"
                      className="input-control"
                      value={form.titulo_original || ''}
                      onChange={(e) => setField('titulo_original', e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="f-diretor" className="field-label">Direção (Direcao 1,1) *</label>
                    <select
                      id="f-diretor"
                      className="input-control"
                      value={form.id_diretor || ''}
                      onChange={(e) => setField('id_diretor', Number(e.target.value))}
                      required
                    >
                      {db.pessoas.map((p) => (
                        <option key={p.id_pessoa} value={p.id_pessoa}>{p.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="f-ano" className="field-label">Ano de lançamento *</label>
                    <input
                      id="f-ano"
                      type="number"
                      min={1895}
                      max={2035}
                      className="input-control"
                      value={form.ano_lancamento || ''}
                      onChange={(e) => setField('ano_lancamento', Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="f-dur" className="field-label">Duração (min) *</label>
                    <input
                      id="f-dur"
                      type="number"
                      min={1}
                      className="input-control"
                      value={form.duracao_min || ''}
                      onChange={(e) => setField('duracao_min', Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="f-class" className="field-label">Classificação indicativa *</label>
                    <select
                      id="f-class"
                      className="input-control"
                      value={form.classificacao || '12'}
                      onChange={(e) => setField('classificacao', e.target.value)}
                    >
                      {RATINGS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="f-tema" className="field-label">Paleta da capa padrão</label>
                    <select
                      id="f-tema"
                      className="input-control"
                      value={form.capa_tema || 'noir'}
                      onChange={(e) => setField('capa_tema', e.target.value)}
                    >
                      {POSTER_THEMES.map((t) => (
                        <option key={t.key} value={t.key}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="f-inc" className="field-label">Data de inclusão</label>
                    <input
                      id="f-inc"
                      type="date"
                      className="input-control"
                      value={form.data_inclusao || ''}
                      onChange={(e) => setField('data_inclusao', e.target.value)}
                    />
                  </div>
                  <div className="form-field form-field-full">
                    <label htmlFor="f-capa" className="field-label">URL da capa (opcional)</label>
                    <input
                      id="f-capa"
                      type="url"
                      className="input-control"
                      placeholder="https://... (deixe vazio para usar capa tipográfica integrada)"
                      value={form.capa_url || ''}
                      onChange={(e) => setField('capa_url', e.target.value)}
                    />
                  </div>
                  <div className="form-field form-field-full">
                    <span className="field-label">Gêneros (Pertence_a, mínimo 1) *</span>
                    <div className="genre-toggle-grid">
                      {db.generos.map((g) => {
                        const selected = (form.generos || []).includes(g.id_genero);
                        return (
                          <button
                            key={g.id_genero}
                            type="button"
                            className={`genre-pill ${selected ? 'is-active' : ''}`}
                            onClick={() => toggleMovieGenre(g.id_genero)}
                          >
                            {g.nome}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="form-field form-field-full">
                    <label htmlFor="f-sinopse" className="field-label">Sinopse *</label>
                    <textarea
                      id="f-sinopse"
                      className="input-control"
                      value={form.sinopse || ''}
                      onChange={(e) => setField('sinopse', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="field-label" style={{ marginBottom: 8 }}>Prévia da capa</div>
                  <MoviePoster
                    filme={{
                      titulo: form.titulo || 'Título do Filme',
                      ano_lancamento: form.ano_lancamento || 2026,
                      classificacao: form.classificacao || '12',
                      capa_url: form.capa_url || '',
                      capa_tema: form.capa_tema || 'noir',
                    }}
                    directorName={selectedDirectorName}
                  />
                </div>
              </div>
            )}

            {table === 'generos' && (
              <div className="form-grid">
                <div className="form-field form-field-full">
                  <label htmlFor="g-nome" className="field-label">Nome do gênero *</label>
                  <input
                    id="g-nome"
                    className="input-control"
                    value={form.nome || ''}
                    onChange={(e) => setField('nome', e.target.value)}
                    required
                  />
                </div>
                <div className="form-field form-field-full">
                  <label htmlFor="g-desc" className="field-label">Descrição *</label>
                  <textarea
                    id="g-desc"
                    className="input-control"
                    value={form.descricao || ''}
                    onChange={(e) => setField('descricao', e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {table === 'pessoas' && (
              <div className="form-grid">
                <div className="form-field form-field-full">
                  <label htmlFor="p-nome" className="field-label">Nome completo ou artístico *</label>
                  <input
                    id="p-nome"
                    className="input-control"
                    value={form.nome || ''}
                    onChange={(e) => setField('nome', e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="p-nasc" className="field-label">Data de nascimento *</label>
                  <input
                    id="p-nasc"
                    type="date"
                    className="input-control"
                    value={form.data_nascimento || ''}
                    onChange={(e) => setField('data_nascimento', e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="p-nac" className="field-label">Nacionalidade *</label>
                  <input
                    id="p-nac"
                    className="input-control"
                    value={form.nacionalidade || ''}
                    onChange={(e) => setField('nacionalidade', e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {table === 'atua' && (
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="at-pessoa" className="field-label">Ator / Atriz *</label>
                  <select
                    id="at-pessoa"
                    className="input-control"
                    value={form.id_pessoa || ''}
                    onChange={(e) => setField('id_pessoa', Number(e.target.value))}
                  >
                    {db.pessoas.map((p) => (
                      <option key={p.id_pessoa} value={p.id_pessoa}>{p.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="at-filme" className="field-label">Filme *</label>
                  <select
                    id="at-filme"
                    className="input-control"
                    value={form.id_filme || ''}
                    onChange={(e) => setField('id_filme', Number(e.target.value))}
                  >
                    {db.filmes.map((f) => (
                      <option key={f.id_filme} value={f.id_filme}>{f.titulo}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="at-funcao" className="field-label">Função no elenco *</label>
                  <select
                    id="at-funcao"
                    className="input-control"
                    value={form.funcao || 'Protagonista'}
                    onChange={(e) => setField('funcao', e.target.value)}
                  >
                    <option value="Protagonista">Protagonista</option>
                    <option value="Coadjuvante">Coadjuvante</option>
                    <option value="Participação Especial">Participação Especial</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="at-pers" className="field-label">Personagem *</label>
                  <input
                    id="at-pers"
                    className="input-control"
                    value={form.personagem || ''}
                    onChange={(e) => setField('personagem', e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {table === 'usuarios' && (
              <div className="form-grid">
                <div className="form-field form-field-full">
                  <label htmlFor="u-nome" className="field-label">Nome completo *</label>
                  <input
                    id="u-nome"
                    className="input-control"
                    value={form.nome || ''}
                    onChange={(e) => setField('nome', e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="u-email" className="field-label">E-mail *</label>
                  <input
                    id="u-email"
                    type="email"
                    className="input-control"
                    value={form.email || ''}
                    onChange={(e) => setField('email', e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="u-cpf" className="field-label">CPF *</label>
                  <input
                    id="u-cpf"
                    className="input-control"
                    placeholder="000.000.000-00"
                    value={form.cpf || ''}
                    onChange={(e) => setField('cpf', e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="u-nasc" className="field-label">Data de nascimento *</label>
                  <input
                    id="u-nasc"
                    type="date"
                    className="input-control"
                    value={form.data_nascimento || ''}
                    onChange={(e) => setField('data_nascimento', e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="u-senha" className="field-label">Senha de acesso *</label>
                  <input
                    id="u-senha"
                    type="password"
                    className="input-control"
                    value={form.senha || ''}
                    onChange={(e) => setField('senha', e.target.value)}
                    required
                  />
                </div>
                {!isEditing && (
                  <div className="form-field form-field-full">
                    <label htmlFor="u-perfil" className="field-label">
                      Nome do perfil inicial (criado automaticamente pela regra 1,N)
                    </label>
                    <input
                      id="u-perfil"
                      className="input-control"
                      placeholder="Ex.: Principal (se vazio, usa o primeiro nome)"
                      value={form.perfil_inicial_nome || ''}
                      onChange={(e) => setField('perfil_inicial_nome', e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {table === 'perfis' && (
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="pf-user" className="field-label">Usuário titular *</label>
                  <select
                    id="pf-user"
                    className="input-control"
                    value={form.id_usuario || ''}
                    onChange={(e) => setField('id_usuario', Number(e.target.value))}
                  >
                    {db.usuarios.map((u) => (
                      <option key={u.id_usuario} value={u.id_usuario}>{u.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="pf-nome" className="field-label">Nome do perfil *</label>
                  <input
                    id="pf-nome"
                    className="input-control"
                    value={form.nome || ''}
                    onChange={(e) => setField('nome', e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="pf-class" className="field-label">Classificação máxima *</label>
                  <select
                    id="pf-class"
                    className="input-control"
                    value={form.classificacao_max || '18'}
                    onChange={(e) => setField('classificacao_max', e.target.value)}
                  >
                    {RATINGS.map((r) => (
                      <option key={r} value={r}>Até {r}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="pf-cor" className="field-label">Cor do avatar</label>
                  <select
                    id="pf-cor"
                    className="input-control"
                    value={form.avatar_color || 'red'}
                    onChange={(e) => setField('avatar_color', e.target.value)}
                  >
                    {AVATAR_COLORS.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field form-field-full">
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={Boolean(form.infantil)}
                      onChange={(e) => {
                        const isKids = e.target.checked;
                        setField('infantil', isKids);
                        if (isKids && !['L', '10', '12'].includes(String(form.classificacao_max))) {
                          setField('classificacao_max', 'L');
                        }
                      }}
                    />
                    <span>Perfil infantil (limita classificação máxima até 12 anos)</span>
                  </label>
                </div>
              </div>
            )}

            {table === 'planos' && (
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="pl-nome" className="field-label">Nome comercial *</label>
                  <input
                    id="pl-nome"
                    className="input-control"
                    value={form.nome || ''}
                    onChange={(e) => setField('nome', e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="pl-preco" className="field-label">Preço mensal (R$) *</label>
                  <input
                    id="pl-preco"
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="input-control"
                    value={form.preco_mensal || ''}
                    onChange={(e) => setField('preco_mensal', e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="pl-telas" className="field-label">Telas simultâneas *</label>
                  <input
                    id="pl-telas"
                    type="number"
                    min={1}
                    className="input-control"
                    value={form.max_telas || 1}
                    onChange={(e) => setField('max_telas', Number(e.target.value))}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="pl-qual" className="field-label">Qualidade máxima *</label>
                  <select
                    id="pl-qual"
                    className="input-control"
                    value={form.qualidade_max || 'Full HD'}
                    onChange={(e) => setField('qualidade_max', e.target.value)}
                  >
                    <option value="HD">HD (720p)</option>
                    <option value="Full HD">Full HD (1080p)</option>
                    <option value="4K">4K + HDR</option>
                  </select>
                </div>
              </div>
            )}

            {table === 'assinaturas' && (
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="as-user" className="field-label">Usuário *</label>
                  <select
                    id="as-user"
                    className="input-control"
                    value={form.id_usuario || ''}
                    onChange={(e) => setField('id_usuario', Number(e.target.value))}
                  >
                    {db.usuarios.map((u) => (
                      <option key={u.id_usuario} value={u.id_usuario}>{u.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="as-plano" className="field-label">Plano *</label>
                  <select
                    id="as-plano"
                    className="input-control"
                    value={form.id_plano || ''}
                    onChange={(e) => setField('id_plano', Number(e.target.value))}
                  >
                    {db.planos.map((p) => (
                      <option key={p.id_plano} value={p.id_plano}>{p.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="as-ini" className="field-label">Data de início *</label>
                  <input
                    id="as-ini"
                    type="date"
                    className="input-control"
                    value={form.data_inicio || ''}
                    onChange={(e) => setField('data_inicio', e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="as-fim" className="field-label">Data de encerramento</label>
                  <input
                    id="as-fim"
                    type="date"
                    className="input-control"
                    value={form.data_fim || ''}
                    onChange={(e) => setField('data_fim', e.target.value)}
                  />
                </div>
                <div className="form-field form-field-full">
                  <label htmlFor="as-sit" className="field-label">Situação *</label>
                  <select
                    id="as-sit"
                    className="input-control"
                    value={form.situacao || 'Ativa'}
                    onChange={(e) => setField('situacao', e.target.value)}
                  >
                    <option value="Ativa">Ativa</option>
                    <option value="Suspensa">Suspensa</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
              </div>
            )}

            {table === 'visualizacoes' && (
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="v-perfil" className="field-label">Perfil *</label>
                  <select
                    id="v-perfil"
                    className="input-control"
                    value={form.id_perfil || ''}
                    onChange={(e) => setField('id_perfil', Number(e.target.value))}
                  >
                    {db.perfis.map((p) => (
                      <option key={p.id_perfil} value={p.id_perfil}>
                        {p.nome} (até {p.classificacao_max})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="v-filme" className="field-label">Filme *</label>
                  <select
                    id="v-filme"
                    className="input-control"
                    value={form.id_filme || ''}
                    onChange={(e) => setField('id_filme', Number(e.target.value))}
                  >
                    {db.filmes.map((f) => (
                      <option key={f.id_filme} value={f.id_filme}>
                        {f.titulo} ({f.classificacao}, {f.duracao_min}min)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="v-dt" className="field-label">Data e hora de início *</label>
                  <input
                    id="v-dt"
                    type="datetime-local"
                    className="input-control"
                    value={form.data_hora_inicio || ''}
                    onChange={(e) => setField('data_hora_inicio', e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="v-min" className="field-label">Minutos assistidos *</label>
                  <input
                    id="v-min"
                    type="number"
                    min={1}
                    className="input-control"
                    value={form.minutos_assistidos || 1}
                    onChange={(e) => setField('minutos_assistidos', Number(e.target.value))}
                    required
                  />
                </div>
                <div className="form-field form-field-full">
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={Boolean(form.conclusao)}
                      onChange={(e) => setField('conclusao', e.target.checked)}
                    />
                    <span>Filme assistido até o final (conclusão)</span>
                  </label>
                </div>
              </div>
            )}

            {table === 'avaliacoes' && (
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="av-perfil" className="field-label">Perfil *</label>
                  <select
                    id="av-perfil"
                    className="input-control"
                    value={form.id_perfil || ''}
                    onChange={(e) => setField('id_perfil', Number(e.target.value))}
                    disabled={isEditing}
                  >
                    {db.perfis.map((p) => (
                      <option key={p.id_perfil} value={p.id_perfil}>{p.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="av-filme" className="field-label">Filme *</label>
                  <select
                    id="av-filme"
                    className="input-control"
                    value={form.id_filme || ''}
                    onChange={(e) => setField('id_filme', Number(e.target.value))}
                    disabled={isEditing}
                  >
                    {db.filmes.map((f) => (
                      <option key={f.id_filme} value={f.id_filme}>{f.titulo}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="av-nota" className="field-label">Nota (1 a 5) *</label>
                  <select
                    id="av-nota"
                    className="input-control"
                    value={form.nota || 5}
                    onChange={(e) => setField('nota', Number(e.target.value))}
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n} estrela(s)</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="av-data" className="field-label">Data da avaliação *</label>
                  <input
                    id="av-data"
                    type="date"
                    className="input-control"
                    value={form.data_avaliacao || ''}
                    onChange={(e) => setField('data_avaliacao', e.target.value)}
                    required
                  />
                </div>
                <div className="form-field form-field-full">
                  <label htmlFor="av-com" className="field-label">Comentário</label>
                  <textarea
                    id="av-com"
                    className="input-control"
                    value={form.comentario || ''}
                    onChange={(e) => setField('comentario', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting
                ? 'Salvando...'
                : isEditing
                ? 'Salvar alterações'
                : 'Cadastrar registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
