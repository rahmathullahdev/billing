'use client';
import { useEffect } from 'react';

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !loading) onCancel?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop-custom"
      onClick={() => {
        if (!loading) onCancel?.();
      }}
    >
      <div
        className="modal-box-custom p-4 text-center"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 420 }}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={`confirm-icon-wrap mb-3 ${danger ? 'is-danger' : 'is-info'}`}>
          <i className={`bi ${danger ? 'bi-exclamation-triangle-fill' : 'bi-question-circle-fill'}`}></i>
        </div>
        <h4 className="fw-bold text-dark mb-2">{title}</h4>
        {message ? <p className="text-muted mb-4">{message}</p> : null}
        <div className="d-flex justify-content-center gap-3">
          <button type="button" className="btn btn-light px-4 border fw-semibold" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn px-4 fw-semibold shadow-sm ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
