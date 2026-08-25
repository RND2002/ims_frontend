export interface Party {
  id: string;
  name: string;
  phone: string;
  party_type: "customer" | "supplier";
  store_id: string;
  address?: string;
  opening_balance: number;
  current_balance: number;
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  entry_type: "debit" | "credit";
  amount: number;
  balance_after: number;
  reference_type: string;
  reference_id: string;
  note?: string;
  created_at: string;
}

export interface LedgerStatement {
  party_id: string;
  name: string;
  party_type: "customer" | "supplier";
  current_balance: number;
  entries: LedgerEntry[];
}

export interface SaleItem {
  id?: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  line_total: number;
}

export interface Sale {
  id: string;
  invoice_no: string;
  party_id: string | null;
  party?: Party | null;
  subtotal: number;
  tax_total: number;
  discount: number;
  grand_total: number;
  amount_paid: number;
  payment_status: "paid" | "partial" | "unpaid";
  created_at: string;
  items: SaleItem[];
}
