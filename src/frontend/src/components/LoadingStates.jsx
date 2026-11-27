export function BrandSplash() {
  return (
    <div className="brand-splash" role="status" aria-label="Carregando Lumiere">
      <div className="brand-splash-inner">
        <div className="brand-splash-wordmark">LUMIERE</div>
        <div className="brand-splash-track">
          <div className="brand-splash-bar" />
        </div>
      </div>
    </div>
  );
}

export function CatalogSkeleton({ profileName }) {
  return (
    <div aria-busy="true" aria-label={`Carregando catálogo de ${profileName || 'perfil'}`}>
      <div className="hero-skeleton-stage">
        <div className="hero-inner">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="skeleton-block" style={{ width: 150, height: 14 }} />
            <div className="skeleton-block" style={{ width: '68%', height: 52 }} />
            <div className="skeleton-block" style={{ width: '44%', height: 18 }} />
            <div className="skeleton-block" style={{ width: '84%', height: 42 }} />
            <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
              <div className="skeleton-block" style={{ width: 160, height: 40 }} />
              <div className="skeleton-block" style={{ width: 180, height: 40 }} />
            </div>
          </div>
          <div className="hero-poster-wrap">
            <div className="skeleton-block" style={{ width: '100%', aspectRatio: '2 / 3' }} />
          </div>
        </div>
      </div>

      <div className="page-container">
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {[96, 120, 88, 108, 92].map((w, idx) => (
            <div key={idx} className="skeleton-block" style={{ width: w, height: 32, borderRadius: 999 }} />
          ))}
        </div>

        <div className="poster-grid">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="skeleton-block" style={{ width: '100%', aspectRatio: '2 / 3' }} />
              <div className="skeleton-block" style={{ width: '75%', height: 14 }} />
              <div className="skeleton-block" style={{ width: '48%', height: 12 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }} aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '60px 2fr 1.5fr 1fr 80px',
            gap: 14,
            alignItems: 'center',
          }}
        >
          <div className="skeleton-block" style={{ height: 16 }} />
          <div className="skeleton-block" style={{ height: 18 }} />
          <div className="skeleton-block" style={{ height: 16 }} />
          <div className="skeleton-block" style={{ height: 16 }} />
          <div className="skeleton-block" style={{ height: 28 }} />
        </div>
      ))}
    </div>
  );
}
