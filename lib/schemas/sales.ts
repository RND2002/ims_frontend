import { z } from "zod";

export const partySchema = z.object({
  name: z.string().min(2, "Customer name must be at least 2 characters"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
});

export type PartyFormData = z.infer<typeof partySchema>;

export const saleItemSchema = z.object({
  product_id: z.string().uuid("Invalid product selection"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unit_price: z.number().min(0, "Price must be 0 or greater"),
});

export const saleCheckoutSchema = z.object({
  party_id: z.string().uuid("Please select a customer").nullable().optional(),
  amount_paid: z.number().min(0, "Amount paid must be 0 or greater").default(0),
  items: z.array(saleItemSchema).min(1, "Please add at least one product"),
});

export type SaleCheckoutFormData = z.infer<typeof saleCheckoutSchema>;
