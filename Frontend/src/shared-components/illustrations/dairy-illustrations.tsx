/**
 * @file dairy-illustrations.tsx
 * @description Original, hand-drawn SVG spot illustrations (cow, milk bottle, milk can, cheese, wheat, droplets).
 *              Drawn from scratch for this app — no third-party artwork, so there are no licences to track.
 *              Brand colours come from CSS variables; neutral colours (milk white, cow black) are fixed.
 */
import type { SVGProps } from 'react';

type IllustrationProps = { size?: number; className?: string } & Omit<SVGProps<SVGSVGElement>, 'width' | 'height'>;

const INK = '#2b2b26';
const MILK = '#fffdf6';
const MILK_EDGE = '#dfe6d3';

/** Cow artwork as a bare <g> (viewBox 0 0 140 100) so scenes can embed it at any position/scale. */
export const CowShape = ({ animated = false }: { animated?: boolean }) => (
  <g>
    <g className={animated ? 'animate-tail' : undefined}>
      <path d="M118 44c10 3 12 14 9 26" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="127" cy="72" rx="4" ry="6" fill={INK} />
    </g>
    <ellipse cx="94" cy="80" rx="9" ry="6" fill="#f7b6c2" />
    {[37, 49, 88, 100].map((x) => (
      <g key={x}>
        <rect x={x} y="62" width="10" height="28" rx="3.500" fill={MILK} stroke={MILK_EDGE} />
        <rect x={x} y="85" width="10" height="7" rx="2.500" fill="#4a3b31" />
      </g>
    ))}
    <rect x="28" y="30" width="94" height="44" rx="22" fill={MILK} stroke={MILK_EDGE} strokeWidth="1.500" />
    <path d="M58 32c10-3 20 3 18 12s-14 12-22 6-4-15 4-18z" fill={INK} />
    <path d="M92 44c9-4 20 2 19 12-1 8-12 12-19 6s-6-14 0-18z" fill={INK} />
    <path d="M40 60c6-2 12 2 10 8s-10 6-13 2-1-8 3-10z" fill={INK} />
    <rect x="4" y="30" width="38" height="34" rx="15" fill={MILK} stroke={MILK_EDGE} strokeWidth="1.500" />
    <path d="M22 30c2-6 10-8 15-4 3 3 2 8-2 9-6 1-12 0-13-5z" fill={INK} />
    <ellipse cx="14" cy="55" rx="12.500" ry="10" fill="#f7b6c2" />
    <ellipse cx="9.500" cy="55" rx="2" ry="2.800" fill="#d88897" />
    <ellipse cx="18.500" cy="55" rx="2" ry="2.800" fill="#d88897" />
    <circle cx="26" cy="42" r="2.800" fill={INK} />
    <circle cx="26.800" cy="41.200" r="0.900" fill="#fff" />
    <path d="M36 27c-2-6 0-11 5-13-1 5 0 9 3 12z" fill="#efe1b4" stroke="#d9c88f" />
    <path d="M6 34c-6-1-9 3-8 8 5 1 9-1 10-5z" fill="#f7b6c2" stroke="#e39bab" />
    <circle cx="36" cy="62" r="3.500" style={{ fill: 'var(--color-accent-mid)' }} />
    <path d="M32 58h8" stroke="#8a6a1c" strokeWidth="2" strokeLinecap="round" />
  </g>
);

export const Cow = ({ size = 120, className = '', ...rest }: IllustrationProps) => (
  <svg width={size} height={size * (100 / 140)} viewBox="0 0 140 100" className={className} aria-hidden="true" {...rest}>
    <CowShape />
  </svg>
);

export const MilkBottle = ({ size = 80, className = '', ...rest }: IllustrationProps) => (
  <svg width={size * 0.6} height={size} viewBox="0 0 60 100" className={className} aria-hidden="true" {...rest}>
    <rect x="19" y="2" width="22" height="9" rx="3" style={{ fill: 'var(--color-accent-mid)' }} />
    <path d="M21 11h18v12c0 5 12 10 12 22v42a9 9 0 0 1-9 9H18a9 9 0 0 1-9-9V45c0-12 12-17 12-22z" fill={MILK} stroke="#c9d6c0" strokeWidth="2" />
    <path d="M9 48h42v39a9 9 0 0 1-9 9H18a9 9 0 0 1-9-9z" fill="#f4f7ee" />
    <rect x="14" y="54" width="32" height="28" rx="6" style={{ fill: 'var(--color-primary)' }} />
    <path d="M30 60c-4 5-6 7.500-6 10a6 6 0 0 0 12 0c0-2.500-2-5-6-10z" fill={MILK} />
    <path d="M15 30c1 5-1 9-3 14" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />
  </svg>
);

