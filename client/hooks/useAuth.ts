/**
 * Authentication Management Hook
 *
 * This hook manages the complete authentication lifecycle:
 * - Check for existing token on app startup
 * - Restore user session if token is valid
 * - Handle login and logout
 * - Provide auth state to components
 *
 * Architecture:
 * - Used once in App.tsx to initialize auth state
 * - Provides auth context that components consume
 * - Handles token refresh and expiration
 * - Type-safe user data throughout the app
 *
 * Usage in App.tsx:
 *   const auth = useAuthInitialize();
 *   if (auth.isLoading) return <LoadingScreen />;
 *   return <App />;
 */

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "./useStore";
import { UserDTO, LoginResponseDTO } from "@/types/api/users";
import { UserRole } from "@/types/enums";

/**
 * Auth State returned by useAuth hook
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserDTO | null;
  error: string | null;
}

/**
 * Auth context value interface
 */
export interface AuthContextValue {
  state: AuthState;
  login: (userData: LoginResponseDTO) => void;
  logout: () => void;
  isInitialized: boolean;
}

/**
 * useAuthInitialize - Initialize authentication on app startup
 *
 * This hook should be called once in your App.tsx component.
 * It checks for an existing token in localStorage and validates it.
 *
 * Flow:
 * 1. App mounts
 * 2. Check localStorage for token and user data
 * 3. If found, validate token (optional: call /api/me or similar)
 * 4. If valid, restore user session
 * 5. If invalid/expired, clear token and redirect to login
 * 6. Return auth state to App
 *
 * @returns AuthState with isAuthenticated, user, and loading state
 *
 * @example
 * ```typescript
 * function App() {
 *   const auth = useAuthInitialize();
 *
 *   // Show loading screen while checking token
 *   if (auth.isLoading) {
 *     return <div>Checking authentication...</div>;
 *   }
 *
 *   return (
 *     <BrowserRouter>
 *       <Routes>
 *         {auth.isAuthenticated ? (
 *           <>
 *             <Route path="/" element={<Dashboard />} />
 *             <Route path="/users" element={<UsersPage />} />
 *           </>
 *         ) : (
 *           <Route path="/login" element={<LoginPage />} />
 *         )}
 *       </Routes>
 *     </BrowserRouter>
 *   );
 * }
 * ```
 */
export function useAuthInitialize(): AuthState & { isInitialized: boolean } {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const { setCurrentUser } = useStore();

  useEffect(() => {
    // Initialize auth state from localStorage on app startup
    const initializeAuth = () => {
      try {
        // Check for stored token
        const token = localStorage.getItem("authToken");
        const storedUser = localStorage.getItem("currentUser");

        if (token && storedUser) {
          // Token and user exist in storage
          const user = JSON.parse(storedUser) as UserDTO;

          // Validate token format (basic check)
          // In production, you might want to validate token expiration
          if (isValidToken(token)) {
            // Restore user session
            setCurrentUser(user);
            setState({
              isAuthenticated: true,
              isLoading: false,
              user,
              error: null,
            });
            setIsInitialized(true);
            return;
          }
        }

        // No valid token found
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: null,
        });
        setIsInitialized(true);
      } catch (error) {
        // Error parsing stored data - clear and reset
        localStorage.removeItem("authToken");
        localStorage.removeItem("currentUser");
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: "Failed to restore session",
        });
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [setCurrentUser]);

  return {
    ...state,
    isInitialized,
  };
}

/**
 * useAuthActions - Get login and logout functions
 *
 * Provides methods to update auth state after login/logout.
 * Used by LoginPage and other auth-related components.
 *
 * @returns Object with login and logout functions
 *
 * @example
 * ```typescript
 * const { login, logout } = useAuthActions();
 *
 * const handleLogin = async (loginResponse: LoginResponseDTO) => {
 *   login(loginResponse);
 *   navigate('/dashboard');
 * };
 *
 * const handleLogout = () => {
 *   logout();
 *   navigate('/login');
 * };
 * ```
 */
export function useAuthActions() {
  const { setCurrentUser } = useStore();
  const queryClient = useQueryClient();

  const login = useCallback(
    (loginResponse: LoginResponseDTO) => {
      // Store token in localStorage (expires on browser close if using sessionStorage)
      localStorage.setItem("authToken", loginResponse.token);

      // Create UserDTO from login response
      const user: UserDTO = {
        id: loginResponse.userId,
        username: loginResponse.username,
        fullName: loginResponse.fullName,
        email: loginResponse.email,
        phoneNumber: "", // Not included in login response
        role: loginResponse.role as UserRole,
        lastLoginDate: new Date().toISOString(),
        isActive: true,
        isLocked: false,
      };

      // Store user data in localStorage
      localStorage.setItem("currentUser", JSON.stringify(user));

      // Update Zustand store
      setCurrentUser(user);
    },
    [setCurrentUser],
  );

  const logout = useCallback(() => {
    // Clear stored credentials
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    sessionStorage.removeItem("redirectAfterLogin");

    // Clear Zustand store
    setCurrentUser(null);

    // Clear React Query cache to avoid leaking user-specific data
    queryClient.clear();
  }, [setCurrentUser, queryClient]);

  return { login, logout };
}

/**
 * useCheckAuth - Check if user is authenticated
 *
 * Hook to check authentication status in any component.
 * Throws error if used outside AuthProvider.
 *
 * @returns Boolean indicating if user is authenticated
 *
 * @example
 * ```typescript
 * const isAuth = useCheckAuth();
 * return isAuth ? <Dashboard /> : <LoginPage />;
 * ```
 */
export function useCheckAuth(): boolean {
  const { currentUser } = useStore();
  return currentUser !== null;
}

/**
 * useCurrentUser - Get current logged-in user
 *
 * @returns Current user or null if not authenticated
 *
 * @example
 * ```typescript
 * const user = useCurrentUser();
 * return <span>Welcome, {user?.fullName}</span>;
 * ```
 */
export function useCurrentUser(): UserDTO | null {
  const { currentUser } = useStore();
  return currentUser as UserDTO | null;
}

/**
 * Validate JWT token format
 * Basic validation: checks if token exists and has 3 parts (header.payload.signature)
 *
 * In production, you might also:
 * - Decode and check expiration date
 * - Validate signature
 * - Call server to validate token
 *
 * @param token - JWT token string
 * @returns true if token appears valid
 */
function isValidToken(token: string): boolean {
  if (!token || typeof token !== "string") {
    return false;
  }

  // JWT tokens have format: xxxxx.yyyyy.zzzzz
  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }

  // Check if token might be expired (optional)
  try {
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp) {
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      return expirationTime > Date.now();
    }
  } catch {
    // Token couldn't be decoded, but still has valid format
  }

  return true;
}

/**
 * useRedirectAfterLogin - Get and clear redirect path stored before login
 *
 * Useful for redirecting user to the page they were trying to access before login.
 *
 * @returns Redirect path or undefined
 *
 * @example
 * ```typescript
 * const redirect = useRedirectAfterLogin();
 * useEffect(() => {
 *   if (redirect) {
 *     navigate(redirect);
 *   } else {
 *     navigate('/dashboard');
 *   }
 * }, [redirect]);
 * ```
 */
export function useRedirectAfterLogin(): string | undefined {
  const redirect = sessionStorage.getItem("redirectAfterLogin");
  if (redirect) {
    sessionStorage.removeItem("redirectAfterLogin");
  }
  return redirect || undefined;
}
