import { X, ShieldCheck } from 'lucide-react';
import RatingBadge from './RatingBadge.jsx';

export default function ProfileGateModal({
  open,
  perfis,
  usuarios,
  activeProfileId,
  onSelectProfile,
  onClose,
}) {
  if (!open) return null;

  const getOwnerName = (idUsuario) => {
    const user = usuarios.find((u) => u.id_usuario === idUsuario);
    return user ? user.nome.split(' ')[0] : 'Conta';
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-gate-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-lg">
        <div className="modal-header">
          <div>
            <h2 id="profile-gate-title" className="modal-title">
              Quem está assistindo?
            </h2>
            <p className="crud-toolbar-note">
              O perfil selecionado aplica o limite de classificação indicativa em todo o catálogo.
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Fechar seleção de perfil"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="profile-grid">
            {perfis.map((perfil) => {
              const isCurrent = perfil.id_perfil === activeProfileId;
              const letter = perfil.nome.charAt(0).toUpperCase();
              return (
                <button
                  key={perfil.id_perfil}
                  type="button"
                  className={`profile-tile ${isCurrent ? 'is-current' : ''}`}
                  onClick={() => {
                    onSelectProfile(perfil.id_perfil);
                    onClose();
                  }}
                >
                  <span
                    className={`profile-avatar profile-avatar-lg avatar-${perfil.avatar_color || 'red'}`}
                  >
                    {letter}
                  </span>
                  <div className="cell-primary">{perfil.nome}</div>
                  <div className="cell-secondary">Conta: {getOwnerName(perfil.id_usuario)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <RatingBadge rating={perfil.classificacao_max} />
                    {perfil.infantil && (
                      <span className="status-pill status-success">
                        <ShieldCheck size={12} style={{ marginRight: 4 }} aria-hidden="true" />
                        Infantil
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
