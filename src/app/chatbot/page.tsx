/**
 * Document RAG Chatbot Page
 * 
 * Page for the RAG-based document chatbot interface
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useHasHydrated } from '@/lib/store/auth.store';
import RAGDocumentChatbot from '@/components/ai/RAGDocumentChatbot';
import { ArrowLeft } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Document Chatbot</h1>
              <p className="text-sm text-gray-600">Ask questions about your uploaded documents</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <RAGDocumentChatbot />
        </div>
      </div>
    </div>
  );
}
