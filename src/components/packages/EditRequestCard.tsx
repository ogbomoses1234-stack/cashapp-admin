import { useState } from 'react';
import type { AdminPackageEditRequest } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime, formatRelative } from '@/utils/format';

interface Props {
  edit: AdminPackageEditRequest;
  onResolve: (
    status: 'approved' | 'denied',
    adminNote?: string
  ) => Promise<void> | void;
  busy?: boolean;
  /** If false, hides the approve/deny buttons (used in history view) */
  actionable?: boolean;
}

export function EditRequestCard({
  edit,
  onResolve,
  busy,
  actionable = true,
}: Props) {
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);

  const isPending = edit.status === 'pending';

  const tone =
    edit.status === 'approved'
      ? 'green'
      : edit.status === 'denied'
        ? 'rose'
        : 'amber';

  return (
    <div className="rounded-2xl border border-surface-border bg-white/[.015] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-ink-500">
          Edit request
        </span>
        <Badge tone={tone}>{edit.status}</Badge>
      </div>

      <p className="text-[12.5px] font-medium leading-relaxed text-white">
        {edit.reason}
      </p>

      <p className="mt-2 text-[10.5px] text-ink-500">
        Requested {formatRelative(edit.createdAt)}
        {edit.resolvedAt && ` · resolved ${formatDateTime(edit.resolvedAt)}`}
      </p>

      {edit.adminNote && (
        <div className="mt-3 rounded-lg bg-white/[.04] p-3 ring-1 ring-inset ring-white/10">
          <p className="text-[10px] font-black uppercase tracking-wider text-ink-500">
            Admin note
          </p>
          <p className="mt-0.5 text-[12px] text-ink-300">{edit.adminNote}</p>
        </div>
      )}

      {isPending && actionable && (
        <>
          {!showNote ? (
            <div className="mt-4 flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onResolve('approved')}
                disabled={busy}
                className="flex-1"
              >
                Approve
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowNote(true)}
                disabled={busy}
                className="flex-1"
              >
                Deny…
              </Button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional reason for the customer"
                disabled={busy}
                className="w-full resize-none rounded-xl border-0 bg-white/[.04] px-3.5 py-2.5 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
              />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowNote(false);
                    setNote('');
                  }}
                  disabled={busy}
                >
                  Back
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    onResolve('denied', note.trim() || undefined)
                  }
                  loading={busy}
                  className="flex-1"
                >
                  Send denial
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}