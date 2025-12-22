import React, { useState, useEffect } from 'react';
import { DocumentUpload } from './DocumentUpload';
import { ChatInterface } from './ChatInterface';
import { ChatHistory } from './ChatHistory';
import { ragApi } from './rag.api';
import { RAGDocument, HealthStatus } from './types';
import { 
  Layout, 
  MessageSquare, 
  History, 
  Settings, 
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react';

export function DocumentChat() {
  const [activeTab, setActiveTab] = useState<'chat' | 'documents' | 'history'>('chat');
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    loadDocuments();
    checkHealth();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await ragApi.listDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const checkHealth = async () => {
    try {
      const status = await ragApi.getHealth();
      setHealth(status);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Layout className="w-5 h-5 text-blue-600" />
            Document Chat
          </h2>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${activeTab === 'chat' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
            `}
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${activeTab === 'documents' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
            `}
          >
            <Layout className="w-4 h-4" />
            Documents
            <span className="ml-auto bg-gray-200 text-gray-600 py-0.5 px-2 rounded-full text-xs">
              {documents.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${activeTab === 'history' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
            `}
          >
            <History className="w-4 h-4" />
            History
          </button>
        </nav>

        {/* System Status */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">System Status</h3>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">LLM Engine</span>
              {health?.llm ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Vector DB</span>
              {health?.vector_db ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeTab === 'chat' && (
          <ChatInterface selectedDocumentIds={selectedDocIds} />
        )}
        
        {activeTab === 'documents' && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Documents</h2>
              <DocumentUpload 
                documents={documents}
                onUploadSuccess={loadDocuments}
                onDeleteSuccess={loadDocuments}
              />
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex-1 overflow-hidden">
            <ChatHistory onSelectChat={() => setActiveTab('chat')} />
          </div>
        )}
      </div>
    </div>
  );
}
