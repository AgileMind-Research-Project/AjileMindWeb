export interface RAGDocument {
  id: string;
  filename: string;
  size: number;
  upload_date: string;
  status: 'processing' | 'ready' | 'error';
  chunks_count?: number;
}

export interface Source {
  document_id: string;
  filename: string;
  chunk_index: number;
  relevance_score: number;
  preview: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Source[];
  model?: string;
  response_time?: number;
  isThinking?: boolean;
}

export interface ChatResponse {
  question: string;
  answer: string;
  model: string;
  sources: Source[];
  response_time: number;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  llm: boolean;
  vector_db: boolean;
  version: string;
}
