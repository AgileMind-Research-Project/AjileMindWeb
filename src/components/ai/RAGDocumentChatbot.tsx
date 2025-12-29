/**
 * RAG Document Chatbot Component
 * 
 * Comprehensive component for:
 * - Date picker for selecting document upload dates
 * - Document selector dropdown filtered by selected date
 * - Chatbot interface with message history
 * - RAG-based question answering from selected document
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, FileText, Send, Loader, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';

// Local hook implementations
const useDocumentDates = (accessToken: string | null) => {
  const [dates, setDates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDates = async () => {
      setLoading(true);
      try {
        const headers: HeadersInit = {};
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/${API_VERSION}/documents/dates`, { headers });
        if (!response.ok) throw new Error('Failed to fetch dates');
        const data = await response.json();
        setDates(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching dates');
        setDates([]);
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchDates();
    }
  }, [accessToken]);

  return { dates, loading, error };
};

const useDocumentsByDate = (selectedDate: string, accessToken: string | null) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDate || !accessToken) {
      setDocuments([]);
      return;
    }

    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const headers: HeadersInit = {};
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/${API_VERSION}/documents?date=${encodeURIComponent(selectedDate)}`, { headers });
        if (!response.ok) throw new Error('Failed to fetch documents');
        const data = await response.json();
        setDocuments(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching documents');
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [selectedDate, accessToken]);

  return { documents, loading, error };
};

const useChatWithDocument = (accessToken: string | null) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chat = async (documentId: number, query: string) => {
    setLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch('/api/v1/documents/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ document_id: documentId, query }),
      });
      if (!response.ok) throw new Error('Failed to get response');
      const data = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error getting response';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { chat, loading, error };
};

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  documentId?: number;
}

interface Document {
  id: number;
  doc_title: string;
  uploaded_date: string;
  category?: string;
  created_at: string;
}

interface DocumentDate {
  uploaded_date: string;
  count: number;
}

export default function RAGDocumentChatbot() {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get access token from auth store
  const { accessToken } = useAuthStore();

  // API hooks
  const { dates: availableDates, loading: datesLoading, error: datesError } = useDocumentDates(accessToken);
  const { documents, loading: docsLoading, error: docsError } = useDocumentsByDate(selectedDate, accessToken);
  const { chat, loading: chatLoading, error: chatError } = useChatWithDocument(accessToken);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle date selection
  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    setSelectedDocument(null);
    setMessages([]); // Clear chat when changing date
  };

  // Handle document selection
  const handleDocumentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const docId = parseInt(e.target.value);
    setSelectedDocument(docId);
    setMessages([]); // Clear chat when changing document
  };

  // Handle sending message
  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim() || !selectedDocument || chatLoading) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date(),
      documentId: selectedDocument,
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      // Send query to backend
      const response = await chat(selectedDocument, query);
      
      // Add assistant message to chat
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.chatbot_response,
        timestamp: new Date(),
        documentId: selectedDocument,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Error: ${chatError || 'Failed to get response. Please try again.'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const selectedDocTitle = documents?.find(d => d.id === selectedDocument)?.doc_title;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 shadow-md">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Document Chatbot
        </h1>
        <p className="text-blue-100 mt-2">Ask questions about your documents using AI</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Control Panel */}
        <div className="bg-white border-b border-slate-200 p-4 space-y-3">
          {/* Date Picker */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Select Document Date
              </label>
              <select
                value={selectedDate}
                onChange={handleDateChange}
                disabled={datesLoading}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors"
              >
                <option value="">Choose a date...</option>
                {availableDates?.map((dateObj) => (
                  <option key={dateObj.uploaded_date} value={dateObj.uploaded_date}>
                    {new Date(dateObj.uploaded_date).toLocaleDateString()} ({dateObj.count} documents)
                  </option>
                ))}
              </select>
              {datesError && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {datesError}
                </p>
              )}
            </div>

            {/* Document Selector */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Select Document
              </label>
              <select
                value={selectedDocument || ''}
                onChange={handleDocumentChange}
                disabled={!selectedDate || docsLoading}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors"
              >
                <option value="">Choose a document...</option>
                {documents?.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.doc_title}
                  </option>
                ))}
              </select>
              {docsError && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {docsError}
                </p>
              )}
              {!selectedDate && (
                <p className="text-slate-500 text-xs mt-1">Select a date first</p>
              )}
            </div>
          </div>

          {/* Selected Document Info */}
          {selectedDocTitle && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span className="text-sm text-blue-900">
                <strong>Current:</strong> {selectedDocTitle}
              </span>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <FileText className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-center max-w-md">
                {selectedDocument
                  ? 'Ask a question about the selected document to get started!'
                  : 'Select a date and document to begin chatting'}
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl rounded-lg px-4 py-3 ${
                    msg.type === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-200 text-slate-900 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-xs mt-1 ${
                    msg.type === 'user' ? 'text-blue-100' : 'text-slate-500'
                  }`}>
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-200 text-slate-900 rounded-lg px-4 py-3 rounded-bl-none">
                <div className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  <p className="text-sm">Generating response...</p>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-slate-200 p-4">
          {chatError && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {chatError}
            </div>
          )}
          
          <form onSubmit={handleSendQuery} className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={selectedDocument ? "Ask a question..." : "Select a document first..."}
              disabled={!selectedDocument || loading}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors"
            />
            <button
              type="submit"
              disabled={!selectedDocument || !query.trim() || loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
