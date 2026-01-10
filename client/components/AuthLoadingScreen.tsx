/**
 * Auth Loading Screen Component
 *
 * Displayed while the app is checking authentication status on startup.
 * This prevents flashing the login page while checking for a valid token.
 *
 * Timeline:
 * 1. App mounts
 * 2. useAuthInitialize hook checks localStorage
 * 3. This component is shown while checking
 * 4. Once auth check is complete, proper page is rendered
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

interface AuthLoadingScreenProps {
  message?: string;
}

/**
 * AuthLoadingScreen Component
 *
 * Simple, professional loading indicator shown during auth check.
 * Prevents flickering between pages during authentication verification.
 */
export function AuthLoadingScreen({
  message = 'Loading authentication...',
}: AuthLoadingScreenProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Animated Loading Spinner */}
        <Loader2 className="h-12 w-12 animate-spin text-primary" />

        {/* Loading Message */}
        <div>
          <p className="text-lg font-medium text-foreground">{message}</p>
          <p className="mt-2 text-sm text-muted-foreground">Please wait...</p>
        </div>
      </div>
    </div>
  );
}
