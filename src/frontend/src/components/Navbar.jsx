import { useEffect, useState } from 'react';
import { Film, Database, BarChart3, Search, ChevronDown, X } from 'lucide-react';
import RatingBadge from './RatingBadge.jsx';

export default function Navbar({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  activeProfile,
  onOpenProfileGate,
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const initialLetter = activeProfile?.nome ? activeProfile.nome.charAt(0).toUpperCase() : 'P';
  const avatarColor = activeProfile?.avatar_color || 'red';

  return (
    <header className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-inner">
        <div className="navbar-left">
          <button
            type="button"
            className="brand-wordmark"
            onClick={() => onTabChange('catalog')}
            aria-label="Lumiere, ir para o catálogo"
          >
            LUMIERE
          </button>

          <nav className="nav-links" aria-label="Navegação principal">
            <button
              type="button"
              className={`nav-link ${activeTab === 'catalog' ? 'is-active' : ''}`}
              onClick={() => onTabChange('catalog')}
            >
              <Film size={16} aria-hidden="true" />
              <span>Catálogo</span>
            </button>

            <button
              type="button"
              className={`nav-link ${activeTab === 'crud' ? 'is-active' : ''}`}
              onClick={() => onTabChange('crud')}
            >
              <Database size={16} aria-hidden="true" />
              <span>Gerenciar</span>
            </button>

            <button
              type="button"
              className={`nav-link ${activeTab === 'reports' ? 'is-active' : ''}`}
              onClick={() => onTabChange('reports')}
            >
              <BarChart3 size={16} aria-hidden="true" />
              <span>Relatórios</span>
            </button>
          </nav>
        </div>

        <div className="navbar-right">
          {activeTab === 'catalog' && (
            <div className="search-box search-box-nav">
              <Search size={15} className="search-box-icon" aria-hidden="true" />
              <input
                type="text"
                className="search-input search-input-nav"
                placeholder="Buscar título ou diretor"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                aria-label="Buscar filme por título ou diretor"
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
          )}

          <button
            type="button"
            className="profile-switch-btn"
            onClick={onOpenProfileGate}
            title="Trocar perfil de exibição"
          >
            <span className={`profile-avatar avatar-${avatarColor}`}>{initialLetter}</span>
            <span className="profile-switch-name">{activeProfile?.nome || 'Perfil'}</span>
            {activeProfile && <RatingBadge rating={activeProfile.classificacao_max} />}
            <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
