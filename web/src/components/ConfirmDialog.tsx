import { Modal } from './Modal';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  loading = false,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="modal-body">
        <p>{message}</p>
        {error ? <div className="error-box">{error}</div> : null}
      </div>
      <footer className="modal-actions">
        <button type="button" className="ghost" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button type="button" className="danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting...' : confirmLabel}
        </button>
      </footer>
    </Modal>
  );
}
