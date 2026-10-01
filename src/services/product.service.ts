import { del, get, patch, post } from './api';
import type { AdminProduct, Paginated } from '@/types';

type Loose = Record<string, unknown>;

/* ─── Coercion helpers ───────────────────────────────────── */
function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    if (isFinite(n)) return n;
  }
  return fallback;
}

function str(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return fallback;
}

function bool(v: unknown, fallback = true): boolean {
  if (typeof v === 'boolean') return v;
  if (v === 'true' || v === 1 || v === '1') return true;
  if (v === 'false' || v === 0 || v === '0') return false;
  return fallback;
}

/* ─── Normalize one product ──────────────────────────────── */
export function normalizeProduct(input: unknown, index = 0): AdminProduct {
  const r = (input ?? {}) as Loose;
  const countObj = (r._count ?? r.count ?? {}) as Loose;
  const serialCount = num(
    r.serialCount ?? r.serial_count ?? countObj.serials ?? countObj.serialCount ?? 0
  );

  return {
    id: str(r.id ?? r._id ?? `row-${index}`),
    title: str(r.title ?? r.name ?? 'Untitled'),
    slug: str(r.slug ?? r.id ?? `product-${index}`),
    description: (r.description as string) ?? null,
    price: str(r.price ?? 0),
    thumbnailUrl:
      (r.thumbnailUrl ?? r.thumbnail_url ?? r.image ?? null) as string | null,
    category: (r.category as string) ?? null,
    stockCount: num(r.stockCount ?? r.stock_count ?? r.stock ?? 0),
    isActive: bool(r.isActive ?? r.is_active ?? r.active, true),
    isFeatured: bool(r.isFeatured ?? r.is_featured ?? false, false),
    serialCount,
    createdAt: str(r.createdAt ?? r.created_at ?? new Date().toISOString()),
  };
}

/* ─── Extract array from any plausible backend shape ─────── */
function extractArray(data: unknown): Loose[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as Loose[];
  const obj = data as Loose;
  const arr = obj.items ?? obj.products ?? obj.data;
  return Array.isArray(arr) ? (arr as Loose[]) : [];
}

/* ═══════════════════════════════════════════════════════════
   Public API
═══════════════════════════════════════════════════════════ */

export async function listProducts(
  params: { search?: string; page?: number; perPage?: number } = {}
): Promise<Paginated<AdminProduct>> {
  const data = await get<unknown>(
    '/api/admin/products',
    params as Record<string, unknown>
  );

  const items = extractArray(data).map((r, i) => normalizeProduct(r, i));
  const obj = (data ?? {}) as Loose;

  return {
    items,
    page: num(obj.page, 1),
    perPage: num(obj.perPage ?? obj.per_page, items.length),
    total: num(obj.total, items.length),
    totalPages: num(obj.totalPages ?? obj.total_pages, 1),
  };
}

export interface ProductInput {
  title: string;
  price: number;
  description?: string;
  thumbnailUrl?: string;
  category?: string;
  stockCount?: number;
  isActive?: boolean;
}

export async function createProduct(input: ProductInput): Promise<AdminProduct> {
  const data = await post<unknown>('/api/admin/products', input);
  const obj = (data ?? {}) as Loose;
  const raw = (obj.product ?? obj) as Loose;
  return normalizeProduct(raw);
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>
): Promise<AdminProduct> {
  const data = await patch<unknown>(`/api/admin/products/${id}`, input);
  const obj = (data ?? {}) as Loose;
  const raw = (obj.product ?? obj) as Loose;
  return normalizeProduct(raw);
}

export async function deleteProduct(id: string): Promise<void> {
  await del<unknown>(`/api/admin/products/${id}`);
}

/* ═══════════════════════════════════════════════════════════
   toggleFeatured — the missing export
   Flip a product's "featured" flag (shown on the home page).
═══════════════════════════════════════════════════════════ */
export async function toggleFeatured(
  id: string,
  isFeatured: boolean
): Promise<AdminProduct> {
  const data = await patch<unknown>(`/api/admin/products/${id}/feature`, {
    isFeatured,
  });
  const obj = (data ?? {}) as Loose;
  const raw = (obj.product ?? obj) as Loose;
  return normalizeProduct(raw);
}
