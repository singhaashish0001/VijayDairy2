import { describe, expect, it } from 'vitest';
import { normalizeApiPath } from '../src/middleware/pathNormalize';

describe('normalizeApiPath', () => {
  it.each([
    ['/api/auth/login', '/api/auth/login'],
    ['/.netlify/functions/api/auth/login', '/api/auth/login'],
    ['/.netlify/functions/api/api/auth/login', '/api/auth/login'],
    ['/auth/login', '/api/auth/login'],
    ['/api', '/api'],
    ['/.netlify/functions/api', '/api/'],
    ['/api/products/stock-import?mode=SET', '/api/products/stock-import?mode=SET'],
    ['/products?x=1', '/api/products?x=1'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizeApiPath(input)).toBe(expected);
  });
});
