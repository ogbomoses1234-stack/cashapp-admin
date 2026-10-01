import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { listDisputes } from '@/services/dispute.service';
import type { AdminDispute } from '@/types';
import { formatDate } from '@/utils/format';

export default function DisputesPage() {
  const [rows, setRows] = useState<AdminDispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listDisputes({ perPage: 100 })
      .then((r) => setRows(r.items))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<AdminDispute>[] = [
    { key: 'customer', header: 'Customer', render: (d) => (
      <div><p className="text-[12.5px] font-bold text-white">{d.customer.fullName}</p>
      <p className="text-[11px] text-ink-500">{d.customer.email}</p></div>
    )},
    { key: 'serial', header: 'Serial', render: (d) => (
      <span className="font-mono text-[12px] text-white">#{d.serialNumber}</span>
    )},
    { key: 'desc', header: 'Description', render: (d) => (
      <span className="line-clamp-1 text-[12px] text-ink-300">{d.description}</span>
    )},
    { key: 'createdAt', header: 'Reported', render: (d) => (
      <span className="text-[12px] text-ink-400">{formatDate(d.createdAt)}</span>
    )},
    { key: 'status', header: 'Status', render: (d) => (
      <Badge tone={d.status === 'resolved' ? 'green' : d.status === 'rejected' ? 'rose' : 'amber'}>
        {d.status}
      </Badge>
    )},
  ];

  return (
    <>
      <Header title="Dispute Reports" subtitle="Review and resolve QR seal disputes" />
      <div className="flex-1 overflow-y-auto p-6">
        <DataTable columns={columns} rows={rows} keyField="id" loading={loading}
          emptyIcon="⚠️" emptyTitle="No disputes" emptyHint="All clear." />
      </div>
    </>
  );
}
