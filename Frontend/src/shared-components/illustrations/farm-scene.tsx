/**
 * @file farm-scene.tsx
 * @description Original layered farm landscape (sun, drifting clouds, rolling pasture, barn, silo, fence, grazing cows,
 *              trees). Used as the login hero and the dashboard banner. Greens follow the active theme.
 */
import { CowShape } from './dairy-illustrations';

interface FarmSceneProps {
  className?: string;
  /** Hide the sky gradient so the scene can sit on top of another background (dashboard hero). */
  transparentSky?: boolean;
  /** "cover" fills the box (crops); "contain" fits the whole scene to the width, anchored at the bottom. */
  fit?: 'cover' | 'contain';
}

const Tree = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="-4" y="0" width="8" height="30" rx="3" fill="#7a5a3a" />
    <circle cx="0" cy="-8" r="22" style={{ fill: 'var(--color-primary-dark)' }} />
    <circle cx="-14" cy="6" r="15" style={{ fill: 'var(--color-primary)' }} />
    <circle cx="14" cy="4" r="16" style={{ fill: 'var(--color-primary)' }} />
  </g>
);

const Cloud = ({ x, y, s = 1, className = '' }: { x: number; y: number; s?: number; className?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} className={className}>
    <g fill="#fff" opacity="0.92">
      <ellipse cx="0" cy="0" rx="34" ry="14" />
      <ellipse cx="-18" cy="-8" rx="18" ry="14" />
      <ellipse cx="10" cy="-12" rx="22" ry="16" />
    </g>
  </g>
);

export const FarmScene = ({ className = '', transparentSky = false, fit = 'cover' }: FarmSceneProps) => (
  <svg viewBox="0 0 800 520" preserveAspectRatio={fit === 'contain' ? 'xMidYMax meet' : 'xMidYMid slice'} className={className} aria-hidden="true">
    <defs>
      <linearGradient id="fs-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#d9f0e1" />
        <stop offset="60%" stopColor="#f6f8e6" />
        <stop offset="100%" stopColor="#fdf6d8" />
      </linearGradient>
      <radialGradient id="fs-sun" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
      </radialGradient>
    </defs>

    {!transparentSky && <rect width="800" height="520" fill="url(#fs-sky)" />}

    <circle cx="640" cy="120" r="110" fill="url(#fs-sun)" />
    <circle cx="640" cy="120" r="40" fill="#fbbf24" />

    <Cloud x={140} y={110} s={1.2} className="animate-drift" />
    <Cloud x={430} y={70} s={0.8} className="animate-drift" />
    <Cloud x={700} y={210} s={0.7} className="animate-drift" />

    {/* Far hills */}
    <path d="M0 300C110 240 220 250 330 285s230 20 330-25 100-5 140 10v255H0z" style={{ fill: 'var(--color-primary-light)' }} />
    {/* Mid hills */}
    <path d="M0 340c120-50 250-40 360 0s240 30 440-30v210H0z" style={{ fill: 'var(--color-primary-mid)' }} opacity="0.55" />

    {/* Barn + silo on the mid hill */}
    <g transform="translate(90 262)">
      <rect x="46" y="-18" width="28" height="78" rx="4" fill="#d6d3c9" />
      <path d="M46 -18a14 14 0 0 1 28 0z" fill="#b8b4a8" />
      <rect x="0" y="16" width="86" height="60" fill="#b23a2e" />
      <path d="M-8 20 43 -14l51 34z" fill="#8c2a21" />
      <rect x="26" y="38" width="34" height="38" fill="#7a231b" />
      <path d="M26 38h34M43 38v38M26 38l34 38M60 38 26 76" stroke="#f3e9d8" strokeWidth="2.500" />
      <rect x="35" y="2" width="16" height="12" fill="#f3e9d8" />
    </g>

    <Tree x={330} y={310} s={0.9} />
    <Tree x={690} y={318} s={1.1} />
    <Tree x={745} y={332} s={0.8} />

    {/* Near pasture */}
    <path d="M0 400c140-40 280-30 400 0s280 30 400-10v130H0z" style={{ fill: 'var(--color-primary)' }} />
    <path d="M0 450c160-30 300-20 420 6s260 24 380-14v78H0z" style={{ fill: 'var(--color-primary-dark)' }} />

    {/* Fence */}
    <g stroke="#e9dcc2" strokeWidth="5" strokeLinecap="round">
      <path d="M470 398h300M470 414h300" />
      {[480, 520, 560, 600, 640, 680, 720, 760].map((x) => (
        <path key={x} d={`M${x} 388v40`} />
      ))}
    </g>

    {/* Cows */}
    <g transform="translate(150 372) scale(0.95)">
      <CowShape animated />
    </g>
    <g transform="translate(330 400) scale(0.72) translate(140 0) scale(-1 1)">
      <CowShape animated />
    </g>

    {/* Wheat + flowers */}
    <g stroke="#e6b93e" strokeWidth="3" strokeLinecap="round">
      {[40, 58, 76, 690, 708, 726].map((x) => (
        <g key={x}>
          <path d={`M${x} 500V462`} />
          <path d={`M${x} 470l-6-8M${x} 470l6-8M${x} 480l-6-8M${x} 480l6-8`} />
        </g>
      ))}
    </g>
    <g>
      {[120, 210, 300, 520, 610].map((x, i) => (
        <g key={x} transform={`translate(${x} ${478 + (i % 2) * 14})`}>
          <circle r="4" fill="#fff" />
          <circle r="1.800" style={{ fill: 'var(--color-accent-mid)' }} />
        </g>
      ))}
    </g>
  </svg>
);

export default FarmScene;
