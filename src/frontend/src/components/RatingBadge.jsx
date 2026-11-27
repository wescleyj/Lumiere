import { RATING_LABELS } from '../utils/formatters.js';

export default function RatingBadge({ rating, className = '' }) {
  const code = String(rating || 'L');
  const label = RATING_LABELS[code] || `Classificação ${code}`;
  return (
    <span
      className={`rating-badge rating-${code} ${className}`.trim()}
      title={label}
      aria-label={label}
    >
      {code}
    </span>
  );
}
