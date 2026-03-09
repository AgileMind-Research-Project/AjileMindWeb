/**
 * RAG Report Chatbot Component
 * 
 * Comprehensive component for:
 * - Date picker for selecting report dates
 * - Report selector dropdown filtered by selected date
 * - Chatbot interface with message history
 * - RAG-based question answering from selected report
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, FileText, Send, Loader, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';

// Local hook implementations
const useReportDates = (accessToken: string | null) => {
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

const useReportsByDate = (selectedDate: string, accessToken: string | null) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setReports([]);
      return;
    }

    // If "all" is selected or no date, fetch all reports
    if (selectedDate === 'all' || !selectedDate) {
      const fetchAllReports = async () => {
        setLoading(true);
        try {
          const headers: HeadersInit = {};
          if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
          }

          const response = await fetch(`${API_BASE_URL}/api/${API_VERSION}/documents?limit=1000`, { headers });
          if (!response.ok) throw new Error('Failed to fetch reports');
          const data = await response.json();
          setReports(data);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error fetching reports');
          setReports([]);
        } finally {
          setLoading(false);
        }
      };

      if (selectedDate === 'all') {
        fetchAllReports();
      } else {
        setReports([]);
      }
      return;
    }

    const fetchReports = async () => {
      setLoading(true);
      try {
        const headers: HeadersInit = {};
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/${API_VERSION}/documents?date=${encodeURIComponent(selectedDate)}`, { headers });
        if (!response.ok) throw new Error('Failed to fetch reports');
        const data = await response.json();
        setReports(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching reports');
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [selectedDate, accessToken]);

  return { reports, loading, error };
};

const useChatWithReport = (accessToken: string | null) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat with specific report or search reports (optionally filtered by date)
  const chat = async (reportId: number | null, query: string, searchAll: boolean = false, filterDate: string | null = null) => {
    setLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Build request body based on whether we're searching all or specific report
      const requestBody: any = { query };
      
      if (searchAll) {
        requestBody.search_all = true;
        requestBody.document_id = null;
        // Only pass filter_date if we're searching within a specific date
        if (filterDate && filterDate !== 'all') {
          requestBody.filter_date = filterDate;
        }
      } else if (reportId !== null) {
        requestBody.document_id = reportId;
        requestBody.search_all = false;
      }

      const response = await fetch(`${API_BASE_URL}/api/${API_VERSION}/documents/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
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
  reportId?: number;
  sourceReport?: string;
}

interface Report {
  id: number;
  doc_title: string;
  uploaded_date: string;
  category?: string;
  created_at: string;
}

interface ReportDate {
  uploaded_date: string;
  count: number;
}

export default function RAGDocumentChatbot() {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<string>(''); // Changed to string to handle 'all'
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get access token from auth store
  const { accessToken } = useAuthStore();

  // API hooks
  const { dates: availableDates, loading: datesLoading, error: datesError } = useReportDates(accessToken);
  const { reports, loading: reportsLoading, error: reportsError } = useReportsByDate(selectedDate, accessToken);
  const { chat, loading: chatLoading, error: chatError } = useChatWithReport(accessToken);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle date selection
  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    setSelectedReport('');
    setMessages([]); // Clear chat when changing date
  };

  // Handle report selection
  const handleReportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedReport(value);
    setMessages([]); // Clear chat when changing report
  };

  // Check if we should search multiple reports (not a specific one)
  // isSearchAll is true when "All Reports" is selected
  const isSearchAll = selectedReport === 'all';
  // isGlobalSearch is true when both "All Dates" AND "All Reports" are selected
  const isGlobalSearch = selectedDate === 'all' && selectedReport === 'all';
  const selectedReportId = selectedReport && selectedReport !== 'all' ? parseInt(selectedReport) : null;

  // Handle sending message
  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Allow sending if we have a specific report OR if search all is enabled
    if (!query.trim() || chatLoading) return;
    if (!isSearchAll && !selectedReportId) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date(),
      reportId: selectedReportId ?? undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      // Send query to backend - pass searchAll flag and filterDate when not global search
      const filterDate = isSearchAll && !isGlobalSearch ? selectedDate : null;
      const response = await chat(selectedReportId, query, isSearchAll, filterDate);
      
      // Build response message with source info if searching all
      let responseContent = response.chatbot_response;
      if (response.source_document) {
        responseContent = `${response.chatbot_response}\n\n📄 ${response.source_document}`;
      }
      
      // Add assistant message to chat
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        reportId: response.document_id,
        sourceReport: response.source_document,
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

  const selectedReportTitle = selectedReport === 'all' 
    ? 'All Reports' 
    : reports?.find(d => d.id === selectedReportId)?.doc_title;

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden" style={{
      backgroundColor: 'var(--am-bg-card)',
      border: '1px solid var(--am-border)',
      boxShadow: 'var(--am-shadow-lg)',
    }}>
      {/* Header - AI Accent color */}
      <div className="p-6" style={{
        background: 'linear-gradient(135deg, var(--am-accent) 0%, var(--am-accent-dark) 100%)',
        color: 'white',
      }}>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Report Chatbot
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>Ask questions about your reports using AI</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Control Panel */}
        <div className="p-4 space-y-3" style={{ backgroundColor: 'white', borderBottom: '1px solid var(--am-border)' }}>
          {/* Date Picker */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--am-text-primary)' }}>
                <Calendar className="w-4 h-4 inline mr-2" style={{ color: 'var(--am-accent)' }} />
                Select Report Date
              </label>
              <select
                value={selectedDate}
                onChange={handleDateChange}
                disabled={datesLoading}
                className="w-full px-4 py-2.5 rounded-xl text-sm transition-all duration-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  border: '1.5px solid var(--am-border)',
                  color: 'var(--am-text-primary)',
                  backgroundColor: 'white',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--am-accent)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(20, 184, 166, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--am-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <option value="">Choose a date...</option>
                <option value="all" style={{ fontWeight: 600 }}>All Dates (Search All Reports)</option>
                {availableDates?.map((dateObj) => (
                  <option key={dateObj.uploaded_date} value={dateObj.uploaded_date}>
                    {new Date(dateObj.uploaded_date).toLocaleDateString()} ({dateObj.count} reports)
                  </option>
                ))}
              </select>
              {datesError && (
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--am-error)' }}>
                  <AlertCircle className="w-3 h-3" />
                  {datesError}
                </p>
              )}
            </div>

            {/* Report Selector */}
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--am-text-primary)' }}>
                <FileText className="w-4 h-4 inline mr-2" style={{ color: 'var(--am-accent)' }} />
                Select Report
              </label>
              <select
                value={selectedReport}
                onChange={handleReportChange}
                disabled={!selectedDate || reportsLoading}
                className="w-full px-4 py-2.5 rounded-xl text-sm transition-all duration-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  border: '1.5px solid var(--am-border)',
                  color: 'var(--am-text-primary)',
                  backgroundColor: 'white',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--am-accent)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(20, 184, 166, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--am-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <option value="">Choose a report...</option>
                <option value="all" style={{ fontWeight: 600 }}>All Reports (Search All)</option>
                {reports?.map((report) => (
                  <option key={report.id} value={report.id}>
                    {report.doc_title}
                  </option>
                ))}
              </select>
              {reportsError && (
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--am-error)' }}>
                  <AlertCircle className="w-3 h-3" />
                  {reportsError}
                </p>
              )}
              {!selectedDate && (
                <p className="text-xs mt-1" style={{ color: 'var(--am-text-muted)' }}>Select a date first or choose &quot;All Dates&quot;</p>
              )}
            </div>
          </div>

          {/* Selected Report Info */}
          {selectedReportTitle && (
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{
              backgroundColor: isSearchAll ? 'var(--am-accent-50)' : 'var(--am-primary-50)',
              border: `1px solid ${isSearchAll ? 'var(--am-accent-100)' : 'var(--am-primary-100)'}`,
            }}>
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: isSearchAll ? 'var(--am-accent)' : 'var(--am-primary)' }} />
              <span className="text-sm" style={{ color: isSearchAll ? 'var(--am-accent-dark)' : 'var(--am-primary-dark)' }}>
                <strong>{isSearchAll ? 'Search Mode:' : 'Current:'}</strong> {selectedReportTitle}
                {isSearchAll && !isGlobalSearch && <span className="ml-2 text-xs" style={{ color: 'var(--am-accent)' }}>(Will search reports from {new Date(selectedDate).toLocaleDateString()} only)</span>}
                {isGlobalSearch && <span className="ml-2 text-xs" style={{ color: 'var(--am-accent)' }}>(Will search all reports across all dates)</span>}
              </span>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: 'var(--am-bg)' }}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center" style={{ color: 'var(--am-text-muted)' }}>
              <FileText className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-center max-w-md text-sm">
                {selectedReport
                  ? (isSearchAll 
                    ? (isGlobalSearch 
                      ? 'Ask any question - I will search all reports to find the answer!'
                      : `Ask any question - I will search reports from ${new Date(selectedDate).toLocaleDateString()}!`)
                    : 'Ask a question about the selected report to get started!')
                  : 'Select a date and report to begin chatting, or choose "All" to search reports'}
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-2xl rounded-2xl px-4 py-3"
                  style={
                    msg.type === 'user'
                      ? {
                          backgroundColor: 'var(--am-primary)',
                          color: 'white',
                          borderBottomRightRadius: '4px',
                        }
                      : {
                          backgroundColor: 'white',
                          color: 'var(--am-text-primary)',
                          borderBottomLeftRadius: '4px',
                          border: '1px solid var(--am-border)',
                        }
                  }
                >
                  <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs mt-1" style={{
                    color: msg.type === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--am-text-muted)'
                  }}>
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-3" style={{
                backgroundColor: 'white',
                border: '1px solid var(--am-border)',
                borderBottomLeftRadius: '4px',
              }}>
                <div className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" style={{ color: 'var(--am-accent)' }} />
                  <p className="text-sm" style={{ color: 'var(--am-text-secondary)' }}>Generating response...</p>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4" style={{ backgroundColor: 'white', borderTop: '1px solid var(--am-border)' }}>
          {chatError && (
            <div className="mb-3 p-2 rounded-lg text-xs flex items-center gap-2" style={{
              backgroundColor: 'var(--am-error-light)',
              border: '1px solid var(--am-error-border)',
              color: '#991B1B',
            }}>
              <AlertCircle className="w-4 h-4" />
              {chatError}
            </div>
          )}
          
          <form onSubmit={handleSendQuery} className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isSearchAll 
                  ? (isGlobalSearch ? "Ask any question - searching all reports..." : "Ask any question - searching reports from selected date...")
                  : (selectedReport ? "Ask a question..." : "Select a report first...")
              }
              disabled={(!selectedReport && !isSearchAll) || loading}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                border: '1.5px solid var(--am-border)',
                color: 'var(--am-text-primary)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--am-accent)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(20, 184, 166, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--am-border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <button
              type="submit"
              disabled={(!selectedReport && !isSearchAll) || !query.trim() || loading}
              className="px-5 py-2.5 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 font-semibold text-sm transition-all duration-200"
              style={{
                backgroundColor: isSearchAll ? 'var(--am-accent)' : 'var(--am-primary)',
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = isSearchAll ? 'var(--am-accent-dark)' : 'var(--am-primary-dark)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isSearchAll ? 'var(--am-accent)' : 'var(--am-primary)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  {isSearchAll ? 'Searching...' : 'Thinking...'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {isSearchAll ? 'Search All' : 'Send'}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
