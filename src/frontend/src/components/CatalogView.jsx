import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Play,
  Info,
  Plus,
  ShieldAlert,
  Star,
  Film,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  TrendingUp,
  X,
} from 'lucide-react';
import MoviePoster from './MoviePoster.jsx';
import PosterArtwork from './posterArt.jsx';
import RatingBadge from './RatingBadge.jsx';
import { CatalogSkeleton } from './LoadingStates.jsx';
import { canProfileWatch, formatDuration } from '../utils/formatters.js';

export default function CatalogView({
  db,
  activeProfile,
  isLoadingProfile = false,
  searchQuery,
  onSearchChange,
  onOpenMovie,
  onOpenQuickAddMovie,
  onOpenProfileGate,
}) {
  const [selectedGenreId, setSelectedGenreId] = useState(null);
  const [sortBy, setSortBy] = useState('recent');
  const [heroIndex, setHeroIndex] = useState(0);
  const topRailRef = useRef(null);
  const continueRailRef = useRef(null);

  const directorMap = useMemo(() => {
    const map = new Map();
    for (const p of db.pessoas) map.set(p.id_pessoa, p.nome);
    return map;
  }, [db.pessoas]);

  const genreMap = useMemo(() => {
    const map = new Map();
    for (const g of db.generos) map.set(g.id_genero, g.nome);
    return map;
  }, [db.generos]);

  const ratingStatsMap = useMemo(() => {
    const sums = new Map();
    for (const a of db.avaliacoes) {
      const cur = sums.get(a.id_filme) || { sum: 0, count: 0 };
      cur.sum += a.nota;
      cur.count += 1;
      sums.set(a.id_filme, cur);
    }
    const out = new Map();
    for (const [id, { sum, count }] of sums.entries()) {
      out.set(id, { avg: Number((sum / count).toFixed(1)), count });
    }
    return out;
  }, [db.avaliacoes]);

  const viewCountsMap = useMemo(() => {
    const map = new Map();
    for (const v of db.visualizacoes) {
      map.set(v.id_filme, (map.get(v.id_filme) || 0) + 1);
    }
    return map;
  }, [db.visualizacoes]);

  const allowedMovies = useMemo(() => {
    return db.filmes.filter((f) => canProfileWatch(activeProfile, f));
  }, [db.filmes, activeProfile]);

  const hiddenCount = db.filmes.length - allowedMovies.length;

  const heroPool = useMemo(() => {
    return allowedMovies.slice(0, Math.min(4, allowedMovies.length));
  }, [allowedMovies]);

  useEffect(() => {
    if (heroIndex >= heroPool.length) setHeroIndex(0);
  }, [heroPool.length, heroIndex]);

  const featuredMovie = heroPool[heroIndex] || allowedMovies[0] || null;

  const featuredCast = useMemo(() => {
    if (!featuredMovie) return [];
    return db.atua
      .filter((a) => a.id_filme === featuredMovie.id_filme)
      .slice(0, 3)
      .map((a) => db.pessoas.find((p) => p.id_pessoa === a.id_pessoa)?.nome)
      .filter(Boolean);
  }, [db.atua, db.pessoas, featuredMovie]);

  // Continue Watching rail for active profile
  const continueWatchingItems = useMemo(() => {
    if (!activeProfile) return [];
    const seen = new Set();
    const profileViews = [...db.visualizacoes]
      .filter((v) => v.id_perfil === activeProfile.id_perfil)
      .sort((a, b) => String(b.data_hora_inicio).localeCompare(String(a.data_hora_inicio)));

    const items = [];
    for (const v of profileViews) {
      if (seen.has(v.id_filme)) continue;
      const filme = allowedMovies.find((f) => f.id_filme === v.id_filme);
      if (!filme) continue;
      seen.add(v.id_filme);
      const pct = Math.min(100, Math.round((v.minutos_assistidos / filme.duracao_min) * 100));
      items.push({
        filme,
        minutos_assistidos: v.minutos_assistidos,
        conclusao: v.conclusao,
        pct,
        remaining: Math.max(0, filme.duracao_min - v.minutos_assistidos),
      });
    }
    return items;
  }, [db.visualizacoes, activeProfile, allowedMovies]);

  // Top 5 ranked movies in Lumiere
  const topFiveMovies = useMemo(() => {
    return [...allowedMovies]
      .sort((a, b) => {
        const viewsA = viewCountsMap.get(a.id_filme) || 0;
        const viewsB = viewCountsMap.get(b.id_filme) || 0;
        if (viewsB !== viewsA) return viewsB - viewsA;
        const ratingA = ratingStatsMap.get(a.id_filme)?.avg || 0;
        const ratingB = ratingStatsMap.get(b.id_filme)?.avg || 0;
        return ratingB - ratingA;
      })
      .slice(0, 5);
  }, [allowedMovies, viewCountsMap, ratingStatsMap]);

  const filteredMovies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = allowedMovies.filter((f) => {
      const matchesGenre = selectedGenreId === null || f.generos.includes(selectedGenreId);
      if (!matchesGenre) return false;
      if (!q) return true;
      const director = (directorMap.get(f.id_diretor) || '').toLowerCase();
      return (
        f.titulo.toLowerCase().includes(q) ||
        f.titulo_original.toLowerCase().includes(q) ||
        director.includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'rating') {
        const ra = ratingStatsMap.get(a.id_filme)?.avg || 0;
        const rb = ratingStatsMap.get(b.id_filme)?.avg || 0;
        return rb - ra || b.ano_lancamento - a.ano_lancamento;
      }
      if (sortBy === 'alpha') {
        return a.titulo.localeCompare(b.titulo, 'pt-BR');
      }
      return b.ano_lancamento - a.ano_lancamento || b.id_filme - a.id_filme;
    });
  }, [allowedMovies, selectedGenreId, searchQuery, directorMap, sortBy, ratingStatsMap]);

  const scrollRail = (ref, dir) => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir * 420, behavior: 'smooth' });
  };

  if (isLoadingProfile) {
    return <CatalogSkeleton profileName={activeProfile?.nome} />;
  }

  const showRails = selectedGenreId === null && searchQuery.trim() === '';

  return (
    <div className="view-enter">
      {featuredMovie && showRails && (
        <section className="hero-stage" aria-label="Destaque do catálogo">
          <div className={`hero-backdrop-art poster-theme-${featuredMovie.capa_tema || 'noir'}`}>
            <PosterArtwork idFilme={featuredMovie.id_filme} tema={featuredMovie.capa_tema} />
          </div>
          <div className="hero-vignette" aria-hidden="true" />

          <div className="hero-inner">
            <div>
              <div className="hero-kicker">
                <span className="hero-monogram" aria-hidden="true">L</span>
                <span>Destaque Lumiere</span>
              </div>

              <h1 className="hero-title">{featuredMovie.titulo}</h1>

              <div className="hero-meta">
                {ratingStatsMap.has(featuredMovie.id_filme) && (
                  <span className="hero-match-score">
                    Nota {ratingStatsMap.get(featuredMovie.id_filme).avg.toFixed(1)}
                  </span>
                )}
                <span>{featuredMovie.ano_lancamento}</span>
                <span aria-hidden="true">·</span>
                <span>{formatDuration(featuredMovie.duracao_min)}</span>
                <span aria-hidden="true">·</span>
                <RatingBadge rating={featuredMovie.classificacao} />
                <span aria-hidden="true">·</span>
                <span>Dir. {directorMap.get(featuredMovie.id_diretor) || '-'}</span>
              </div>

              <div className="hero-genres-row">
                {featuredMovie.generos.map((gid) => (
                  <span key={gid} className="hero-genre-chip">
                    {genreMap.get(gid) || 'Gênero'}
                  </span>
                ))}
                {featuredCast.length > 0 && (
                  <span className="hero-genre-chip">Elenco: {featuredCast.join(', ')}</span>
                )}
              </div>

              <p className="hero-synopsis">{featuredMovie.sinopse}</p>

              <div className="hero-actions">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => onOpenMovie(featuredMovie.id_filme, 'watch')}
                >
                  <Play size={17} fill="currentColor" aria-hidden="true" />
                  <span>Simular exibição</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onOpenMovie(featuredMovie.id_filme, 'info')}
                >
                  <Info size={17} aria-hidden="true" />
                  <span>Detalhes e avaliações</span>
                </button>
              </div>

              {heroPool.length > 1 && (
                <div className="hero-carousel-controls" aria-label="Alternar destaque">
                  <button
                    type="button"
                    className="rail-nav-btn"
                    onClick={() => setHeroIndex((i) => (i - 1 + heroPool.length) % heroPool.length)}
                    aria-label="Destaque anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {heroPool.map((m, idx) => (
                    <button
                      key={m.id_filme}
                      type="button"
                      className={`hero-dot ${idx === heroIndex ? 'is-active' : ''}`}
                      onClick={() => setHeroIndex(idx)}
                      aria-label={`Ver destaque ${m.titulo}`}
                    />
                  ))}
                  <button
                    type="button"
                    className="rail-nav-btn"
                    onClick={() => setHeroIndex((i) => (i + 1) % heroPool.length)}
                    aria-label="Próximo destaque"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="hero-poster-wrap">
              <MoviePoster
                filme={featuredMovie}
                directorName={directorMap.get(featuredMovie.id_diretor)}
                avgRating={ratingStatsMap.get(featuredMovie.id_filme)?.avg}
              />
            </div>
          </div>
        </section>
      )}

      <div className="page-container">
        {hiddenCount > 0 && activeProfile && (
          <div className="parental-banner" role="note">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldAlert size={18} style={{ color: 'var(--status-warning)', flexShrink: 0 }} aria-hidden="true" />
              <span>
                Controle parental ativo para <strong>{activeProfile.nome}</strong> (até{' '}
                <strong>{activeProfile.classificacao_max}</strong>): {hiddenCount} título(s) oculto(s).
              </span>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenProfileGate}>
              Trocar perfil
            </button>
          </div>
        )}

        {showRails && continueWatchingItems.length > 0 && (
          <section className="rail-section" aria-label="Continuar assistindo">
            <div className="rail-header">
              <h2 className="rail-title">
                <Clock size={18} style={{ color: 'var(--brand-red)' }} aria-hidden="true" />
                <span>Continuar assistindo como {activeProfile?.nome}</span>
              </h2>
              <div className="rail-nav-group">
                <button
                  type="button"
                  className="rail-nav-btn"
                  onClick={() => scrollRail(continueRailRef, -1)}
                  aria-label="Rolar para esquerda"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="rail-nav-btn"
                  onClick={() => scrollRail(continueRailRef, 1)}
                  aria-label="Rolar para direita"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="rail-scroll" ref={continueRailRef}>
              {continueWatchingItems.map(({ filme, pct, conclusao, remaining }) => (
                <div key={filme.id_filme} className="rail-card">
                  <button
                    type="button"
                    className="poster-card-btn"
                    onClick={() => onOpenMovie(filme.id_filme, 'watch')}
                    aria-label={`Continuar ${filme.titulo}`}
                  >
                    <MoviePoster
                      filme={filme}
                      directorName={directorMap.get(filme.id_diretor)}
                      interactive
                      avgRating={ratingStatsMap.get(filme.id_filme)?.avg}
                      progressPct={pct}
                    />
                  </button>
                  <div className="movie-card-meta">
                    <div className="movie-card-title">{filme.titulo}</div>
                    <div className="movie-card-sub">
                      <span>{conclusao ? 'Concluído' : `Restam ${remaining} min`}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {showRails && topFiveMovies.length >= 3 && (
          <section className="rail-section" aria-label="Top 5 no Lumiere">
            <div className="rail-header">
              <h2 className="rail-title">
                <TrendingUp size={18} style={{ color: 'var(--brand-red)' }} aria-hidden="true" />
                <span>Em alta no Lumiere</span>
              </h2>
              <div className="rail-nav-group">
                <button
                  type="button"
                  className="rail-nav-btn"
                  onClick={() => scrollRail(topRailRef, -1)}
                  aria-label="Rolar Top 5 para esquerda"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="rail-nav-btn"
                  onClick={() => scrollRail(topRailRef, 1)}
                  aria-label="Rolar Top 5 para direita"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="rail-scroll" ref={topRailRef}>
              {topFiveMovies.map((filme, idx) => (
                <div key={filme.id_filme} className="top-rank-item">
                  <span className="top-rank-num" aria-hidden="true">{idx + 1}</span>
                  <div className="top-rank-poster">
                    <button
                      type="button"
                      className="poster-card-btn"
                      onClick={() => onOpenMovie(filme.id_filme, 'info')}
                      aria-label={`#${idx + 1} ${filme.titulo}`}
                    >
                      <MoviePoster
                        filme={filme}
                        directorName={directorMap.get(filme.id_diretor)}
                        interactive
                        avgRating={ratingStatsMap.get(filme.id_filme)?.avg}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="rail-header" style={{ marginBottom: 14 }}>
          <h2 className="rail-title">
            <span>Catálogo completo</span>
            <span className="cell-secondary" style={{ fontWeight: 500 }}>
              ({filteredMovies.length})
            </span>
          </h2>
        </div>

        <div className="catalog-toolbar">
          <div className="genre-pills" role="tablist" aria-label="Filtrar por gênero">
            <button
              type="button"
              role="tab"
              aria-selected={selectedGenreId === null}
              className={`genre-pill ${selectedGenreId === null ? 'is-active' : ''}`}
              onClick={() => setSelectedGenreId(null)}
            >
              Todos ({allowedMovies.length})
            </button>
            {db.generos.map((g) => (
              <button
                key={g.id_genero}
                type="button"
                role="tab"
                aria-selected={selectedGenreId === g.id_genero}
                className={`genre-pill ${selectedGenreId === g.id_genero ? 'is-active' : ''}`}
                onClick={() => setSelectedGenreId(g.id_genero)}
              >
                {g.nome}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <select
              className="input-control"
              style={{ width: 'auto', padding: '7px 12px', fontSize: '0.86rem' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Ordenar catálogo"
            >
              <option value="recent">Mais recentes</option>
              <option value="rating">Melhor avaliados</option>
              <option value="alpha">Título (A-Z)</option>
            </select>

            <button type="button" className="btn btn-primary btn-sm" onClick={onOpenQuickAddMovie}>
              <Plus size={16} aria-hidden="true" />
              <span>Novo filme</span>
            </button>
          </div>
        </div>

        {/* Mobile search input fallback */}
        <div style={{ marginBottom: 18 }} className="mobile-search-only">
          <style>{`@media (min-width: 641px) { .mobile-search-only { display: none !important; } }`}</style>
          <div className="search-box">
            <Search size={15} className="search-box-icon" aria-hidden="true" />
            <input
              type="text"
              className="search-input search-input-full"
              placeholder="Buscar título ou diretor"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Buscar filme no catálogo"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => onSearchChange('')}
                aria-label="Limpar busca"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {filteredMovies.length === 0 ? (
          <div className="crud-panel">
            <div className="empty-state">
              <Film size={32} aria-hidden="true" />
              <h2 className="empty-state-title">Nenhum filme encontrado</h2>
              <p className="empty-state-desc">
                Ajuste o filtro de gênero, limpe a busca ou cadastre uma nova obra no catálogo.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                {(selectedGenreId !== null || searchQuery) && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setSelectedGenreId(null);
                      onSearchChange('');
                    }}
                  >
                    Limpar filtros
                  </button>
                )}
                <button type="button" className="btn btn-primary btn-sm" onClick={onOpenQuickAddMovie}>
                  <Plus size={15} aria-hidden="true" />
                  <span>Adicionar filme</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="poster-grid">
            {filteredMovies.map((filme) => {
              const directorName = directorMap.get(filme.id_diretor) || '';
              const stats = ratingStatsMap.get(filme.id_filme);
              const primaryGenre = filme.generos[0] ? genreMap.get(filme.generos[0]) : '';
              return (
                <article key={filme.id_filme} className="movie-card">
                  <button
                    type="button"
                    className="poster-card-btn"
                    onClick={() => onOpenMovie(filme.id_filme, 'info')}
                    aria-label={`Abrir detalhes de ${filme.titulo}`}
                  >
                    <MoviePoster
                      filme={filme}
                      directorName={directorName}
                      interactive
                      avgRating={stats?.avg}
                    />
                  </button>
                  <div className="movie-card-meta">
                    <div className="movie-card-title" title={filme.titulo}>
                      {filme.titulo}
                    </div>
                    <div className="movie-card-sub">
                      <span>{filme.ano_lancamento}</span>
                      <span>·</span>
                      <span>{primaryGenre || formatDuration(filme.duracao_min)}</span>
                      {stats && (
                        <>
                          <span>·</span>
                          <span className="star-inline">
                            <Star size={12} fill="currentColor" aria-hidden="true" />
                            {stats.avg.toFixed(1)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
