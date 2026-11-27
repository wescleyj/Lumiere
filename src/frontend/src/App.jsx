import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  loadState,
  saveState,
  resetState,
  createRecord,
  updateRecord,
  deleteRecord,
} from './data/store.js';
import Navbar from './components/Navbar.jsx';
import CatalogView from './components/CatalogView.jsx';
import CrudView from './components/CrudView.jsx';
import ReportsView from './components/ReportsView.jsx';
import ProfileGateModal from './components/ProfileGateModal.jsx';
import MovieDetailModal from './components/MovieDetailModal.jsx';
import EntityFormModal from './components/EntityFormModal.jsx';
import { BrandSplash } from './components/LoadingStates.jsx';
import Toast from './components/Toast.jsx';

export default function App() {
  const [db, setDb] = useState(() => loadState());
  const [activeTab, setActiveTab] = useState('catalog');
  const [activeProfileId, setActiveProfileId] = useState(() => {
    const initial = loadState();
    return initial.perfis[0]?.id_perfil || 1;
  });
  const [showSplash, setShowSplash] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [movieModal, setMovieModal] = useState({ id: null, focus: 'info' });
  const [profileGateOpen, setProfileGateOpen] = useState(false);
  const [quickMovieModal, setQuickMovieModal] = useState({ open: false, record: null });
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = window.setTimeout(() => setShowSplash(false), reduced ? 0 : 480);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isLoadingProfile) return;
    const t = window.setTimeout(() => setIsLoadingProfile(false), 260);
    return () => window.clearTimeout(t);
  }, [isLoadingProfile]);

  useEffect(() => {
    saveState(db);
  }, [db]);

  const activeProfile = useMemo(() => {
    return db.perfis.find((p) => p.id_perfil === activeProfileId) || db.perfis[0] || null;
  }, [db.perfis, activeProfileId]);

  const selectedMovie = useMemo(() => {
    if (!movieModal.id) return null;
    return db.filmes.find((f) => f.id_filme === movieModal.id) || null;
  }, [db.filmes, movieModal.id]);

  const pushToast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleCreate = useCallback(
    (table, payload) => {
      const res = createRecord(db, table, payload);
      if (!res.ok) {
        pushToast(res.error, 'error');
        return res;
      }
      setDb(res.state);
      pushToast('Registro cadastrado com sucesso.', 'success');
      return res;
    },
    [db, pushToast]
  );

  const handleUpdate = useCallback(
    (table, key, payload) => {
      const res = updateRecord(db, table, key, payload);
      if (!res.ok) {
        pushToast(res.error, 'error');
        return res;
      }
      setDb(res.state);
      pushToast('Alterações salvas.', 'success');
      return res;
    },
    [db, pushToast]
  );

  const handleDelete = useCallback(
    (table, key) => {
      const res = deleteRecord(db, table, key);
      if (!res.ok) {
        pushToast(res.error, 'error');
        return res;
      }
      setDb(res.state);
      if (table === 'filmes' && movieModal.id === Number(key)) {
        setMovieModal({ id: null, focus: 'info' });
      }
      pushToast('Registro excluído.', 'success');
      return res;
    },
    [db, movieModal.id, pushToast]
  );

  const handleResetDatabase = useCallback(() => {
    const fresh = resetState();
    setDb(fresh);
    setActiveProfileId(fresh.perfis[0]?.id_perfil || 1);
    setMovieModal({ id: null, focus: 'info' });
    pushToast('Banco restaurado com os dados iniciais.', 'success');
  }, [pushToast]);

  const handleSaveReview = useCallback(
    (payload, exists) => {
      if (exists) {
        handleUpdate('avaliacoes', `${payload.id_perfil}-${payload.id_filme}`, payload);
      } else {
        handleCreate('avaliacoes', payload);
      }
    },
    [handleCreate, handleUpdate]
  );

  return (
    <div>
      {showSplash && <BrandSplash />}

      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeProfile={activeProfile}
        onOpenProfileGate={() => setProfileGateOpen(true)}
      />

      <main className="app-main">
        {activeTab === 'catalog' && (
          <CatalogView
            db={db}
            activeProfile={activeProfile}
            isLoadingProfile={isLoadingProfile}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenMovie={(id, focus) => setMovieModal({ id, focus })}
            onOpenQuickAddMovie={() => setQuickMovieModal({ open: true, record: null })}
            onOpenProfileGate={() => setProfileGateOpen(true)}
          />
        )}

        {activeTab === 'crud' && (
          <CrudView
            db={db}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onResetDatabase={handleResetDatabase}
          />
        )}

        {activeTab === 'reports' && <ReportsView db={db} />}
      </main>

      <footer className="app-footer">
        <div className="app-footer-inner">
          <span>LUMIERE · Sistema de Filmes On-line · BD I e LBD I · CEFET-MG</span>
          <div className="footer-links">
            <button type="button" className="footer-link-btn" onClick={() => setActiveTab('catalog')}>
              Catálogo
            </button>
            <button type="button" className="footer-link-btn" onClick={() => setActiveTab('crud')}>
              Gerenciar
            </button>
            <button type="button" className="footer-link-btn" onClick={() => setActiveTab('reports')}>
              Relatórios
            </button>
          </div>
        </div>
      </footer>

      <ProfileGateModal
        open={profileGateOpen}
        perfis={db.perfis}
        usuarios={db.usuarios}
        activeProfileId={activeProfile?.id_perfil}
        onSelectProfile={(id) => {
          if (id !== activeProfileId) {
            setIsLoadingProfile(true);
          }
          setActiveProfileId(id);
          const chosen = db.perfis.find((p) => p.id_perfil === id);
          if (chosen) {
            pushToast(`Perfil ativo: ${chosen.nome} (até ${chosen.classificacao_max})`, 'success');
          }
        }}
        onClose={() => setProfileGateOpen(false)}
      />

      <MovieDetailModal
        filme={selectedMovie}
        db={db}
        activeProfile={activeProfile}
        initialFocus={movieModal.focus}
        onClose={() => setMovieModal({ id: null, focus: 'info' })}
        onEditMovie={(filme) => {
          setMovieModal({ id: null, focus: 'info' });
          setQuickMovieModal({ open: true, record: filme });
        }}
        onDeleteMovie={(id) => handleDelete('filmes', id)}
        onCreateView={(payload) => handleCreate('visualizacoes', payload)}
        onSaveReview={handleSaveReview}
      />

      <EntityFormModal
        open={quickMovieModal.open}
        table="filmes"
        record={quickMovieModal.record}
        db={db}
        onSubmit={(table, payload, existing) =>
          existing
            ? handleUpdate(table, existing.id_filme, payload)
            : handleCreate(table, payload)
        }
        onClose={() => setQuickMovieModal({ open: false, record: null })}
      />

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
