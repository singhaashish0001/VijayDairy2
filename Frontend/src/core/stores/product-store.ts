/**
 * @file product-store.ts
 * @description MobX store for the product catalog: list, add, update, delete and CSV bulk import.
 */
import { action, makeObservable, observable, runInAction } from 'mobx';
import URLConstants from '../../constants/url-constants';
import * as baseService from '../service/base-service';
import type { IObservableInitialState } from '../../models/ICommon';
import type IApiResponse from '../../models/response/IApiResponse';
import type { IApiSuccessResponse } from '../../models/response/IApiResponse';
import type IProductResponse from '../../models/response/IProductResponse';
import type { IBulkImportResult } from '../../models/response/IProductResponse';
import type { StockImportMode } from '../../helpers/product-csv-template';
import type { IAddEditProduct } from '../../models/forms/IAddEditProduct';
import type { IProductStore } from './interfaces/IProductStore';

const initialState: IObservableInitialState = { success: false, error: '', inProgress: false };

export class ProductStore implements IProductStore {
  inProgress = false;
  error = '';
  products: IProductResponse[] = [];
  addUpdateState: IObservableInitialState = { ...initialState };
  deleteState: IObservableInitialState = { ...initialState };
  importResult: IBulkImportResult | null = null;
  importState: IObservableInitialState = { ...initialState };

  constructor() {
    makeObservable(this, {
      inProgress: observable,
      error: observable,
      products: observable,
      addUpdateState: observable,
      deleteState: observable,
      importResult: observable,
      importState: observable,
      fetchAllAsync: action,
      addAsync: action,
      updateAsync: action,
      deleteAsync: action,
      bulkImportAsync: action,
      importStockAsync: action,
    });
  }

  resetAddUpdateState = () => {
    this.addUpdateState = { ...initialState };
  };

  resetImportState = () => {
    this.importState = { ...initialState };
    this.importResult = null;
  };

  fetchAllAsync = () => {
    this.inProgress = true;
    this.error = '';
    return baseService
      .getRequest(URLConstants.Products)
      .then((response: IApiResponse<IApiSuccessResponse<IProductResponse[]>>) => {
        runInAction(() => {
          this.products = response.data.data;
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

  addAsync = (data: IAddEditProduct) => {
    this.addUpdateState = { success: false, error: '', inProgress: true };
    const payload = {
      Name: data.name.trim(),
      Unit: data.unit,
      Price: Number(data.price),
      Stock: data.stock === '' ? 0 : Number(data.stock),
      LowStockThreshold: data.lowStockThreshold === '' ? 0 : Number(data.lowStockThreshold),
    };
    return baseService
      .postRequest(URLConstants.Products, payload)
      .then(() => {
        runInAction(() => {
          this.addUpdateState.success = true;
        });
        return this.fetchAllAsync();
      })
      .catch((err: string) => {
        runInAction(() => {
          this.addUpdateState.error = err;
        });
        throw err;
      })
      .finally(
        action(() => {
          this.addUpdateState.inProgress = false;
        }),
      );
  };

  updateAsync = (id: string, data: Partial<IAddEditProduct>) => {
    this.addUpdateState = { success: false, error: '', inProgress: true };
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.Name = data.name.trim();
    if (data.unit !== undefined) payload.Unit = data.unit;
    if (data.price !== undefined && data.price !== '') payload.Price = Number(data.price);
    if (data.stock !== undefined && data.stock !== '') payload.Stock = Number(data.stock);
    if (data.lowStockThreshold !== undefined && data.lowStockThreshold !== '') payload.LowStockThreshold = Number(data.lowStockThreshold);

    return baseService
      .putRequest(`${URLConstants.Products}/${id}`, payload)
      .then(() => {
        runInAction(() => {
          this.addUpdateState.success = true;
        });
        return this.fetchAllAsync();
      })
      .catch((err: string) => {
        runInAction(() => {
          this.addUpdateState.error = err;
        });
        throw err;
      })
      .finally(
        action(() => {
          this.addUpdateState.inProgress = false;
        }),
      );
  };

  deleteAsync = (id: string) => {
    this.deleteState = { success: false, error: '', inProgress: true };
    return baseService
      .deleteRequest(`${URLConstants.Products}/${id}`)
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

  /** Stock-only CSV import: updates existing products, never creates them. SET replaces stock, ADD adds to it. */
  importStockAsync = (file: File, mode: StockImportMode) => {
    this.importState = { success: false, error: '', inProgress: true };
    this.importResult = null;
    const formData = new FormData();
    formData.append('file', file);
    return baseService
      .postRequest(`${URLConstants.ProductsStockImport}?mode=${mode}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((response: IApiResponse<IApiSuccessResponse<IBulkImportResult>>) => {
        runInAction(() => {
          this.importResult = response.data.data;
          this.importState.success = true;
        });
        return this.fetchAllAsync();
      })
      .catch((err: string) => {
        runInAction(() => {
          this.importState.error = err;
        });
        throw err;
      })
      .finally(
        action(() => {
          this.importState.inProgress = false;
        }),
      );
  };

  bulkImportAsync = (file: File) => {
    this.importState = { success: false, error: '', inProgress: true };
    const formData = new FormData();
    formData.append('file', file);
    return baseService
      .postRequest(URLConstants.ProductsBulkImport, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((response: IApiResponse<IApiSuccessResponse<IBulkImportResult>>) => {
        runInAction(() => {
          this.importResult = response.data.data;
          this.importState.success = true;
        });
        return this.fetchAllAsync();
      })
      .catch((err: string) => {
        runInAction(() => {
          this.importState.error = err;
        });
        throw err;
      })
      .finally(
        action(() => {
          this.importState.inProgress = false;
        }),
      );
  };
}

export const productStore = new ProductStore();
export default productStore;
