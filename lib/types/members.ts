export type StoreRole = "owner" | "manager" | "staff" | "accountant" | "viewer";

export type MembershipStatus = "active" | "invited" | "removed";

export interface Membership {
  id: string;
  user_id: string;
  store_id: string;
  role: StoreRole;
  status: MembershipStatus;
  permissions: {
    overrides?: Record<string, boolean>;
  };
  joined_at: string;
  user: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
}
