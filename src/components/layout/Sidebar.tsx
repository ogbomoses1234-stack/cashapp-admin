import { NavLink, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { useUIStore } from '@/store/uiStore';
import { logout } from '@/services/auth.service';
import { toast } from '@/hooks/useToast';
import { getInitials } from '@/utils/format';

const SECTIONS = [
  {
    label: 'Operations',
    items: [
      { to: '/dashboard',    icon: '📊', label: 'Dashboard' },
      { to: '/withdrawals',  icon: '💸', label: 'Withdrawals' },
      { to: '/orders',       icon: '🧾', label: 'Orders' },
    ],
  },
{
  label: 'Catalog',
  items: [
    { to: '/products',     icon: '🏷️', label: 'Products' },
    { to: '/banners',      icon: '🖼️', label: 'Banners' },
    { to: '/qr-generator', icon: '🔲', label: 'QR Generator' },
  ],
},
  
  {
    label: 'People',
    items: [
      { to: '/staff',        icon: '👷', label: 'Staff' },
      { to: '/users',        icon: '👥', label: 'Users' },
    ],
  },
  {
    label: 'Support',
    items: [
      { to: '/chats',        icon: '💬', label: 'Chats' },
      { to: '/disputes',     icon: '⚠️', label: 'Disputes' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/logs',         icon: '📋', label: 'Audit Logs' },
      { to: '/settings',     icon: '⚙️', label: 'Settings' },
    ],
  },
];

export function Sidebar() {
  const admin = useAdminAuthStore((s) => s.admin);
  const clear = useAdminAuthStore((s) => s.clear);
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {}
    clear();
    toast.success('Signed out');
    navigate('/login');
  };

  return (
    <aside
      className={`flex flex-col border-r border-surface-border bg-[#080b12] transition-all ${
        collapsed ? 'w-[68px]' : 'w-[240px]'
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-surface-border px-4">
        <Logo size={28} className="flex-shrink-0" />
        {!collapsed && (
          <div className="min-w-0">
            <strong className="block truncate text-[12.5px] font-black tracking-tight text-white">
              Vickkyaku · Admin
            </strong>
            <span className="block truncate text-[10px] font-semibold text-ink-500">
              Isolated ecosystem
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-3">
            {!collapsed && (
              <p className="px-3 py-2 text-[9.5px] font-black uppercase tracking-[0.12em] text-ink-600">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-[12.5px] font-semibold transition ${
                      isActive
                        ? 'bg-brand-500/10 text-brand-300 ring-1 ring-inset ring-brand-400/25'
                        : 'text-ink-400 hover:bg-white/[.04] hover:text-white'
                    } ${collapsed ? 'justify-center' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0 text-[15px]">{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-surface-border p-3">
        <div className={`flex items-center gap-2.5 rounded-lg bg-white/[.03] p-2 ${collapsed ? 'justify-center' : ''}`}>
          <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 text-[10px] font-black text-white">
            {getInitials(admin?.fullName ?? admin?.email)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-[11.5px] font-bold text-white">
                {admin?.fullName ?? 'Admin'}
              </strong>
              <button
                onClick={handleLogout}
                className="text-[10px] font-semibold text-ink-500 hover:text-rose-400"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
