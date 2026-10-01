import { useCallback, useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProductImageUploader } from '@/components/products/ProductImageUploader';
import {
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  type Banner,
  type BannerInput,
} from '@/services/banner.service';
import { ApiClientError } from '@/services/api';
import { toast } from '@/hooks/useToast';
import { formatDate } from '@/utils/format';

const EMPTY: BannerInput = {
  imageUrl: '',
  headline: '',
  subtext: '',
  ctaText: 'Shop now',
  ctaUrl: '/categories',
  sortOrder: 0,
  isActive: true,
};

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BannerInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Banner | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBanners(await listBanners());
    } catch (e) {
      toast.error((e as ApiClientError).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      imageUrl: b.imageUrl,
      headline: b.headline,
      subtext: b.subtext ?? '',
      ctaText: b.ctaText ?? '',
      ctaUrl: b.ctaUrl ?? '',
      sortOrder: b.sortOrder,
      isActive: b.isActive,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.imageUrl || !form.headline.trim()) {
      return toast.error('Image and headline are required');
    }
    setSaving(true);
    try {
      if (editing) {
        await updateBanner(editing.id, form);
        toast.success('Banner updated');
      } else {
        await createBanner(form);
        toast.success('Banner created');
      }
      setOpen(false);
      load();
    } catch (e) {
      toast.error((e as ApiClientError).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteBanner(deleting.id);
      setBanners((p) => p.filter((b) => b.id !== deleting.id));
      toast.success('Banner deleted');
    } catch (e) {
      toast.error((e as ApiClientError).message);
    }
  };

  const toggleActive = async (b: Banner) => {
    try {
      await updateBanner(b.id, { isActive: !b.isActive });
      setBanners((p) =>
        p.map((x) => (x.id === b.id ? { ...x, isActive: !b.isActive } : x))
      );
    } catch (e) {
      toast.error((e as ApiClientError).message);
    }
  };

  return (
    <>
      <Header
        title="Banners"
        subtitle="Manage the home page carousel"
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            + New Banner
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-white/[.02]" />
            ))}
          </div>
        ) : banners.length === 0 ? (
          <EmptyState
            icon="🖼️"
            title="No banners yet"
            hint="Create your first banner to power the home carousel."
            action={<Button variant="primary" onClick={openCreate}>+ New Banner</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {banners.map((b) => (
              <div
                key={b.id}
                className="group overflow-hidden rounded-2xl border border-surface-border bg-white/[.015]"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-ink-950">
                  <img
                    src={b.imageUrl}
                    alt={b.headline}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.opacity = '0.15';
                    }}
                  />
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    <Badge tone={b.isActive ? 'green' : 'slate'}>
                      {b.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge tone="slate">#{b.sortOrder}</Badge>
                  </div>
                </div>

                <div className="p-4">
                  <p className="line-clamp-1 text-[13px] font-black text-white">
                    {b.headline}
                  </p>
                  {b.subtext && (
                    <p className="mt-1 line-clamp-1 text-[11.5px] text-ink-400">
                      {b.subtext}
                    </p>
                  )}
                  <p className="mt-2 text-[10.5px] font-mono text-ink-500">
                    {formatDate(b.createdAt)}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(b)}>
                      ✎ Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleActive(b)}>
                      {b.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setDeleting(b)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit banner' : 'New banner'}
        subtitle="Upload an image, set the copy, and choose where the CTA goes."
        maxWidth="max-w-3xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {editing ? 'Save changes' : 'Create banner'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
          <div>
            <ProductImageUploader
              value={form.imageUrl || null}
              onChange={(url) => setForm({ ...form, imageUrl: url ?? '' })}
              disabled={saving}
            />
          </div>
          <div className="space-y-4">
            <Input
              label="Headline"
              placeholder="Scan the seal. Get ₦100."
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              disabled={saving}
            />
            <Input
              label="Subtext (optional)"
              placeholder="Every sealed pack hides a code."
              value={form.subtext ?? ''}
              onChange={(e) => setForm({ ...form, subtext: e.target.value })}
              disabled={saving}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="CTA text"
                placeholder="Shop now"
                value={form.ctaText ?? ''}
                onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                disabled={saving}
              />
              <Input
                label="CTA URL"
                placeholder="/categories"
                value={form.ctaUrl ?? ''}
                onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
                disabled={saving}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Sort order"
                type="number"
                value={form.sortOrder ?? 0}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: parseInt(e.target.value, 10) || 0 })
                }
                disabled={saving}
              />
              <div className="flex items-end pb-1">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive !== false}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    disabled={saving}
                    className="h-4 w-4 rounded accent-brand-500"
                  />
                  <span className="text-[12px] font-bold text-white">Active</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete banner"
        danger
        confirmLabel="Delete permanently"
        message={
          deleting ? (
            <p>
              Delete <b className="text-white">{deleting.headline}</b>? This cannot be undone.
            </p>
          ) : null
        }
        onConfirm={handleDelete}
      />
    </>
  );
}
