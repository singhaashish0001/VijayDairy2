import type { ElementType, ReactNode } from 'react';

interface PageHeaderProps {
  icon: ElementType;
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}

/** Consistent icon-badge + title + subtitle header used at the top of every page. */
const PageHeader = ({ icon: Icon, title, subtitle, action }: PageHeaderProps) => (
  <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-[#e6e9df]">
    <div className="flex items-center gap-3.5 min-w-0">
      <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-primary-mid to-primary-dark flex items-center justify-center text-white shadow-md shadow-primary/25 shrink-0 ring-4 ring-primary-light/70">
        <Icon size={21} />
      </div>
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold text-slate-900 leading-tight truncate tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action && <div className="flex flex-wrap gap-2 shrink-0">{action}</div>}
    <span className="absolute -bottom-px left-0 h-0.5 w-24 rounded-full bg-linear-to-r from-accent-mid to-primary-mid" />
  </div>
);

export default PageHeader;
