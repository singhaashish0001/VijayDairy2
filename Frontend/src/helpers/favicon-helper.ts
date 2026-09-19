/**
 * @file favicon-helper.ts
 * @description Regenerates the browser-tab favicon from the active theme's colors.
 *              The favicon is a small SVG (rounded square, gradient background, white
 *              milk-drop glyph matching the brand logo) built at runtime and swapped
 *              in as a data URI, so it stays in sync with theme changes instead of being
 *              a static file baked to one fixed color pair.
 */
// Milk-drop mark (same glyph as BrandMark in illustrations/brand-logo.tsx), on a 32x32 canvas.
const DROP_PATH = 'M16 6.500c-3.500 4.400-6 7.400-6 10.700a6 6 0 0 0 12 0c0-3.300-2.500-6.300-6-10.700z';
const LEAF_PATH = 'M21 22.700c2.800-.1 4.800-1.900 5.300-4.500-2.900.1-4.900 1.700-5.300 4.500z';

function buildFaviconSvg(colorMid: string, colorDark: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${colorMid}" />
      <stop offset="100%" stop-color="${colorDark}" />
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="9" fill="url(#bg)" />
  <path d="${DROP_PATH}" fill="#fffdf6" />
  <path d="${LEAF_PATH}" fill="#facc15" />
</svg>`;
}

export function applyThemedFavicon(colorMid: string, colorDark: string): void {
  const svg = buildFaviconSvg(colorMid, colorDark);
  const href = `data:image/svg+xml,${encodeURIComponent(svg)}`;

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.type = 'image/svg+xml';
  link.href = href;
}
