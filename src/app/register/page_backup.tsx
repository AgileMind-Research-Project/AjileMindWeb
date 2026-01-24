/**
 * Professional Multi-Step Registration Wizard
 * Clean, compact design with official blue theme
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { validatePassword } from '@/lib/utils/password.utils';
import TermsModal from './TermsModal';
import PrivacyModal from './PrivacyModal';
import {
    Eye,
    EyeOff,
    Building2,
    Mail,
    Lock,
    CheckCircle,
    XCircle,
    ArrowRight,
    ArrowLeft,
    FileText,
    Shield,
    Check,
    Loader2,
    Zap
} from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const { registerTenant, loading } = useAuth();

    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 5;

    const [formData, setFormData] = useState({
        company_name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [termsScrolledToBottom, setTermsScrolledToBottom] = useState(false);
    const [privacyScrolledToBottom, setPrivacyScrolledToBottom] = useState(false);

    // OTP-related states
    const [otpToken, setOtpToken] = useState('');
    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
    const [otpError, setOtpError] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    const passwordValidation = validatePassword(formData.password);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleNext = async () => {
        if (currentStep === 1 && !formData.company_name.trim()) {
            alert('Please enter your company name');
            return;
        }
        if (currentStep === 2 && !formData.email.trim()) {
            alert('Please enter your email address');
            return;
        }

        // Send OTP when moving from email step
        /* 
        if (currentStep === 2) {
            await sendOTP();
            return; // sendOTP will handle step transition
        }
        */

        // Skip step 3 (OTP) validation here as it's handled by verifyOTP

        if (currentStep === 4) {
            if (!passwordValidation.isValid) {
                alert('Password does not meet requirements');
                return;
            }
            if (formData.password !== formData.password_confirmation) {
                alert('Passwords do not match');
                return;
            }
        }
        if (currentStep === 5 && (!termsAccepted || !privacyAccepted)) {
            alert('Please accept both Terms & Conditions and Privacy Policy');
            return;
        }
        setCurrentStep(currentStep + 1);
    };

    const handleBack = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async () => {
        try {
            await registerTenant(formData);
        } catch (error) {
            // Error handled in hook
        }
    };

    const handleTermsScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const element = e.currentTarget;
        const isScrolledToBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
        setTermsScrolledToBottom(isScrolledToBottom);
    };

    const handlePrivacyScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const element = e.currentTarget;
        const isScrolledToBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
        setPrivacyScrolledToBottom(isScrolledToBottom);
    };

    const openTermsModal = () => {
        setShowTermsModal(true);
        setTermsScrolledToBottom(false);
    };

    const openPrivacyModal = () => {
        setShowPrivacyModal(true);
        setPrivacyScrolledToBottom(false);
    };

    const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
        <div className={`flex items-center gap-2 text-sm font-medium ${met ? 'text-green-600' : 'text-gray-500'}`}>
            {met ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{text}</span>
        </div>
    );

    const ProgressBar = () => (
        <div className="w-full max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base border-3 ${step < currentStep
                                    ? 'bg-white border-white text-blue-600'
                                    : step === currentStep
                                        ? 'bg-white border-white text-blue-600'
                                        : 'bg-blue-500 border-blue-400 text-blue-200'
                                    }`}
                            >
                                {step < currentStep ? <Check className="w-6 h-6" /> : step}
                            </div>
                            <span className={`text-sm mt-2 font-semibold ${step === currentStep ? 'text-white' : 'text-blue-200'}`}>
                                {step === 1 && 'Company'}
                                {step === 2 && 'Email'}
                                {step === 3 && 'Password'}
                                {step === 4 && 'Review'}
                            </span>
                        </div>
                        {step < 4 && (
                            <div className="flex-1 h-1 mx-3 bg-blue-500 rounded-full">
                                <div
                                    className={`h-full rounded-full ${step < currentStep ? 'bg-white' : 'bg-blue-500'}`}
                                    style={{ width: step < currentStep ? '100%' : '0%' }}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

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
                                <p className="text-sm text-gray-600">Create Your Account</p>
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

            {/* Progress Indicator */}
            <div className="bg-white border-b border-gray-100 py-4 px-6">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-between">
                        {[1, 2, 3, 4].map((step) => (
                            <div key={step} className="flex items-center flex-1">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step < currentStep
                                            ? 'bg-green-500 text-white'
                                            : step === currentStep
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-500'
                                            }`}
                                    >
                                        {step < currentStep ? <Check className="w-5 h-5" /> : step}
                                    </div>
                                    <span className={`text-sm mt-1.5 font-semibold ${step === currentStep ? 'text-blue-600' : 'text-gray-500'}`}>
                                        {step === 1 && 'Company'}
                                        {step === 2 && 'Email'}
                                        {step === 3 && 'Password'}
                                        {step === 4 && 'Confirm'}
                                    </span>
                                </div>
                                {step < 4 && (
                                    <div className="flex-1 h-0.5 mx-2 bg-gray-200 rounded-full">
                                        <div
                                            className={`h-full rounded-full transition-all ${step < currentStep ? 'bg-green-500' : 'bg-gray-200'}`}
                                            style={{ width: step < currentStep ? '100%' : '0%' }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-6 py-8">
                {/* Step 1: Company Name */}
                {currentStep === 1 && (
                    <div className="w-full max-w-lg mx-auto">
                        {/* Passwordless Option - Featured */}
                        <div className="mb-8 p-6 bg-linear-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg border-2 border-blue-500">
                            <div className="flex items-start gap-4">
                                <div className="shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                                    <Zap className="w-7 h-7 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-xl font-bold text-white">Passwordless Registration</h3>
                                        <span className="px-2 py-0.5 bg-green-400 text-green-900 text-xs font-bold rounded-full">FAST</span>
                                    </div>
                                    <p className="text-blue-100 text-base mb-4">
                                        Quick signup with email verification - No password needed!
                                    </p>
                                    <button
                                        onClick={() => router.push('/otp-register')}
                                        className="w-full px-6 py-3 bg-white text-blue-600 text-base font-bold rounded-lg hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-md"
                                    >
                                        <Zap className="w-5 h-5" />
                                        Sign Up with Email OTP
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="relative mb-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-blue-50 text-gray-600 font-semibold">Or continue with traditional registration</span>
                            </div>
                        </div>

                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl mb-4">
                                <Building2 className="w-7 h-7 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Company Information</h2>
                            <p className="text-lg text-gray-600">Let's start with your organization name</p>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-base font-semibold text-gray-700 mb-2">
                                    Company Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 text-base bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 placeholder-gray-400 transition-all"
                                    placeholder="Enter company name"
                                    autoFocus
                                />
                                <p className="mt-2 text-sm text-gray-500">This will be your workspace identifier</p>
                            </div>

                            <button
                                onClick={handleNext}
                                disabled={!formData.company_name.trim()}
                                className="w-full px-6 py-3 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                Continue
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Email */}
                {currentStep === 2 && (
                    <div className="w-full max-w-lg mx-auto">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl mb-4">
                                <Mail className="w-7 h-7 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Administrator Email</h2>
                            <p className="text-lg text-gray-600">
                                Primary email for <span className="text-blue-600 font-bold">{formData.company_name}</span>
                            </p>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-base font-semibold text-gray-700 mb-2">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 text-base bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 placeholder-gray-400 transition-all"
                                    placeholder="admin@company.com"
                                    autoFocus
                                />
                                <p className="mt-2 text-sm text-gray-500">You'll use this email to sign in</p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleBack}
                                    className="px-5 py-3 border border-gray-300 text-gray-700 text-base font-semibold rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={!formData.email.trim() || !formData.email.includes('@')}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    Continue
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Password */}
                {currentStep === 3 && (
                    <div className="w-full max-w-lg mx-auto">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl mb-4">
                                <Lock className="w-7 h-7 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Secure Your Account</h2>
                            <p className="text-lg text-gray-600">Create a strong password</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-base font-semibold text-gray-700 mb-2">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        onFocus={() => setPasswordFocused(true)}
                                        className="w-full px-4 py-3 pr-12 text-base bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 placeholder-gray-400 transition-all"
                                        placeholder="Enter password"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-base font-semibold text-gray-700 mb-2">
                                    Confirm Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="password_confirmation"
                                        value={formData.password_confirmation}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 pr-12 text-base bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 placeholder-gray-400 transition-all"
                                        placeholder="Re-enter password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {formData.password_confirmation && formData.password !== formData.password_confirmation && (
                                    <p className="mt-2 text-sm text-red-500 font-semibold">Passwords do not match</p>
                                )}
                            </div>

                            {passwordFocused && (
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-sm font-bold text-gray-800 mb-3">Password Requirements:</p>
                                    <div className="space-y-2">
                                        <PasswordRequirement met={passwordValidation.requirements.minLength} text="At least 8 characters" />
                                        <PasswordRequirement met={passwordValidation.requirements.hasUppercase} text="One uppercase letter" />
                                        <PasswordRequirement met={passwordValidation.requirements.hasLowercase} text="One lowercase letter" />
                                        <PasswordRequirement met={passwordValidation.requirements.hasNumber} text="One number" />
                                        <PasswordRequirement met={passwordValidation.requirements.hasSymbol} text="One special character" />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleBack}
                                    className="px-5 py-3 border border-gray-300 text-gray-700 text-base font-semibold rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={!passwordValidation.isValid || formData.password !== formData.password_confirmation}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    Continue
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Terms & Privacy */}
                {currentStep === 4 && (
                    <div className="w-full max-w-lg mx-auto">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl mb-4">
                                <FileText className="w-7 h-7 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Terms & Privacy</h2>
                            <p className="text-lg text-gray-600">Please review and accept</p>
                        </div>

                        <div className="space-y-4">
                            {/* Terms */}
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        <h3 className="text-base font-bold text-gray-900">Terms & Conditions</h3>
                                    </div>
                                    <button
                                        onClick={openTermsModal}
                                        className="text-blue-600 hover:text-blue-700 font-semibold text-sm underline"
                                    >
                                        View
                                    </button>
                                </div>
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer bg-white"
                                    />
                                    <label htmlFor="terms" className="text-base text-gray-700 cursor-pointer leading-snug">
                                        I agree to the Terms & Conditions
                                    </label>
                                </div>
                            </div>

                            {/* Privacy */}
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-blue-600" />
                                        <h3 className="text-base font-bold text-gray-900">Privacy Policy</h3>
                                    </div>
                                    <button
                                        onClick={openPrivacyModal}
                                        className="text-blue-600 hover:text-blue-700 font-semibold text-sm underline"
                                    >
                                        View
                                    </button>
                                </div>
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        id="privacy"
                                        checked={privacyAccepted}
                                        onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer bg-white"
                                    />
                                    <label htmlFor="privacy" className="text-base text-gray-700 cursor-pointer leading-snug">
                                        I accept the Privacy Policy
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-3">
                                <button
                                    onClick={handleBack}
                                    className="px-5 py-3 border border-gray-300 text-gray-700 text-base font-semibold rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!termsAccepted || !privacyAccepted || loading}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Creating Account...
                                        </>
                                    ) : (
                                        <>
                                            Create Account
                                            <Check className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-gray-200 py-4">
                <div className="max-w-7xl mx-auto px-6">
                    <p className="text-center text-base text-gray-600">
                        © 2025 AgileMind Platform. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Modals */}
            <TermsModal
                isOpen={showTermsModal}
                onClose={() => setShowTermsModal(false)}
                onAccept={() => {
                    setTermsAccepted(true);
                    setShowTermsModal(false);
                }}
                scrolledToBottom={termsScrolledToBottom}
                onScroll={handleTermsScroll}
            />

            <PrivacyModal
                isOpen={showPrivacyModal}
                onClose={() => setShowPrivacyModal(false)}
                onAccept={() => {
                    setPrivacyAccepted(true);
                    setShowPrivacyModal(false);
                }}
                scrolledToBottom={privacyScrolledToBottom}
                onScroll={handlePrivacyScroll}
            />
        </div>
    );
}
