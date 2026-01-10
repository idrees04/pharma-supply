/**
 * Protected Route Component
 *
 * Wrapper that ensures only authenticated users can access a route.
 * If user is not authenticated, redirects to login page.
 *
 * Usage in Routes:
 *   <Route
 *     path="/users"
 *     element={
 *       <ProtectedRoute>
 *         <UsersPage />
 *       </ProtectedRoute>
 *     }
 *   />
 *
 * Or with role-based access control:
 *   <Route
 *     path="/users"
 *     element={
 *       <ProtectedRoute requiredRole={UserRole.Admin}>
 *         <UsersPage />
 *       </ProtectedRoute>
 *     }
 *   />
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCheckAuth, useCurrentUser } from '@/hooks/useAuth';
import { UserRole } from '@/types/enums';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

/**
 * ProtectedRoute Component
 *
 * Protects routes by checking authentication status.
 * Optionally enforces role-based access control.
 *
 * If user is not authenticated:
 * - Redirects to /login
 * - Stores current location in sessionStorage for redirect after login
 *
 * If user is authenticated but lacks required role:
 * - Redirects to / (unauthorized)
 *
 * @param children - Component to render if user is authorized
 * @param requiredRole - Optional role required to access this route
 *
 * @example
 * ```typescript
 * // Basic protection (any authenticated user)
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 *
 * // Admin-only route
 * <ProtectedRoute requiredRole={UserRole.Admin}>
 *   <UserManagement />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const isAuthenticated = useCheckAuth();
  const currentUser = useCurrentUser();
  const location = useLocation();

  // Check if user is authenticated
  if (!isAuthenticated) {
    // Store the page user was trying to access
    // They'll be redirected here after successful login
    sessionStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (requiredRole && currentUser && currentUser.role !== requiredRole) {
    // User is authenticated but doesn't have the required role
    // Redirect to unauthorized page or home
    return <Navigate to="/" replace />;
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
  return <ProtectedRoute requiredRole={UserRole.Admin}>{children}</ProtectedRoute>;
}
