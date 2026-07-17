import { Modal } from './Modal';
import { useI18n } from '../i18n/I18nContext';

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
  confirmLabel,
  loading = false,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const { t } = useI18n();

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="modal-body">
        <p>{message}</p>
        {error ? <div className="error-box">{error}</div> : null}
      </div>
      <footer className="modal-actions">
        <button type="button" className="ghost" onClick={onClose} disabled={loading}>
          {t('common.cancel')}
        </button>
        <button type="button" className="danger" onClick={onConfirm} disabled={loading}>
          {loading ? t('common.deleting') : confirmLabel ?? t('common.delete')}
        </button>
      </footer>
    </Modal>
  );
}
