'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare } from 'lucide-react';

export default function ChatbotPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
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
      <div className="flex-1 container mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-2xl mx-auto mt-10">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">How can I help you today?</h2>
          <p className="text-gray-600 mb-8">
            I'm here to assist you with project management, report generation, and answering questions about your agile process.
          </p>
          
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm text-gray-500">
            Chat interface coming soon...
          </div>
        </div>
      </div>
    </div>
  );
}
