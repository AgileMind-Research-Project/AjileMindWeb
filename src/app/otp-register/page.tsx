/**
 * OTP Registration Page - Step 1: Email Entry
 * Passwordless registration using email OTP verification
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight, Building2, Loader2 } from 'lucide-react';

export default function OTPRegisterPage() {
    const router = useRouter();
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!companyName.trim()) {
            setError('Please enter your company name');
            return;
        }
        
        if (!isValidEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }
        
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/otp/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send OTP');
            }

            // Store token and data in session storage
            sessionStorage.setItem('otp_token', data.data.token);
            sessionStorage.setItem('otp_email', email);
            sessionStorage.setItem('otp_company_name', companyName);

            // Navigate to OTP verification page
            router.push('/otp-register/verify');
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
                                <p className="text-sm text-gray-600">Passwordless Registration</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/')}
                            className="text-base text-gray-700 hover:text-blue-600 font-semibold transition-colors"
                        >
                            ← Back to Home
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-lg">
                    {/* Icon and Title */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-6 shadow-lg">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">
                            Get Started with AgileMind
                        </h2>
                        <p className="text-lg text-gray-600">
                            Passwordless registration - Quick and secure
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Company Name */}
                        <div>
                            <label htmlFor="company-name" className="block text-base font-semibold text-gray-700 mb-2">
                                Company Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="company-name"
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full px-4 py-3 text-base bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 placeholder-gray-400 transition-all"
                                placeholder="Enter company name"
                                required
                                autoFocus
                                disabled={loading}
                            />
                            <p className="mt-2 text-sm text-gray-500">This will be your workspace identifier</p>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email-input" className="block text-base font-semibold text-gray-700 mb-2">
                                Administrator Email <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="email-input"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 pl-12 text-base bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 placeholder-gray-400 transition-all"
                                    placeholder="admin@company.com"
                                    required
                                    disabled={loading}
                                />
                                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                                We'll send a 6-digit verification code to this email
                            </p>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800 font-medium">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!companyName.trim() || !isValidEmail(email) || loading}
                            className="w-full px-6 py-3 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Sending Code...
                                </>
                            ) : (
                                <>
                                    Continue
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Alternative */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <button
                                onClick={() => router.push('/login')}
                                className="text-blue-600 hover:text-blue-700 font-semibold"
                            >
                                Sign in
                            </button>
                        </p>
                        <p className="text-sm text-gray-600 mt-3">
                            Prefer traditional signup?{' '}
                            <button
                                onClick={() => router.push('/register')}
                                className="text-blue-600 hover:text-blue-700 font-semibold"
                            >
                                Register with password
                            </button>
                        </p>
                    </div>
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
