/**
 * Report RAG Chatbot Page
 * 
 * Page for the RAG-based report chatbot interface
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useHasHydrated } from '@/lib/store/auth.store';
import RAGDocumentChatbot from '@/components/ai/RAGDocumentChatbot';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ChatbotPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const hasHydrated = useHasHydrated();

  React.useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, hasHydrated, router]);

  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <RAGDocumentChatbot />
      </div>
    </DashboardLayout>
  );
}
