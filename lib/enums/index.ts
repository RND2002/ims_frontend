// TypeScript enums mirroring Python enums 1:1
// Source: app/models/enums.py

export enum StorePlanTier {
  FREE = "free",
  PRO = "pro",
}

export enum StoreRole {
  OWNER = "owner",
  MANAGER = "manager",
  STAFF = "staff",
  ACCOUNTANT = "accountant",
  VIEWER = "viewer",
}

export enum MembershipStatus {
  ACTIVE = "active",
  INVITED = "invited",
  REMOVED = "removed",
}

export enum StockMovementType {
  PURCHASE = "purchase",
  SALE = "sale",
  RETURN_IN = "return_in",
  RETURN_OUT = "return_out",
  ADJUSTMENT = "adjustment",
  TRANSFER = "transfer",
}

export enum PartyType {
  CUSTOMER = "customer",
  SUPPLIER = "supplier",
  BOTH = "both",
}

export enum PaymentStatus {
  PAID = "paid",
  PARTIAL = "partial",
  UNPAID = "unpaid",
}

export enum LedgerEntryType {
  DEBIT = "debit",
  CREDIT = "credit",
}

export enum LedgerReferenceType {
  SALE = "sale",
  PURCHASE = "purchase",
  PAYMENT = "payment",
  MANUAL = "manual",
}

export enum PaymentMode {
  CASH = "cash",
  UPI = "upi",
  BANK_TRANSFER = "bank_transfer",
  CHEQUE = "cheque",
}

export enum PaymentDirection {
  RECEIVED = "received",
  PAID = "paid",
}

export enum ExpenseCategory {
  RENT = "rent",
  ELECTRICITY = "electricity",
  WAGES = "wages",
  MISC = "misc",
}

export enum StockAdjustmentReason {
  DAMAGE = "damage",
  THEFT = "theft",
  MISCOUNT = "miscount",
  EXPIRED = "expired",
}

export enum NotificationType {
  PAYMENT_DUE = "payment_due",
  LOW_STOCK = "low_stock",
  EXPIRY_SOON = "expiry_soon",
}
