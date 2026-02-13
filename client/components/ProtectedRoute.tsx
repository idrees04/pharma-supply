/**
 * Protected Route Component
 *
 * Wrapper that ensures only authenticated users can access a route.
 * If user is not authenticated, redirects to login page.
 * If user lacks required permissions, redirects to unauthorized page.
 *
 * Usage in Routes:
 *   <Route
 *     path="/users"
 *     element={
 *       <ProtectedRoute module="users" permission="read">
 *         <UsersPage />
 *       </ProtectedRoute>
 *     }
 *   />
 *
 * Or with role-based access control:
 *   <Route
 *     path="/admin"
 *     element={
 *       <ProtectedRoute requiredRole="admin">
 *         <AdminPanel />
 *       </ProtectedRoute>
 *     }
 *   />
 */

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useCheckAuth, useCurrentUser } from "@/hooks/useAuth";
import { useAuth } from "@/context/AuthContext";
import { RoleKey } from "@/types/enums";

type Permission = "create" | "read" | "update" | "delete";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Specific role required (string key like 'admin') */
  requiredRole?: RoleKey;
  /** Module for permission check (e.g., 'products', 'users') */
  module?: string;
  /** Required permission level (default: 'read') */
  permission?: Permission;
}

/**
 * ProtectedRoute Component
 *
 * Protects routes by checking authentication status.
 * Optionally enforces role-based OR permission-based access control.
 *
 * Authorization modes:
 * 1. Authentication only (no props): any logged-in user can access
 * 2. Role-based (requiredRole): only users with that role can access
 * 3. Permission-based (module + permission): checks hasPermission()
 *
 * @param children - Component to render if user is authorized
 * @param requiredRole - Optional role required to access this route
 * @param module - Optional module for permission check
 * @param permission - Permission level required (default: 'read')
 *
 * @example
 * ```typescript
 * // Basic protection (any authenticated user)
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 *
 * // Permission-based protection
 * <ProtectedRoute module="users" permission="read">
 *   <UsersPage />
 * </ProtectedRoute>
 *
 * // Role-based protection
 * <ProtectedRoute requiredRole="admin">
 *   <AdminPanel />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  requiredRole,
  module,
  permission = "read",
}: ProtectedRouteProps) {
  const isAuthenticated = useCheckAuth();
  const currentUser = useCurrentUser();
  const { hasPermission } = useAuth();
  const location = useLocation();

  // Check if user is authenticated
  if (!isAuthenticated) {
    // Store the page user was trying to access
    // They'll be redirected here after successful login
    sessionStorage.setItem("redirectAfterLogin", location.pathname);
    return <Navigate to="/login" replace />;
  }

  // Check module-based permission if specified
  if (module && !hasPermission(module, permission)) {
    // User lacks required permission for this module
    return <Navigate to="/unauthorized" replace />;
  }

  // Check if user has required role (for role-specific routes)
  if (requiredRole && currentUser && currentUser.role !== requiredRole) {
    // User is authenticated but doesn't have the required role
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
}

/**
 * Public Route Component
 *
 * Routes that should NOT be accessible to authenticated users
 * (e.g., login page should redirect if already logged in)
 *
 * If user is already authenticated:
 * - Redirects to dashboard (/)
 *
 * Otherwise:
 * - Renders the component normally
 */
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useCheckAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/**
 * Admin-Only Route Helper
 *
 * Convenience wrapper for routes that require admin role
 *
 * @example
 * <Route
 *   path="/admin/users"
 *   element={
 *     <AdminRoute>
 *       <UserManagement />
 *     </AdminRoute>
 *   }
 * />
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>
  );
}
