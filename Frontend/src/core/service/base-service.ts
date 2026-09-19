/**
 * @file base-service.ts
 * @description Thin typed HTTP helpers wrapping the shared Axios instance (baseAPI) from
 *              the interceptor module. Every store uses these instead of calling Axios
 *              directly, so every request goes through the interceptor (auth header,
 *              error normalisation).
 */
import * as axios from '../interceptor/interceptor';

const jsonConfig = { headers: { 'Content-Type': 'application/json' } };

export const getRequest = (url: string, requestConfig?: object) =>
  axios.baseAPI.get(url, { ...jsonConfig, ...requestConfig });

export const postRequest = (url: string, data: unknown, requestConfig?: object) =>
  axios.baseAPI.post(url, data, { ...jsonConfig, ...requestConfig });

export const putRequest = (url: string, data: unknown) =>
  axios.baseAPI.put(url, data, jsonConfig);

export const deleteRequest = (url: string) =>
  axios.baseAPI.delete(url, jsonConfig);
