/**
 * OTP Verification Page - Step 2: Enter OTP Code
 * Verify the 6-digit OTP code sent to email
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight, Shield, Loader2, RefreshCw } from 'lucide-react';

export default function VerifyOTPPage() {
    const router = useRouter();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resending, setResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [email, setEmail] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Get email and token from session storage
        const storedEmail = sessionStorage.getItem('otp_email');
        const token = sessionStorage.getItem('otp_token');

        if (!storedEmail || !token) {
            router.push('/otp-register');
            return;
        }

        setEmail(storedEmail);
    }, [router]);

    useEffect(() => {
        // Cooldown timer
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        
        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = [...otp];
        for (let i = 0; i < pastedData.length; i++) {
            newOtp[i] = pastedData[i];
        }
        setOtp(newOtp);

        // Focus the next empty input or last input
        const nextIndex = Math.min(pastedData.length, 5);
        inputRefs.current[nextIndex]?.focus();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const token = sessionStorage.getItem('otp_token');
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/otp/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    otp: otpString,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Invalid OTP');
            }

            // Store verification token
            sessionStorage.setItem('verification_token', data.data.verification_token);
            sessionStorage.removeItem('otp_token');

            // Navigate to password setup page
            router.push('/otp-register/complete');
        } catch (err: any) {
            setError(err.message || 'Invalid OTP. Please try again.');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendCooldown > 0) return;

        setResending(true);
        setError('');

        try {
            const token = sessionStorage.getItem('otp_token');
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/otp/resend-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to resend OTP');
            }

            // Update token
            sessionStorage.setItem('otp_token', data.data.token);
            setResendCooldown(60); // 60 seconds cooldown
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } catch (err: any) {
            setError(err.message || 'Failed to resend OTP. Please try again.');
        } finally {
            setResending(false);
        }
    };

    const maskEmail = (email: string) => {
        if (!email) return '';
        const [username, domain] = email.split('@');
        if (username.length <= 2) {
            return username[0] + '*'.repeat(username.length - 1) + '@' + domain;
        }
        return username[0] + '*'.repeat(username.length - 2) + username.at(-1) + '@' + domain;
    };

    return (
        <div className="min-h-screen bg-linear-to-b from-blue-50 via-white to-blue-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">AgileMind Platform</h1>
                                <p className="text-sm text-gray-600">Verify Your Email</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/otp-register')}
                            className="text-base text-gray-700 hover:text-blue-600 font-semibold transition-colors"
                        >
                            ← Change Email
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    {/* Icon and Title */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-6 shadow-lg">
                            <Mail className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">
                            Check Your Email
                        </h2>
                        <p className="text-lg text-gray-600 mb-2">
                            We sent a 6-digit code to
                        </p>
                        <p className="text-lg font-semibold text-blue-600">
                            {maskEmail(email)}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="otp-0" className="block text-base font-semibold text-gray-700 mb-4 text-center">
                                Enter Verification Code
                            </label>
                            <div className="flex gap-2 justify-center">
                                {otp.map((digit, index) => (
                                    <input
                                        key={`otp-input-${index}`}
                                        id={`otp-${index}`}
                                        ref={(el) => { inputRefs.current[index] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        onPaste={handlePaste}
                                        className="w-14 h-14 text-center text-2xl font-bold bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 transition-all"
                                        disabled={loading}
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>
                            <p className="mt-4 text-sm text-gray-500 text-center">
                                Code expires in 5 minutes
                            </p>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800 font-medium text-center">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={otp.join('').length !== 6 || loading}
                            className="w-full px-6 py-3 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    Verify Code
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Resend */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600 mb-3">
                            Didn't receive the code?
                        </p>
                        <button
                            onClick={handleResendOTP}
                            disabled={resending || resendCooldown > 0}
                            className="text-blue-600 hover:text-blue-700 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                        >
                            {(() => {
                                if (resending) {
                                    return (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Resending...
                                        </>
                                    );
                                }
                                if (resendCooldown > 0) {
                                    return <>Resend in {resendCooldown}s</>;
                                }
                                return (
                                    <>
                                        <RefreshCw className="w-4 h-4" />
                                        Resend Code
                                    </>
                                );
                            })()}
                        </button>
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
