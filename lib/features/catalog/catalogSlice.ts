import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/lib/store";
import { API_ENDPOINTS } from "@/app/api/endpoints";
import { createApiClient } from "@/lib/apiClient";
import { Product, Category, Unit, TaxRate, ProductBatch, PaginatedResponse } from "@/lib/types/catalog";
import { StockAdjustmentReason } from "@/lib/enums";

interface CatalogState {
  products: Product[];
  total: number;
  limit: number;
  offset: number;
  categories: Category[];
  units: Unit[];
  taxRates: TaxRate[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: CatalogState = {
  products: [],
  total: 0,
  limit: 20,
  offset: 0,
  categories: [],
  units: [],
  taxRates: [],
  loading: false,
  saving: false,
  error: null,
};

// Thunk to fetch products with pagination and filters
export const fetchProducts = createAsyncThunk(
  "catalog/fetchProducts",
  async (
    params: { limit?: number; offset?: number; search?: string; category_id?: string } = {},
    { getState, rejectWithValue }
  ) => {
    try {
      const client = createApiClient(getState as () => RootState);
      const queryParams = new URLSearchParams();
      if (params.limit !== undefined) queryParams.append("limit", String(params.limit));
      if (params.offset !== undefined) queryParams.append("offset", String(params.offset));
      if (params.search) queryParams.append("search", params.search);
      if (params.category_id) queryParams.append("category_id", params.category_id);

      const url = `${API_ENDPOINTS.backend.catalog.products}?${queryParams.toString()}`;
      const data = await client.get<PaginatedResponse<Product>>(url);
      return {
        data,
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
      };
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch products");
    }
  }
);

// Thunk to create a new product with optional opening stock adjustment
export const createProduct = createAsyncThunk(
  "catalog/createProduct",
  async (
    payload: {
      name: string;
      sku?: string;
      barcode?: string;
      category_id?: string | null;
      unit_id?: string | null;
      tax_rate_id?: string | null;
      cost_price: number;
      selling_price: number;
      mrp?: number | null;
      reorder_level: number;
      opening_stock?: number;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const client = createApiClient(() => state);

      // 1. Create the product
      const product = await client.post<Product>(API_ENDPOINTS.backend.catalog.products, {
        name: payload.name,
        sku: payload.sku || undefined,
        barcode: payload.barcode || null,
        category_id: payload.category_id || null,
        unit_id: payload.unit_id || null,
        tax_rate_id: payload.tax_rate_id || null,
        cost_price: payload.cost_price,
        selling_price: payload.selling_price,
        mrp: payload.mrp || null,
        reorder_level: payload.reorder_level,
      });

      // 2. Adjust opening stock if specified and > 0
      if (payload.opening_stock && payload.opening_stock > 0) {
        try {
          let defaultBatchId: string | undefined = product.batches?.[0]?.id;

          // Fallback to GET batches if not present in the creation response
          if (!defaultBatchId) {
            const batchesUrl = API_ENDPOINTS.backend.catalog.productBatches(product.id);
            const batches = await client.get<ProductBatch[]>(batchesUrl);
            if (batches && batches.length > 0) {
              defaultBatchId = batches[0].id;
            }
          }

          if (defaultBatchId) {
            // Perform stock adjustment
            await client.post(API_ENDPOINTS.backend.stock.adjust, {
              product_id: product.id,
              batch_id: defaultBatchId,
              new_quantity: payload.opening_stock,
              reason: StockAdjustmentReason.MISCOUNT,
            });
          }
        } catch (adjustError) {
          console.error("Product created but opening stock adjustment failed:", adjustError);
        }
      }

      // Re-fetch the product to get updated stock totals
      const updatedProduct = await client.get<Product>(
        API_ENDPOINTS.backend.catalog.productById(product.id)
      );
      return updatedProduct;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to create product");
    }
  }
);

// Thunk to update an existing product
export const updateProduct = createAsyncThunk(
  "catalog/updateProduct",
  async (
    payload: {
      id: string;
      name: string;
      sku?: string;
      barcode?: string | null;
      category_id?: string | null;
      unit_id?: string | null;
      tax_rate_id?: string | null;
      cost_price: number;
      selling_price: number;
      mrp?: number | null;
      reorder_level: number;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const client = createApiClient(getState as () => RootState);
      const url = API_ENDPOINTS.backend.catalog.productById(payload.id);
      const data = await client.patch<Product>(url, {
        name: payload.name,
        sku: payload.sku || undefined,
        barcode: payload.barcode || null,
        category_id: payload.category_id || null,
        unit_id: payload.unit_id || null,
        tax_rate_id: payload.tax_rate_id || null,
        cost_price: payload.cost_price,
        selling_price: payload.selling_price,
        mrp: payload.mrp || null,
        reorder_level: payload.reorder_level,
      });
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to update product");
    }
  }
);

// Thunk to delete a product
export const deleteProduct = createAsyncThunk(
  "catalog/deleteProduct",
  async (productId: string, { getState, rejectWithValue }) => {
    try {
      const client = createApiClient(getState as () => RootState);
      const url = API_ENDPOINTS.backend.catalog.productById(productId);
      await client.delete(url);
      return productId;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to delete product");
    }
  }
);

// Thunk to fetch categories
export const fetchCategories = createAsyncThunk(
  "catalog/fetchCategories",
  async (_, { getState, rejectWithValue }) => {
    try {
      const client = createApiClient(getState as () => RootState);
      const data = await client.get<Category[]>(API_ENDPOINTS.backend.catalog.categories);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch categories");
    }
  }
);

// Thunk to create a category
export const createCategory = createAsyncThunk(
  "catalog/createCategory",
  async (payload: { name: string; description?: string }, { getState, rejectWithValue }) => {
    try {
      const client = createApiClient(getState as () => RootState);
      const data = await client.post<Category>(API_ENDPOINTS.backend.catalog.categories, payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to create category");
    }
  }
);

// Thunk to fetch units
export const fetchUnits = createAsyncThunk(
  "catalog/fetchUnits",
  async (_, { getState, rejectWithValue }) => {
    try {
      const client = createApiClient(getState as () => RootState);
      const data = await client.get<Unit[]>(API_ENDPOINTS.backend.catalog.units);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch units");
    }
  }
);

// Thunk to create a unit
export const createUnit = createAsyncThunk(
  "catalog/createUnit",
  async (payload: { name: string; symbol: string }, { getState, rejectWithValue }) => {
    try {
      const client = createApiClient(getState as () => RootState);
      const data = await client.post<Unit>(API_ENDPOINTS.backend.catalog.units, payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to create unit");
    }
  }
);

// Thunk to fetch tax rates
export const fetchTaxRates = createAsyncThunk(
  "catalog/fetchTaxRates",
  async (_, { getState, rejectWithValue }) => {
    try {
      const client = createApiClient(getState as () => RootState);
      const data = await client.get<TaxRate[]>(API_ENDPOINTS.backend.catalog.taxRates);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch tax rates");
    }
  }
);

// Thunk to create a tax rate
export const createTaxRate = createAsyncThunk(
  "catalog/createTaxRate",
  async (payload: { name: string; rate: number }, { getState, rejectWithValue }) => {
    try {
      const client = createApiClient(getState as () => RootState);
      const data = await client.post<TaxRate>(API_ENDPOINTS.backend.catalog.taxRates, payload);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to create tax rate");
    }
  }
);

const parseProductNumbers = (prod: any): Product => {
  if (!prod) return prod;
  const parsedBatches = Array.isArray(prod.batches)
    ? prod.batches.map((b: any) => ({
        ...b,
        quantity: b.quantity ? Number(b.quantity) : 0,
        cost_price: b.cost_price ? Number(b.cost_price) : 0,
      }))
    : [];

  const computedStock = parsedBatches.reduce((sum: number, b: any) => sum + b.quantity, 0);

  return {
    ...prod,
    cost_price: prod.cost_price ? Number(prod.cost_price) : 0,
    selling_price: prod.selling_price ? Number(prod.selling_price) : 0,
    mrp: prod.mrp ? Number(prod.mrp) : null,
    current_stock: prod.current_stock ? Number(prod.current_stock) : computedStock,
    reorder_level: prod.reorder_level ? Number(prod.reorder_level) : 0,
    batches: parsedBatches.length > 0 ? parsedBatches : prod.batches,
  };
};

export const catalogSlice = createSlice({
  name: "catalog",
  initialState,
  reducers: {
    clearCatalogError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = (action.payload.data.items || []).map(parseProductNumbers);
        state.total = action.payload.data.total;
        state.limit = action.payload.limit;
        state.offset = action.payload.offset;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Product
      .addCase(createProduct.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.saving = false;
        state.products.unshift(parseProductNumbers(action.payload));
        state.total += 1;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.saving = false;
        const parsed = parseProductNumbers(action.payload);
        const idx = state.products.findIndex((p) => p.id === parsed.id);
        if (idx !== -1) {
          state.products[idx] = parsed;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      // Delete Product
      .addCase(deleteProduct.pending, (state, action) => {
        // Optimistic deletion
        state.products = state.products.filter((p) => p.id !== action.meta.arg);
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Fetch Categories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        if (Array.isArray(action.payload)) {
          state.categories = action.payload;
        } else if (action.payload && typeof action.payload === "object" && "items" in action.payload) {
          state.categories = (action.payload as any).items || [];
        } else {
          state.categories = [];
        }
      })
      // Create Category
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      })
      // Fetch Units
      .addCase(fetchUnits.fulfilled, (state, action) => {
        if (Array.isArray(action.payload)) {
          state.units = action.payload;
        } else if (action.payload && typeof action.payload === "object" && "items" in action.payload) {
          state.units = (action.payload as any).items || [];
        } else {
          state.units = [];
        }
      })
      // Create Unit
      .addCase(createUnit.fulfilled, (state, action) => {
        state.units.push(action.payload);
      })
      // Fetch Tax Rates
      .addCase(fetchTaxRates.fulfilled, (state, action) => {
        if (Array.isArray(action.payload)) {
          state.taxRates = action.payload;
        } else if (action.payload && typeof action.payload === "object" && "items" in action.payload) {
          state.taxRates = (action.payload as any).items || [];
        } else {
          state.taxRates = [];
        }
      })
      // Create Tax Rate
      .addCase(createTaxRate.fulfilled, (state, action) => {
        state.taxRates.push(action.payload);
      });
  },
});

export const { clearCatalogError } = catalogSlice.actions;
export default catalogSlice.reducer;
