/** Rounds half away from zero (the .NET MidpointRounding.AwayFromZero used by the original code). */
export function roundHalfAwayFromZero(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return value;
  const abs = Math.abs(value);
  const text = String(abs);
  let rounded: number;
  if (text.includes('e')) {
    const factor = 10 ** decimals;
    rounded = Math.round(abs * factor) / factor;
  } else {
    // Shifting via exponent notation avoids binary float artefacts such as 1.005 * 100 = 100.49999999999999.
    rounded = Number(`${Math.round(Number(`${text}e${decimals}`))}e-${decimals}`);
  }
  return value < 0 ? -rounded : rounded;
}

export const round2 = (value: number) => roundHalfAwayFromZero(value, 2);

/**
 * Mimics decimal.TryParse(s, NumberStyles.Number, InvariantCulture): optional sign, ',' thousands separators,
 * '.' decimal point. Returns null when it cannot be parsed.
 */
export function tryParseDecimal(raw: string): number | null {
  const s = raw.trim();
  if (!/^[+-]?(\d[\d,]*)?(\.\d*)?$/.test(s) || !/\d/.test(s)) return null;
  const n = Number(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** Coerces a JSON value (number or numeric string) to a number; null/undefined/garbage -> undefined. */
export function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string') return tryParseDecimal(value) ?? undefined;
  return undefined;
}
