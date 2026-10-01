import { ReactNode } from 'react';
import { Spinner } from './Spinner';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
  render: (row: T) => ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  keyField: keyof T;
  loading?: boolean;
  emptyTitle?: string;
  emptyHint?: string;
  emptyIcon?: ReactNode;
}

/**
 * Render one cell defensively.
 * If the column's render fn throws (e.g. reading `.toLocaleString()` on undefined),
 * we swallow it and show a placeholder instead of crashing the whole page.
 */
function SafeCell<T>({ col, row }: { col: Column<T>; row: T }) {
  try {
    const node = col.render(row);
    if (node === null || node === undefined || node === '') {
      return <span className="text-ink-500">—</span>;
    }
    return <>{node}</>;
  } catch {
    return (
      <span className="font-mono text-[11px] text-rose-400/70" title="Render error">
        ⚠ cell
      </span>
    );
  }
}

function SafeKey<T extends object>(row: T, keyField: keyof T, fallbackIdx: number): string {
  try {
    const v = row[keyField];
    if (v === undefined || v === null) return `__idx_${fallbackIdx}`;
    return String(v);
  } catch {
    return `__idx_${fallbackIdx}`;
  }
}

export function DataTable<T extends object>({
  columns,
  rows,
  keyField,
  loading,
  emptyTitle = 'No records found',
  emptyHint,
  emptyIcon,
}: Props<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-surface-border bg-white/[.015] py-20">
        <Spinner size={24} className="!border-white/15 !border-t-brand-400" />
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} hint={emptyHint} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-surface-border bg-white/[.015]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-surface-border bg-white/[.02]">
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{ width: c.width }}
                  className={`px-4 py-3 text-[10px] font-black uppercase tracking-wider text-ink-400 ${
                    c.align === 'right'
                      ? 'text-right'
                      : c.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                  }`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={SafeKey(row, keyField, rowIdx)}
                className="border-b border-surface-border/60 last:border-b-0 transition hover:bg-white/[.02]"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-4 py-3.5 align-middle ${
                      c.align === 'right'
                        ? 'text-right'
                        : c.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                    }`}
                  >
                    <SafeCell col={c} row={row} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
