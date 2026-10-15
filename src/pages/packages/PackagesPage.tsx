import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listPackages } from '@/services/package.service';
import type { AdminPackage, PackageStatus, Paginated } from '@/types';
import { Header } from '@/components/layout/Header';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { Pagination } from '@/components/ui/Pagination';
import { formatDate, getInitials } from '@/utils/format';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from '@/hooks/useToast';
import { ApiClientError } from '@/services/api';

const STATUS_META: Record<PackageStatus, { label: string; tone: 'slate' | 'blue' | 'violet' | 'green' | 'amber' | 'rose' }> = {
  draft:       { label: 'Draft',       tone: 'slate' },
  submitted:   { label: 'Submitted',   tone: 'blue' },
  quoted:      { label: 'Quoted',      tone: 'violet' },
  approved:    { label: 'Approved',    tone: 'green' },
  in_progress: { label: 'In progress', tone: 'amber' },
  shipped:     { label: 'Shipped',     tone: 'blue' },
  delivered:   { label: 'Delivered',   tone: 'green' },
  cancelled:   { label: 'Cancelled',   tone: 'rose' },
};

const FILTERS: Array<{ key: 'all' | PackageStatus; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'approved', label: 'Approved' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function PackagesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Paginated<AdminPackage>>({
    items: [], page: 1, perPage: 30, total: 0, totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | PackageStatus>('all');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchInput, 350);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPackages({
        status: filter === 'all' ? undefined : filter,
        search: debouncedSearch.trim() || undefined,
        page,
        perPage: 30,
      });
      setData(res);
    } catch (e) {
      toast.error((e as ApiClientError).message);
    } finally {
      setLoading(false);
    }
  }, [filter, debouncedSearch, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [filter, debouncedSearch]);

  const columns = useMemo<Column<AdminPackage>[]>(() => [
    {
      key: 'reference', header: 'Reference', width: '140px',
      render: (p) => <span className="font-mono text-[12px] font-bold text-white">#{p.reference}</span>,
    },
    {
      key: 'customer', header: 'Customer',
      render: (p) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 text-[10px] font-black text-white">
            {getInitials(p.customer?.fullName ?? '—')}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-bold text-white">{p.customer?.fullName ?? '—'}</p>
            <p className="truncate text-[10.5px] text-ink-500">{p.customer?.email ?? ''}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'title', header: 'List',
      render: (p) => (
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-semibold text-white">{p.title}</p>
          <p className="mt-0.5 truncate text-[10.5px] text-ink-500">
            {p.items.length} {p.items.length === 1 ? 'item' : 'items'}
            {p.city && ` · ${p.city}`}
            {p.country && `, ${p.country}`}
          </p>
        </div>
      ),
    },
    {
      key: 'quote', header: 'Quote', align: 'right', width: '120px',
      render: (p) => p.quotedTotal
        ? <span className="font-mono text-[12px] font-bold text-brand-300">₦{Number(p.quotedTotal).toLocaleString()}</span>
        : <span className="text-ink-600">—</span>,
    },
    {
      key: 'status', header: 'Status', align: 'center', width: '130px',
      render: (p) => (
        <div className="flex flex-col items-center gap-1">
          <Badge tone={STATUS_META[p.status]?.tone ?? 'slate'}>{STATUS_META[p.status]?.label ?? p.status}</Badge>
          {p.pendingEditRequest && (
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-300">⏳ edit request</span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt', header: 'Created', align: 'right', width: '110px',
      render: (p) => <span className="text-[11.5px] text-ink-400">{formatDate(p.createdAt)}</span>,
    },
  ], []);

  return (
    <>
      <Header
        title="Special Orders"
        subtitle={`${data.total} list${data.total === 1 ? '' : 's'} · personal shopping requests`}
        actions={<RefreshButton onRefresh={load} tone="dark" label="Refresh lists" />}
      />

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
              </svg>
            </span>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by reference, title, customer…"
              className="h-10 w-full rounded-xl border-0 bg-white/[.04] pl-9 pr-3 text-[13px] font-medium text-white outline-none ring-1 ring-inset ring-white/10 transition placeholder:text-ink-500 focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-[12px] font-bold tracking-tight transition ${
                  isActive ? 'bg-brand-500 text-[#04140d]' : 'bg-white/[.04] text-ink-400 ring-1 ring-inset ring-white/10 hover:bg-white/[.08] hover:text-white'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <DataTable
          columns={columns}
          rows={data.items}
          keyField="id"
          loading={loading}
          onRowClick={(p) => navigate(`/packages/${p.id}`)}
          emptyTitle="No lists found"
          emptyHint={filter === 'all' ? 'Customer requests will appear here.' : `No lists with status "${filter}".`}
          emptyIcon="🛍️"
        />

        <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} disabled={loading} />
      </div>
    </>
  );
}
