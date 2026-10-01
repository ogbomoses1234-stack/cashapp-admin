import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#05070d] px-6 text-center">
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-white/[.04] text-2xl font-black text-white ring-1 ring-inset ring-white/10">
        404
      </div>
      <h1 className="mb-2 text-xl font-black tracking-tight text-white">
        Page not found
      </h1>
      <p className="mb-6 max-w-sm text-[13px] font-medium text-ink-400">
        This page doesn't exist in the admin console.
      </p>
      <Link to="/dashboard">
        <Button variant="primary">Back to dashboard</Button>
      </Link>
    </div>
  );
}
