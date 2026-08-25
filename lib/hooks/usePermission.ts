import { useAppSelector } from "@/lib/store/hooks";
import { StoreRole } from "@/lib/types/members";

// Define action names type
export type PermissionAction =
  | "catalog:view"
  | "catalog:create"
  | "catalog:update"
  | "catalog:delete"
  | "stock:view"
  | "stock:adjust"
  | "sales:view"
  | "sales:create"
  | "sales:delete"
  | "ledgers:view"
  | "ledgers:create"
  | "ledgers:delete"
  | "expenses:view"
  | "expenses:create"
  | "expenses:delete"
  | "members:view"
  | "members:invite"
  | "members:role_update"
  | "members:remove"
  | "dashboard:view";

// Default permissions by role (only backend defined roles: owner, manager, staff, accountant, viewer)
const ROLE_DEFAULTS: Record<StoreRole, PermissionAction[]> = {
  owner: [
    "catalog:view", "catalog:create", "catalog:update", "catalog:delete",
    "stock:view", "stock:adjust",
    "sales:view", "sales:create", "sales:delete",
    "ledgers:view", "ledgers:create", "ledgers:delete",
    "expenses:view", "expenses:create", "expenses:delete",
    "members:view", "members:invite", "members:role_update", "members:remove",
    "dashboard:view"
  ],
  manager: [
    "catalog:view", "catalog:create", "catalog:update", "catalog:delete",
    "stock:view", "stock:adjust",
    "sales:view", "sales:create", "sales:delete",
    "ledgers:view", "ledgers:create", "ledgers:delete",
    "expenses:view", "expenses:create", "expenses:delete",
    "members:view", "members:invite", "members:role_update", "members:remove",
    "dashboard:view"
  ],
  staff: [
    "catalog:view", "catalog:create", "catalog:update",
    "stock:view", "stock:adjust",
    "sales:view", "sales:create",
    "ledgers:view", "ledgers:create",
    "expenses:view", "expenses:create",
    "dashboard:view"
  ],
  viewer: [
    "catalog:view",
    "stock:view",
    "sales:view",
    "ledgers:view",
    "expenses:view",
    "dashboard:view"
  ],
  accountant: [
    "ledgers:view",
    "expenses:view",
    "dashboard:view"
  ]
};

// Normalizes arbitrary role strings to valid backend-defined StoreRole keys
function normalizeRole(roleStr: string): StoreRole {
  const role = (roleStr || "viewer").toLowerCase();
  if (role.includes("owner") || role.includes("admin")) return "owner";
  if (role.includes("manager")) return "manager";
  if (role.includes("staff")) return "staff";
  if (role.includes("accountant")) return "accountant";
  return "viewer";
}

// Client-side JWT Decoder to recover user identity when user state is unpopulated
function decodeJwt(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function usePermission() {
  const { activeStore } = useAppSelector((state) => state.stores);
  const { user, accessToken } = useAppSelector((state) => state.auth);
  const { members } = useAppSelector((state) => state.members);

  const hasPermission = (action: PermissionAction): boolean => {
    if (!activeStore) return false;

    // Resolve user ID or phone from JWT
    let currentUserId = user?.id;
    let currentUserPhone = user?.phone;
    if ((!currentUserId || !currentUserPhone) && accessToken) {
      const decoded = decodeJwt(accessToken);
      if (decoded) {
        // sub usually holds phone number or user UUID
        const sub = decoded.sub || decoded.user_id || decoded.id;
        if (sub) {
          if (sub.includes("@") || sub.length > 15) {
            currentUserId = sub;
          } else {
            currentUserPhone = sub.replace(/\D/g, ""); // clean non-digits
          }
        }
      }
    }

    // Resolve role (try matching members list first, then fall back to activeStore.role)
    let roleString: string = activeStore.role;
    let matchedMember = null;

    if (members.length > 0) {
      matchedMember = members.find((m) => {
        // Match by user_id
        if (currentUserId && m.user_id === currentUserId) return true;
        // Match by phone number
        if (currentUserPhone) {
          const mPhoneClean = m.user.phone.replace(/\D/g, "");
          const targetPhoneClean = currentUserPhone.replace(/\D/g, "");
          return mPhoneClean.endsWith(targetPhoneClean) || targetPhoneClean.endsWith(mPhoneClean);
        }
        return false;
      });

      if (matchedMember) {
        roleString = matchedMember.role;
      }
    }

    const rawRole = normalizeRole(roleString || "viewer");

    // 1. Owner role always gets full access
    if (rawRole === "owner") return true;

    // 2. Check for manual overrides from the active members list
    if (matchedMember && matchedMember.permissions?.overrides) {
      const overrideVal = matchedMember.permissions.overrides[action];
      if (overrideVal !== undefined) {
        return overrideVal; // explicitly true or false override
      }
    }

    // 3. Fallback to default permissions for the role
    const defaults = ROLE_DEFAULTS[rawRole] || ROLE_DEFAULTS.viewer;
    return defaults.includes(action);
  };

  return { hasPermission };
}
export default usePermission;
