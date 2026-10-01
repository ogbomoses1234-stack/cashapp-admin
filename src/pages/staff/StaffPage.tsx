import { useCallback, useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  listStaff, createStaff, resetStaffPassword, deactivateStaff,
} from '@/services/staff.service';
import type { StaffMember } from '@/types';
import { formatDate } from '@/utils/format';
import { ApiClientError } from '@/services/api';
import { toast } from '@/hooks/useToast';

export default function StaffPage() {
  const [rows, setRows] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [resetTarget, setResetTarget] = useState<StaffMember | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<StaffMember | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: '', email: '', phoneNumber: '', salesPoint: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listStaff({ perPage: 100 });
      setRows(res.items);
    } catch (e) {
      toast.error((e as ApiClientError).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    try {
      await createStaff({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim() || undefined,
        salesPoint: form.salesPoint.trim() || undefined,
      });
      toast.success('Staff account created — credentials emailed');
      setCreating(false);
      setForm({ fullName: '', email: '', phoneNumber: '', salesPoint: '' });
      load();
    } catch (e) {
      toast.error((e as ApiClientError).message);
    }
  };

  const handleReset = async () => {
    if (!resetTarget) return;
    try {
      const res = await resetStaffPassword(resetTarget.id);
      setTempPassword(res.tempPassword);
      toast.success('Password reset — share the temp password');
      load();
    } catch (e) {
      toast.error((e as ApiClientError).message);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await deactivateStaff(deactivateTarget.id);
      toast.success('Account deactivated & devices blocked');
      load();
    } catch (e) {
      toast.error((e as ApiClientError).message);
    }
  };

  const columns: Column<StaffMember>[] = [
    {
      key: 'fullName',
      header: 'Staff member',
      render: (s) => (
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 text-[10px] font-black text-white">
            {s.fullName.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-bold text-white">{s.fullName}</p>
            <p className="truncate text-[11px] text-ink-500">{s.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phoneNumber',
      header: 'Phone',
      render: (s) => (
        <span className="text-[12px] font-semibold text-ink-300">
          {s.phoneNumber ?? '—'}
        </span>
      ),
    },
    {
      key: 'salesPoint',
      header: 'Sales point',
      render: (s) => (
        <span className="text-[12px] font-semibold text-ink-300">
          {s.salesPoint ?? '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (s) => (
        <span className="text-[12px] text-ink-400">{formatDate(s.createdAt)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <Badge tone={s.isActive ? 'green' : 'rose'}>
          {s.isActive ? 'Active' : 'Deactivated'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (s) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setResetTarget(s);
              setTempPassword(null);
            }}
          >
            Reset pw
          </Button>
          {s.isActive && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeactivateTarget(s)}
            >
              Deactivate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Header
        title="Staff Management"
        subtitle="Provision seller accounts and control access"
        actions={
          <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
            + Create Staff
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <DataTable
          columns={columns}
          rows={rows}
          keyField="id"
          loading={loading}
          emptyIcon="👷"
          emptyTitle="No staff accounts yet"
          emptyHint="Create your first seller account to provision access."
        />
      </div>

      {/* ─── Create staff ──────────────────────────── */}
      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Create staff account"
        subtitle="A temp password is generated and emailed to them."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Create & send credentials
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full name"
            placeholder="Emeka Kalu"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            placeholder="emeka@vickkyaku.local"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Phone (optional)"
            placeholder="+2348035550142"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
          />
          <Input
            label="Sales point (optional)"
            placeholder="Ikeja · Stall 14"
            value={form.salesPoint}
            onChange={(e) => setForm({ ...form, salesPoint: e.target.value })}
          />
        </div>
      </Modal>

      {/* ─── Reset password ────────────────────────── */}
      <Modal
        open={!!resetTarget}
        onClose={() => {
          setResetTarget(null);
          setTempPassword(null);
        }}
        title="Reset password"
        subtitle={resetTarget?.fullName}
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
              Share this temporary password with the staff member over a secure channel. They will
              be required to change it on next login.
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
            This generates a new temporary password and forces the staff member to change it on
            next login.
          </p>
        )}
      </Modal>

      {/* ─── Deactivate ────────────────────────────── */}
      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        title="Deactivate staff account"
        danger
        confirmLabel="Deactivate"
        message={
          deactivateTarget ? (
            <div className="space-y-2">
              <p>
                <b className="text-white">{deactivateTarget.fullName}</b> will lose access
                immediately. Any device fingerprints they used will be permanently blocked.
              </p>
              <p className="text-[12px] text-ink-500">
                You can reactivate them later, but blocked devices will require manual clearance.
              </p>
            </div>
          ) : null
        }
        onConfirm={handleDeactivate}
      />
    </>
  );
}
