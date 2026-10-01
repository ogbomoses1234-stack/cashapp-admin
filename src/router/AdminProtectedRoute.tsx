import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { Spinner } from '@/components/ui/Spinner';

export function AdminProtectedRoute() {
  const admin = useAdminAuthStore((s) => s.admin);
  const hydrated = useAdminAuthStore((s) => s.hydrated);
  const location = useLocation();

  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#05070d]">
        <Spinner size={28} className="!border-white/15 !border-t-brand-400" />
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
