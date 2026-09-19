const CANDIDATE_DELIMITERS = [',', ';', '\t'];

/** Splits one CSV line, honouring double-quoted fields and "" escapes. */
export function splitCsvLine(line: string, delimiter = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else inQuotes = false;
      } else current += c;
    } else if (c === '"') inQuotes = true;
    else if (c === delimiter) {
      result.push(current);
      current = '';
    } else current += c;
  }
  result.push(current);
  return result;
}

/**
 * Excel writes ';' (some regional settings) or tab ("Text (Tab delimited)") instead of ',' - pick whichever the
 * header line actually uses. Ties and no-match fall back to ','.
 */
export function detectDelimiter(headerLine: string): string {
  let best = ',';
  let bestCount = 0;
  for (const d of CANDIDATE_DELIMITERS) {
    const count = splitCsvLine(headerLine, d).filter((c) => c.trim().length > 0).length;
    if (count > bestCount) {
      best = d;
      bestCount = count;
    }
  }
  return best;
}

/** True when every cell is blank - Excel often leaves rows like ",,,,," at the end of a sheet. */
export const isBlankRow = (cells: string[]) => cells.every((c) => c.trim().length === 0);

/** Decodes uploaded CSV bytes (UTF-8 by default; UTF-16 when a BOM says so) and strips the BOM. */
export function decodeCsv(buffer: Buffer): string {
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) return new TextDecoder('utf-16le').decode(buffer);
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) return new TextDecoder('utf-16be').decode(buffer);
  return new TextDecoder('utf-8').decode(buffer); // strips a UTF-8 BOM
}

export interface ParsedCsv {
  lines: string[];
  delimiter: string;
  headers: string[];
}

/** Normalises line endings, drops empty lines, detects the delimiter and lower-cases the trimmed header cells. */
export function parseCsv(content: string): ParsedCsv | null {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.length > 0);
  if (lines.length === 0) return null;
  const delimiter = detectDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter).map((h) => h.trim().toLowerCase());
  return { lines, delimiter, headers };
}

export function missingColumnsMessage(missing: string[], headers: string[]): string {
  const found = headers.filter((h) => h.length > 0);
  return `Missing required columns: ${missing.join(', ')}. Found columns: ${found.length === 0 ? 'none' : found.slice(0, 8).join(' | ')}`;
}

export const cell = (cols: string[], idx: number) => (idx >= 0 && idx < cols.length ? cols[idx] : '');
