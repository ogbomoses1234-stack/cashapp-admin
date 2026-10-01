import { Outlet } from 'react-router-dom';
import { RouteProgress } from '@/components/ui/RouteProgress';
import { Sidebar } from '@/components/layout/Sidebar';
import { ToastHost } from '@/components/ui/Toast';

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-[#05070d]">
      <RouteProgress />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
      <ToastHost />
    </div>
  );
}
