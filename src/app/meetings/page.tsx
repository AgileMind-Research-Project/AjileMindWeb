/**
 * Meetings Page
 * 
 * Manage and schedule meetings with full CRUD operations
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUser, useTenant, useHasHydrated } from '@/lib/store/auth.store';
import { Calendar, Clock, Users, Video, Plus, ArrowLeft, MapPin, FileText, Edit, Trash2 } from 'lucide-react';
import { meetingApi, type Meeting } from '@/lib/api/meetings';
import MeetingFormModal from '@/components/meetings/MeetingFormModal';

export default function MeetingsPage() {
  const router = useRouter();
  const { isAuthenticated, passwordChangeRequired } = useAuth();
  const user = useUser();
  const tenant = useTenant();
  const hasHydrated = useHasHydrated();
  
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    
    if (!isAuthenticated) {
      router.push('/login');
    } else if (passwordChangeRequired) {
      router.push('/auth/change-password');
    }
  }, [isAuthenticated, passwordChangeRequired, hasHydrated, router]);

  // Fetch meetings from API
  const fetchMeetings = async () => {
    try {
      setIsLoading(true);
      const response = await meetingApi.list({
        status: filter === 'all' ? undefined : filter,
        page: 1,
        page_size: 50
      });
      setMeetings(response.meetings);
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && hasHydrated) {
      fetchMeetings();
    }
  }, [isAuthenticated, hasHydrated, filter]);

  const handleDelete = async (meetingId: string) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;
    
    try {
      await meetingApi.delete(meetingId);
      await fetchMeetings();
    } catch (error) {
      console.error('Failed to delete meeting:', error);
      alert('Failed to delete meeting');
    }
  };

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingMeeting(null);
  };

  const handleModalSuccess = () => {
    fetchMeetings();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (!hasHydrated || isLoading) {
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
    <>
      <MeetingFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        editMeeting={editingMeeting}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Manage Meetings</h1>
                  <p className="text-sm text-gray-600">{tenant?.company_name}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingMeeting(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Schedule Meeting</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-8">
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Meetings
            </button>
            <button
              onClick={() => setFilter('scheduled')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'scheduled'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Scheduled
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Completed
            </button>
          </div>

          {/* Meetings Grid */}
          {meetings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No meetings found</h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all' 
                  ? "You haven't scheduled any meetings yet."
                  : `No ${filter} meetings at the moment.`}
              </p>
              <button
                onClick={() => {
                  setEditingMeeting(null);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Schedule Your First Meeting</span>
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {meetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        meeting.status === 'scheduled'
                          ? 'bg-green-100 text-green-700'
                          : meeting.status === 'completed'
                          ? 'bg-gray-100 text-gray-700'
                          : meeting.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                    </span>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      meeting.is_virtual ? 'bg-purple-100' : 'bg-blue-100'
                    }`}>
                      {meeting.is_virtual ? (
                        <Video className="w-5 h-5 text-purple-600" />
                      ) : (
                        <MapPin className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </div>

                  {/* Meeting Info */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{meeting.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{meeting.description || 'No description'}</p>

                  {/* Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(meeting.scheduled_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{formatTime(meeting.scheduled_date)} • {meeting.duration_minutes} mins</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{meeting.is_virtual ? (meeting.meeting_link || 'Virtual') : (meeting.location || 'TBD')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{meeting.participants?.length || 0} participants</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                    {meeting.status === 'scheduled' && (
                      <>
                        <button
                          onClick={() => handleEdit(meeting)}
                          className="flex-1 flex items-center justify-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(meeting.id)}
                          className="flex-1 flex items-center justify-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </>
                    )}
                    {meeting.status === 'completed' && (
                      <button
                        onClick={() => handleDelete(meeting.id)}
                        className="flex-1 flex items-center justify-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6 mt-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Total Meetings</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">{meetings.length}</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Scheduled</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {meetings.filter(m => m.status === 'scheduled').length}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Completed</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {meetings.filter(m => m.status === 'completed').length}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Virtual</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {meetings.filter(m => m.is_virtual).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
