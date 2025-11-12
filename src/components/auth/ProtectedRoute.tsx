/**
 * Protected Route Component
 * 
 * Wrapper component to protect routes that require authentication
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, usePasswordChangeRequired, useHasHydrated } from '@/lib/store/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/login',
}) => {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const passwordChangeRequired = usePasswordChangeRequired();
  const hasHydrated = useHasHydrated();

  useEffect(() => {
    // Wait for store to hydrate from localStorage before checking auth
    if (!hasHydrated) return;

    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo);
    } else if (isAuthenticated && passwordChangeRequired) {
      // Redirect to change password if required
      router.push('/auth/change-password');
    }
  }, [isAuthenticated, passwordChangeRequired, hasHydrated, requireAuth, redirectTo, router]);

  // Show loading state while hydrating
  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and auth is required, don't render children
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
