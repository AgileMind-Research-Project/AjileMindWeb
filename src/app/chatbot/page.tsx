'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { DocumentChat } from '@/components/ai/rag/DocumentChat';

export default function ChatbotPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex items-center gap-4 shrink-0 z-10">
        <button 
          onClick={() => router.back()} 
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">AI Assistant</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <DocumentChat />
      </div>
    </div>
  );
}
