/**
 * User Role Enum
 *
 * Maps roles to numeric IDs for API communication.
 * The API stores roles as numbers, but we use this enum for type safety.
 *
 * Benefits:
 * - Type-safe role checking throughout the app
 * - Single source of truth for role values
 * - Readable in code (Admin vs 1)
 */
export enum UserRole {
  Admin = 1,
  Manager = 2,
  Accountant = 3,
  Warehouse = 4,
  Sales = 5,
}

/**
 * Maps numeric role values to readable names
 * Useful for displaying roles in UI (e.g., tables, dropdowns)
 */
export const roleNames: Record<UserRole, string> = {
  [UserRole.Admin]: "Admin",
  [UserRole.Manager]: "Manager",
  [UserRole.Accountant]: "Accountant",
  [UserRole.Warehouse]: "Warehouse",
  [UserRole.Sales]: "Sales",
};

/**
 * Get role name from numeric value
 * @param roleId - The numeric role ID from API
 * @returns Human-readable role name or 'Unknown' if not found
 */
export function getRoleName(roleId: number): string {
  return roleNames[roleId as UserRole] || "Unknown";
}

/**
 * Get all available roles for dropdowns/selects
 * @returns Array of { value: UserRole, label: string } for UI
 */
export function getAvailableRoles() {
  return Object.entries(roleNames).map(([key, value]) => ({
    value: parseInt(key) as UserRole,
    label: value,
  }));
}

/**
 * String-based role keys for frontend permission system
 * These map to the keys used in AuthContext rolePermissions
 */
export type RoleKey = 'admin' | 'manager' | 'accountant' | 'warehouse' | 'sales';

/**
 * Maps numeric role IDs to string permission keys
 * Used to bridge between API (numeric) and frontend permissions (string keys)
 */
export const ROLE_KEYS: Record<UserRole, RoleKey> = {
  [UserRole.Admin]: 'admin',
  [UserRole.Manager]: 'manager',
  [UserRole.Accountant]: 'accountant',
  [UserRole.Warehouse]: 'warehouse',
  [UserRole.Sales]: 'sales',
};

/**
 * Convert numeric role ID from API to string permission key
 * @param roleId - Numeric role from API (e.g., 1 for Admin)
 * @returns String key for permission lookup (e.g., 'admin')
 */
export function getRoleKey(roleId: UserRole | number): RoleKey | undefined {
  return ROLE_KEYS[roleId as UserRole];
}
