import { useCallback, useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProductFormModal } from '@/components/products/ProductFormModal';
import {
  listProducts,
  deleteProduct,
  toggleFeatured,
} from '@/services/product.service';
import type { AdminProduct } from '@/types';
import { formatNaira } from '@/utils/format';
import { useDebounce } from '@/hooks/useDebounce';
import { ApiClientError } from '@/services/api';
import { toast } from '@/hooks/useToast';

export default function ProductsPage() {
  const [rows, setRows] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState<AdminProduct | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  /* ─── Load ────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listProducts({
        search: debouncedSearch || undefined,
        perPage: 200,
      });
      setRows(Array.isArray(res.items) ? res.items : []);
    } catch (e) {
      toast.error((e as ApiClientError).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  /* ─── Create / Edit ───────────────────────────────────── */
  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (p: AdminProduct) => {
    setEditing(p);
    setModalOpen(true);
  };

  const handleSaved = (saved: AdminProduct) => {
    setRows((prev) => {
      const exists = prev.some((r) => r.id === saved.id);
      return exists
        ? prev.map((r) => (r.id === saved.id ? saved : r))
        : [saved, ...prev];
    });
  };

  /* ─── Delete ──────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteProduct(deleting.id);
      setRows((prev) => prev.filter((r) => r.id !== deleting.id));
      toast.success('Product deleted');
    } catch (e) {
      toast.error((e as ApiClientError).message);
    } finally {
      setDeleting(null);
    }
  };

  /* ─── Feature toggle ──────────────────────────────────── */
  const handleToggleFeatured = async (p: AdminProduct) => {
    if (togglingId) return;
    const next = !p.isFeatured;
    setTogglingId(p.id);

    // Optimistic update — flip immediately, roll back if the call fails
    setRows((prev) =>
      prev.map((r) => (r.id === p.id ? { ...r, isFeatured: next } : r))
    );

    try {
      const updated = await toggleFeatured(p.id, next);
      setRows((prev) => prev.map((r) => (r.id === p.id ? updated : r)));
      toast.success(
        next ? 'Added to home page featured' : 'Removed from featured'
      );
    } catch (e) {
      // Roll back
      setRows((prev) =>
        prev.map((r) => (r.id === p.id ? { ...r, isFeatured: p.isFeatured } : r))
      );
      toast.error((e as ApiClientError).message);
    } finally {
      setTogglingId(null);
    }
  };

  /* ─── Columns ─────────────────────────────────────────── */
  const columns: Column<AdminProduct>[] = [
    /* ═══════════════════════════════════════════════════
       FEATURED STAR — admin-controlled home page visibility
    ═══════════════════════════════════════════════════ */
    {
      key: 'featured',
      header: '★',
      align: 'center',
      width: '56px',
      render: (p) => {
        const isBusy = togglingId === p.id;
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFeatured(p);
            }}
            disabled={isBusy}
            className={`grid h-8 w-8 place-items-center rounded-lg text-lg transition active:scale-95 ${
              p.isFeatured
                ? 'bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-400/30 hover:bg-amber-500/25'
                : 'text-ink-500 hover:bg-white/[.05] hover:text-amber-300'
            } ${isBusy ? 'opacity-50' : ''}`}
            title={
              p.isFeatured
                ? 'Remove from home page featured'
                : 'Feature on home page'
            }
            aria-label={p.isFeatured ? 'Unfeature product' : 'Feature product'}
          >
            {isBusy ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-300/30 border-t-amber-300" />
            ) : p.isFeatured ? (
              '★'
            ) : (
              '☆'
            )}
          </button>
        );
      },
    },

    /* ═══════════════════════════════════════════════════
       PRODUCT (thumbnail + title + slug)
    ═══════════════════════════════════════════════════ */
    {
      key: 'product',
      header: 'Product',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 flex-shrink-0 place-items-center overflow-hidden rounded-lg bg-white/[.04] ring-1 ring-inset ring-white/10">
            {p.thumbnailUrl ? (
              <img
                src={p.thumbnailUrl}
                alt={p.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                  if (img.parentElement) {
                    img.parentElement.classList.add('text-lg');
                    img.parentElement.textContent = '📦';
                  }
                }}
              />
            ) : (
              <span className="text-lg opacity-40">📦</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-white">
              {p.title ?? '—'}
            </p>
            <p className="truncate font-mono text-[11px] text-ink-500">
              {p.slug ?? '—'}
            </p>
          </div>
        </div>
      ),
    },

    /* ═══════════════════════════════════════════════════
       CATEGORY
    ═══════════════════════════════════════════════════ */
    {
      key: 'category',
      header: 'Category',
      render: (p) => (
        <span className="text-[12px] font-semibold capitalize text-ink-300">
          {p.category ?? '—'}
        </span>
      ),
    },

    /* ═══════════════════════════════════════════════════
       PRICE
    ═══════════════════════════════════════════════════ */
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      render: (p) => (
        <span className="text-[13px] font-black text-white">
          {formatNaira(p.price ?? '0')}
        </span>
      ),
    },

    /* ═══════════════════════════════════════════════════
       STOCK
    ═══════════════════════════════════════════════════ */
    {
      key: 'stock',
      header: 'Stock',
      align: 'right',
      render: (p) => {
        const stock = Number(p.stockCount ?? 0);
        return (
          <span
            className={`text-[12.5px] font-semibold ${
              stock === 0 ? 'text-rose-400' : 'text-ink-300'
            }`}
          >
            {stock.toLocaleString()}
          </span>
        );
      },
    },

    /* ═══════════════════════════════════════════════════
       SERIALS
    ═══════════════════════════════════════════════════ */
    {
      key: 'serials',
      header: 'Serials',
      align: 'right',
      render: (p) => (
        <span className="font-mono text-[12.5px] text-ink-400">
          {Number(p.serialCount ?? 0).toLocaleString()}
        </span>
      ),
    },

    /* ═══════════════════════════════════════════════════
       STATUS
    ═══════════════════════════════════════════════════ */
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <Badge tone={p.isActive ? 'green' : 'slate'}>
          {p.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },

    /* ═══════════════════════════════════════════════════
       ACTIONS
    ═══════════════════════════════════════════════════ */
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <div
          className="flex items-center justify-end gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
            ✎ Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleting(p)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Header
        title="Products"
        subtitle="Manage your catalog · tap ★ to feature on the home page"
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            + New Product
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Search */}
        <div className="mb-5 flex items-center gap-3">
          <div className="max-w-md flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by title or slug…"
              className="w-full rounded-xl border-0 bg-white/[.04] px-3.5 py-2.5 text-[13px] font-semibold text-white outline-none ring-1 ring-inset ring-white/10 transition placeholder:text-ink-500 focus:ring-2 focus:ring-brand-500"
            />
          </div>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-[12px] font-bold text-ink-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          keyField="id"
          loading={loading}
          emptyIcon="🏷️"
          emptyTitle="No products yet"
          emptyHint="Create your first product to start minting QR serials."
        />
      </div>

      {/* ─── Create/Edit modal ────────────────────────── */}
      <ProductFormModal
        open={modalOpen}
        product={editing}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />

      {/* ─── Delete confirmation ──────────────────────── */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete product"
        danger
        confirmLabel="Delete permanently"
        message={
          deleting ? (
            <div className="space-y-2">
              <p>
                You're about to permanently delete{' '}
                <b className="text-white">{deleting.title}</b>. This cannot be
                undone.
              </p>
              <p className="text-[12px] text-ink-500">
                {deleting.serialCount > 0 ? (
                  <>
                    ⚠ This product has{' '}
                    <b className="text-amber-300">
                      {deleting.serialCount} serials
                    </b>{' '}
                    associated with it. The backend may reject the deletion.
                  </>
                ) : (
                  'No serials are associated with this product.'
                )}
              </p>
            </div>
          ) : null
        }
        onConfirm={handleDelete}
      />
    </>
  );
}
