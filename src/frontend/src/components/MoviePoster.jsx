import { useState, useEffect } from 'react';
import { Play, Info, Star } from 'lucide-react';
import RatingBadge from './RatingBadge.jsx';
import PosterArtwork from './posterArt.jsx';
import { formatDuration } from '../utils/formatters.js';

export default function MoviePoster({
  filme,
  directorName = '',
  compact = false,
  interactive = false,
  avgRating = null,
  progressPct = null,
  className = '',
}) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [filme?.capa_url]);

  const theme = filme?.capa_tema || 'noir';
  const showImage = Boolean(filme?.capa_url && !imgFailed);
  const surname = directorName ? directorName.split(' ').slice(-1)[0] : '';

  return (
    <div className={`poster-frame ${className}`.trim()}>
      {showImage ? (
        <>
          <img
            src={filme.capa_url}
            alt={`Capa do filme ${filme.titulo}`}
            className="poster-img"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
          {!compact && (
            <div className="poster-img-badge">
              <RatingBadge rating={filme.classificacao} />
            </div>
          )}
        </>
      ) : (
        <div className={`poster-art poster-theme-${theme}`}>
          <PosterArtwork idFilme={filme?.id_filme} tema={theme} />

          <div className="poster-art-top">
            <span className="poster-art-year">{filme?.ano_lancamento || '----'}</span>
            {!compact && <RatingBadge rating={filme?.classificacao} />}
          </div>

          <div className="poster-art-bottom">
            <div className="poster-art-rule" aria-hidden="true" />
            <div
              className="poster-art-title"
              style={compact ? { fontSize: '0.68rem', lineHeight: 1 } : undefined}
            >
              {compact ? String(filme?.titulo || '').slice(0, 10) : filme?.titulo}
            </div>
            {!compact && surname && (
              <div className="poster-art-director">Dir. {surname}</div>
            )}
          </div>
        </div>
      )}

      {interactive && !compact && (
        <div className="poster-hover-overlay" aria-hidden="true">
          <div className="poster-hover-actions">
            <span className="poster-hover-play">
              <Play size={16} fill="currentColor" />
            </span>
            <span className="poster-hover-info">
              <Info size={15} />
            </span>
          </div>
          <div className="poster-hover-meta">
            <span>{formatDuration(filme?.duracao_min)}</span>
            {avgRating && (
              <span className="star-inline">
                <Star size={12} fill="currentColor" />
                {avgRating}
              </span>
            )}
          </div>
        </div>
      )}

      {progressPct !== null && progressPct !== undefined && (
        <div className="poster-progress-track" aria-label={`${Math.round(progressPct)}% assistido`}>
          <div
            className="poster-progress-fill"
            style={{ width: `${Math.max(4, Math.min(100, progressPct))}%` }}
          />
        </div>
      )}
    </div>
  );
}
