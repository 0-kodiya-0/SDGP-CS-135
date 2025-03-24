import { useEffect, useState } from 'react';
import { Edit, Trash2, ArrowLeft, Clock, MapPin, Users, Video, Loader2 } from 'lucide-react';
import { useTabStore } from '../../../required/tab_view';
import { useCalendarEvents } from '../hooks/useCalendarEvents.google';
import { CalendarEvent } from '../types/types.google.api';
import { formatDateRange, getAttendeeStatusInfo } from '../utils/utils.google.api';
import { ComponentTypes } from '../../../required/tab_view/types/types.views';

interface CalendarEventViewProps {
    accountId: string;
    eventId: string;
    calendarId?: string;
}

export default function CalendarEventView({ accountId, eventId, calendarId }: CalendarEventViewProps) {
    const [event, setEvent] = useState<CalendarEvent | null>(null);
    const { getEvent, deleteEvent, loading, error } = useCalendarEvents(accountId);
    const { addTab, closeTab } = useTabStore();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleteSuccess, setDeleteSuccess] = useState(false);

    // Fetch event data on component mount
    useEffect(() => {
        if (accountId && eventId) {
            const fetchEvent = async () => {
                // Pass calendarId to your hook:
                const eventData = await getEvent(eventId, calendarId);
                if (eventData) {
                    setEvent(eventData);
                }
            };
            fetchEvent();
        }
    }, [accountId, eventId, calendarId, getEvent]);

    // Handle edit event
    const handleEditEvent = () => {
        if (event) {
            addTab(`Edit: ${event.summary || 'Untitled'}`, null, ComponentTypes.CALENDAR_EDIT_EVENT_VIEW, { accountId, event });
        }
    };

    // Handle delete event
    const handleDeleteEvent = async () => {
        if (confirmDelete && event?.id) {
            const success = await deleteEvent(event.id);
            if (success) {
                setDeleteSuccess(true);
                // Close the tab after a short delay
                setTimeout(() => {
                    closeTab("current"); // Assuming closeTab can take "current" to close the active tab
                }, 2000);
            }
        } else {
            setConfirmDelete(true);
        }
    };

    // Reset delete confirmation if canceled
    const handleCancelDelete = () => {
        setConfirmDelete(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
                <span className="text-gray-600">Loading event details...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4">
                <div className="text-red-500 mb-4">Error: {error}</div>
                <button
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
                    onClick={() => closeTab("current")}
                >
                    Close
                </button>
            </div>
        );
    }

    if (deleteSuccess) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4">
                <div className="text-green-500 mb-4">Event successfully deleted</div>
                <div className="text-gray-500">Closing this tab...</div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4">
                <div className="text-gray-500 mb-4">Event not found</div>
                <button
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
                    onClick={() => closeTab("current")}
                >
                    Close
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                    <button
                        onClick={() => closeTab("current")}
                        className="p-1 text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded mr-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-medium">Event Details</h2>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={handleEditEvent}
                        className="flex items-center px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded border border-gray-300"
                    >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                    </button>
                    {confirmDelete ? (
                        <div className="flex space-x-2">
                            <button
                                onClick={handleCancelDelete}
                                className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded border border-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteEvent}
                                className="flex items-center px-3 py-1 text-sm text-white bg-red-500 hover:bg-red-600 rounded"
                            >
                                Confirm Delete
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleDeleteEvent}
                            className="flex items-center px-3 py-1 text-sm text-white bg-red-500 hover:bg-red-600 rounded"
                        >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                        </button>
                    )}
                </div>
            </div>

            {/* Event content */}
            <div className="flex-grow p-6 overflow-y-auto">
                <div className="max-w-3xl mx-auto">
                    {/* Event title */}
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {event.summary || 'Untitled Event'}
                    </h1>

                    {/* Status indicator */}
                    {event.status === 'cancelled' && (
                        <div className="inline-block px-2 py-1 bg-red-100 text-red-700 text-sm rounded mb-4">
                            Cancelled
                        </div>
                    )}

                    {/* Date and time */}
                    <div className="flex items-start mt-4 mb-6">
                        <Clock className="w-5 h-5 text-gray-500 mr-3 mt-0.5" />
                        <div>
                            <p className="text-gray-900">
                                {event.start && event.end
                                    ? formatDateRange(event.start, event.end, event.start.timeZone)
                                    : 'Date and time not specified'}
                            </p>
                            {event.start?.timeZone && (
                                <p className="text-sm text-gray-500 mt-1">
                                    Timezone: {event.start.timeZone}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Location */}
                    {event.location && (
                        <div className="flex items-start mb-6">
                            <MapPin className="w-5 h-5 text-gray-500 mr-3 mt-0.5" />
                            <div>
                                <p className="text-gray-900">{event.location}</p>
                            </div>
                        </div>
                    )}

                    {/* Video conference */}
                    {event.hangoutLink && (
                        <div className="flex items-start mb-6">
                            <Video className="w-5 h-5 text-gray-500 mr-3 mt-0.5" />
                            <div>
                                <p className="text-gray-900">Google Meet</p>
                                <a
                                    href={event.hangoutLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                >
                                    {event.hangoutLink}
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Attendees */}
                    {event.attendees && event.attendees.length > 0 && (
                        <div className="flex items-start mb-6">
                            <Users className="w-5 h-5 text-gray-500 mr-3 mt-0.5" />
                            <div className="flex-grow">
                                <p className="text-gray-900 mb-2">Attendees</p>
                                <ul className="space-y-2">
                                    {event.attendees.map((attendee, index) => {
                                        const statusInfo = getAttendeeStatusInfo(attendee.responseStatus);
                                        return (
                                            <li key={index} className="flex items-center justify-between">
                                                <div className="flex-grow">
                                                    <p className="text-gray-900">
                                                        {attendee.displayName || attendee.email}
                                                        {attendee.organizer && <span className="text-xs ml-2">(Organizer)</span>}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{attendee.email}</p>
                                                </div>
                                                <div
                                                    className="px-2 py-1 text-xs rounded"
                                                    style={{
                                                        backgroundColor: `${statusInfo.color}20`,
                                                        color: statusInfo.color
                                                    }}
                                                >
                                                    {statusInfo.text}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {event.description && (
                        <div className="mt-6 border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
                            <div
                                className="prose max-w-none text-gray-700"
                                dangerouslySetInnerHTML={{ __html: event.description }}
                            />
                        </div>
                    )}

                    {/* Created and updated info */}
                    <div className="mt-8 pt-6 border-t border-gray-200 text-xs text-gray-500">
                        {event.creator && (
                            <p>Created by: {event.creator.displayName || event.creator.email}</p>
                        )}
                        {event.created && (
                            <p>Created: {new Date(event.created).toLocaleString()}</p>
                        )}
                        {event.updated && (
                            <p>Last updated: {new Date(event.updated).toLocaleString()}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}