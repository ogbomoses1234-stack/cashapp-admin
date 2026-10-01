import { Button } from './Button';

interface Props {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
  disabled?: boolean;
}

export function Pagination({ page, totalPages, onChange, disabled }: Props) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 pt-4">
      <span className="text-[12px] font-semibold text-ink-400">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onChange(page - 1)}
        >
          ← Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
