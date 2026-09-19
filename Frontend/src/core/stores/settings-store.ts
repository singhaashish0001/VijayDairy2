/**
 * @file settings-store.ts
 * @description MobX store for business settings (get/update).
 */
import { action, makeObservable, observable, runInAction } from 'mobx';
import URLConstants from '../../constants/url-constants';
import * as baseService from '../service/base-service';
import type { IObservableInitialState } from '../../models/ICommon';
import type IApiResponse from '../../models/response/IApiResponse';
import type { IApiSuccessResponse } from '../../models/response/IApiResponse';
import type ISettingsResponse from '../../models/response/ISettingsResponse';
import type { IUpdateSettings } from '../../models/forms/IUpdateSettings';

const initialState: IObservableInitialState = { success: false, error: '', inProgress: false };

export class SettingsStore {
  inProgress = false;
  error = '';
  settings: ISettingsResponse | null = null;
  updateState: IObservableInitialState = { ...initialState };

  constructor() {
    makeObservable(this, {
      inProgress: observable,
      error: observable,
      settings: observable,
      updateState: observable,
      fetchAsync: action,
      updateAsync: action,
    });
  }

  fetchAsync = () => {
    this.inProgress = true;
    this.error = '';
    return baseService
      .getRequest(URLConstants.Settings)
      .then((response: IApiResponse<IApiSuccessResponse<ISettingsResponse>>) => {
        runInAction(() => {
          this.settings = response.data.data;
        });
      })
      .catch((err: string) => {
        runInAction(() => {
          this.error = err;
        });
      })
      .finally(
        action(() => {
          this.inProgress = false;
        }),
      );
  };

  updateAsync = (data: IUpdateSettings) => {
    this.updateState = { success: false, error: '', inProgress: true };
    const payload = {
      ShopName: data.shopName,
      Address: data.address,
      Phone: data.phone,
      GstNumber: data.gstNumber,
      FooterNote: data.footerNote,
      InventoryEnabled: data.inventoryEnabled,
    };
    return baseService
      .putRequest(URLConstants.Settings, payload)
      .then((response: IApiResponse<IApiSuccessResponse<ISettingsResponse>>) => {
        runInAction(() => {
          this.settings = response.data.data;
          this.updateState.success = true;
        });
      })
      .catch((err: string) => {
        runInAction(() => {
          this.updateState.error = err;
        });
        throw err;
      })
      .finally(
        action(() => {
          this.updateState.inProgress = false;
        }),
      );
  };
}

export const settingsStore = new SettingsStore();
export default settingsStore;
