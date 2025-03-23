import React, { useEffect, useState } from 'react';
import { Trash2, Calendar, Search, ExternalLink, Clock, MapPin, User, Users } from 'lucide-react';
import { useWorkspaceFeature } from '../hooks/useWorkspaceFeature';
import { WorkspaceFeatureType, WorkspaceContent } from '../types/workspace.types';

interface WorkspaceCalendarProps {
    workspaceId: string;
}

const WorkspaceCalendar: React.FC<WorkspaceCalendarProps> = ({ workspaceId }) => {
    const {
        featureContents,
        loading,
        error,
        fetchFeatureContents,
        removeFeatureContent
    } = useWorkspaceFeature(WorkspaceFeatureType.Calendar);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEvent, setSelectedEvent] = useState<WorkspaceContent | null>(null);
    const [currentView, setCurrentView] = useState<'list' | 'day' | 'week'>('list');

    // Fetch calendar events when component mounts
    useEffect(() => {
        fetchFeatureContents();
    }, [fetchFeatureContents, workspaceId]);

    // Filter events based on search query
    const filteredEvents = searchQuery
        ? featureContents.filter(event =>
            event.metadata.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.metadata.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.metadata.location?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : featureContents;

    // Sort events by start date
    const sortedEvents = [...filteredEvents].sort((a, b) => {
        const dateA = a.metadata.startDateTime ? new Date(a.metadata.startDateTime).getTime() : 0;
        const dateB = b.metadata.startDateTime ? new Date(b.metadata.startDateTime).getTime() : 0;
        return dateA - dateB;
    });

    // Handle event removal
    const handleRemoveEvent = async (event: WorkspaceContent, e: React.MouseEvent) => {
        e.stopPropagation();

        if (window.confirm('Are you sure you want to remove this event from the workspace?')) {
            const success = await removeFeatureContent(event.id);

            if (success && selectedEvent?.id === event.id) {
                setSelectedEvent(null);
            }
        }
    };

    // Format date string for display
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'No date';

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString(undefined, {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    // Format time string for display
    const formatTime = (dateString?: string) => {
        if (!dateString) return '';

        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return '';
        }
    };

    // Check if an event is all day
    const isAllDayEvent = (event: WorkspaceContent): boolean => {
        if (!event.metadata.startDateTime || !event.metadata.endDateTime) return false;

        try {
            const start = new Date(event.metadata.startDateTime);
            const end = new Date(event.metadata.endDateTime);

            // Check if the event spans exactly 24 hours and starts at midnight
            return (
                start.getHours() === 0 &&
                start.getMinutes() === 0 &&
                end.getHours() === 0 &&
                end.getMinutes() === 0 &&
                (end.getTime() - start.getTime()) >= 86400000 // At least 24 hours
            );
        } catch (e) {
            return false;
        }
    };

    // Get the duration string
    const getDuration = (event: WorkspaceContent): string => {
        if (!event.metadata.startDateTime || !event.metadata.endDateTime) return '';

        try {
            const start = new Date(event.metadata.startDateTime);
            const end = new Date(event.metadata.endDateTime);

            if (isAllDayEvent(event)) {
                const days = Math.round((end.getTime() - start.getTime()) / 86400000);
                return days === 1 ? 'All day' : `${days} days`;
            }

            const durationMs = end.getTime() - start.getTime();
            const hours = Math.floor(durationMs / 3600000);
            const minutes = Math.floor((durationMs % 3600000) / 60000);

            if (hours === 0) {
                return `${minutes} min`;
            } else if (minutes === 0) {
                return `${hours} hour${hours > 1 ? 's' : ''}`;
            } else {
                return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} min`;
            }
        } catch (e) {
            return '';
        }
    };

    return (
        <div className="flex h-full overflow-hidden">
            {/* Calendar Events Panel */}
            <div className="w-1/3 border-r border-gray-200 overflow-hidden flex flex-col">
                {/* Search Bar */}
                <div className="p-3 border-b border-gray-200">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search events..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    </div>
                </div>

                {/* View Selector */}
                <div className="border-b border-gray-200 p-2 flex space-x-1">
                    <button
                        onClick={() => setCurrentView('list')}
                        className={`flex-1 py-1 px-2 text-sm rounded ${currentView === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        List
                    </button>
                    <button
                        onClick={() => setCurrentView('day')}
                        className={`flex-1 py-1 px-2 text-sm rounded ${currentView === 'day' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        Day
                    </button>
                    <button
                        onClick={() => setCurrentView('week')}
                        className={`flex-1 py-1 px-2 text-sm rounded ${currentView === 'week' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        Week
                    </button>
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                )}

                {/* Error state */}
                {error && !loading && (
                    <div className="flex-1 flex items-center justify-center p-4 text-center">
                        <div className="text-red-500">
                            <p>Failed to load calendar events:</p>
                            <p className="font-medium">{error}</p>
                            <button
                                onClick={() => fetchFeatureContents()}
                                className="mt-4 px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )}

                {/* Event List View */}
                {!loading && !error && currentView === 'list' && (
                    <div className="flex-1 overflow-auto">
                        {sortedEvents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                                <Calendar className="w-12 h-12 text-gray-300 mb-2" />
                                <p className="text-gray-500">
                                    {searchQuery
                                        ? 'No events match your search'
                                        : 'No events shared to this workspace yet'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {sortedEvents.map(event => (
                                    <div
                                        key={event.id}
                                        onClick={() => setSelectedEvent(event)}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedEvent?.id === event.id ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <div className="flex justify-between">
                                            <h3 className="font-medium text-sm text-gray-900 truncate">
                                                {event.metadata.title || 'Untitled Event'}
                                            </h3>
                                            <button
                                                onClick={(e) => handleRemoveEvent(event, e)}
                                                className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                                                title="Remove from workspace"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="mt-2">
                                            <p className="text-xs flex items-center text-gray-500">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {formatDate(event.metadata.startDateTime)}
                                                {isAllDayEvent(event) ? (
                                                    <span className="ml-1">(All day)</span>
                                                ) : (
                                                    <span className="ml-1">
                                                        {formatTime(event.metadata.startDateTime)} - {formatTime(event.metadata.endDateTime)}
                                                    </span>
                                                )}
                                            </p>

                                            {event.metadata.location && (
                                                <p className="text-xs flex items-center text-gray-500 mt-1">
                                                    <MapPin className="w-3 h-3 mr-1" />
                                                    {event.metadata.location}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Day View - Simple Implementation */}
                {!loading && !error && currentView === 'day' && (
                    <div className="flex-1 overflow-auto p-4">
                        {/* Day view implementation would go here */}
                        <p className="text-sm text-gray-500 text-center mb-4">
                            Showing events for today
                        </p>

                        {sortedEvents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-4 text-center">
                                <Calendar className="w-10 h-10 text-gray-300 mb-2" />
                                <p className="text-gray-500">No events for this day</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {sortedEvents.map(event => (
                                    <div
                                        key={event.id}
                                        onClick={() => setSelectedEvent(event)}
                                        className={`p-3 rounded-lg border cursor-pointer ${selectedEvent?.id === event.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <p className="font-medium">{event.metadata.title || 'Untitled Event'}</p>
                                            {isAllDayEvent(event) ? (
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">All day</span>
                                            ) : (
                                                <span className="text-xs text-gray-500">
                                                    {formatTime(event.metadata.startDateTime)} - {formatTime(event.metadata.endDateTime)}
                                                </span>
                                            )}
                                        </div>

                                        {event.metadata.location && (
                                            <p className="text-xs flex items-center text-gray-500 mt-1">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                {event.metadata.location}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Week View - Simple Implementation */}
                {!loading && !error && currentView === 'week' && (
                    <div className="flex-1 overflow-auto p-4">
                        {/* Week view implementation would go here */}
                        <p className="text-sm text-gray-500 text-center mb-4">
                            Showing events for this week
                        </p>

                        {sortedEvents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-4 text-center">
                                <Calendar className="w-10 h-10 text-gray-300 mb-2" />
                                <p className="text-gray-500">No events for this week</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Group events by day */}
                                {Array.from(new Set(sortedEvents.map(event =>
                                    event.metadata.startDateTime
                                        ? new Date(event.metadata.startDateTime).toDateString()
                                        : 'No Date'
                                ))).map(dayString => (
                                    <div key={dayString}>
                                        <h3 className="font-medium text-sm text-gray-700 mb-2">
                                            {dayString !== 'No Date' ? new Date(dayString).toLocaleDateString(undefined, {
                                                weekday: 'long',
                                                month: 'short',
                                                day: 'numeric'
                                            }) : 'No Date'}
                                        </h3>
                                        <div className="space-y-2 pl-2">
                                            {sortedEvents
                                                .filter(event =>
                                                    event.metadata.startDateTime
                                                        ? new Date(event.metadata.startDateTime).toDateString() === dayString
                                                        : dayString === 'No Date'
                                                )
                                                .map(event => (
                                                    <div
                                                        key={event.id}
                                                        onClick={() => setSelectedEvent(event)}
                                                        className={`p-2 pl-3 border-l-4 rounded-r-lg cursor-pointer ${selectedEvent?.id === event.id
                                                                ? 'border-l-blue-500 bg-blue-50'
                                                                : 'border-l-gray-300 hover:border-l-blue-300 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <p className="font-medium">{event.metadata.title || 'Untitled Event'}</p>
                                                            {isAllDayEvent(event) ? (
                                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">All day</span>
                                                            ) : (
                                                                <span className="text-xs text-gray-500">
                                                                    {formatTime(event.metadata.startDateTime)} - {formatTime(event.metadata.endDateTime)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Event Detail Panel */}
            <div className="flex-1 overflow-auto flex flex-col">
                {selectedEvent ? (
                    <div className="flex-1 p-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {selectedEvent.metadata.title || 'Untitled Event'}
                            </h2>

                            <div className="mt-6 space-y-4">
                                <div className="flex">
                                    <Clock className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
                                    <div>
                                        <p className="text-gray-700">
                                            {formatDate(selectedEvent.metadata.startDateTime)}
                                            {isAllDayEvent(selectedEvent) ? (
                                                <span className="font-medium ml-2">(All day)</span>
                                            ) : (
                                                <span>
                                                    , {formatTime(selectedEvent.metadata.startDateTime)} - {formatTime(selectedEvent.metadata.endDateTime)}
                                                </span>
                                            )}
                                        </p>
                                        {!isAllDayEvent(selectedEvent) && (
                                            <p className="text-sm text-gray-500 mt-1">
                                                Duration: {getDuration(selectedEvent)}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {selectedEvent.metadata.location && (
                                    <div className="flex">
                                        <MapPin className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
                                        <p className="text-gray-700">{selectedEvent.metadata.location}</p>
                                    </div>
                                )}

                                {selectedEvent.metadata.organizer && (
                                    <div className="flex">
                                        <User className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
                                        <p className="text-gray-700">
                                            <span className="font-medium">Organizer: </span>
                                            {selectedEvent.metadata.organizer}
                                        </p>
                                    </div>
                                )}

                                {selectedEvent.metadata.attendees && selectedEvent.metadata.attendees.length > 0 && (
                                    <div className="flex">
                                        <Users className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-gray-700">Attendees:</p>
                                            <ul className="mt-1 space-y-1">
                                                {selectedEvent.metadata.attendees.map((attendee, index) => (
                                                    <li key={index} className="text-gray-700 flex items-center">
                                                        <span className={`w-2 h-2 rounded-full mr-2 ${attendee.responseStatus === 'accepted' ? 'bg-green-500' :
                                                                attendee.responseStatus === 'declined' ? 'bg-red-500' :
                                                                    attendee.responseStatus === 'tentative' ? 'bg-yellow-500' :
                                                                        'bg-gray-400'
                                                            }`}></span>
                                                        {attendee.email}
                                                        {attendee.responseStatus && (
                                                            <span className="text-xs text-gray-500 ml-2">
                                                                ({attendee.responseStatus})
                                                            </span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {selectedEvent.metadata.description && (
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-md font-medium mb-2">Description</h3>
                                <div className="prose max-w-none">
                                    <p>{selectedEvent.metadata.description}</p>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 flex justify-end">
                            <a
                                href={selectedEvent.metadata.url || `https://calendar.google.com/calendar/event?eid=${selectedEvent.contentId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View in Calendar
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                        <Calendar className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Select an event to view</h3>
                        <p className="text-gray-500 max-w-md">
                            Choose an event from the list to view its details here
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkspaceCalendar;