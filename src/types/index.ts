/* =============================================================
   Admin domain types
============================================================= */

export type Role = 'customer' | 'staff' | 'admin';

export interface AdminProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'admin';
  createdAt: string;
}

export interface LoginChallenge {
  challengeId: string;
  email: string;
}

/* ─── Dashboard ─────────────────────────────────────────── */
export interface DashboardMetrics {
  totalCashbackRedeemed: string;
  activeSellers: number;
  pendingWithdrawals: number;
  pendingOrders: number;
  redemptionChart: Array<{ date: string; amount: string }>;
  serialLifecycle: {
    created: number;
    dispatched: number;
    redeemed: number;
    disputed: number;
  };
  recentActivity: Array<{
    id: string;
    event: string;
    actorName: string;
    actorRole: string;
    reference: string;
    status: string;
    createdAt: string;
  }>;
}

/* ─── Shared sub-objects ────────────────────────────────── */
export interface CustomerSummary {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  deliveryAddress: string;
}

/* ─── Orders ────────────────────────────────────────────── */
export type OrderStatus =
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Flagged'
  | 'Cancelled';

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customer: CustomerSummary;
  totalAmount: string;
  status: OrderStatus;
  paymentMethod: 'bank_transfer' | 'pod';
  receiptObjectKey: string | null;
  items: Array<{
    id: string;
    productTitle: string;
    quantity: number;
    unitPrice: string;
  }>;
  createdAt: string;
}

/* ─── Withdrawals ───────────────────────────────────────── */
export type WithdrawalStatus = 'pending' | 'approved' | 'declined';

export interface AdminWithdrawal {
  id: string;
  customer: CustomerSummary;
  amount: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: WithdrawalStatus;
  declineReason: string | null;
  createdAt: string;
  processedAt?: string | null;
  processedBy?: string | null;
}

/* ─── Products ──────────────────────────────────────────── */
export interface AdminProduct {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: string;
  thumbnailUrl: string | null;
  category: string | null;
  stockCount: number;
  isActive: boolean;
  isFeatured: boolean;
  serialCount: number;
  createdAt: string;
}

/* ─── Serials ───────────────────────────────────────────── */
export interface QrBatchResult {
  batchId: string;
  productId: string;
  productTitle: string;
  volume: number;
  archiveObjectKey: string;
  createdAt: string;
  qrSignature?: string;
}

export interface SerialRow {
  serialNumber: string;
  productTitle: string;
  status: 'Created' | 'Dispatched' | 'Redeemed' | 'Disputed';
  dispatchedBy: string | null;
  redeemedBy: string | null;
  dispatchedAt: string | null;
  redeemedAt: string | null;
  qrSignature?: string;
}

/* ─── Staff ─────────────────────────────────────────────── */
export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  salesPoint: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

/* ─── Users ─────────────────────────────────────────────── */
export interface UserRow {
  id: string;
  fullName: string | null;
  email: string;
  role: Role;
  phoneNumber: string | null;
  walletBalance: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}

/* ─── Chat ──────────────────────────────────────────────── */
export type ChatStatus =
  | 'open'
  | 'awaiting_admin'
  | 'awaiting_customer'
  | 'closed';

export interface AdminChatThread {
  id: string;
  customer: CustomerSummary;
  subject: string;
  status: ChatStatus;
  lastMessageAt: string;
  createdAt: string;
}

export interface AdminChatMessage {
  id: string;
  senderId: string;
  senderRole: 'customer' | 'admin';
  body: string;
  attachmentObjectKey: string | null;
  createdAt: string;
}

/* ─── Disputes ──────────────────────────────────────────── */
export type DisputeStatus = 'open' | 'investigating' | 'resolved' | 'rejected';

export interface AdminDispute {
  id: string;
  customer: CustomerSummary;
  serialNumber: string;
  description: string;
  photoObjectKey: string | null;
  status: DisputeStatus;
  adminNote: string | null;
  createdAt: string;
}

/* ─── Audit Log ─────────────────────────────────────────── */
export interface AuditLogRow {
  id: string;
  event: string;
  actorId: string | null;
  actorEmail: string | null;
  ipAddress: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

/* ─── Settings ──────────────────────────────────────────── */
export interface AdminSettings {
  cashbackAmount: string;
  minWithdrawal: string;
  scanRateLimit: number;
  scanLockoutMinutes: number;
  sessionTtlMinutes: number;
}

/* ─── API envelope ──────────────────────────────────────── */
export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  error: { code: string; message: string; details?: Record<string, unknown> };
}

export interface Paginated<T> {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}


/* ═══════════════════════════════════════════════════════════
   SERIAL TRACKER — audit trail for QR scans
═══════════════════════════════════════════════════════════ */
export type SerialTrackerStatus =
  | 'Created'
  | 'Dispatched'
  | 'Redeemed'
  | 'Disputed';

export interface TrackerUser {
  id: string;
  fullName: string;
  email: string;
  role?: 'customer' | 'staff' | 'admin';
  phoneNumber?: string | null;
}

export interface SerialTrackerRow {
  serialNumber: string;
  productId: string | null;
  productTitle: string;

  status: SerialTrackerStatus;

  /* Dispatch side (which staff took it out for sale) */
  dispatchedBy: TrackerUser | null;
  dispatchedAt: string | null;

  /* Redemption side (which customer claimed it) */
  redeemedBy: TrackerUser | null;
  redeemedAt: string | null;

  /* Metrics */
  timeToRedeemSeconds: number | null;

  /* Signature & meta */
  qrSignature: string | null;
  createdAt: string;
}


/* ═══════════════════════════════════════════════════════════
   WITHDRAWAL DETAIL — full cashback trail
═══════════════════════════════════════════════════════════ */
export interface WithdrawalSerialLink {
  serialNumber: string;
  productTitle?: string;
  serialStatus?: string;
  creditedAt: string;
  creditedAmount: string;
  serialFound: boolean;

  dispatchedBy?: TrackerUser | null;
  dispatchedAt?: string | null;
  redeemedBy?: TrackerUser | null;
  redeemedAt?: string | null;
  timeToRedeemSeconds?: number | null;
}

export interface WithdrawalDetail extends AdminWithdrawal {
  linkedSerials: WithdrawalSerialLink[];
  summary: {
    totalSerials: number;
    withStaffDispatch: number;
    withoutStaffDispatch: number;
    totalCredited: string;
  };
}
