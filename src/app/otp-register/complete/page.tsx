/**
 * Complete Registration Page - Step 3: Company Info & Password
 * Final step after OTP verification
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Lock, Eye, EyeOff, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-sm font-medium ${met ? 'text-green-600' : 'text-gray-500'}`}>
        {met ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
        <span>{text}</span>
    </div>
);

export default function CompleteRegistrationPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [formData, setFormData] = useState({
        password: '',
        password_confirmation: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Check for verification token
        const token = sessionStorage.getItem('verification_token');
        const storedEmail = sessionStorage.getItem('otp_email');
        const storedCompanyName = sessionStorage.getItem('otp_company_name');

        if (!token) {
            router.push('/otp-register');
            return;
        }

        if (storedEmail) {
            setEmail(storedEmail);
        }
        
        if (storedCompanyName) {
            setCompanyName(storedCompanyName);
        }
    }, [router]);

    const validatePassword = (password: string) => {
        return {
            minLength: password.length >= 8,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        };
    };

    const passwordValidation = validatePassword(formData.password);
    const isPasswordValid = Object.values(passwordValidation).every(Boolean);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isPasswordValid) {
            setError('Password does not meet requirements');
            return;
        }

        if (formData.password !== formData.password_confirmation) {
            setError('Passwords do not match');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const verificationToken = sessionStorage.getItem('verification_token');

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/otp/complete-registration`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    verification_token: verificationToken,
                    company_name: companyName,
                    password: formData.password,
                    password_confirmation: formData.password_confirmation,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            // Clear session storage
            sessionStorage.removeItem('verification_token');
            sessionStorage.removeItem('otp_email');
            sessionStorage.removeItem('otp_company_name');

            // Store tokens
            localStorage.setItem('access_token', data.data.tokens.access_token);
            localStorage.setItem('refresh_token', data.data.tokens.refresh_token);

            // Show success message and redirect
            alert('Registration completed successfully! Welcome to AgileMind.');
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-b from-blue-50 via-white to-blue-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">AgileMind Platform</h1>
                                <p className="text-sm text-gray-600">Complete Your Registration</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-lg">
                    {/* Icon and Title */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-6 shadow-lg">
                            <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">
                            Email Verified Successfully!
                        </h2>
                        <p className="text-lg text-gray-600 mb-2">
                            <span className="font-bold text-blue-600">{companyName}</span>
                        </p>
                        <p className="text-base font-medium text-gray-600">
                            {email}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Set your password to complete registration
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-base font-semibold text-gray-700 mb-2">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onFocus={() => setPasswordFocused(true)}
                                    className="w-full px-4 py-3 pl-12 pr-12 text-base bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 placeholder-gray-400 transition-all"
                                    placeholder="Create a strong password"
                                    required
                                    disabled={loading}
                                />
                                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="password-confirmation" className="block text-base font-semibold text-gray-700 mb-2">
                                Confirm Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="password-confirmation"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="password_confirmation"
                                    value={formData.password_confirmation}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 pl-12 pr-12 text-base bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 placeholder-gray-400 transition-all"
                                    placeholder="Re-enter your password"
                                    required
                                    disabled={loading}
                                />
                                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {formData.password_confirmation && formData.password !== formData.password_confirmation && (
                                <p className="mt-2 text-sm text-red-500 font-semibold">Passwords do not match</p>
                            )}
                        </div>

                        {/* Password Requirements */}
                        {passwordFocused && (
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm font-bold text-gray-800 mb-3">Password Requirements:</p>
                                <div className="space-y-2">
                                    <PasswordRequirement met={passwordValidation.minLength} text="At least 8 characters" />
                                    <PasswordRequirement met={passwordValidation.hasUppercase} text="One uppercase letter" />
                                    <PasswordRequirement met={passwordValidation.hasLowercase} text="One lowercase letter" />
                                    <PasswordRequirement met={passwordValidation.hasNumber} text="One number" />
                                    <PasswordRequirement met={passwordValidation.hasSymbol} text="One special character" />
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800 font-medium">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={
                                !isPasswordValid ||
                                formData.password !== formData.password_confirmation ||
                                loading
                            }
                            className="w-full px-6 py-3 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    Complete Registration
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-gray-200 py-4">
                <div className="max-w-7xl mx-auto px-6">
                    <p className="text-center text-sm text-gray-600">
                        © 2025 AgileMind Platform. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
