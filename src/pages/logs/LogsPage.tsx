import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { listLogs } from '@/services/log.service';
import type { AuditLogRow } from '@/types';
import { formatDateTime } from '@/utils/format';

export default function LogsPage() {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listLogs({ perPage: 100 })
      .then((r) => setRows(r.items))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<AuditLogRow>[] = [
    { key: 'event', header: 'Event', render: (l) => (
      <span className="font-mono text-[12px] font-bold text-white">{l.event}</span>
    )},
    { key: 'actor', header: 'Actor', render: (l) => (
      <span className="text-[12px] text-ink-300">{l.actorEmail ?? '—'}</span>
    )},
    { key: 'ip', header: 'IP', render: (l) => (
      <span className="font-mono text-[11px] text-ink-500">{l.ipAddress ?? '—'}</span>
    )},
    { key: 'createdAt', header: 'When', render: (l) => (
      <span className="text-[12px] text-ink-400">{formatDateTime(l.createdAt)}</span>
    )},
  ];

  return (
    <>
      <Header title="Audit Logs" subtitle="Every state-changing action, tracked" />
      <div className="flex-1 overflow-y-auto p-6">
        <DataTable columns={columns} rows={rows} keyField="id" loading={loading}
          emptyIcon="📋" emptyTitle="No log entries" />
      </div>
    </>
  );
}
