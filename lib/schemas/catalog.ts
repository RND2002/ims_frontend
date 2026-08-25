import { z } from "zod";

export const productSchema = z
  .object({
    name: z.string().min(2, "Product name must be at least 2 characters"),
    sku: z.string().nullable().optional().or(z.literal("")),
    barcode: z.string().nullable().optional().or(z.literal("")),
    category_id: z.string().nullable().optional(),
    unit_id: z.string().nullable().optional(),
    tax_rate_id: z.string().nullable().optional(),
    cost_price: z.number().min(0, "Cost price must be 0 or greater"),
    selling_price: z.number().min(0, "Selling price must be 0 or greater"),
    mrp: z.number().min(0, "MRP must be 0 or greater").optional().nullable(),
    reorder_level: z.number().int().min(0, "Reorder level must be 0 or greater"),
    opening_stock: z.number().int().min(0, "Opening stock must be 0 or greater"), // create-only
  })
  .refine((data) => data.selling_price >= data.cost_price, {
    message: "Selling price should not be less than cost price",
    path: ["selling_price"],
  });

export type ProductFormData = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional().or(z.literal("")),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

export const taxRateSchema = z.object({
  name: z.string().min(1, "Tax rate label is required"),
  rate: z.coerce.number().min(0, "Rate must be 0 or greater").max(100, "Rate cannot exceed 100"),
});

export type TaxRateFormData = z.infer<typeof taxRateSchema>;

export const unitSchema = z.object({
  name: z.string().min(1, "Unit name is required"),
  symbol: z.string().min(1, "Symbol is required"),
});

export type UnitFormData = z.infer<typeof unitSchema>;
