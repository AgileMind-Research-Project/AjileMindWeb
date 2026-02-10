/**
 * Audit Logs Page
 * 
 * View, filter, and manage audit logs (Super Admin only)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useHasHydrated, useIsAuthenticated } from '@/lib/store/auth.store';
import { 
  Shield, Search, Filter, Trash2, X, ArrowLeft, Settings as SettingsIcon,
  Calendar, User, Activity, Download, RefreshCw, CheckSquare, Square
} from 'lucide-react';
import { toast } from 'sonner';
import * as auditApi from '@/lib/api/audit.api';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface AuditLog {
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

export default function AuditLogsPage() {
  const router = useRouter();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const hasHydrated = useHasHydrated();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<any>(null);
  
  // Filters
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [selectedEventType, setSelectedEventType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [loggingEnabled, setLoggingEnabled] = useState(true);
  const [retentionDays, setRetentionDays] = useState(90);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Selection
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!user?.roles?.includes('SUPER_ADMIN')) { 
      toast.error('Access denied. Super Admin only.');
      router.push('/dashboard');
      return;
    }
    loadData();
  }, [hasHydrated, isAuthenticated, user, router]);

  const loadData = async () => {
    try {
      await Promise.all([loadLogs(), loadEventTypes(), loadSettings()]);
    } catch (error: any) {
      console.error('Failed to load data:', error);
    }
  };

  const loadLogs = async (page: number = 1) => {
    try {
      setLoading(true);
      const filters: any = { page, page_size: 20 };
      if (selectedEventType) filters.event_type = selectedEventType;
      if (startDate) filters.start_date = new Date(startDate).toISOString();
      if (endDate) filters.end_date = new Date(endDate).toISOString();
      
      const data = await auditApi.getAuditLogs(filters);
      setLogs(data.logs);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (error: any) {
      console.error('Failed to load logs:', error);
      toast.error(error.response?.data?.detail || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const loadEventTypes = async () => {
    try {
      const types = await auditApi.getEventTypes();
      setEventTypes(types);
    } catch (error: any) {
      console.error('Failed to load event types:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await auditApi.getAuditSettings();
      setSettings(data);
      setLoggingEnabled(data.audit_logging_enabled);
      setRetentionDays(data.retention_days);
    } catch (error: any) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      await auditApi.updateAuditSettings({
        audit_logging_enabled: loggingEnabled,
        retention_days: retentionDays
      });
      toast.success('Settings updated successfully!');
      setShowSettings(false);
      await loadSettings();
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast.error(error.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleClearSelected = async () => {
    if (selectedLogs.size === 0) {
      toast.error('No logs selected');
      return;
    }
    
    if (!confirm(`Delete ${selectedLogs.size} selected log(s)? This cannot be undone.`)) return;
    
    try {
      const log_ids = Array.from(selectedLogs);
      await auditApi.clearAuditLogs({ log_ids });
      toast.success(`Deleted ${selectedLogs.size} log(s)`);
      setSelectedLogs(new Set());
      setSelectAll(false);
      await loadLogs(currentPage);
    } catch (error: any) {
      console.error('Failed to clear logs:', error);
      toast.error(error.response?.data?.detail || 'Failed to clear logs');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Delete ALL audit logs? This cannot be undone!')) return;
    
    try {
      await auditApi.clearAuditLogs();
      toast.success('All audit logs cleared');
      setSelectedLogs(new Set());
      setSelectAll(false);
      await loadLogs(1);
    } catch (error: any) {
      console.error('Failed to clear all logs:', error);
      toast.error(error.response?.data?.detail || 'Failed to clear all logs');
    }
  };

  const handleCleanupOld = async () => {
    if (!confirm(`Delete logs older than ${retentionDays} days?`)) return;
    
    try {
      await auditApi.cleanupOldLogs();
      toast.success('Old logs cleaned up');
      await loadLogs(currentPage);
    } catch (error: any) {
      console.error('Failed to cleanup logs:', error);
      toast.error(error.response?.data?.detail || 'Failed to cleanup logs');
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedLogs(new Set());
    } else {
      setSelectedLogs(new Set(logs.map(log => log.log_id)));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelect = (logId: string) => {
    const newSelected = new Set(selectedLogs);
    if (newSelected.has(logId)) {
      newSelected.delete(logId);
    } else {
      newSelected.add(logId);
    }
    setSelectedLogs(newSelected);
    setSelectAll(newSelected.size === logs.length);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getEventColor = (type: string) => {
    if (type.includes('login') || type.includes('created')) return 'text-green-600 bg-green-50';
    if (type.includes('failed') || type.includes('deleted')) return 'text-red-600 bg-red-50';
    if (type.includes('updated')) return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  if (!hasHydrated || loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-sm text-gray-600">Monitor system activity and security events</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
              <Filter className="w-5 h-5" />
              Filters
            </button>
            <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
              <SettingsIcon className="w-5 h-5" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Settings Status Bar */}
      {settings && (
        <div className={`border-b ${loggingEnabled ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="px-6 py-2">
            <div className="flex items-center justify-between text-sm">
              <span className={loggingEnabled ? 'text-green-700' : 'text-red-700'}>
                {loggingEnabled ? '✓ Audit Logging Enabled' : '✗ Audit Logging Disabled'} • Retention: {retentionDays} days
              </span>
              {!loggingEnabled && (
                <span className="text-red-600 font-medium">No new logs will be recorded until logging is enabled</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b">
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                <select
                  value={selectedEventType}
                  onChange={(e) => setSelectedEventType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">All Events</option>
                  {eventTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={() => loadLogs(1)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Search className="w-5 h-5 mx-auto" />
                </button>
                <button
                  onClick={() => {
                    setSelectedEventType('');
                    setStartDate('');
                    setEndDate('');
                    loadLogs(1);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="py-8">
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              {selectAll ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
              Select All
            </button>
            {selectedLogs.size > 0 && (
              <span className="text-sm text-gray-600">{selectedLogs.size} selected</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => loadLogs(currentPage)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            {selectedLogs.size > 0 && (
              <button
                onClick={handleClearSelected}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Selected
              </button>
            )}
            <button
              onClick={handleCleanupOld}
              className="px-4 py-2 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50"
            >
              Cleanup Old
            </button>
            <button
              onClick={handleClearAll}
              className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12"></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.log_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(log.log_id)}>
                        {selectedLogs.has(log.log_id) ? 
                          <CheckSquare className="w-5 h-5 text-blue-600" /> : 
                          <Square className="w-5 h-5 text-gray-400" />
                        }
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getEventColor(log.event_type)}`}>
                        {formatEventType(log.event_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {log.user_email || log.user_id || 'System'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.ip_address || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.event_data && Object.keys(log.event_data).length > 0 ? (
                        <details className="cursor-pointer">
                          <summary className="text-blue-600 hover:text-blue-700">View</summary>
                          <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-w-md">
                            {JSON.stringify(log.event_data, null, 2)}
                          </pre>
                        </details>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.total_pages} • Total: {pagination.total} logs
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => loadLogs(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => loadLogs(currentPage + 1)}
                disabled={currentPage === pagination.total_pages}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Audit Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-medium text-gray-900">Enable Audit Logging</div>
                    <div className="text-sm text-gray-600">Record all system activities</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={loggingEnabled}
                    onChange={(e) => setLoggingEnabled(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                </label>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retention Period (Days)
                </label>
                <input
                  type="number"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(parseInt(e.target.value) || 90)}
                  min="1"
                  max="365"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Logs older than this will be automatically deleted (1-365 days)
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  disabled={savingSettings}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={savingSettings}
                >
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
