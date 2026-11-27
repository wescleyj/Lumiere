import { X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-item ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => onDismiss(toast.id)}
            aria-label="Fechar notificação"
            style={{ width: 26, height: 26 }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
