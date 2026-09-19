/**
 * @file brand-logo.tsx
 * @description Vijay Dairy mark: a milk drop with a highlight, sitting on a rounded gradient badge with a
 *              small pasture leaf. Original artwork, themed through CSS variables so it follows the active theme.
 */
interface BrandMarkProps {
  size?: number;
  className?: string;
}

export const BrandMark = ({ size = 40, className = '' }: BrandMarkProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} role="img" aria-label="Vijay Dairy logo">
    <defs>
      <linearGradient id="vd-badge" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" style={{ stopColor: 'var(--color-primary-mid)' }} />
        <stop offset="100%" style={{ stopColor: 'var(--color-primary-dark)' }} />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="13" fill="url(#vd-badge)" />
    <path d="M24 9.5c-5.2 6.6-9 11.1-9 16.1a9 9 0 0 0 18 0c0-5-3.800-9.500-9-16.100z" fill="#fffdf6" />
    <path d="M19.600 26.500a4.700 4.700 0 0 0 3.400 4.400" stroke="#bbf7d0" strokeWidth="1.800" strokeLinecap="round" fill="none" />
    <path d="M31.500 33.500c4.200-.2 7.200-2.800 8-6.800-4.300.1-7.400 2.500-8 6.800z" style={{ fill: 'var(--color-accent-mid)' }} />
  </svg>
);

interface BrandLogoProps {
  size?: number;
  /** Show the wordmark next to the mark. */
  withText?: boolean;
  /** Light text for dark backgrounds (e.g. the sidebar). */
  inverted?: boolean;
  subtitle?: string;
  className?: string;
}

export const BrandLogo = ({ size = 40, withText = true, inverted = false, subtitle = 'Dairy Operations', className = '' }: BrandLogoProps) => (
  <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
    <BrandMark size={size} className="shrink-0 drop-shadow-sm" />
    {withText && (
      <div className="min-w-0">
        <div
          className={`leading-none tracking-wide truncate ${inverted ? 'text-white' : 'text-slate-900'}`}
          style={{ fontFamily: 'var(--font-serif-accent)', fontWeight: 600, fontSize: size * 0.46 }}
        >
          Vijay Dairy
        </div>
        <div className={`leading-none mt-1.5 text-[10px] font-bold uppercase tracking-[0.16em] truncate ${inverted ? 'text-white/60' : 'text-primary'}`}>
          {subtitle}
        </div>
      </div>
    )}
  </div>
);

export default BrandLogo;
