import type { IObservableInitialState } from '../../../models/ICommon';
import type IProductResponse from '../../../models/response/IProductResponse';
import type { IBulkImportResult } from '../../../models/response/IProductResponse';
import type { StockImportMode } from '../../../helpers/product-csv-template';
import type { IAddEditProduct } from '../../../models/forms/IAddEditProduct';

export interface IProductStore {
  inProgress: boolean;
  error: string;
  products: IProductResponse[];
  addUpdateState: IObservableInitialState;
  deleteState: IObservableInitialState;
  importResult: IBulkImportResult | null;
  importState: IObservableInitialState;

  fetchAllAsync(): Promise<void>;
  addAsync(data: IAddEditProduct): Promise<void>;
  updateAsync(id: string, data: Partial<IAddEditProduct>): Promise<void>;
  deleteAsync(id: string): Promise<void>;
  bulkImportAsync(file: File): Promise<void>;
  importStockAsync(file: File, mode: StockImportMode): Promise<void>;
}
