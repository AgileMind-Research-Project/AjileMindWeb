/**
 * Jira Integration Page
 * 
 * Manage Jira Cloud integration and view connected accounts
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUser, useHasHydrated } from '@/lib/store/auth.store';
import { jiraApi } from '@/lib/api/jira.api';
import { showSuccessAlert, showErrorAlert } from '@/lib/utils/toast.utils';
import { 
  ArrowLeft, 
  Plus, 
  X, 
  Link2, 
  Trash2,
  RefreshCw
} from 'lucide-react';

interface JiraIntegration {
  id?: number;
  jira_url: string;
  email: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function JiraIntegrationPage() {
  const router = useRouter();
  const { isAuthenticated, passwordChangeRequired } = useAuth();
  const user = useUser();
  const hasHydrated = useHasHydrated();

  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [integrations, setIntegrations] = useState<JiraIntegration[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    jira_url: '',
    email: '',
    api_token: ''
  });

  useEffect(() => {
    if (!hasHydrated) return;
    
    if (!isAuthenticated) {
      router.push('/login');
    } else if (passwordChangeRequired) {
      router.push('/auth/change-password');
    } else if (!user?.roles?.includes('SUPER_ADMIN') && !user?.roles?.includes('ADMIN')) {
      router.push('/dashboard');
    } else {
      loadJiraStatus();
    }
  }, [isAuthenticated, passwordChangeRequired, hasHydrated, user, router]);

  const loadJiraStatus = async () => {
    setIsLoadingStatus(true);
    
    try {
      const response = await jiraApi.getStatus();
      if (response.data.integrations && Array.isArray(response.data.integrations)) {
        setIntegrations(response.data.integrations);
      }
    } catch (err: any) {
      console.error('Error loading Jira status:', err);
      showErrorAlert(err.response?.data?.detail || 'Failed to load Jira integration status');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic validation
    if (!formData.jira_url || !formData.email || !formData.api_token) {
      showErrorAlert('All fields are required');
      setIsLoading(false);
      return;
    }

    // Validate Jira URL format
    if (!formData.jira_url.includes('atlassian.net')) {
      showErrorAlert('Please enter a valid Jira Cloud URL (e.g., https://yourcompany.atlassian.net)');
      setIsLoading(false);
      return;
    }

    try {
      const response = await jiraApi.connectJira(formData);
      
      showSuccessAlert(response.message || 'Jira integration connected successfully!');
      
      // Reload the integrations list
      await loadJiraStatus();
      
      // Reset form and close modal
      setFormData({ jira_url: '', email: '', api_token: '' });
      setShowForm(false);
    } catch (err: any) {
      console.error('Error connecting Jira:', err);
      const errorMessage = err.response?.data?.detail || 'Failed to connect Jira integration';
      showErrorAlert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (integrationId: number) => {
    if (!confirm('Are you sure you want to disconnect this Jira integration?')) {
      return;
    }

    setIsLoading(true);

    try {
      await jiraApi.disconnectJira();
      
      // Reload the integrations list
      await loadJiraStatus();
      showSuccessAlert('Jira integration disconnected successfully');
    } catch (err: any) {
      console.error('Error disconnecting Jira:', err);
      showErrorAlert(err.response?.data?.detail || 'Failed to disconnect Jira integration');
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasHydrated || isLoadingStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-bold text-gray-900">Jira Integration</h1>
            </div>
            
            {integrations.length > 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Integration
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Integration List */}
        {integrations.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Connected Integrations</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {integrations.length} Jira {integrations.length === 1 ? 'account' : 'accounts'} configured
                </p>
              </div>
            </div>

            {integrations.map((integration) => (
              <div key={integration.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <Link2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">Jira Cloud</h3>
                          {integration.is_active && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              Active
                            </span>
                          )}
                          {!integration.is_active && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">URL:</span>{' '}
                            <a 
                              href={integration.jira_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              {integration.jira_url}
                            </a>
                          </p>
                          <p>
                            <span className="font-medium">Email:</span> {integration.email}
                          </p>
                          {integration.updated_at && (
                            <p className="text-xs text-gray-500">
                              Last updated: {new Date(integration.updated_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={loadJiraStatus}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Refresh"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDisconnect(integration.id || 0)}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Link2 className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Jira Integration</h2>
            <p className="text-gray-600 mb-6">
              Connect your Jira Cloud account to start syncing issues and projects
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Connect Jira
            </button>
          </div>
        )}

        {/* Setup Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3">How to get your Jira API Token:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
            <li>Go to <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer" className="underline">Atlassian Account Settings</a></li>
            <li>Click on "Create API token"</li>
            <li>Give your token a label (e.g., "AgileMind Integration")</li>
            <li>Click "Create" and copy the generated token</li>
            <li>Use this token in the form above</li>
          </ol>
        </div>
      </div>

      {/* Add/Update Integration Modal */}
      {showForm && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center z-9999 p-4">
          <div className="bg-white p-5 rounded-[10px] shadow-[0_0_10px_rgba(0,0,0,0.2)] w-[740px] h-[90%] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {integrations.length > 0 ? 'Add New' : 'Connect'} Jira Integration
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormData({ jira_url: '', email: '', api_token: '' });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="jira_url" className="block text-sm font-medium text-gray-700 mb-2">
                  Jira URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  id="jira_url"
                  name="jira_url"
                  value={formData.jira_url}
                  onChange={handleInputChange}
                  placeholder="https://yourcompany.atlassian.net"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Your Jira Cloud instance URL</p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your-email@company.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Your Jira account email</p>
              </div>

              <div>
                <label htmlFor="api_token" className="block text-sm font-medium text-gray-700 mb-2">
                  API Token <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="api_token"
                  name="api_token"
                  value={formData.api_token}
                  onChange={handleInputChange}
                  placeholder="Your Jira API token"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Generate from{' '}
                  <a 
                    href="https://id.atlassian.com/manage-profile/security/api-tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Atlassian Account Settings
                  </a>
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ jira_url: '', email: '', api_token: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
