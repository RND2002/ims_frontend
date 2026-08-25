export interface Category {
  id: string;
  name: string;
  description?: string | null;
  store_id: string;
}

export interface Unit {
  id: string;
  name: string;
  symbol: string;
  store_id: string;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number; // e.g. 18 for 18%
  store_id: string;
}

export interface ProductBatch {
  id: string;
  product_id: string;
  batch_number: string;
  quantity: number;
  expiry_date?: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  category_id: string | null;
  category?: Category | null;
  unit_id: string | null;
  unit?: Unit | null;
  tax_rate_id?: string | null;
  tax_rate?: TaxRate | null;
  cost_price: number;
  selling_price: number;
  mrp?: number | null;
  current_stock: number;
  reorder_level: number;
  is_active: boolean;
  batches?: ProductBatch[] | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
