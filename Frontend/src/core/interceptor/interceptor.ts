/**
 * @file interceptor.ts
 * @description Configures the application-wide Axios instance (baseAPI).
 *              Request interceptor attaches the Bearer JWT from secure storage.
 *              Response interceptor normalises API errors into a single string message
 *              consumed by store catch blocks, and on 401 clears the session and
 *              redirects to /login (unless already there, to avoid a redirect loop on
 *              a failed login attempt itself).
 */
import axios, { type AxiosResponse } from 'axios';
import { errorMessage } from '../../constants/error-constants';
import config from '../../helpers/config-helper';
import secureStorage from '../../helpers/secure-storage';
import { authStore } from '../stores/auth-store';

const appConfig = config();

export const baseURL = appConfig.VITE_API_URL || '/api';

export const baseAPI = axios.create({ baseURL });

baseAPI.interceptors.request.use((request) => {
  const token = authStore.getToken;
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return request;
});

const errorHandler = (error: unknown): Promise<never> => {
  let message: string = errorMessage.ErrorOccurred;

  if (axios.isAxiosError(error) && error.response) {
    if (error.response.status === 401) {
      const isAlreadyOnLoginPage = window.location.pathname === '/login';
      if (isAlreadyOnLoginPage) {
        // Came from the login request itself (wrong credentials) — surface it, don't redirect again.
        const serverMessage = (error.response.data as { messageText?: string })?.messageText;
        return Promise.reject(serverMessage || errorMessage.Unauthorized);
      }

      secureStorage.clear();
      window.location.href = '/login';
      return Promise.reject(errorMessage.Unauthorized);
    }

    if (error.response.status === 403) {
      return Promise.reject(errorMessage.UnauthorizedAccess);
    }

    const serverMessage = (error.response.data as { messageText?: string })?.messageText;
    if (serverMessage) {
      message = serverMessage;
    }
  }

  return Promise.reject(message);
};

const successHandler = (response: AxiosResponse): AxiosResponse | Promise<never> => {
  if (response.data && response.data.error === true) {
    return Promise.reject(response.data.messageText || errorMessage.ErrorOccurred);
  }
  return response;
};

baseAPI.interceptors.response.use(
  (response) => successHandler(response),
  (error) => errorHandler(error),
);
