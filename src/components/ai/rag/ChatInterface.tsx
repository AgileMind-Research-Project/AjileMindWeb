import React, { useState, useRef, useEffect } from 'react';
import { Send, Copy, Clock, Bot, User, ChevronDown, ChevronUp, FileText, Cpu, Calendar } from 'lucide-react';
import { ChatMessage, Source } from './types';
import { ragApi } from './rag.api';
import { toast } from 'sonner';

interface ChatInterfaceProps {
  selectedDocumentIds: string[];
}

/**
 * Enhanced ChatInterface with Date-Based Document Selection Feature
 * 
 * Date-Based Document Chat Flow:
 * 1. User selects a DATE from date picker dropdown → fetches available dates
 * 2. Frontend displays documents for that date → user selects specific document
 * 3. Selected document ID sent to backend when asking questions
 * 4. Backend retrieves ONLY that document's chunks from vector DB
 * 5. LLM generates SHORT answer (1-3 sentences) using selected document context
 * 6. Answer shown with source document reference and upload date
 * 
 * This enables more focused, context-aware conversations specific to daily documents.
 */
export function ChatInterface({ selectedDocumentIds }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ============================================
  // Date-Based Document Selection State
  // ============================================
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [documentsForDate, setDocumentsForDate] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial history and available dates
  useEffect(() => {
    loadHistory();
    loadAvailableDates();
  }, []);

  const loadHistory = async () => {
    try {
      const history = await ragApi.getChatHistory();
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  /**
   * Fetch all distinct dates that have documents
   * First step of date-based document selection flow
   */
  const loadAvailableDates = async () => {
    try {
      setLoadingDates(true);
      const response = await ragApi.getAvailableDates();
      setAvailableDates(response.dates || []);
      
      // Auto-select the most recent date if available
      if (response.dates && response.dates.length > 0) {
        setSelectedDate(response.dates[0]);
        loadDocumentsForDate(response.dates[0]);
      }
    } catch (error) {
      console.error('Failed to load available dates:', error);
      toast.error('Failed to load dates');
    } finally {
      setLoadingDates(false);
    }
  };

  /**
   * Fetch documents for selected date
   * Second step: user selects date → get documents for that date
   */
  const loadDocumentsForDate = async (date: string) => {
    try {
      setLoadingDocs(true);
      setSelectedDocument(null); // Clear previous selection
      
      const response = await ragApi.getDocumentsByDate(date);
      setDocumentsForDate(response.documents || []);
      
      // Auto-select first document if available
      if (response.documents && response.documents.length > 0) {
        setSelectedDocument(response.documents[0]);
      }
    } catch (error) {
      console.error('Failed to load documents for date:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    loadDocumentsForDate(date);
  };

  const handleDocumentChange = (doc: any) => {
    setSelectedDocument(doc);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    // Warn if no document selected
    if (!selectedDocument) {
      toast.error('Please select a document');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Send question with selected document ID
      const response = await ragApi.askQuestion(
        userMessage.content,
        selectedDocument.document_id // Pass selected document to backend
      );

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer, // SHORT answer from LLM
        timestamp: new Date().toISOString(),
        sources: response.sources,
        model: response.model,
        response_time: response.response_time,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat failed:', error);
      toast.error('Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Date-Based Document Selection Panel */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Select Date
            </label>
            <select
              value={selectedDate || ''}
              onChange={(e) => handleDateChange(e.target.value)}
              disabled={loadingDates}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="">-- Select a date --</option>
              {availableDates.map((date) => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </option>
              ))}
            </select>
          </div>

          {/* Document Selection - shows documents for selected date */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Select Document
              </label>
              {loadingDocs ? (
                <div className="p-2 text-gray-500 text-sm">Loading documents...</div>
              ) : documentsForDate.length > 0 ? (
                <select
                  value={selectedDocument?.document_id || ''}
                  onChange={(e) => {
                    const doc = documentsForDate.find(d => d.document_id === e.target.value);
                    if (doc) handleDocumentChange(doc);
                  }}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select a document --</option>
                  {documentsForDate.map((doc) => (
                    <option key={doc.document_id} value={doc.document_id}>
                      {doc.title} ({doc.type})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2 text-gray-500 text-sm italic">No documents available for this date</div>
              )}
            </div>
          )}

          {/* Current Selection Display */}
          {selectedDocument && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="text-blue-900">
                📄 <strong>{selectedDocument.title}</strong> ({selectedDocument.type})
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
            <div className="p-4 bg-white rounded-full shadow-sm">
              <Bot className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-lg font-medium">How can I help you?</p>
            <p className="text-sm max-w-md text-center">
              Select a date and document above, then ask questions. Get SHORT, focused answers specific to that document.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center shrink-0
                ${msg.role === 'user' ? 'bg-blue-600' : 'bg-green-600'}
              `}>
                {msg.role === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>

              <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`
                  p-4 rounded-2xl shadow-sm
                  ${msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-900 rounded-tl-none border border-gray-100'}
                `}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                </div>

                {msg.role === 'assistant' && (
                  <div className="mt-2 space-y-2 w-full">
                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 px-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {msg.response_time?.toFixed(2)}s
                      </span>
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3 h-3" />
                        {msg.model}
                      </span>
                      <button 
                        onClick={() => copyToClipboard(msg.content)}
                        className="hover:text-blue-600 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <details className="group">
                          <summary className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50">
                            <span className="text-xs font-medium text-gray-700 flex items-center gap-2">
                              <FileText className="w-3 h-3" />
                              {msg.sources.length} Sources
                            </span>
                            <ChevronDown className="w-3 h-3 text-gray-400 group-open:rotate-180 transition-transform" />
                          </summary>
                          <div className="p-2 border-t border-gray-200 bg-gray-50 space-y-2">
                            {msg.sources.map((source, idx) => (
                              <div key={idx} className="text-xs bg-white p-2 rounded border border-gray-200">
                                <div className="flex justify-between mb-1">
                                  <span className="font-medium text-blue-600 truncate max-w-[200px]">
                                    {source.filename}
                                  </span>
                                  <span className="text-gray-400">
                                    Score: {(source.relevance_score * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <p className="text-gray-600 line-clamp-2 italic">
                                  "{source.preview}"
                                </p>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="relative max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedDocument ? "Ask a question about the selected document..." : "Select a date and document first..."}
            disabled={!selectedDocument}
            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32 min-h-[50px] disabled:opacity-50"
            rows={1}
            style={{ height: 'auto', minHeight: '50px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading || !selectedDocument}
            className="absolute right-2 bottom-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          ✨ Answers are short and focused to your selected document. AI can make mistakes - verify important information.
        </p>
      </div>
    </div>
  );
}
