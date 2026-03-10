/**
 * Login Page (AgileMind Platform)
 * 
 * User login form - redirects to dashboard or password change
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(formData);
      // Redirect handled in hook
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{
      background: 'linear-gradient(135deg, var(--am-primary-50) 0%, #FFFFFF 50%, var(--am-secondary-50) 100%)'
    }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ backgroundColor: 'var(--am-primary)' }}>
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--am-primary)' }}>AgileMind Platform</h1>
          <p style={{ color: 'var(--am-text-secondary)' }}>Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="rounded-2xl p-8" style={{
          backgroundColor: 'white',
          boxShadow: 'var(--am-shadow-lg)',
          border: '1px solid var(--am-border)'
        }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: 'var(--am-text-primary)' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--am-text-muted)' }} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all duration-200 outline-none"
                  style={{
                    border: '1.5px solid var(--am-border)',
                    color: 'var(--am-text-primary)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--am-primary)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--am-border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="your.email@company.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: 'var(--am-text-primary)' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--am-text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-12 py-3 rounded-xl text-sm transition-all duration-200 outline-none"
                  style={{
                    border: '1.5px solid var(--am-border)',
                    color: 'var(--am-text-primary)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--am-primary)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--am-border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--am-text-muted)' }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.push('/auth/forgot-password')}
                className="text-sm font-semibold transition-colors"
                style={{ color: 'var(--am-primary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--am-primary-dark)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--am-primary)'; }}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: loading ? 'var(--am-text-muted)' : 'var(--am-primary)',
                boxShadow: loading ? 'none' : '0 4px 14px 0 rgba(37, 99, 235, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'var(--am-primary-dark)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'var(--am-primary)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p style={{ color: 'var(--am-text-secondary)' }}>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => router.push('/register')}
                className="font-semibold transition-colors"
                style={{ color: 'var(--am-primary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--am-primary-dark)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--am-primary)'; }}
              >
                Create Account
              </button>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="transition-colors text-sm"
            style={{ color: 'var(--am-text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--am-text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--am-text-secondary)'; }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
