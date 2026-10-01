import { useCallback, useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  listUsers, deactivateUser, reactivateUser, resetUserPassword,
} from '@/services/user.service';
import type { UserRow } from '@/types';
import { formatNaira, formatDate } from '@/utils/format';
import { useDebounce } from '@/hooks/useDebounce';
import { ApiClientError } from '@/services/api';
import { toast } from '@/hooks/useToast';

export default function UsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deactivateTarget, setDeactivateTarget] = useState<UserRow | null>(null);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listUsers({
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
        perPage: 100,
      });
      setRows(res.items);
    } catch (e) {
      toast.error((e as ApiClientError).message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    if (deactivateReason.trim().length < 3) {
      toast.error('Enter a reason');
      return;
    }
    try {
      await deactivateUser(deactivateTarget.id, deactivateReason.trim());
      toast.success('User deactivated & devices blocked');
      setDeactivateTarget(null);
      setDeactivateReason('');
      load();
    } catch (e) {
      toast.error((e as ApiClientError).message);
    }
  };

  const handleReactivate = async (u: UserRow) => {
    try {
      await reactivateUser(u.id);
      toast.success('User reactivated');
      load();
    } catch (e) {
      toast.error((e as ApiClientError).message);
    }
  };

  const handleReset = async () => {
    if (!resetTarget) return;
    try {
      const res = await resetUserPassword(resetTarget.id);
      setTempPassword(res.tempPassword);
      toast.success('Password reset');
    } catch (e) {
      toast.error((e as ApiClientError).message);
    }
  };

  const columns: Column<UserRow>[] = [
    {
      key: 'fullName',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[.06] text-[10px] font-black text-white">
            {(u.fullName ?? u.email).slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-bold text-white">
              {u.fullName ?? '—'}
            </p>
            <p className="truncate text-[11px] text-ink-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => (
        <Badge tone={u.role === 'staff' ? 'violet' : u.role === 'admin' ? 'rose' : 'blue'}>
          {u.role}
        </Badge>
      ),
    },
    {
      key: 'walletBalance',
      header: 'Wallet',
      align: 'right',
      render: (u) => (
        <span className="text-[12.5px] font-black text-white">
          {formatNaira(u.walletBalance)}
        </span>
      ),
    },
    {
      key: 'emailVerified',
      header: 'Email',
      render: (u) => (
        <Badge tone={u.emailVerified ? 'green' : 'amber'}>
          {u.emailVerified ? 'Verified' : 'Pending'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (u) => (
        <span className="text-[12px] text-ink-400">{formatDate(u.createdAt)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => (
        <Badge tone={u.isActive ? 'green' : 'rose'}>
          {u.isActive ? 'Active' : 'Deactivated'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setResetTarget(u);
              setTempPassword(null);
            }}
          >
            Reset pw
          </Button>
          {u.isActive ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeactivateTarget(u)}
            >
              Deactivate
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleReactivate(u)}
            >
              Reactivate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Header
        title="User Management"
        subtitle="Customer and staff directory with access control"
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Filters */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="min-w-[240px] flex-1">
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border-0 bg-white/[.04] px-3.5 py-2.5 text-[13px] font-semibold text-white outline-none ring-1 ring-inset ring-white/10 transition focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All roles</option>
            <option value="customer">Customers</option>
            <option value="staff">Staff</option>
          </select>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          keyField="id"
          loading={loading}
          emptyIcon="👥"
          emptyTitle="No users found"
          emptyHint="Try adjusting your search or filters."
        />
      </div>

      {/* ─── Deactivate ────────────────────────────── */}
      <Modal
        open={!!deactivateTarget}
        onClose={() => {
          setDeactivateTarget(null);
          setDeactivateReason('');
        }}
        title="Deactivate user account"
        subtitle="Their device fingerprints will be blocked"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setDeactivateTarget(null);
                setDeactivateReason('');
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeactivate}>
              Deactivate
            </Button>
          </>
        }
      >
        <label className="block">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-ink-400">
            Reason
          </span>
          <textarea
            rows={3}
            value={deactivateReason}
            onChange={(e) => setDeactivateReason(e.target.value)}
            placeholder="e.g. Suspicious activity detected"
            className="w-full rounded-xl border-0 bg-white/[.04] px-3.5 py-3 text-[13px] font-medium text-white outline-none ring-1 ring-inset ring-white/10 transition focus:ring-2 focus:ring-brand-500"
          />
        </label>
      </Modal>

      {/* ─── Reset password ────────────────────────── */}
      <Modal
        open={!!resetTarget}
        onClose={() => {
          setResetTarget(null);
          setTempPassword(null);
        }}
        title="Reset password"
        subtitle={resetTarget?.email}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setResetTarget(null);
                setTempPassword(null);
              }}
            >
              Close
            </Button>
            {!tempPassword && (
              <Button variant="primary" onClick={handleReset}>
                Generate new password
              </Button>
            )}
          </>
        }
      >
        {tempPassword ? (
          <div className="space-y-3">
            <p className="text-[12.5px] font-medium text-ink-300">
              Share this temporary password with the user over a secure channel.
            </p>
            <div className="flex items-center gap-2 rounded-xl bg-white/[.04] p-3.5 ring-1 ring-inset ring-white/10">
              <code className="flex-1 font-mono text-[14px] font-black tracking-wider text-brand-300">
                {tempPassword}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard?.writeText(tempPassword);
                  toast.success('Copied');
                }}
              >
                Copy
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-[12.5px] font-medium text-ink-300">
            Generate a new temporary password for this user.
          </p>
        )}
      </Modal>
    </>
  );
}
