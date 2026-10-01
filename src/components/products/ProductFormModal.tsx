import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProductImageUploader } from './ProductImageUploader';
import {
  createProduct,
  updateProduct,
  type ProductInput,
} from '@/services/product.service';
import type { AdminProduct } from '@/types';
import { ApiClientError } from '@/services/api';
import { toast } from '@/hooks/useToast';

interface Props {
  open: boolean;
  product: AdminProduct | null; // null = create mode
  onClose: () => void;
  onSaved: (product: AdminProduct) => void;
}

interface FormState {
  title: string;
  price: string;
  stockCount: string;
  category: string;
  description: string;
  thumbnailUrl: string | null;
  isActive: boolean;
}

const EMPTY: FormState = {
  title: '',
  price: '',
  stockCount: '',
  category: '',
  description: '',
  thumbnailUrl: null,
  isActive: true,
};

export function ProductFormModal({ open, product, onClose, onSaved }: Props) {
  const isEdit = !!product;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  /* ─── Sync form when modal opens ──────────────────────── */
  useEffect(() => {
    if (!open) return;
    if (product) {
      setForm({
        title: product.title,
        price: String(product.price ?? ''),
        stockCount: String(product.stockCount ?? ''),
        category: product.category ?? '',
        description: product.description ?? '',
        thumbnailUrl: product.thumbnailUrl,
        isActive: product.isActive,
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [open, product]);

  /* ─── Validate ────────────────────────────────────────── */
  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    const p = parseFloat(form.price);
    if (!isFinite(p) || p < 0) e.price = 'Enter a valid price';
    const s = form.stockCount === '' ? 0 : parseInt(form.stockCount, 10);
    if (!isFinite(s) || s < 0) e.stockCount = 'Enter a valid number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ─── Save ────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: ProductInput = {
        title: form.title.trim(),
        price: parseFloat(form.price),
        stockCount: form.stockCount === '' ? 0 : parseInt(form.stockCount, 10),
        description: form.description.trim() || undefined,
        category: form.category.trim() || undefined,
        thumbnailUrl: form.thumbnailUrl ?? undefined,
        isActive: form.isActive,
      };

      const saved = isEdit && product
        ? await updateProduct(product.id, payload)
        : await createProduct(payload);

      toast.success(isEdit ? 'Product updated' : 'Product created');
      onSaved(saved);
      onClose();
    } catch (e) {
      toast.error((e as ApiClientError).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit product' : 'Create product'}
      subtitle={
        isEdit
          ? `Updating: ${product?.title}`
          : 'Fill in the details. You can upload an image now or later.'
      }
      maxWidth="max-w-3xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>
            {isEdit ? 'Save changes' : 'Create product'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
        {/* ─── Left: image ───────────────────────────── */}
        <div>
          <ProductImageUploader
            value={form.thumbnailUrl}
            onChange={(url) => setForm({ ...form, thumbnailUrl: url })}
            disabled={saving}
          />
        </div>

        {/* ─── Right: fields ─────────────────────────── */}
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="Body Lotion 400ml"
            value={form.title}
            error={errors.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            disabled={saving}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price (₦)"
              type="number"
              min={0}
              placeholder="4500"
              value={form.price}
              error={errors.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              disabled={saving}
            />
            <Input
              label="Stock count"
              type="number"
              min={0}
              placeholder="100"
              value={form.stockCount}
              error={errors.stockCount}
              onChange={(e) => setForm({ ...form, stockCount: e.target.value })}
              disabled={saving}
            />
          </div>

          <Input
            label="Category"
            placeholder="Skincare"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            disabled={saving}
          />

          <label className="block">
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-ink-400">
              Description
            </span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Deep moisturising body lotion with shea butter…"
              disabled={saving}
              className="w-full resize-none rounded-xl border-0 bg-white/[.04] px-3.5 py-3 text-[13px] font-medium text-white outline-none ring-1 ring-inset ring-white/10 transition placeholder:text-ink-500 focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
            />
          </label>

          {/* Active toggle */}
          <label className="flex cursor-pointer items-center gap-3">
            <span
              onClick={() => !saving && setForm({ ...form, isActive: !form.isActive })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition ${
                form.isActive ? 'bg-brand-500' : 'bg-white/10'
              } ${saving ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                  form.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </span>
            <div>
              <p className="text-[12.5px] font-bold text-white">
                {form.isActive ? 'Active' : 'Inactive'}
              </p>
              <p className="text-[11px] text-ink-500">
                Inactive products are hidden from the customer catalog
              </p>
            </div>
          </label>
        </div>
      </div>
    </Modal>
  );
}
