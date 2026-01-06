'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MeetingsHeader from '@/components/meetings/MeetingsHeader';
import MeetingList from '@/components/meetings/MeetingList';
import CreateMeetingModal from '@/components/meetings/CreateMeetingModal';
import ViewMeetingModal from '@/components/meetings/ViewMeetingModal';
import { meetingsApi, Meeting } from '@/lib/api/meetings.api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function MeetingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('daily');
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMeeting, setViewMeeting] = useState<Meeting | null>(null);
    const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

    const fetchMeetings = async () => {
        setLoading(true);
        try {
            const allMeetings = await meetingsApi.listMeetings();
            setMeetings(allMeetings);
        } catch (error) {
            console.error('Failed to load meetings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeetings();
    }, []);

    const handleStartMeeting = async (meeting: Meeting) => {
        try {
            await meetingsApi.updateMeeting(meeting.meeting_id, { status: 'IN_PROGRESS' });
            toast.success(`Meeting "${meeting.title}" started`);
            fetchMeetings();
        } catch (error) {
            console.error('Failed to start meeting:', error);
            toast.error('Failed to start meeting');
        }
    };

    const handleEditMeeting = (meeting: Meeting) => {
        setEditingMeeting(meeting);
        setIsModalOpen(true);
    };

    const handleDeleteMeeting = async (meeting: Meeting) => {
        if (window.confirm('Are you sure you want to delete this meeting?')) {
            try {
                await meetingsApi.deleteMeeting(meeting.meeting_id);
                toast.success('Meeting deleted successfully');
                fetchMeetings();
            } catch (error) {
                console.error('Failed to delete meeting:', error);
                toast.error('Failed to delete meeting');
            }
        }
    };

    // Filter meetings based on active tab
    const filteredMeetings = meetings.filter(meeting => {
        if (activeTab === 'daily') return meeting.category === 'Daily Meeting';
        if (activeTab === 'category1') return meeting.category === 'Sprint Planning';
        if (activeTab === 'category2') return meeting.category === 'Sprint Review' || meeting.category === 'Retrospective';
        return true;
    });

    return (
        <DashboardLayout>
            <MeetingsHeader
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onCreateClick={() => {
                    setEditingMeeting(null);
                    setIsModalOpen(true);
                }}
            />

            <div className="mt-6">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <MeetingList
                        meetings={filteredMeetings}
                        onStart={handleStartMeeting}
                        onEdit={handleEditMeeting}
                        onDelete={handleDeleteMeeting}
                        onView={setViewMeeting}
                    />
                )}
            </div>

            <CreateMeetingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    fetchMeetings();
                    setIsModalOpen(false);
                }}
                meeting={editingMeeting}
            />

            {viewMeeting && (
                <ViewMeetingModal
                    isOpen={true}
                    meeting={viewMeeting}
                    onClose={() => setViewMeeting(null)}
                    onMeetingUpdated={() => fetchMeetings()}
                />
            )}
        </DashboardLayout>
    );
}
