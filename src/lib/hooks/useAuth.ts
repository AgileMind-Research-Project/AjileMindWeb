/**
 * Authentication Hook
 * 
 * Custom hook for authentication operations
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { authApi, type LoginRequest, type TenantRegisterRequest, type ChangePasswordRequest } from '@/lib/api/auth.api';
import { PLATFORM_URLS } from '@/lib/config/api.config';
import { showSuccessAlert, showErrorAlert } from '@/lib/utils/toast.utils';

export const useAuth = () => {
  const router = useRouter();
  const { setAuth, clearAuth, user, isAuthenticated, passwordChangeRequired } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const registerTenant = async (data: TenantRegisterRequest) => {
    setLoading(true);
    try {
      const response = await authApi.registerTenant(data);
      
      const { user: userData, tokens, redirect_url } = response.data;
      
      // Store auth data
      setAuth(
        {
          user_id: userData.user_id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          tenant_id: response.data.tenant_id,
          tenant_name: response.data.company_name,
        },
        {
          tenant_id: response.data.tenant_id,
          company_name: response.data.company_name,
        },
        tokens.access_token,
        tokens.refresh_token,
        false
      );
      
      showSuccessAlert('Account created successfully! Redirecting to dashboard...');
      
      // Redirect to AgileMind Platform
      setTimeout(() => {
        window.location.href = redirect_url || `${PLATFORM_URLS.AGILEMIND}/dashboard`;
      }, 1000);
      
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      showErrorAlert(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: LoginRequest) => {
    setLoading(true);
    try {
      const response = await authApi.login(data);
      
      const { user: userData, tokens, password_change_required } = response.data;
      
      // Store auth data
      setAuth(
        userData,
        userData.tenant_id ? {
          tenant_id: userData.tenant_id,
          company_name: userData.tenant_name || '',
        } : null,
        tokens.access_token,
        tokens.refresh_token,
        password_change_required
      );
      
      showSuccessAlert('Login successful!');
      
      // Redirect based on password change requirement
      if (password_change_required) {
        router.push('/auth/change-password');
      } else {
        router.push('/dashboard');
      }
      
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      showErrorAlert(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authApi.logout();
      clearAuth();
      showSuccessAlert('Logged out successfully');
      router.push('/login');
    } catch (error) {
      // Clear auth even if API call fails
      clearAuth();
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (data: ChangePasswordRequest) => {
    setLoading(true);
    try {
      console.log('Attempting to change password...', { 
        current_password: data.current_password ? '***' : 'empty',
        new_password: data.new_password ? '***' : 'empty',
        new_password_confirmation: data.new_password_confirmation ? '***' : 'empty'
      });
      
      const response = await authApi.changePassword(data);
      console.log('Password change response:', response);
      
      showSuccessAlert('Password changed successfully!');
      
      // Update password change required status
      setAuth(
        user!,
        useAuthStore.getState().tenant,
        useAuthStore.getState().accessToken!,
        useAuthStore.getState().refreshToken!,
        false
      );
      
      router.push('/dashboard');
      return response;
    } catch (error: any) {
      console.error('Password change error:', error);
      console.error('Error response:', error.response);
      
      // Try to extract error message from different possible locations
      const errorMessage = 
        error.response?.data?.detail || 
        error.response?.data?.message || 
        error.message ||
        'Failed to change password.';
      
      showErrorAlert(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      showSuccessAlert('Password reset link sent to your email');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset email.';
      showErrorAlert(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string, confirmPassword: string) => {
    setLoading(true);
    try {
      await authApi.resetPassword({
        token,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });
      showSuccessAlert('Password reset successfully! Please login.');
      router.push('/login');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reset password.';
      showErrorAlert(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    isAuthenticated,
    passwordChangeRequired,
    loading,
    registerTenant,
    login,
    logout,
    changePassword,
    forgotPassword,
    resetPassword,
  };
};
