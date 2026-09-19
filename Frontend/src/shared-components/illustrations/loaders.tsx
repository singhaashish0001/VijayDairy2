/**
 * @file loaders.tsx
 * @description Custom dairy-themed loaders (pure SVG + CSS keyframes from index.css, no dependencies):
 *   - MilkDropSpinner: compact droplet with ripple rings for buttons and inline states
 *   - MilkPourLoader:  bottle pours milk into a glass — full-page / app-boot loader
 *   - CowLoader:       bobbing cow — data-fetching loader for dashboards
 *   - Skeleton, TableSkeleton, CardSkeleton: shimmer placeholders
 * Every loader exposes role="status" with an accessible label and respects prefers-reduced-motion.
 */
import { CowShape } from './dairy-illustrations';

export const MilkDropSpinner = ({ size = 22, className = '', label = 'Loading' }: { size?: number; className?: string; label?: string }) => (
  <span role="status" aria-label={label} className={`inline-flex items-center justify-center ${className}`}>
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="30" r="9" fill="none" strokeWidth="2" className="animate-ripple stroke-current" />
      <circle cx="20" cy="30" r="9" fill="none" strokeWidth="2" className="animate-ripple stroke-current" style={{ animationDelay: '0.8s' }} />
      <path className="animate-drop-fall fill-current" d="M20 5c-4.500 6-7 9.500-7 13a7 7 0 0 0 14 0c0-3.500-2.500-7-7-13z" />
    </svg>
  </span>
);

export const MilkPourLoader = ({ label = 'Pouring fresh data…', size = 120 }: { label?: string; size?: number }) => (
  <div role="status" aria-live="polite" className="flex flex-col items-center gap-3">
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <clipPath id="pour-glass-clip">
          <path d="M68 66h36l-4 44a5 5 0 0 1-5 4H77a5 5 0 0 1-5-4z" />
        </clipPath>
      </defs>
      {/* Glass */}
      <path d="M68 66h36l-4 44a5 5 0 0 1-5 4H77a5 5 0 0 1-5-4z" fill="#fff" stroke="#c9d6c0" strokeWidth="2" />
      <g clipPath="url(#pour-glass-clip)">
        <g className="animate-glass-fill">
          <rect x="66" y="66" width="42" height="52" fill="#fffdf6" />
          <path d="M66 70q6-4 12 0t12 0 12 0v6H66z" fill="#f1f5e9" />
        </g>
      </g>
      {/* Stream */}
      <rect x="72" y="26" width="3.500" height="42" rx="1.750" fill="#fffdf6" stroke="#dfe6d3" className="animate-pour-stream" />
      {/* Bottle (tilts towards the glass) */}
      <g className="animate-pour-tilt">
        <rect x="24" y="6" width="18" height="8" rx="2.500" style={{ fill: 'var(--color-accent-mid)' }} />
        <path d="M26 14h14v10c0 4 9 8 9 17v34a7 7 0 0 1-7 7H24a7 7 0 0 1-7-7V41c0-9 9-13 9-17z" fill="#fffdf6" stroke="#c9d6c0" strokeWidth="2" />
        <rect x="21" y="46" width="24" height="20" rx="5" style={{ fill: 'var(--color-primary)' }} />
      </g>
      <ellipse cx="60" cy="116" rx="46" ry="3" fill="#000" opacity="0.06" />
    </svg>
    <span className="text-sm font-medium text-slate-500">{label}</span>
  </div>
);

export const CowLoader = ({ label = 'Fetching fresh data…', size = 130 }: { label?: string; size?: number }) => (
  <div role="status" aria-live="polite" className="flex flex-col items-center gap-2">
    <div className="relative">
      <svg width={size} height={size * (100 / 140)} viewBox="0 0 140 100" className="animate-moo" aria-hidden="true">
        <CowShape animated />
      </svg>
      <svg width={size} height="10" viewBox="0 0 140 10" className="absolute -bottom-1 left-0" aria-hidden="true">
        <ellipse cx="70" cy="5" rx="52" ry="3.500" fill="#000" opacity="0.07" />
      </svg>
    </div>
    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
      {label}
      <span className="flex gap-0.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-1 h-1 rounded-full bg-primary animate-drop-fall" style={{ animationDelay: `${i * 0.25}s` }} />
        ))}
      </span>
    </div>
  </div>
);

export const Skeleton = ({ className = '' }: { className?: string }) => <div className={`skeleton ${className}`} aria-hidden="true" />;

export const CardSkeleton = () => (
  <div className="card p-4 flex items-start justify-between" role="status" aria-label="Loading">
    <div className="space-y-2.5 flex-1">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-6 w-28" />
    </div>
    <Skeleton className="h-10 w-10 rounded-xl" />
  </div>
);

export const TableSkeleton = ({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) => (
  <>
    {Array.from({ length: rows }).map((_, r) => (
      <tr key={r} aria-hidden="true">
        {Array.from({ length: cols }).map((__, c) => (
          <td key={c}>
            <Skeleton className={`h-4 ${c === 0 ? 'w-40' : 'w-16 ml-auto'}`} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

type PageLoaderVariant = 'pour' | 'cow';

/** Centered page-level loader. `fullScreen` for route guards / public pages, otherwise fits its container. */
export const PageLoader = ({ variant = 'pour', label, fullScreen = false }: { variant?: PageLoaderVariant; label?: string; fullScreen?: boolean }) => (
  <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'py-24'}`}>
    {variant === 'cow' ? <CowLoader label={label} /> : <MilkPourLoader label={label} />}
  </div>
);
