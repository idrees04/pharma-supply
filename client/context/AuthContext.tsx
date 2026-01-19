import React, { createContext, useContext, useCallback, useMemo } from "react";
import { useStore, UserRole, User } from "@/hooks/useStore";
import { UserDTO } from "@/types/api/users";

type Permission = "create" | "read" | "update" | "delete";

interface ModulePermissions {
  [key: string]: Permission[];
}

const rolePermissions: Record<UserRole, ModulePermissions> = {
  admin: {
    products: ["create", "read", "update", "delete"],
    suppliers: ["create", "read", "update", "delete"],
    hospitals: ["create", "read", "update", "delete"],
    supplyOrders: ["create", "read", "update", "delete"],
    purchaseOrders: ["create", "read", "update", "delete"],
    salesOrders: ["create", "read", "update", "delete"],
    deliveryChallans: ["create", "read", "update", "delete"],
    invoices: ["create", "read", "update", "delete"],
    payments: ["create", "read", "update", "delete"],
    expenses: ["create", "read", "update", "delete"],
    transfers: ["create", "read", "update", "delete"],
    bankAccounts: ["create", "read", "update", "delete"],
    salaryVouchers: ["create", "read", "update", "delete"],
    tenders: ["create", "read", "update", "delete"],
    inventory: ["create", "read", "update", "delete"],
    reports: ["read"],
    users: ["create", "read", "update", "delete"],
  },
  manager: {
    products: ["read", "update"],
    suppliers: ["read", "update"],
    hospitals: ["read", "update"],
    supplyOrders: ["create", "read", "update"],
    purchaseOrders: ["create", "read", "update"],
    salesOrders: ["create", "read", "update"],
    deliveryChallans: ["create", "read", "update"],
    invoices: ["create", "read", "update"],
    payments: ["read", "update"],
    expenses: ["read"],
    transfers: ["read"],
    bankAccounts: ["read"],
    salaryVouchers: ["read"],
    tenders: ["read", "create"],
    inventory: ["read"],
    reports: ["read"],
    users: ["read"],
  },
  accountant: {
    products: ["read"],
    suppliers: ["read"],
    hospitals: ["read"],
    supplyOrders: ["read"],
    purchaseOrders: ["read"],
    salesOrders: ["read"],
    deliveryChallans: ["read"],
    invoices: ["read"],
    payments: ["create", "read", "update"],
    expenses: ["create", "read", "update"],
    transfers: ["create", "read", "update"],
    bankAccounts: ["read", "update"],
    salaryVouchers: ["create", "read", "update"],
    tenders: ["read"],
    inventory: ["read"],
    reports: ["read"],
    users: [],
  },
  warehouse: {
    products: ["read"],
    suppliers: ["read"],
    hospitals: ["read"],
    supplyOrders: ["read"],
    purchaseOrders: ["read"],
    salesOrders: ["read"],
    deliveryChallans: ["create", "read", "update"],
    invoices: ["read"],
    payments: ["read"],
    expenses: ["read"],
    transfers: [],
    bankAccounts: [],
    salaryVouchers: [],
    tenders: ["read"],
    inventory: ["read", "update"],
    reports: ["read"],
    users: [],
  },
  sales: {
    products: ["read"],
    suppliers: ["read"],
    hospitals: ["read"],
    supplyOrders: ["create", "read", "update"],
    purchaseOrders: ["read"],
    salesOrders: ["create", "read", "update"],
    deliveryChallans: ["read"],
    invoices: ["read"],
    payments: ["read"],
    expenses: ["read"],
    transfers: [],
    bankAccounts: [],
    salaryVouchers: [],
    tenders: ["read"],
    inventory: ["read"],
    reports: ["read"],
    users: [],
  },
};

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  hasPermission: (module: string, permission: Permission) => boolean;
  canAccess: (module: string) => boolean;
  isAdmin: boolean;
  isManager: boolean;
  isAccountant: boolean;
  isWarehouse: boolean;
  isSales: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const currentUser = useStore((state) => state.currentUser);
  const setCurrentUser = useStore((state) => state.setCurrentUser);

  const hasPermission = useCallback(
    (module: string, permission: Permission): boolean => {
      if (!currentUser) return false;
      const permissions = rolePermissions[currentUser.role];
      return permissions[module]?.includes(permission) ?? false;
    },
    [currentUser],
  );

  const canAccess = useCallback(
    (module: string): boolean => {
      if (!currentUser) return false;
      const permissions = rolePermissions[currentUser.role];
      return (permissions[module]?.length ?? 0) > 0;
    },
    [currentUser],
  );

  const value: AuthContextType = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      hasPermission,
      canAccess,
      isAdmin: currentUser?.role === "admin",
      isManager: currentUser?.role === "manager",
      isAccountant: currentUser?.role === "accountant",
      isWarehouse: currentUser?.role === "warehouse",
      isSales: currentUser?.role === "sales",
    }),
    [currentUser, setCurrentUser, hasPermission, canAccess],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
