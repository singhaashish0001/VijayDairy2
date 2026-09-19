/**
 * @file secure-storage.ts
 * @description Lightweight obfuscated localStorage wrapper used to persist the JWT
 *              and session metadata. Values are XOR-obfuscated (not cryptographically
 *              secure — just keeps raw tokens from sitting in plain text in DevTools)
 *              and namespaced under a `_s_` prefix. Synchronous by design so it can be
 *              called from MobX store constructors/actions without extra async plumbing.
 *
 *              Obfuscation is gated by VITE_SECURE_STORAGE_ACTIVE (defaults to true
 *              whenever unset, so unconfigured environments stay obfuscated). Set it to
 *              "false" in .env.development to store plain JSON and inspect values
 *              directly in localStorage while debugging.
 */
const isSecureStorageActive = import.meta.env.VITE_SECURE_STORAGE_ACTIVE !== 'false';

const XOR_KEY = 'vd2026';

function xorObfuscate(data: string): string {
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ XOR_KEY.charCodeAt(i % XOR_KEY.length));
  }
  return btoa(result);
}

function xorDeobfuscate(encoded: string): string {
  const data = atob(encoded);
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ XOR_KEY.charCodeAt(i % XOR_KEY.length));
  }
  return result;
}

export const secureStorage = {
  setSync(key: string, value: string): void {
    const serialized = JSON.stringify(value);
    localStorage.setItem(`_s_${key}`, isSecureStorageActive ? xorObfuscate(serialized) : serialized);
  },

  getSync<T = string>(key: string): T | null {
    const raw = localStorage.getItem(`_s_${key}`);
    if (raw === null) return null;
    try {
      return JSON.parse(isSecureStorageActive ? xorDeobfuscate(raw) : raw) as T;
    } catch {
      localStorage.removeItem(`_s_${key}`);
      return null;
    }
  },

  removeSync(key: string): void {
    localStorage.removeItem(`_s_${key}`);
  },

  clear(): void {
    localStorage.clear();
  },
};

export default secureStorage;
