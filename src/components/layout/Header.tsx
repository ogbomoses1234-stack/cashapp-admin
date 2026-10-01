import { useUIStore } from '@/store/uiStore';

interface Props {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: Props) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-surface-border bg-[#0a0e17]/70 px-6 py-4 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-white/[.05] hover:text-white"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-[16px] font-black tracking-tight text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-[11.5px] font-medium text-ink-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
