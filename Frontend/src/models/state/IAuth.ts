import type { IObservableInitialState } from '../ICommon';
import type { IUserVM } from '../response/IAuthResponse';

export interface IAuthData {
  token: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
}

export interface IAuthStore {
  inProgress: boolean;
  error: string;
  isAuthenticated: boolean;
  authData: IAuthData;
  loadingMe: boolean;

  readonly getToken: string | null;
  readonly getUserEmail: string | null;
  readonly getUserId: string | null;

  reset(): void;
  login(email: string, password: string): Promise<void>;
  fetchCurrentUser(): Promise<void>;
  logout(): Promise<void>;
  updateAuth(): void;
}

export const initialAuthState: IObservableInitialState = {
  success: false,
  error: '',
  inProgress: false,
};

export type { IUserVM };