export const MilkCan = ({ size = 90, className = '', ...rest }: IllustrationProps) => (
  <svg width={size * 0.8} height={size} viewBox="0 0 80 100" className={className} aria-hidden="true" {...rest}>
    <path d="M22 18c0-6 4-10 18-10s18 4 18 10z" fill="#cfd6d0" stroke="#aab4ac" strokeWidth="1.500" />
    <rect x="34" y="2" width="12" height="7" rx="3" fill="#aab4ac" />
    <rect x="24" y="18" width="32" height="10" rx="3" fill="#dfe5e0" stroke="#aab4ac" strokeWidth="1.500" />
    <path d="M24 28h32c8 6 14 14 14 30v30a7 7 0 0 1-7 7H17a7 7 0 0 1-7-7V58c0-16 6-24 14-30z" fill="#e6ebe7" stroke="#aab4ac" strokeWidth="1.500" />
    <path d="M10 58h60v14H10z" style={{ fill: 'var(--color-primary)' }} />
    <text x="40" y="69" textAnchor="middle" fontSize="9" fontWeight="800" fill={MILK} fontFamily="Manrope, sans-serif" letterSpacing="1.2">
      MILK
    </text>
    <path d="M10 44c-8 0-8 12 0 12M70 44c8 0 8 12 0 12" stroke="#aab4ac" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M18 36c-2 8-2 16-1 22" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
  </svg>
);

export const Cheese = ({ size = 90, className = '', ...rest }: IllustrationProps) => (
  <svg width={size} height={size * 0.8} viewBox="0 0 100 80" className={className} aria-hidden="true" {...rest}>
    <path d="M6 44 70 12l24 14v34H6z" fill="#f6c945" stroke="#d9a520" strokeWidth="2" strokeLinejoin="round" />
    <path d="M6 44 70 12l24 14-64 30z" fill="#fadf78" stroke="#d9a520" strokeWidth="2" strokeLinejoin="round" />
    <path d="M6 44l24 12v20H6z" fill="#f2bd2e" opacity="0.0" />
    <circle cx="40" cy="30" r="4" fill="#e8b02a" />
    <circle cx="62" cy="24" r="3" fill="#e8b02a" />
    <circle cx="26" cy="64" r="6" fill="#e8b02a" />
    <circle cx="52" cy="62" r="4.500" fill="#e8b02a" />
    <circle cx="78" cy="52" r="5" fill="#e8b02a" />
    <circle cx="14" cy="52" r="3" fill="#e8b02a" />
  </svg>
);

export const Wheat = ({ size = 70, className = '', ...rest }: IllustrationProps) => (
  <svg width={size * 0.5} height={size} viewBox="0 0 40 80" className={className} aria-hidden="true" {...rest}>
    <path d="M20 78V22" stroke="#a37b2c" strokeWidth="2.500" strokeLinecap="round" />
    {[0, 1, 2, 3, 4].map((i) => (
      <g key={i}>
        <ellipse cx="14" cy={20 + i * 8} rx="3.500" ry="6" transform={`rotate(-28 14 ${20 + i * 8})`} fill="#e6b93e" />
        <ellipse cx="26" cy={20 + i * 8} rx="3.500" ry="6" transform={`rotate(28 26 ${20 + i * 8})`} fill="#f0c94f" />
      </g>
    ))}
    <ellipse cx="20" cy="9" rx="3.500" ry="7" fill="#f0c94f" />
  </svg>
);

export const Drops = ({ size = 40, className = '', ...rest }: IllustrationProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden="true" {...rest}>
    <path d="M17 6c-5 7-8 11-8 15a8 8 0 0 0 16 0c0-4-3-8-8-15z" style={{ fill: 'var(--color-primary-light)' }} stroke="#c7d8bf" strokeWidth="1.500" />
    <path d="M34 22c-3.500 5-5.500 8-5.500 10.500a5.500 5.500 0 0 0 11 0c0-2.500-2-5.500-5.500-10.500z" fill={MILK} stroke="#c7d8bf" strokeWidth="1.500" />
    <path d="M13 24a3.500 3.500 0 0 0 2.500 3" stroke="#fff" strokeWidth="1.800" strokeLinecap="round" fill="none" />
  </svg>
);
