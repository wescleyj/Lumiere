import { useState, useEffect } from 'react';
import { X, Play, Star, Edit3, Trash2, Users } from 'lucide-react';
import MoviePoster from './MoviePoster.jsx';
import RatingBadge from './RatingBadge.jsx';
import { formatDate, formatDuration, nowIsoDateTime, todayIsoDate } from '../utils/formatters.js';

export default function MovieDetailModal({
  filme,
  db,
  activeProfile,
  initialFocus = 'info',
  onClose,
  onEditMovie,
  onDeleteMovie,
  onCreateView,
  onSaveReview,
}) {
  const [minutesWatched, setMinutesWatched] = useState(filme?.duracao_min || 60);
  const [completed, setCompleted] = useState(true);
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');

  const existingReview =
    filme && activeProfile
      ? db.avaliacoes.find(
          (a) => a.id_perfil === activeProfile.id_perfil && a.id_filme === filme.id_filme
        )
      : null;

  useEffect(() => {
    if (!filme) return;
    setMinutesWatched(filme.duracao_min);
    setCompleted(true);
    if (existingReview) {
      setNota(existingReview.nota);
      setComentario(existingReview.comentario || '');
    } else {
      setNota(5);
      setComentario('');
    }
  }, [filme?.id_filme, activeProfile?.id_perfil]);

  if (!filme) return null;

  const director = db.pessoas.find((p) => p.id_pessoa === filme.id_diretor);
  const movieGenres = filme.generos
    .map((gid) => db.generos.find((g) => g.id_genero === gid)?.nome)
    .filter(Boolean);
  const cast = db.atua
    .filter((a) => a.id_filme === filme.id_filme)
    .map((a) => ({
      ...a,
      pessoa: db.pessoas.find((p) => p.id_pessoa === a.id_pessoa)?.nome || 'Profissional',
    }));
  const reviews = db.avaliacoes
    .filter((a) => a.id_filme === filme.id_filme)
    .map((a) => ({
      ...a,
      perfilNome: db.perfis.find((p) => p.id_perfil === a.id_perfil)?.nome || 'Perfil',
    }));

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.nota, 0) / reviews.length).toFixed(1)
      : null;

  const handleMinutesChange = (val) => {
    const num = Math.max(1, Math.min(filme.duracao_min, Number(val) || 1));
    setMinutesWatched(num);
    setCompleted(num >= filme.duracao_min);
  };

  const handleWatchSubmit = (e) => {
    e.preventDefault();
    onCreateView({
      id_perfil: activeProfile.id_perfil,
      id_filme: filme.id_filme,
      data_hora_inicio: nowIsoDateTime(),
      minutos_assistidos: Number(minutesWatched),
      conclusao: completed,
    });
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    onSaveReview(
      {
        id_perfil: activeProfile.id_perfil,
        id_filme: filme.id_filme,
        nota: Number(nota),
        data_avaliacao: todayIsoDate(),
        comentario,
      },
      Boolean(existingReview)
    );
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="movie-detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-lg">
        <div className="modal-header">
          <div>
            <h2 id="movie-detail-title" className="modal-title">
              {filme.titulo}
            </h2>
            {filme.titulo_original !== filme.titulo && (
              <div className="cell-secondary">Título original: {filme.titulo_original}</div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onEditMovie(filme)}
            >
              <Edit3 size={14} aria-hidden="true" />
              <span>Editar</span>
            </button>
            <button
              type="button"
              className="btn btn-danger-outline btn-sm"
              onClick={() => onDeleteMovie(filme.id_filme)}
            >
              <Trash2 size={14} aria-hidden="true" />
              <span>Excluir</span>
            </button>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar detalhes">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          <div className="detail-top">
            <MoviePoster filme={filme} directorName={director?.nome} />
            <div>
              <div className="detail-meta-row">
                <span>{filme.ano_lancamento}</span>
                <span>·</span>
                <span>{formatDuration(filme.duracao_min)}</span>
                <span>·</span>
                <RatingBadge rating={filme.classificacao} />
                <span>·</span>
                <span>Incluso em {formatDate(filme.data_inclusao)}</span>
                {avgRating && (
                  <>
                    <span>·</span>
                    <span className="star-inline">
                      <Star size={14} fill="currentColor" aria-hidden="true" />
                      {avgRating} ({reviews.length})
                    </span>
                  </>
                )}
              </div>

              <p style={{ margin: '0 0 14px', color: 'var(--text-secondary)' }}>{filme.sinopse}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.88rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Direção: </span>
                  <strong>{director?.nome || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Gêneros: </span>
                  <strong>{movieGenres.join(', ') || '-'}</strong>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Users size={14} aria-hidden="true" />
                  <span>Elenco registrado (Atua)</span>
                </div>
                {cast.length === 0 ? (
                  <p style={{ margin: '6px 0 0', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                    Nenhum crédito de atuação vinculado (participação parcial 0,M no modelo).
                  </p>
                ) : (
                  <div className="detail-cast-list">
                    {cast.map((c) => (
                      <div key={c.id_atua} className="cast-chip">
                        <strong>{c.pessoa}</strong> como {c.personagem}{' '}
                        <span className="cell-secondary">({c.funcao})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="detail-panels">
            <section className="sub-panel" aria-label="Simulação de exibição">
              <h3 className="sub-panel-title">
                <Play size={16} style={{ color: 'var(--brand-red)' }} aria-hidden="true" />
                <span>Simular exibição (Visualizacao)</span>
              </h3>
              <p className="cell-secondary" style={{ margin: '0 0 12px' }}>
                Registra uma sessão de reprodução para o perfil <strong>{activeProfile?.nome}</strong>{' '}
                sem necessidade de hospedar arquivo de vídeo.
              </p>

              <form onSubmit={handleWatchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-field">
                  <label htmlFor="watch-minutes" className="field-label">
                    Minutos assistidos: {minutesWatched} de {filme.duracao_min} min
                  </label>
                  <input
                    id="watch-minutes"
                    type="range"
                    min={1}
                    max={filme.duracao_min}
                    value={minutesWatched}
                    autoFocus={initialFocus === 'watch'}
                    onChange={(e) => handleMinutesChange(e.target.value)}
                  />
                </div>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={completed}
                    onChange={(e) => setCompleted(e.target.checked)}
                  />
                  <span>Marcar sessão como concluída</span>
                </label>

                <button type="submit" className="btn btn-primary btn-sm">
                  Registrar visualização
                </button>
              </form>
            </section>

            <section className="sub-panel" aria-label="Avaliações do filme">
              <h3 className="sub-panel-title">
                <Star size={16} style={{ color: 'var(--status-warning)' }} aria-hidden="true" />
                <span>Avaliações (Avalia)</span>
              </h3>

              <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="form-field">
                  <label htmlFor="review-nota" className="field-label">
                    Sua nota como {activeProfile?.nome}
                  </label>
                  <select
                    id="review-nota"
                    className="input-control"
                    value={nota}
                    onChange={(e) => setNota(Number(e.target.value))}
                  >
                    <option value={5}>5 estrelas (Excelente)</option>
                    <option value={4}>4 estrelas (Muito bom)</option>
                    <option value={3}>3 estrelas (Bom)</option>
                    <option value={2}>2 estrelas (Regular)</option>
                    <option value={1}>1 estrela (Fraco)</option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="review-comment" className="field-label">
                    Comentário
                  </label>
                  <input
                    id="review-comment"
                    type="text"
                    className="input-control"
                    placeholder="Escreva uma opinião breve"
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-secondary btn-sm">
                  {existingReview ? 'Atualizar avaliação' : 'Publicar avaliação'}
                </button>
              </form>

              <div className="review-list">
                {reviews.length === 0 ? (
                  <div className="cell-secondary">Nenhuma avaliação registrada ainda.</div>
                ) : (
                  reviews.map((r) => (
                    <div key={`${r.id_perfil}-${r.id_filme}`} className="review-item">
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}
                      >
                        <strong>{r.perfilNome}</strong>
                        <span className="star-inline">
                          <Star size={12} fill="currentColor" aria-hidden="true" />
                          {r.nota}/5
                        </span>
                      </div>
                      {r.comentario && <div style={{ color: 'var(--text-secondary)' }}>{r.comentario}</div>}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
