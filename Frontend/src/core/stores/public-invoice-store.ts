/**
 * @file public-invoice-store.ts
 * @description MobX store backing the unauthenticated /invoice/:id share page.
 */
import { action, makeObservable, observable, runInAction } from 'mobx';
import URLConstants from '../../constants/url-constants';
import * as baseService from '../service/base-service';
import type IApiResponse from '../../models/response/IApiResponse';
import type { IApiSuccessResponse } from '../../models/response/IApiResponse';
import type IPublicInvoiceResponse from '../../models/response/IPublicInvoiceResponse';

export class PublicInvoiceStore {
  inProgress = true;
  error = '';
  data: IPublicInvoiceResponse | null = null;

  constructor() {
    makeObservable(this, {
      inProgress: observable,
      error: observable,
      data: observable,
      fetchAsync: action,
    });
  }

  fetchAsync = (id: string) => {
    this.inProgress = true;
    this.error = '';
    this.data = null;
    return baseService
      .getRequest(`${URLConstants.PublicInvoice}/${id}`)
      .then((response: IApiResponse<IApiSuccessResponse<IPublicInvoiceResponse>>) => {
        runInAction(() => {
          this.data = response.data.data;
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
}

export const publicInvoiceStore = new PublicInvoiceStore();
export default publicInvoiceStore;
