/**
 * @file auth-store.ts
 * @description MobX class store — single source of truth for authentication state and
 *              session lifecycle. Persists the JWT/user info to secureStorage so the
 *              session survives a page reload, and hydrates from it via updateAuth().
 */
import { action, computed, makeObservable, observable, runInAction } from 'mobx';
import URLConstants from '../../constants/url-constants';
import secureStorage from '../../helpers/secure-storage';
import type { IAuthData, IAuthStore } from '../../models/state/IAuth';
import type IApiResponse from '../../models/response/IApiResponse';
import type { IApiSuccessResponse } from '../../models/response/IApiResponse';
import type IAuthResponse from '../../models/response/IAuthResponse';
import * as baseService from '../service/base-service';

const emptyAuthData: IAuthData = { token: '', userId: '', userName: '', userEmail: '', userRole: '' };

export class AuthStore implements IAuthStore {
  inProgress = false;
  error = '';
  isAuthenticated = false;
  loadingMe = true;
  authData: IAuthData = { ...emptyAuthData };

  constructor() {
    makeObservable(this, {
      inProgress: observable,
      error: observable,
      isAuthenticated: observable,
      loadingMe: observable,
      authData: observable,
      reset: action,
      login: action,
      fetchCurrentUser: action,
      logout: action,
      updateAuth: action,
      getToken: computed,
      getUserEmail: computed,
      getUserId: computed,
    });

    this.updateAuth();
  }

  get getToken() {
    return secureStorage.getSync<string>('token');
  }

  get getUserEmail() {
    return secureStorage.getSync<string>('userEmail');
  }

  get getUserId() {
    return secureStorage.getSync<string>('userId');
  }

  reset = () => {
    this.error = '';
    this.inProgress = false;
    this.isAuthenticated = false;
    this.authData = { ...emptyAuthData };
  };

  login = (email: string, password: string) => {
    this.inProgress = true;
    this.error = '';

    return baseService
      .postRequest(URLConstants.Login, { Email: email, Password: password })
      .then((response: IApiResponse<IApiSuccessResponse<IAuthResponse>>) => {
        const result = response.data.data;
        secureStorage.setSync('token', result.token);
        secureStorage.setSync('userId', result.user.id);
        secureStorage.setSync('userName', result.user.name);
        secureStorage.setSync('userEmail', result.user.email);
        secureStorage.setSync('userRole', result.user.role);

        runInAction(() => {
          this.isAuthenticated = true;
          this.authData = {
            token: result.token,
            userId: result.user.id,
            userName: result.user.name,
            userEmail: result.user.email,
            userRole: result.user.role,
          };
        });
      })
      .catch((err: string) => {
        runInAction(() => {
          this.error = err;
        });
        throw err;
      })
      .finally(
        action(() => {
          this.inProgress = false;
        }),
      );
  };

  fetchCurrentUser = () => {
    this.loadingMe = true;
    return baseService
      .getRequest(URLConstants.Me)
      .then((response: IApiResponse<IApiSuccessResponse<IAuthResponse['user']>>) => {
        const user = response.data.data;
        secureStorage.setSync('userId', user.id);
        secureStorage.setSync('userName', user.name);
        secureStorage.setSync('userEmail', user.email);
        secureStorage.setSync('userRole', user.role);
        runInAction(() => {
          this.isAuthenticated = true;
          this.authData = {
            token: this.getToken || '',
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            userRole: user.role,
          };
        });
      })
      .catch(() => {
        secureStorage.clear();
        runInAction(() => this.reset());
      })
      .finally(
        action(() => {
          this.loadingMe = false;
        }),
      );
  };

  logout = async (): Promise<void> => {
    try {
      await baseService.postRequest(URLConstants.Logout, {});
    } catch {
      // Server-side revocation is best-effort — the session is cleared client-side regardless.
    } finally {
      runInAction(() => {
        this.reset();
        secureStorage.clear();
      });
    }
  };

  updateAuth = () => {
    const token = this.getToken;
    if (!token) {
      this.loadingMe = false;
      return;
    }
    this.authData = {
      token,
      userId: secureStorage.getSync<string>('userId') || '',
      userName: secureStorage.getSync<string>('userName') || '',
      userEmail: secureStorage.getSync<string>('userEmail') || '',
      userRole: secureStorage.getSync<string>('userRole') || '',
    };
    this.isAuthenticated = true;
  };
}

export const authStore = new AuthStore();
export default authStore;
