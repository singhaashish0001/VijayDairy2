export type ProductUnit = 'LTR' | 'KG' | 'PCS';

export interface IAddEditProduct {
  name: string;
  unit: ProductUnit;
  price: number | '';
  stock: number | '';
  lowStockThreshold: number | '';
}
