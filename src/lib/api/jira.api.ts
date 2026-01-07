/**
 * Jira Integration API Service
 * 
 * API calls for Jira Cloud integration management
 */

import { httpClient } from './http-client';

export interface JiraCredentials {
  jira_url: string;
  email: string;
  api_token: string;
}

export interface JiraCredentialsResponse {
  success: boolean;
  message: string;
  data: {
    jira_url: string;
    email: string;
    is_active: boolean;
  };
}

export interface JiraStatusResponse {
  success: boolean;
  message: string;
  data: {
    connected: boolean;
    integrations?: Array<{
      id: number;
      jira_url: string;
      email: string;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    }>;
    total?: number;
    jira_url?: string;
    email?: string;
    is_active?: boolean;
  };
}

export interface JiraProjectsResponse {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    key: string;
    name: string;
    projectTypeKey: string;
  }>;
}

export const jiraApi = {
  // Connect Jira integration
  connectJira: async (credentials: JiraCredentials): Promise<JiraCredentialsResponse> => {
    return httpClient.post('/jira/connect', credentials);
  },

  // Get Jira integration status
  getStatus: async (): Promise<JiraStatusResponse> => {
    return httpClient.get('/jira/status');
  },

  // Get Jira projects
  getProjects: async (): Promise<JiraProjectsResponse> => {
    return httpClient.get('/jira/projects');
  },

  // Disconnect Jira integration
  disconnectJira: async (): Promise<any> => {
    return httpClient.delete('/jira/disconnect');
  },

  // Get Jira issue status
  getIssueStatus: async (issueKey: string): Promise<{ success: boolean; data: any }> => {
    return httpClient.get(`/jira/issues/${issueKey}/status`);
  },

  // Transition Jira Issue
  transitionIssue: async (issueKey: string, targetStatus: string = 'Done'): Promise<{ success: boolean; data: any }> => {
    return httpClient.post(`/jira/issues/${issueKey}/transition`, { target_status: targetStatus });
  },
};
