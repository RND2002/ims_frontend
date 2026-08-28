import { apiSlice } from "@/lib/store/apiSlice";
import { API_ENDPOINTS } from "@/app/api/endpoints";
import { Product, Category, Unit, TaxRate, PaginatedResponse } from "@/lib/types/catalog";

export const parseProductNumbers = (prod: any): Product => {
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

export const catalogApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<
      PaginatedResponse<Product>,
      { limit?: number; offset?: number; search?: string; category_id?: string }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.limit !== undefined) queryParams.append("limit", String(params.limit));
        if (params.offset !== undefined) queryParams.append("offset", String(params.offset));
        if (params.search) queryParams.append("search", params.search);
        if (params.category_id) queryParams.append("category_id", params.category_id);
        return `${API_ENDPOINTS.backend.catalog.products}?${queryParams.toString()}`;
      },
      transformResponse: (response: PaginatedResponse<Product>) => ({
        ...response,
        items: (response.items || []).map(parseProductNumbers),
      }),
      providesTags: ["Product"],
    }),
    getCategories: builder.query<Category[], void>({
      query: () => API_ENDPOINTS.backend.catalog.categories,
      transformResponse: (response: any) => {
        if (Array.isArray(response)) return response;
        if (response && typeof response === "object" && "items" in response) {
          return response.items || [];
        }
        return [];
      },
      providesTags: ["Category"],
    }),
    getUnits: builder.query<Unit[], void>({
      query: () => API_ENDPOINTS.backend.catalog.units,
      transformResponse: (response: any) => {
        if (Array.isArray(response)) return response;
        if (response && typeof response === "object" && "items" in response) {
          return response.items || [];
        }
        return [];
      },
      providesTags: ["Unit"],
    }),
    getTaxRates: builder.query<TaxRate[], void>({
      query: () => API_ENDPOINTS.backend.catalog.taxRates,
      transformResponse: (response: any) => {
        if (Array.isArray(response)) return response;
        if (response && typeof response === "object" && "items" in response) {
          return response.items || [];
        }
        return [];
      },
      providesTags: ["TaxRate"],
    }),
    createProduct: builder.mutation<Product, Partial<Product> & { opening_stock?: number }>({
      query: (payload) => ({
        url: API_ENDPOINTS.backend.catalog.products,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: Product) => parseProductNumbers(response),
      invalidatesTags: ["Product"],
    }),
    updateProduct: builder.mutation<Product, { productId: string; payload: Partial<Product> }>({
      query: ({ productId, payload }) => ({
        url: API_ENDPOINTS.backend.catalog.productById(productId),
        method: "PUT",
        body: payload,
      }),
      transformResponse: (response: Product) => parseProductNumbers(response),
      invalidatesTags: ["Product"],
    }),
    deleteProduct: builder.mutation<void, string>({
      query: (productId) => ({
        url: API_ENDPOINTS.backend.catalog.productById(productId),
        method: "DELETE",
      }),
      invalidatesTags: ["Product"],
    }),
    createCategory: builder.mutation<Category, { name: string; description?: string }>({
      query: (payload) => ({
        url: API_ENDPOINTS.backend.catalog.categories,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Category"],
    }),
    createUnit: builder.mutation<Unit, { name: string; symbol: string }>({
      query: (payload) => ({
        url: API_ENDPOINTS.backend.catalog.units,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Unit"],
    }),
    createTaxRate: builder.mutation<TaxRate, { name: string; rate: number }>({
      query: (payload) => ({
        url: API_ENDPOINTS.backend.catalog.taxRates,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["TaxRate"],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetCategoriesQuery,
  useGetUnitsQuery,
  useGetTaxRatesQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useCreateCategoryMutation,
  useCreateUnitMutation,
  useCreateTaxRateMutation,
} = catalogApi;
