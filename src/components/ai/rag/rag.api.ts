import axios from 'axios';
import { RAGDocument, ChatResponse, HealthStatus } from './types';

const BASE_URL = 'http://localhost:8000/api/v1';

// Helper to get token
const getToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed.state?.accessToken || null;
    }
  } catch (e) {
    return null;
  }
  return null;
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const ragApi = {
  uploadDocument: async (
    file: File, 
    title: string,
    documentType: string,
    uploadDate?: string,
    onProgress?: (progress: number) => void
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('document_type', documentType);
    if (uploadDate) {
      formData.append('upload_date', uploadDate);
    }

    const response = await api.post<RAGDocument>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  listDocuments: async () => {
    const response = await api.get<RAGDocument[]>('/documents/list');
    return response.data;
  },

  deleteDocument: async (documentId: string) => {
    await api.delete(`/documents/${documentId}`);
  },

  /**
   * Date-Based Document Selection Feature
   * Fetch all distinct dates that have documents
   * Frontend uses this to populate date picker dropdown
   */
  getAvailableDates: async () => {
    const response = await api.get<{ success: boolean; dates: string[]; total_dates: number }>(
      '/documents/dates/available'
    );
    return response.data;
  },

  /**
   * Date-Based Document Selection Feature
   * Fetch documents for a specific date
   * Returns list of documents uploaded on that date
   */
  getDocumentsByDate: async (date: string) => {
    const response = await api.get<any>(
      `/documents/by-date/${date}`
    );
    return response.data;
  },

  /**
   * Ask question with selected document context
   * Date-based feature: document_id narrows search to that document
   * Backend returns SHORT answer specific to selected document
   */
  askQuestion: async (question: string, documentId?: string, topK: number = 5) => {
    const params = new URLSearchParams();
    if (documentId) {
      params.append('document_id', documentId);
    }

    const response = await api.post<ChatResponse>(
      `/documents/chat/ask?${params.toString()}`,
      {
        question,
        top_k: topK,
      }
    );
    return response.data;
  },

  getChatHistory: async (limit: number = 50) => {
    const response = await api.get<any[]>('/documents/chat/history', {
      params: { limit },
    });
    return response.data;
  },

  getHealth: async () => {
    const response = await api.get<HealthStatus>('/documents/health');
    return response.data;
  },
};
