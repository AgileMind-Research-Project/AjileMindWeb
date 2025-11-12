/**
 * Audit Logs API Client
 * 
 * API functions for audit log management
 */

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1';

// Types
export interface AuditLog {
  log_id: string;
  tenant_id: string;
  user_id: string | null;
  user_email: string | null;
  event_type: string;
  event_data: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogFilter {
  event_type?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

export interface AuditSettings {
  audit_logging_enabled: boolean;
  retention_days: number;
}

export interface EventType {
  value: string;
  label: string;
}

/**
 * Get audit logs with filters
 */
export const getAuditLogs = async (filters?: AuditLogFilter): Promise<{ logs: AuditLog[]; pagination: any }> => {
  const params = new URLSearchParams();
  
  if (filters?.event_type) params.append('event_type', filters.event_type);
  if (filters?.user_id) params.append('user_id', filters.user_id);
  if (filters?.start_date) params.append('start_date', filters.start_date);
  if (filters?.end_date) params.append('end_date', filters.end_date);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.page_size) params.append('page_size', filters.page_size.toString());
  
  const response = await axios.get(`${API_URL}${API_PREFIX}/audit?${params.toString()}`);
  return response.data.data;
};

/**
 * Get audit settings
 */
export const getAuditSettings = async (): Promise<AuditSettings> => {
  const response = await axios.get(`${API_URL}${API_PREFIX}/audit/settings`);
  return response.data.data;
};

/**
 * Update audit settings
 */
export const updateAuditSettings = async (
  settings: { audit_logging_enabled: boolean; retention_days?: number }
): Promise<AuditSettings> => {
  const response = await axios.put(`${API_URL}${API_PREFIX}/audit/settings`, settings);
  return response.data.data;
};

/**
 * Clear audit logs (all or selected)
 */
export const clearAuditLogs = async (
  options?: { log_ids?: string[]; before_date?: string }
): Promise<{ deleted_count: number }> => {
  const response = await axios.delete(`${API_URL}${API_PREFIX}/audit`, { data: options });
  return response.data.data;
};

/**
 * Get available event types
 */
export const getEventTypes = async (): Promise<EventType[]> => {
  const response = await axios.get(`${API_URL}${API_PREFIX}/audit/event-types`);
  return response.data.data.event_types;
};

/**
 * Cleanup old logs
 */
export const cleanupOldLogs = async (): Promise<{ retention_days: number }> => {
  const response = await axios.post(`${API_URL}${API_PREFIX}/audit/cleanup`);
  return response.data.data;
};
