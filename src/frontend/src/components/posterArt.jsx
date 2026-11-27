/**
 * Bespoke geometric SVG cinema poster motifs for Lumiere movie covers.
 * Colors inherit from CSS variables (--poster-accent, currentColor) so zero hexes are hardcoded here.
 */

function renderMovieMotif(idFilme, tema) {
  switch (Number(idFilme)) {
    case 1: // Duna: Parte Dois - layered dunes and twin suns
      return (
        <g>
          <circle cx="132" cy="82" r="28" fill="currentColor" opacity="0.18" />
          <circle cx="102" cy="94" r="14" fill="currentColor" opacity="0.32" />
          <path d="M0 190 Q70 150 155 185 T240 175 L240 300 L0 300 Z" fill="currentColor" opacity="0.16" />
          <path d="M0 220 Q95 182 185 215 T240 205 L240 300 L0 300 Z" fill="currentColor" opacity="0.26" />
          <line x1="20" y1="138" x2="220" y2="138" stroke="currentColor" strokeWidth="1" opacity="0.35" strokeDasharray="3 5" />
        </g>
      );
    case 2: // Bacurau - radar crosshairs and sertao mesa
      return (
        <g>
          <circle cx="120" cy="116" r="56" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.26" />
          <circle cx="120" cy="116" r="34" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
          <circle cx="120" cy="116" r="10" fill="currentColor" opacity="0.45" />
          <line x1="50" y1="116" x2="190" y2="116" stroke="currentColor" strokeWidth="1" opacity="0.25" />
          <line x1="120" y1="46" x2="120" y2="186" stroke="currentColor" strokeWidth="1" opacity="0.25" />
          <path d="M0 226 L58 226 L76 196 L154 196 L172 226 L240 226 L240 300 L0 300 Z" fill="currentColor" opacity="0.22" />
        </g>
      );
    case 3: // A Viagem de Chihiro - torii gate and lantern moon
      return (
        <g>
          <circle cx="120" cy="112" r="44" fill="currentColor" opacity="0.22" />
          <path d="M56 128 Q120 116 184 128" fill="none" stroke="currentColor" strokeWidth="5" opacity="0.52" />
          <line x1="70" y1="142" x2="170" y2="142" stroke="currentColor" strokeWidth="3.5" opacity="0.45" />
          <line x1="86" y1="128" x2="86" y2="218" stroke="currentColor" strokeWidth="4" opacity="0.45" />
          <line x1="154" y1="128" x2="154" y2="218" stroke="currentColor" strokeWidth="4" opacity="0.45" />
          <line x1="36" y1="224" x2="204" y2="224" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
          <line x1="56" y1="234" x2="184" y2="234" stroke="currentColor" strokeWidth="1" opacity="0.2" />
        </g>
      );
    case 4: // Oppenheimer - atomic orbital rings
      return (
        <g>
          <circle cx="120" cy="130" r="9" fill="currentColor" opacity="0.7" />
          <ellipse cx="120" cy="130" rx="68" ry="22" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.38" transform="rotate(30 120 130)" />
          <ellipse cx="120" cy="130" rx="68" ry="22" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.38" transform="rotate(-30 120 130)" />
          <ellipse cx="120" cy="130" rx="68" ry="22" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.38" transform="rotate(90 120 130)" />
          <circle cx="120" cy="130" r="76" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.18" strokeDasharray="2 4" />
        </g>
      );
    case 5: // Cidade de Deus - hillside blocks and camera viewfinder
      return (
        <g>
          <rect x="44" y="66" width="152" height="104" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
          <path d="M44 82 L44 66 L60 66 M180 66 L196 66 L196 82 M44 154 L44 170 L60 170 M180 170 L196 170 L196 154" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.55" />
          <rect x="24" y="196" width="32" height="36" fill="currentColor" opacity="0.22" />
          <rect x="62" y="182" width="38" height="50" fill="currentColor" opacity="0.3" />
          <rect x="106" y="170" width="34" height="62" fill="currentColor" opacity="0.2" />
          <rect x="146" y="190" width="42" height="42" fill="currentColor" opacity="0.28" />
        </g>
      );
    case 6: // Interestelar - black hole accretion disk
      return (
        <g>
          <circle cx="120" cy="128" r="28" fill="var(--bg-canvas)" stroke="currentColor" strokeWidth="2" opacity="0.85" />
          <ellipse cx="120" cy="128" rx="84" ry="18" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.48" transform="rotate(-12 120 128)" />
          <ellipse cx="120" cy="128" rx="64" ry="48" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.26" />
          <circle cx="52" cy="70" r="2" fill="currentColor" opacity="0.5" />
          <circle cx="188" cy="84" r="1.5" fill="currentColor" opacity="0.45" />
          <circle cx="174" cy="186" r="2" fill="currentColor" opacity="0.4" />
        </g>
      );
    case 7: // Adoraveis Mulheres - editorial classic frame & sunburst
      return (
        <g>
          <rect x="34" y="54" width="172" height="164" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.32" />
          <rect x="42" y="62" width="156" height="148" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.22" />
          <circle cx="120" cy="128" r="32" fill="currentColor" opacity="0.16" />
          <path d="M120 82 L120 174 M74 128 L166 128 M88 96 L152 160 M152 96 L88 160" stroke="currentColor" strokeWidth="1.2" opacity="0.32" />
        </g>
      );
    case 8: // A Chegada - heptapod ink ring
      return (
        <g>
          <circle cx="120" cy="122" r="46" fill="none" stroke="currentColor" strokeWidth="7" opacity="0.35" strokeDasharray="110 14 45 10" />
          <circle cx="120" cy="122" r="56" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.22" strokeDasharray="4 6" />
          <path d="M0 218 Q120 198 240 218 L240 300 L0 300 Z" fill="currentColor" opacity="0.18" />
        </g>
      );
    case 9: // Retratos Fantasmas - projector beam & marquee
      return (
        <g>
          <polygon points="36,84 218,46 218,176 36,102" fill="currentColor" opacity="0.14" />
          <rect x="26" y="80" width="20" height="26" rx="2" fill="currentColor" opacity="0.45" />
          <rect x="64" y="168" width="112" height="44" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.35" />
          <line x1="76" y1="184" x2="164" y2="184" stroke="currentColor" strokeWidth="2" opacity="0.35" />
          <line x1="88" y1="196" x2="152" y2="196" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
        </g>
      );
    case 10: // O Menino e a Garca - crescent moon & stylized wing
      return (
        <g>
          <path d="M142 74 A36 36 0 1 0 142 146 A28 28 0 1 1 142 74 Z" fill="currentColor" opacity="0.36" />
          <path d="M44 174 Q94 128 148 158 Q116 168 92 192 Z" fill="currentColor" opacity="0.3" />
          <rect x="106" y="176" width="28" height="58" fill="currentColor" opacity="0.18" />
        </g>
      );
    default:
      break;
  }

  // Fallback by poster theme for newly added films
  switch (tema) {
    case 'amber':
      return (
        <g>
          <circle cx="120" cy="118" r="48" fill="currentColor" opacity="0.2" />
          <path d="M0 206 Q120 166 240 206 L240 300 L0 300 Z" fill="currentColor" opacity="0.22" />
        </g>
      );
    case 'cyan':
      return (
        <g>
          <circle cx="120" cy="124" r="52" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <circle cx="120" cy="124" r="24" fill="currentColor" opacity="0.25" />
        </g>
      );
    case 'emerald':
      return (
        <g>
          <polygon points="120,66 176,174 64,174" fill="currentColor" opacity="0.2" />
          <circle cx="120" cy="128" r="36" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
        </g>
      );
    case 'crimson':
      return (
        <g>
          <line x1="36" y1="68" x2="204" y2="188" stroke="currentColor" strokeWidth="2" opacity="0.28" />
          <circle cx="120" cy="128" r="44" fill="currentColor" opacity="0.2" />
        </g>
      );
    default:
      return (
        <g>
          <rect x="38" y="64" width="164" height="120" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.28" />
          <circle cx="120" cy="124" r="28" fill="currentColor" opacity="0.22" />
        </g>
      );
  }
}

export default function PosterArtwork({ idFilme, tema = 'noir', className = '' }) {
  return (
    <svg
      viewBox="0 0 240 300"
      preserveAspectRatio="xMidYMid slice"
      className={`poster-svg-art ${className}`.trim()}
      aria-hidden="true"
    >
      {renderMovieMotif(idFilme, tema)}
    </svg>
  );
}
