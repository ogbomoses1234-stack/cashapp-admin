import { Outlet } from 'react-router-dom';
import { ToastHost } from '@/components/ui/Toast';

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05070d] px-4 py-10">
      {/* Ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(600px 400px at 30% 20%, rgba(16,185,129,.10), transparent 60%), radial-gradient(700px 500px at 80% 80%, rgba(124,92,255,.10), transparent 60%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(circle at 50% 50%, #000 30%, transparent 80%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <Outlet />
      </div>

      <ToastHost />
    </div>
  );
}
