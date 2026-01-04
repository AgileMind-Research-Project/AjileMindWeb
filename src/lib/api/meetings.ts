/**
 * Meeting API Service
 * Handles all meeting-related API calls
 */

import { httpClient } from './http-client';

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  meeting_type: 'standup' | 'planning' | 'retrospective' | 'review' | 'general';
  scheduled_date: string;
  duration_minutes: number;
  location?: string;
  is_virtual: boolean;
  meeting_link?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  participants: Participant[];
  created_by: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  ended_at?: string;
}

export interface Participant {
  id: string;
  user_id: string;
  name?: string;
  email?: string;
  attended: boolean;
}

export interface CreateMeetingData {
  title: string;
  description?: string;
  meeting_type: string;
  scheduled_date: string;
  duration_minutes: number;
  location?: string;
  is_virtual: boolean;
  meeting_link?: string;
  participant_ids?: string[];
}

export interface UpdateMeetingData {
  title?: string;
  description?: string;
  meeting_type?: string;
  scheduled_date?: string;
  duration_minutes?: number;
  location?: string;
  is_virtual?: boolean;
  meeting_link?: string;
  status?: string;
}

export interface MeetingListResponse {
  meetings: Meeting[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const meetingApi = {
  /**
   * Get all meetings
   */
  async list(params?: {
    meeting_type?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<MeetingListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.meeting_type) queryParams.append('meeting_type', params.meeting_type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    const response = await httpClient.get(`/meetings?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get meeting by ID
   */
  async get(meetingId: string): Promise<Meeting> {
    const response = await httpClient.get(`/meetings/${meetingId}`);
    return response.data;
  },

  /**
   * Create new meeting
   */
  async create(data: CreateMeetingData): Promise<{ success: boolean; message: string; data: { id: string } }> {
    const response = await httpClient.post('/meetings', data);
    return response.data;
  },

  /**
   * Update meeting
   */
  async update(meetingId: string, data: UpdateMeetingData): Promise<{ success: boolean; message: string }> {
    const response = await httpClient.put(`/meetings/${meetingId}`, data);
    return response.data;
  },

  /**
   * Delete meeting
   */
  async delete(meetingId: string): Promise<{ success: boolean; message: string }> {
    const response = await httpClient.delete(`/meetings/${meetingId}`);
    return response.data;
  },

  /**
   * Cancel meeting
   */
  async cancel(meetingId: string): Promise<{ success: boolean; message: string }> {
    const response = await httpClient.post(`/meetings/${meetingId}/cancel`);
    return response.data;
  },
};
