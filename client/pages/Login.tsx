/**
 * Login Page Component
 *
 * Handles user authentication with username and password.
 * After successful login:
 * - Token is stored in localStorage
 * - User data is stored in localStorage
 * - User is redirected to dashboard or previous page
 *
 * Error Handling:
 * - Invalid credentials: Show error message
 * - Network errors: Show connection message
 * - Server errors: Show generic error
 *
 * Security:
 * - Password field is masked
 * - Token is stored securely (HttpOnly cookies recommended in production)
 * - HTTPS required in production
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "@/hooks/useUsers";
import { useAuthActions } from "@/hooks/useAuth";
import { useCheckAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Login Form Data
 * Holds username and password from form inputs
 */
interface LoginFormData {
  username: string;
  password: string;
}

/**
 * LoginPage Component
 *
 * Features:
 * - Form validation (required fields)
 * - Real-time error display
 * - Loading state during API call
 * - Automatic redirect on successful login
 * - Redirect to previous page if available
 *
 * @example
 * Usage in routes:
 *   <Route path="/login" element={<LoginPage />} />
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useCheckAuth();
  const { login: storeLogin } = useAuthActions();
  const { mutate: login, isPending, error } = useLogin();

  // Form state
  const [formData, setFormData] = useState<LoginFormData>({
    username: "admin",
    password: "Admin@123",
    // username: "",
    // password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Partial<LoginFormData>
  >({});

  /**
   * Redirect to dashboard if already authenticated
   * Prevents authenticated users from accessing login page
   */
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  /**
   * Validate form inputs before submission
   * @returns true if form is valid
   */
  const validateForm = (): boolean => {
    const errors: Partial<LoginFormData> = {};

    if (!formData.username.trim()) {
      errors.username = "Username is required";
    }
    if (!formData.password.trim()) {
      errors.password = "Password is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   * Validates form, sends login request, stores token, and redirects
   */
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate before API call
    if (!validateForm()) {
      return;
    }

    // Send login request
    login(
      {
        username: formData.username,
        password: formData.password,
      },
      {
        onSuccess: (response) => {
          // Store token and user data
          storeLogin(response.data);

          // Get redirect path or default to dashboard
          const redirectPath =
            sessionStorage.getItem("redirectAfterLogin") || "/";
          sessionStorage.removeItem("redirectAfterLogin");

          // Navigate to dashboard or previous page
          navigate(redirectPath);
        },
        // onError is handled by displaying error message below
      },
    );
  };

  /**
   * Handle input changes
   * Updates form state and clears validation errors for that field
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error for this field when user starts typing
    if (validationErrors[name as keyof LoginFormData]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  /**
   * Get error message from API error
   * Shows either validation errors or general error message
   */
  const getErrorMessage = (): string | null => {
    if (!error) return null;

    // Check for specific error messages
    if (
      error.message.includes("Unauthorized") ||
      error.message.includes("invalid")
    ) {
      return "Invalid username or password";
    }

    // Return generic user-friendly message
    return error.userMessage;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Sign In</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your credentials to access the system
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>
              Pharmaceutical Distributor Management System
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{getErrorMessage()}</AlertDescription>
                </Alert>
              )}

              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={isPending}
                  className={cn(
                    "w-full",
                    validationErrors.username &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                  autoFocus
                  autoComplete="username"
                />
                {validationErrors.username && (
                  <p className="text-xs text-destructive">
                    {validationErrors.username}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isPending}
                    className={cn(
                      "w-full pr-10",
                      validationErrors.password &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-xs text-destructive">
                    {validationErrors.password}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isPending}
                size="lg"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? "Signing in..." : "Sign In"}
              </Button>

              {/* Development Info */}
              {/* {import.meta.env.DEV && (
                <div className="rounded-md bg-secondary p-3 text-xs text-secondary-foreground">
                  <p className="font-semibold mb-1">Development Mode</p>
                  <p>API Base URL: https://mds.vtoxi.com</p>
                  <p>Tokens stored in localStorage</p>
                </div>
              )} */}
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>© 2025 Pharmaceutical Distributor Management System</p>
        </div>
      </div>
    </div>
  );
}
