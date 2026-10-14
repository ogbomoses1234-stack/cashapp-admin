import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatNaira } from '@/utils/format';

interface Props {
  open: boolean;
  initial?: string | null;
  onClose: () => void;
  onSave: (amount: string) => Promise<void> | void;
  saving?: boolean;
  /** Live total of estimated prices, shown as a hint */
  suggestedTotal?: number;
}

export function QuoteModal({
  open,
  initial,
  onClose,
  onSave,
  saving,
  suggestedTotal,
}: Props) {
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (open) setAmount(initial ? String(initial) : '');
  }, [open, initial]);

  const parsed = parseFloat(amount);
  const isValid = isFinite(parsed) && parsed > 0;

  const handleSave = () => {
    if (!isValid) return;
    onSave(amount.trim());
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Set quote"
      subtitle="Send the customer a total for this list"
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!isValid}
            loading={saving}
          >
            Send quote
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-ink-400">
            Quoted total (₦)
          </span>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-black text-ink-400">
              ₦
            </span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
              placeholder="0.00"
              autoFocus
              className="h-12 w-full rounded-xl border-0 bg-white/[.04] pl-9 pr-3 text-[15px] font-black tabular-nums text-white outline-none ring-1 ring-inset ring-white/10 transition focus:ring-2 focus:ring-brand-500"
            />
          </div>
          {suggestedTotal !== undefined && suggestedTotal > 0 && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-ink-500">
                Customer's estimate: {formatNaira(suggestedTotal)}
              </span>
              <button
                type="button"
                onClick={() => setAmount(String(suggestedTotal))}
                className="text-[11px] font-black text-brand-300 hover:text-brand-200"
              >
                Use estimate
              </button>
            </div>
          )}
        </label>
      </div>
    </Modal>
  );
}