/**
 * Upload Reports Page
 * 
 * Page for uploading documents for RAG chatbot
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useHasHydrated } from '@/lib/store/auth.store';
import DocumentUpload from '@/components/ai/DocumentUpload';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ArrowLeft } from 'lucide-react';

export default function UploadReportsPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const hasHydrated = useHasHydrated();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Upload Reports</h1>
        <p className="text-sm text-gray-600">Upload documents for the RAG chatbot to analyze</p>
      </div>

      <div className="max-w-4xl">
        <DocumentUpload />
      </div>
    </DashboardLayout>
  );
}
