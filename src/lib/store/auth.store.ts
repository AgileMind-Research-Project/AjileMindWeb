/**
 * Authentication Store (Zustand)
 * 
 * Global state management for authentication
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/lib/config/api.config';

export interface User {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  tenant_id: string;
  tenant_name: string | null;
  status?: string;
}

export interface Tenant {
  tenant_id: string;
  company_name: string;
  status?: string;
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  passwordChangeRequired: boolean;
  _hasHydrated: boolean; // Track if store has been hydrated from localStorage
  
  // Actions
  setAuth: (user: User, tenant: Tenant | null, accessToken: string, refreshToken: string, passwordChangeRequired?: boolean) => void;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (updates: Partial<User>) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      passwordChangeRequired: false,
      _hasHydrated: false,

      setAuth: (user, tenant, accessToken, refreshToken, passwordChangeRequired = false) => {
        set({
          user,
          tenant,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          passwordChangeRequired,
        });
      },

      setUser: (user) => {
        set({ user, isAuthenticated: true });
      },

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
      },

      clearAuth: () => {
        set({
          user: null,
          tenant: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          passwordChangeRequired: false,
        });
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        passwordChangeRequired: state.passwordChangeRequired,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Helper hooks
export const useUser = () => useAuthStore((state) => state.user);
export const useTenant = () => useAuthStore((state) => state.tenant);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const usePasswordChangeRequired = () => useAuthStore((state) => state.passwordChangeRequired);
export const useHasHydrated = () => useAuthStore((state) => state._hasHydrated);
