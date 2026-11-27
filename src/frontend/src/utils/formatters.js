/**
 * Ordering map for Brazilian DJCTQ parental content ratings.
 */
export const RATING_ORDER = {
  L: 0,
  '10': 10,
  '12': 12,
  '14': 14,
  '16': 16,
  '18': 18,
};

export const RATINGS = ['L', '10', '12', '14', '16', '18'];

export const RATING_LABELS = {
  L: 'Livre para todos os públicos',
  '10': 'Não recomendado para menores de 10 anos',
  '12': 'Não recomendado para menores de 12 anos',
  '14': 'Não recomendado para menores de 14 anos',
  '16': 'Não recomendado para menores de 16 anos',
  '18': 'Não recomendado para menores de 18 anos',
};

export const POSTER_THEMES = [
  { key: 'noir', label: 'Noir Vermelho' },
  { key: 'amber', label: 'Dourado Cinema' },
  { key: 'cyan', label: 'Azul Noturno' },
  { key: 'emerald', label: 'Verde Floresta' },
  { key: 'crimson', label: 'Carmesim' },
  { key: 'slate', label: 'Grafite Clássico' },
];

export const AVATAR_COLORS = [
  { key: 'red', label: 'Vermelho Lumiere' },
  { key: 'amber', label: 'Âmbar' },
  { key: 'teal', label: 'Petróleo' },
  { key: 'cobalt', label: 'Azul Cobalto' },
  { key: 'emerald', label: 'Esmeralda' },
  { key: 'zinc', label: 'Grafite' },
];

/**
 * Checks whether a profile's parental ceiling permits watching a movie.
 */
export function canProfileWatch(perfil, filme) {
  if (!perfil || !filme) return false;
  const maxAllowed = RATING_ORDER[String(perfil.classificacao_max)] ?? 18;
  const movieRating = RATING_ORDER[String(filme.classificacao)] ?? 18;
  if (perfil.infantil && movieRating > 12) return false;
  return movieRating <= maxAllowed;
}

/**
 * Dynamically derives age in full years from an ISO date string (YYYY-MM-DD).
 */
export function calculateAge(dataNascimento) {
  if (!dataNascimento) return 0;
  const birth = new Date(`${dataNascimento}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return Math.max(0, age);
}

/**
 * Formats a numeric value in Brazilian Real (BRL).
 */
export function formatCurrency(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 'R$ 0,00';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Formats an ISO date string (YYYY-MM-DD) as DD/MM/YYYY.
 */
export function formatDate(isoDate) {
  if (!isoDate) return '-';
  const parts = String(isoDate).slice(0, 10).split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Formats an ISO datetime string (YYYY-MM-DDTHH:mm) as DD/MM/YYYY HH:mm.
 */
export function formatDateTime(isoDateTime) {
  if (!isoDateTime) return '-';
  const [datePart, timePart] = String(isoDateTime).split('T');
  const dateFormatted = formatDate(datePart);
  if (!timePart) return dateFormatted;
  return `${dateFormatted} ${timePart.slice(0, 5)}`;
}

/**
 * Formats duration in minutes as "Xh Ymin" or "Ymin".
 */
export function formatDuration(minutes) {
  const total = Number(minutes);
  if (!Number.isFinite(total) || total <= 0) return '0min';
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

/**
 * Formats a CPF string into 000.000.000-00 when 11 digits are supplied.
 */
export function normalizeCpf(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length !== 11) return String(raw || '').trim();
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Returns today's date as YYYY-MM-DD.
 */
export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Returns current local date-time formatted for <input type="datetime-local">.
 */
export function nowIsoDateTime() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
