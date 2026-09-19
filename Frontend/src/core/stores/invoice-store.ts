/**
 * @file invoice-store.ts
 * @description MobX store for invoice list/create/delete.
 */
import { action, makeObservable, observable, runInAction } from 'mobx';
import URLConstants from '../../constants/url-constants';
import * as baseService from '../service/base-service';
import type { IObservableInitialState } from '../../models/ICommon';
import type IApiResponse from '../../models/response/IApiResponse';
import type { IApiSuccessResponse } from '../../models/response/IApiResponse';
import type IInvoiceResponse from '../../models/response/IInvoiceResponse';
import type { IAddInvoice } from '../../models/forms/IAddEditInvoice';

const initialState: IObservableInitialState = { success: false, error: '', inProgress: false };

export class InvoiceStore {
  inProgress = false;
  error = '';
  invoices: IInvoiceResponse[] = [];
  addState: IObservableInitialState = { ...initialState };
  deleteState: IObservableInitialState = { ...initialState };
  lastCreatedInvoice: IInvoiceResponse | null = null;

  constructor() {
    makeObservable(this, {
      inProgress: observable,
      error: observable,
      invoices: observable,
      addState: observable,
      deleteState: observable,
      lastCreatedInvoice: observable,
      fetchAllAsync: action,
      addAsync: action,
      deleteAsync: action,
    });
  }

  fetchAllAsync = () => {
    this.inProgress = true;
    this.error = '';
    return baseService
      .getRequest(URLConstants.Invoices)
      .then((response: IApiResponse<IApiSuccessResponse<IInvoiceResponse[]>>) => {
        runInAction(() => {
          this.invoices = response.data.data;
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

  addAsync = (data: IAddInvoice) => {
    this.addState = { success: false, error: '', inProgress: true };
    const payload = {
      Items: data.items.map((i) => ({
        ProductId: i.productId,
        Name: i.name,
        Unit: i.unit,
        Price: i.price,
        Quantity: i.quantity,
        Discount: i.discount,
        Total: i.total,
        SellingMode: i.sellingMode,
        Amount: i.amount,
      })),
      Notes: data.notes,
      Discount: data.discount,
      TaxPercent: data.taxPercent,
    };
    return baseService
      .postRequest(URLConstants.Invoices, payload)
      .then((response: IApiResponse<IApiSuccessResponse<IInvoiceResponse>>) => {
        runInAction(() => {
          this.addState.success = true;
          this.lastCreatedInvoice = response.data.data;
        });
        return response.data.data;
      })
      .catch((err: string) => {
        runInAction(() => {
          this.addState.error = err;
        });
        throw err;
      })
      .finally(
        action(() => {
          this.addState.inProgress = false;
        }),
      );
  };

  deleteAsync = (id: string) => {
    this.deleteState = { success: false, error: '', inProgress: true };
    return baseService
      .deleteRequest(`${URLConstants.Invoices}/${id}`)
      .then(() => {
        runInAction(() => {
          this.deleteState.success = true;
        });
        return this.fetchAllAsync();
      })
      .catch((err: string) => {
        runInAction(() => {
          this.deleteState.error = err;
        });
        throw err;
      })
      .finally(
        action(() => {
          this.deleteState.inProgress = false;
        }),
      );
  };
}

export const invoiceStore = new InvoiceStore();
export default invoiceStore;
