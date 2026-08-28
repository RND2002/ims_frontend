export enum ImportBatchStatus {
  Processing = 'processing',
  PendingReview = 'pending_review',
  Committed = 'committed',
  Discarded = 'discarded',
  Failed = 'failed'
}

export enum ImportMatchStatus {
  AutoMatched = 'auto_matched',
  Suggested = 'suggested',
  Ambiguous = 'ambiguous',
  NoMatch = 'no_match'
}

export enum ImportResolvedAction {
  MatchedExisting = 'matched_existing',
  CreatedNew = 'created_new',
  Skipped = 'skipped'
}

export enum ExpenseCategory {
  Rent = 'rent',
  Electricity = 'electricity',
  Wages = 'wages',
  Misc = 'misc'
}

// Candidates suggested by trigram/semantic matching
export interface CandidateMatch {
  product_id: string;
  name: string;
  score: number; // confidence score (0.0 to 1.0)
}

// Individual line items extracted from receipt
export interface ImportLineItem {
  id: string;
  batch_id: string;
  line_number: number;
  raw_description: string;
  raw_unit_text: string | null;
  raw_qty: number | null;
  raw_rate: number | null;
  raw_amount: number | null;
  match_status: ImportMatchStatus;
  matched_product_id: string | null;
  match_confidence: number | null;
  candidate_matches: CandidateMatch[] | null;
  
  // Human review overrides
  resolved_action: ImportResolvedAction | null;
  resolved_product_id: string | null;
  resolved_unit_id: string | null;
  flagged_reason: string | null; // e.g. "rate_conflict_detected"
}

// Main Import Batch representation
export interface ImportBatch {
  id: string;
  store_id: string;
  source_image_url: string; // Dynamic S3 Presigned URL for image rendering
  status: ImportBatchStatus;
  party_id: string | null;
  bill_no?: string | null;
  invoice_date?: string | null;
  raw_ai_response: any | null; // Auditable extraction dump
  uploaded_by: string;
  created_at: string;
  committed_at: string | null;
  // Only present in detail endpoint (GET /batches/{batchId})
  line_items?: ImportLineItem[];
  // Only present in list endpoint summary responses
  line_items_count?: number;
}

// Upload Payload (multipart/form-data)
export interface UploadInvoiceRequest {
  file: File;
}

// Incremental Staging Review Save Payload
export interface LineItemReviewUpdate {
  id: string;
  resolved_action: ImportResolvedAction;
  resolved_product_id: string | null;
  resolved_unit_id: string | null;
  raw_description?: string;
  raw_unit_text?: string;
  raw_qty?: number;
  raw_rate?: number;
  raw_amount?: number;
}

export interface BatchReviewUpdateRequest {
  party_id: string | null;
  bill_no?: string;
  items: LineItemReviewUpdate[];
}

// New Product Creation Payload (Nested within Commit request if creating products)
export interface ProductCreateInput {
  name: string;
  sku?: string;
  barcode?: string;
  cost_price: number;
  selling_price: number;
  mrp?: number;
  category_id?: string;
  tax_rate_id?: string;
  unit_id: string;
}

// Line Item Commit Override
export interface LineItemCommitOverride {
  id: string;
  resolved_action: ImportResolvedAction;
  resolved_product_id: string | null;
  resolved_unit_id: string | null;
  new_product: ProductCreateInput | null; // Required if resolved_action === CreatedNew
  quantity: number | null;
  unit_cost: number | null;
  line_total: number | null;
  batch_no?: string;
  expiry_date?: string; // YYYY-MM-DD
  expense_category?: ExpenseCategory; // Required if resolved_action === Skipped
}

// Atomic Final Commit Payload
export interface BatchCommitRequest {
  party_id: string; // Linked supplier
  bill_no: string | null;
  invoice_date: string | null; // YYYY-MM-DD
  amount_paid: number;
  items: LineItemCommitOverride[];
}

// Single Item manual rematch payload
export interface LineItemReMatchRequest {
  raw_description?: string;
  raw_unit_text?: string;
  raw_qty?: number;
  raw_rate?: number;
  raw_amount?: number;
}
