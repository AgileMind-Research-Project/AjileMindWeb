/**
 * Document & RAG Chatbot API Hooks
 * 
 * Custom React hooks for:
 * - Fetching unique document upload dates
 * - Fetching documents for a specific date
 * - Sending chat queries and getting RAG responses
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth'; // Assuming auth hook exists

interface DocumentDate {
  uploaded_date: string;
  count: number;
}

interface Document {
  id: number;
  doc_title: string;
  uploaded_date: string;
  category?: string;
  created_at: string;
}

interface ChatResponse {
  document_id: number;
  document_title: string;
  user_query: string;
  chatbot_response: string;
  timestamp: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * Hook for fetching unique document dates
 */
export function useDocumentDates() {
  const [dates, setDates] = useState<DocumentDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    const fetchDates = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE}/documents/dates`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch dates: ${response.statusText}`);
        }

        const data = await response.json();
        setDates(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dates');
        console.error('Error fetching document dates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDates();
  }, [token]);

  return { dates, loading, error };
}

/**
 * Hook for fetching documents by a specific date
 */
export function useDocumentsByDate(uploadedDate: string | null) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!token || !uploadedDate) {
      setDocuments([]);
      return;
    }

    const fetchDocuments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE}/documents/by-date/${uploadedDate}?limit=100`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch documents: ${response.statusText}`);
        }

        const data = await response.json();
        setDocuments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch documents');
        console.error('Error fetching documents:', err);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [token, uploadedDate]);

  return { documents, loading, error };
}

/**
 * Hook for sending chat queries and getting RAG responses
 */
export function useChatWithDocument() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const chat = useCallback(
    async (documentId: number, query: string): Promise<ChatResponse> => {
      if (!token) {
        throw new Error('Not authenticated');
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/documents/chat`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            document_id: documentId,
            query: query,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.detail || `Failed to get response: ${response.statusText}`
          );
        }

        const data: ChatResponse = await response.json();
        return data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get response';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  return { chat, loading, error };
}

/**
 * Hook for searching documents
 */
export function useSearchDocuments() {
  const [results, setResults] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const search = useCallback(
    async (
      query: string,
      uploadedDate?: string,
      category?: string,
      limit: number = 10
    ): Promise<{ total: number; results: Document[] }> => {
      if (!token) {
        throw new Error('Not authenticated');
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/documents/search`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            uploaded_date: uploadedDate || null,
            category: category || null,
            limit,
          }),
        });

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }

        const data = await response.json();
        setResults(data.results);
        return data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Search failed';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  return { search, results, loading, error };
}

/**
 * Hook for getting document content
 */
export function useDocumentContent(documentId: number | null) {
  const [content, setContent] = useState<{
    id: number;
    doc_title: string;
    doc_content: string;
    uploaded_date: string;
    category?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!token || !documentId) {
      setContent(null);
      return;
    }

    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE}/documents/${documentId}/content`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch content: ${response.statusText}`);
        }

        const data = await response.json();
        setContent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch content');
        console.error('Error fetching document content:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [token, documentId]);

  return { content, loading, error };
}

/**
 * Hook for uploading a new document
 */
export function useUploadDocument() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const upload = useCallback(
    async (
      title: string,
      content: string,
      uploadedDate: string,
      category?: string
    ) => {
      if (!token) {
        throw new Error('Not authenticated');
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/documents/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            doc_title: title,
            doc_content: content,
            uploaded_date: uploadedDate,
            category: category || null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.detail || `Upload failed: ${response.statusText}`
          );
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  return { upload, loading, error };
}
