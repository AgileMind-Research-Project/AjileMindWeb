/**
 * Change Password Page
 * 
 * For first-time login or user-initiated password change
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePasswordChangeRequired } from '@/lib/store/auth.store';
import { validatePassword } from '@/lib/utils/password.utils';
import { authApi } from '@/lib/api/auth.api';
import { Eye, EyeOff, Lock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { changePassword, loading } = useAuth();
  const passwordChangeRequired = usePasswordChangeRequired();

  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [currentPasswordValid, setCurrentPasswordValid] = useState<boolean | null>(null);
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  const passwordValidation = validatePassword(formData.new_password);

  // Debounced current password verification
  useEffect(() => {
    // Only verify if password has actual content (not empty or whitespace)
    if (!formData.current_password || formData.current_password.trim().length === 0) {
      setCurrentPasswordValid(null);
      setVerifyingPassword(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setVerifyingPassword(true);
        const response = await authApi.verifyCurrentPassword(formData.current_password);
        setCurrentPasswordValid(response.data.is_valid);
      } catch (error) {
        console.error('Error verifying password:', error);
        setCurrentPasswordValid(null);
      } finally {
        setVerifyingPassword(false);
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [formData.current_password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear errors when user types
    setErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted', {
      current_password: formData.current_password ? '***' : 'empty',
      new_password: formData.new_password ? '***' : 'empty',
      new_password_confirmation: formData.new_password_confirmation ? '***' : 'empty'
    });

    // Clear previous errors
    setErrors([]);
    const validationErrors: string[] = [];

    // Validate current password
    if (!formData.current_password) {
      validationErrors.push('Current password is required');
    } else if (currentPasswordValid === false) {
      validationErrors.push('Current password is incorrect');
    } else if (currentPasswordValid === null) {
      validationErrors.push('Please wait for current password verification');
    }

    // Validate new password
    if (!passwordValidation.isValid) {
      validationErrors.push('New password does not meet requirements');
    }

    // Validate password confirmation
    if (formData.new_password !== formData.new_password_confirmation) {
      validationErrors.push('New passwords do not match');
    }

    // Validate new password is different from current
    if (formData.current_password === formData.new_password) {
      validationErrors.push('New password must be different from current password');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      console.log('Validation errors:', validationErrors);
      toast.error('Please fix the validation errors');
      return;
    }

    try {
      console.log('Calling changePassword...');
      toast.loading('Changing password...');
      await changePassword(formData);
      // Redirect handled in hook
    } catch (error) {
      console.error('Submit error:', error);
      // Error handled in hook
    }
  };

  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-sm ${met ? 'text-green-600' : 'text-gray-500'}`}>
      {met ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Change Password</h1>
          {passwordChangeRequired && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-medium text-yellow-800">Password change required</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    For security reasons, you must change your password before continuing.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Validation Errors */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index} className="text-sm text-red-700">{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* Current Password */}
            <div>
              <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  id="current_password"
                  name="current_password"
                  value={formData.current_password}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-24 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    currentPasswordValid === true ? 'border-green-500' : 
                    currentPasswordValid === false ? 'border-red-500' : 
                    'border-gray-300'
                  }`}
                  placeholder="Enter your current password"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  {verifyingPassword && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  )}
                  {!verifyingPassword && currentPasswordValid === true && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {!verifyingPassword && currentPasswordValid === false && (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              {currentPasswordValid === false && !verifyingPassword && (
                <p className="mt-2 text-sm text-red-600">Current password is incorrect</p>
              )}
              {currentPasswordValid === true && !verifyingPassword && (
                <p className="mt-2 text-sm text-green-600">Current password verified ✓</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="new_password"
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleChange}
                  onFocus={() => setPasswordFocused(true)}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Requirements */}
              {passwordFocused && (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">Password must contain:</p>
                  <PasswordRequirement
                    met={passwordValidation.requirements.minLength}
                    text="At least 8 characters"
                  />
                  <PasswordRequirement
                    met={passwordValidation.requirements.hasUppercase}
                    text="One uppercase letter"
                  />
                  <PasswordRequirement
                    met={passwordValidation.requirements.hasLowercase}
                    text="One lowercase letter"
                  />
                  <PasswordRequirement
                    met={passwordValidation.requirements.hasNumber}
                    text="One number"
                  />
                  <PasswordRequirement
                    met={passwordValidation.requirements.hasSymbol}
                    text="One symbol (!@#$%^&*)"
                  />
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="new_password_confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="new_password_confirmation"
                  name="new_password_confirmation"
                  value={formData.new_password_confirmation}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Re-enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.new_password_confirmation && formData.new_password !== formData.new_password_confirmation && (
                <p className="mt-2 text-sm text-red-600">Passwords do not match</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              onClick={() => console.log('Change Password button clicked', { 
                loading,
                currentPasswordValid,
                isValid: passwordValidation.isValid,
                passwordsMatch: formData.new_password === formData.new_password_confirmation
              })}
              disabled={
                loading || 
                verifyingPassword ||
                currentPasswordValid !== true ||
                !passwordValidation.isValid || 
                formData.new_password !== formData.new_password_confirmation
              }
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Back */}
        {!passwordChangeRequired && (
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
