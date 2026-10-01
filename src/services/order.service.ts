import { get, patch } from './api';
import type { AdminOrder, CustomerSummary, Paginated } from '@/types';

type Loose = Record<string, unknown>;

/* ─── Coercion helpers ──────────────────────────────────── */
function str(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return fallback;
}
function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    if (isFinite(n)) return n;
  }
  return fallback;
}

/* ─── Shared: normalize a customer object ───────────────── */
export function normalizeCustomer(input: unknown): CustomerSummary {
  const r = (input ?? {}) as Loose;
  return {
    id: str(r.id ?? r._id ?? r.customerId ?? r.customer_id ?? ''),
    fullName: str(
      r.fullName ??
        r.full_name ??
        r.name ??
        r.customerName ??
        r.customer_name ??
        '—'
    ),
    email: str(r.email ?? r.customerEmail ?? r.customer_email ?? ''),
    phoneNumber: (r.phoneNumber ??
      r.phone_number ??
      r.phone ??
      null) as string | null,
    deliveryAddress: str(
      r.deliveryAddress ??
        r.delivery_address ??
        r.address ??
        '—'
    ),
  };
}

/* ─── Normalize one order ───────────────────────────────── */
function normalizeOrder(input: unknown, index = 0): AdminOrder {
  const r = (input ?? {}) as Loose;

  /* Customer may be nested under customer / user / buyer,
     or the order may have top-level customerName fields */
  const customerSource = r.customer ?? r.user ?? r.buyer ?? r;

  const rawItems = (r.items ?? r.orderItems ?? r.order_items ?? []) as unknown;
  const items = Array.isArray(rawItems)
    ? rawItems.map((it, i) => {
        const row = (it ?? {}) as Loose;
        const product = (row.product ?? {}) as Loose;
        return {
          id: str(row.id ?? row._id ?? `item-${i}`),
          productTitle: str(
            row.productTitle ??
              row.product_title ??
              product.title ??
              row.title ??
              'Item'
          ),
          quantity: num(row.quantity, 1),
          unitPrice: str(
            row.unitPrice ??
              row.unit_price ??
              row.price ??
              product.price ??
              0
          ),
        };
      })
    : [];

  const rawStatus = str(
    r.status ?? r.orderStatus ?? r.order_status ?? 'Processing'
  );
  const status = (rawStatus.charAt(0).toUpperCase() +
    rawStatus.slice(1).toLowerCase()) as AdminOrder['status'];

  return {
    id: str(r.id ?? r._id ?? `order-${index}`),
    orderNumber: str(r.orderNumber ?? r.order_number ?? r.reference ?? '—'),
    customer: normalizeCustomer(customerSource),
    totalAmount: str(r.totalAmount ?? r.total_amount ?? r.total ?? 0),
    status,
    paymentMethod: (r.paymentMethod ??
      r.payment_method ??
      'bank_transfer') as AdminOrder['paymentMethod'],
    receiptObjectKey: (r.receiptObjectKey ??
      r.receipt_object_key ??
      r.receipt ??
      null) as string | null,
    items,
    createdAt: str(r.createdAt ?? r.created_at ?? new Date().toISOString()),
  };
}

/* ─── Public API ────────────────────────────────────────── */
export async function listOrders(
  params: { status?: string; page?: number; perPage?: number } = {}
): Promise<Paginated<AdminOrder>> {
  const data = await get<unknown>(
    '/api/admin/orders',
    params as Record<string, unknown>
  );

  if (Array.isArray(data)) {
    const items = (data as Loose[]).map((r, i) => normalizeOrder(r, i));
    return {
      items,
      page: 1,
      perPage: items.length,
      total: items.length,
      totalPages: 1,
    };
  }

  const obj = (data ?? {}) as Loose;
  const rawList = (obj.items ?? obj.orders ?? obj.data ?? []) as unknown;
  const items = Array.isArray(rawList)
    ? (rawList as Loose[]).map((r, i) => normalizeOrder(r, i))
    : [];

  return {
    items,
    page: num(obj.page, 1),
    perPage: num(obj.perPage ?? obj.per_page, items.length),
    total: num(obj.total, items.length),
    totalPages: num(obj.totalPages ?? obj.total_pages, 1),
  };
}

export function getOrder(id: string) {
  return get<unknown>(`/api/admin/orders/${id}`).then((data) => {
    const obj = (data ?? {}) as Loose;
    const raw = (obj.order ?? obj) as Loose;
    return normalizeOrder(raw);
  });
}

export function approveOrder(id: string) {
  return patch<unknown>(`/api/admin/orders/${id}/approve`).then((data) => {
    const obj = (data ?? {}) as Loose;
    const raw = (obj.order ?? obj) as Loose;
    return normalizeOrder(raw);
  });
}

export function flagOrder(id: string, reason: string) {
  return patch<unknown>(`/api/admin/orders/${id}/flag`, { reason }).then(
    (data) => {
      const obj = (data ?? {}) as Loose;
      const raw = (obj.order ?? obj) as Loose;
      return normalizeOrder(raw);
    }
  );
}

/* ─── Signed URL for the order's receipt ──────────────────── */
export async function getOrderReceiptUrl(
  orderId: string
): Promise<{ url: string; objectKey: string }> {
  const data = await get<{ url: string; objectKey: string }>(
    `/api/admin/orders/${orderId}/receipt-url`
  );
  return data;
}
