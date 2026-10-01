import { useNavigate, useRouteError } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

interface RouteError {
  message?: string;
  statusText?: string;
}

export default function RouteErrorPage() {
  const error = useRouteError() as RouteError | undefined;
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#05070d] px-6 text-center">
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-rose-500/10 text-3xl ring-1 ring-inset ring-rose-400/30">
        💥
      </div>
      <h1 className="mb-2 text-xl font-black tracking-tight text-white">
        Something went wrong
      </h1>
      <p className="mb-6 max-w-sm text-[13px] font-medium text-ink-400">
        {error?.message ?? error?.statusText ?? 'An unexpected error occurred.'}
      </p>
      <div className="flex gap-3">
        <Button variant="primary" onClick={() => window.location.reload()}>
          Reload page
        </Button>
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          Go to dashboard
        </Button>
      </div>
    </div>
  );
}
