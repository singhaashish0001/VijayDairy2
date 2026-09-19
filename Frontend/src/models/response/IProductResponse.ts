export default interface IProductResponse {
  id: string;
  name: string;
  unit: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  createdAt: string;
}

export interface IBulkImportRowError {
  row: number;
  error: string;
}

export interface IBulkImportResult {
  created: number;
  updated: number;
  total: number;
  errors: IBulkImportRowError[];
}
