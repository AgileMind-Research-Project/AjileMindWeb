import React from 'react';
import { Meeting } from '@/lib/api/meetings.api';

interface ViewMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    meeting: Meeting | null;
}

export default function ViewMeetingModal({ isOpen, onClose, meeting }: ViewMeetingModalProps) {
    if (!isOpen || !meeting) return null;

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

                <div className="relative z-10 inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div>
                        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="mt-3 text-center sm:mt-5">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">{meeting.title}</h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">
                                    {meeting.description || "No description provided."}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 border-t border-gray-200 pt-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium text-gray-500">Date:</span>
                            <span className="text-gray-900">{meeting.date}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="font-medium text-gray-500">Time:</span>
                            <span className="text-gray-900">{meeting.start_time} - {meeting.end_time}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="font-medium text-gray-500">Status:</span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                ${meeting.status === 'SCHEDULED' ? 'bg-green-100 text-green-800' :
                                    meeting.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                                        meeting.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                {meeting.status}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="font-medium text-gray-500">Category:</span>
                            <span className="text-gray-900">{meeting.category}</span>
                        </div>
                        {meeting.project_id && (
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-gray-500">Project ID:</span>
                                <span className="text-gray-900">{meeting.project_id}</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-5 sm:mt-6">
                        <button
                            type="button"
                            className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
