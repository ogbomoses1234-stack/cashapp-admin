import { ReactNode, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface Props {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger,
  onConfirm,
  onClose,
}: Props) {
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={handle}
            loading={busy}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-[13px] font-medium leading-relaxed text-ink-300">
        {message}
      </div>
    </Modal>
  );
}
