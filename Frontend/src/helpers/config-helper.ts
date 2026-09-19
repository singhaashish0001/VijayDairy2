/**
 * @file config-helper.ts
 * @description Resolves the active runtime configuration: window.Config (injected at
 *              deploy time, lets ops override the API URL without a rebuild) takes
 *              priority over Vite's compile-time import.meta.env.
 */
const config = (): Record<string, string | undefined> => {
  const runtimeConfig = (window as unknown as { Config?: Record<string, string> }).Config;
  if (runtimeConfig === undefined) {
    return { ...import.meta.env };
  }
  return { ...runtimeConfig };
};

export default config;
