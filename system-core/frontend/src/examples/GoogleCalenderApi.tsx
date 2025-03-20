import { useEffect, useState } from "react";
import { COMMON_TIMEZONES } from "../features/default/chat";
import { useAuth, useAccount } from "../features/default/user_account";
import {
    CalendarResource,
    useCalendarList,
    CalendarEvent,
    useCalendarEvents,
    getEventStatusColor,
    formatEventTime,
    EventFormData,
    eventToFormData,
    formToEventParams,
    formatDateRange,
    getAttendeeStatusInfo
} from "../features/default/calender";

interface CalendarsListProps {
    accountId: string;
    onSelectCalendar?: (calendar: CalendarResource) => void;
    onCreateCalendar?: () => void;
}

const CalendarsList: React.FC<CalendarsListProps> = ({
    accountId,
    onSelectCalendar,
    onCreateCalendar
}) => {
    const {
        calendars,
        loading,
        error,
        nextPageToken,
        listCalendars,
        deleteCalendar
    } = useCalendarList(accountId);

    useEffect(() => {
        // Load calendars when component mounts
        listCalendars();
    }, [listCalendars]);

    const handleLoadMore = () => {
        if (nextPageToken) {
            listCalendars({ pageToken: nextPageToken });
        }
    };

    const handleDeleteCalendar = async (calendarId: string) => {
        if (window.confirm('Are you sure you want to delete this calendar? This action cannot be undone.')) {
            await deleteCalendar(calendarId);
        }
    };

    if (loading && calendars.length === 0) {
        return <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>;
    }

    if (error) {
        return <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Your Calendars</h2>
                {onCreateCalendar && (
                    <button
                        onClick={onCreateCalendar}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
                    >
                        Create Calendar
                    </button>
                )}
            </div>

            {calendars.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No calendars found.</p>
            ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {calendars.map(calendar => (
                        <div
                            key={calendar.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${calendar.primary ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}
                            onClick={() => onSelectCalendar && onSelectCalendar(calendar)}
                        >
                            <div className="flex items-center">
                                <div
                                    className="w-4 h-4 rounded-full mr-3"
                                    style={{ backgroundColor: calendar.backgroundColor || '#4285F4' }}
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-800">
                                        {calendar.summary || 'Untitled Calendar'}
                                        {calendar.primary && <span className="ml-2 text-xs bg-blue-100 text-blue-800 py-1 px-2 rounded-full">Primary</span>}
                                    </div>
                                    {calendar.description && (
                                        <div className="text-sm text-gray-600 mt-1">{calendar.description}</div>
                                    )}
                                </div>

                                {!calendar.primary && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteCalendar(calendar.id!);
                                        }}
                                        className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                                        title="Delete calendar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18"></path>
                                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {nextPageToken && (
                <div className="mt-6 text-center">
                    <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition duration-200 disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}
        </div>
    );
};

interface EventsListProps {
    accountId: string;
    calendarId?: string;
    onSelectEvent?: (event: CalendarEvent) => void;
    onCreateEvent?: () => void;
}

const EventsList: React.FC<EventsListProps> = ({
    accountId,
    calendarId = 'primary',
    onSelectEvent,
    onCreateEvent
}) => {
    const {
        events,
        loading,
        error,
        nextPageToken,
        listEvents,
        deleteEvent
    } = useCalendarEvents(accountId);

    const [timeRange, setTimeRange] = useState<'upcoming' | 'past' | 'all'>('upcoming');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Load events when component mounts or timeRange/calendarId changes
        loadEvents();
    }, [accountId, calendarId, timeRange]);

    const loadEvents = () => {
        const now = new Date().toISOString();

        const params: {
            calendarId: string;
            timeMin?: string;
            timeMax?: string;
            maxResults?: number;
            orderBy?: 'startTime' | 'updated';
            q?: string;
            singleEvents?: boolean;
        } = {
            calendarId,
            maxResults: 20,
            singleEvents: true, // Expand recurring events
            orderBy: 'startTime'
        };

        if (timeRange === 'upcoming') {
            params.timeMin = now;
        } else if (timeRange === 'past') {
            params.timeMax = now;
            params.orderBy = 'updated'; // Show most recently updated first for past events
        }

        if (searchTerm) {
            params.q = searchTerm;
        }

        listEvents(params);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadEvents();
    };

    const handleLoadMore = () => {
        if (!nextPageToken) return;

        const now = new Date().toISOString();

        const params: {
            calendarId: string;
            timeMin?: string;
            timeMax?: string;
            pageToken: string;
            singleEvents?: boolean;
            q?: string;
        } = {
            calendarId,
            pageToken: nextPageToken,
            singleEvents: true
        };

        if (timeRange === 'upcoming') {
            params.timeMin = now;
        } else if (timeRange === 'past') {
            params.timeMax = now;
        }

        if (searchTerm) {
            params.q = searchTerm;
        }

        listEvents(params);
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            const sendUpdates = window.confirm('Notify attendees about this cancellation?')
                ? 'all'
                : 'none';

            await deleteEvent(eventId, { calendarId, sendUpdates });
        }
    };

    if (loading && events.length === 0) {
        return <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>;
    }

    if (error) {
        return <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Events</h2>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="w-full sm:w-auto">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value as 'upcoming' | 'past' | 'all')}
                            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="upcoming">Upcoming</option>
                            <option value="past">Past</option>
                            <option value="all">All</option>
                        </select>
                    </div>

                    <form onSubmit={handleSearch} className="flex w-full sm:w-auto">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search events..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-gray-100 border border-gray-300 border-l-0 rounded-r-md hover:bg-gray-200 transition duration-200"
                        >
                            Search
                        </button>
                    </form>

                    {onCreateEvent && (
                        <button
                            onClick={onCreateEvent}
                            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
                        >
                            Create Event
                        </button>
                    )}
                </div>
            </div>

            {events.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-gray-500">No events found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {events.map(event => (
                        <div
                            key={event.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${event.status === 'cancelled' ? 'opacity-60 bg-gray-50' : ''}`}
                            onClick={() => onSelectEvent && onSelectEvent(event)}
                        >
                            <div className="flex items-start">
                                <div
                                    className="w-2 h-full self-stretch rounded-full mr-4"
                                    style={{ backgroundColor: getEventStatusColor(event) }}
                                />

                                <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                        <div className="font-medium text-gray-800">{event.summary || 'Untitled Event'}</div>
                                        <div className="text-sm text-gray-600">{formatEventTime(event)}</div>
                                    </div>

                                    {event.location && (
                                        <div className="text-sm text-gray-600 mt-2 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                <circle cx="12" cy="10" r="3"></circle>
                                            </svg>
                                            {event.location}
                                        </div>
                                    )}

                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {event.attendees && event.attendees.length > 0 && (
                                            <div className="text-xs bg-blue-50 text-blue-700 py-1 px-2 rounded-full">
                                                {event.attendees.length} {event.attendees.length === 1 ? 'attendee' : 'attendees'}
                                            </div>
                                        )}

                                        {event.conferenceData && event.hangoutLink && (
                                            <div className="text-xs bg-green-50 text-green-700 py-1 px-2 rounded-full flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                                    <path d="M23 7l-7 5 7 5V7z"></path>
                                                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                                                </svg>
                                                Video call
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteEvent(event.id!);
                                    }}
                                    className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                                    title="Delete event"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 6h18"></path>
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {nextPageToken && (
                <div className="mt-6 text-center">
                    <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition duration-200 disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}
        </div>
    );
};

interface EventFormProps {
    accountId: string;
    eventToEdit?: CalendarEvent;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const EventForm: React.FC<EventFormProps> = ({
    accountId,
    eventToEdit,
    onSuccess,
    onCancel
}) => {
    const { createEvent, updateEvent, loading: eventLoading, error: eventError } = useCalendarEvents(accountId);
    const { calendars, listCalendars, loading: calendarLoading } = useCalendarList(accountId);

    // Default form data
    const defaultFormData: EventFormData = {
        summary: '',
        description: '',
        location: '',
        allDay: false,
        startDate: new Date().toISOString().split('T')[0],
        startTime: new Date().toTimeString().slice(0, 5),
        endDate: new Date().toISOString().split('T')[0],
        endTime: new Date(Date.now() + 60 * 60 * 1000).toTimeString().slice(0, 5), // 1 hour later
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        attendees: '',
        addConference: false,
        reminderMethod: 'popup',
        reminderMinutes: 30,
        useDefaultReminders: true
    };

    const [formData, setFormData] = useState<EventFormData>(defaultFormData);

    useEffect(() => {
        // Load calendars for the dropdown
        listCalendars();

        // If editing an event, populate the form
        if (eventToEdit) {
            setFormData(eventToFormData(eventToEdit));
        }
    }, [eventToEdit, listCalendars]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));

        // If toggling all-day, adjust the time fields
        if (name === 'allDay') {
            if (checked) {
                // When switching to all-day, reset time to midnight
                setFormData(prev => ({
                    ...prev,
                    startTime: '00:00',
                    endTime: '23:59'
                }));
            } else {
                // When switching to timed, set reasonable defaults
                const now = new Date();
                const hour = now.getHours();
                const minute = now.getMinutes();

                const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const endTime = `${(hour + 1).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

                setFormData(prev => ({
                    ...prev,
                    startTime,
                    endTime
                }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const params = formToEventParams(formData);

            if (eventToEdit) {
                // Update existing event
                await updateEvent(eventToEdit.id!, {
                    ...params,
                    calendarId: params.calendarId || 'primary',
                    sendUpdates: 'all'
                });
            } else {
                // Create new event
                await createEvent(params);
            }

            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Error saving event:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">{eventToEdit ? 'Edit Event' : 'Create New Event'}</h2>

            {(eventError || calendarLoading) && (
                <div className="bg-red-100 text-red-700 p-4 rounded-md">{eventError}</div>
            )}

            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label htmlFor="calendarId" className="block text-sm font-medium text-gray-700 mb-1">Calendar</label>
                        <select
                            id="calendarId"
                            name="calendarId"
                            value={formData.calendarId || 'primary'}
                            onChange={handleChange}
                            disabled={calendarLoading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                        >
                            <option value="primary">Primary Calendar</option>
                            {calendars.filter(cal => !cal.primary).map(calendar => (
                                <option key={calendar.id} value={calendar.id}>
                                    {calendar.summary}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                            type="text"
                            id="summary"
                            name="summary"
                            value={formData.summary}
                            onChange={handleChange}
                            required
                            placeholder="Add title"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="allDay"
                            name="allDay"
                            checked={formData.allDay}
                            onChange={handleCheckboxChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="allDay" className="ml-2 block text-sm text-gray-700">All day</label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start date *</label>
                            <input
                                type="date"
                                id="startDate"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {!formData.allDay && (
                            <div>
                                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Start time *</label>
                                <input
                                    type="time"
                                    id="startTime"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End date *</label>
                            <input
                                type="date"
                                id="endDate"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                required
                                min={formData.startDate}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {!formData.allDay && (
                            <div>
                                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">End time *</label>
                                <input
                                    type="time"
                                    id="endTime"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}
                    </div>

                    {!formData.allDay && (
                        <div>
                            <label htmlFor="timeZone" className="block text-sm font-medium text-gray-700 mb-1">Time zone</label>
                            <select
                                id="timeZone"
                                name="timeZone"
                                value={formData.timeZone}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {COMMON_TIMEZONES.map(tz => (
                                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="Add location"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Add description"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="attendees" className="block text-sm font-medium text-gray-700 mb-1">Guests (comma-separated emails)</label>
                        <input
                            type="text"
                            id="attendees"
                            name="attendees"
                            value={formData.attendees}
                            onChange={handleChange}
                            placeholder="person1@example.com, person2@example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="addConference"
                            name="addConference"
                            checked={formData.addConference}
                            onChange={handleCheckboxChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="addConference" className="ml-2 block text-sm text-gray-700">Add Google Meet video conferencing</label>
                    </div>

                    <fieldset className="border border-gray-300 rounded-md p-4">
                        <legend className="text-sm font-medium text-gray-700 px-2">Reminders</legend>

                        <div className="flex items-center mb-4">
                            <input
                                type="checkbox"
                                id="useDefaultReminders"
                                name="useDefaultReminders"
                                checked={formData.useDefaultReminders}
                                onChange={handleCheckboxChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="useDefaultReminders" className="ml-2 block text-sm text-gray-700">Use default reminders</label>
                        </div>

                        {!formData.useDefaultReminders && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="reminderMethod" className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                                    <select
                                        id="reminderMethod"
                                        name="reminderMethod"
                                        value={formData.reminderMethod}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="email">Email</option>
                                        <option value="popup">Notification</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="reminderMinutes" className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                    <select
                                        id="reminderMinutes"
                                        name="reminderMinutes"
                                        value={formData.reminderMinutes.toString()}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="0">At time of event</option>
                                        <option value="5">5 minutes before</option>
                                        <option value="10">10 minutes before</option>
                                        <option value="15">15 minutes before</option>
                                        <option value="30">30 minutes before</option>
                                        <option value="60">1 hour before</option>
                                        <option value="120">2 hours before</option>
                                        <option value="1440">1 day before</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </fieldset>
                </div>
            </div>

      /* Continuation of EventForm component */
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition duration-200"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={eventLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50"
                >
                    {eventLoading
                        ? (eventToEdit ? 'Updating...' : 'Creating...')
                        : (eventToEdit ? 'Update Event' : 'Create Event')}
                </button>
            </div>
        </form>
    );
};

interface CalendarFormProps {
    accountId: string;
    calendarToEdit?: CalendarResource;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const CalendarForm: React.FC<CalendarFormProps> = ({
    accountId,
    calendarToEdit,
    onSuccess,
    onCancel
}) => {
    const { createCalendar, updateCalendar, loading, error } = useCalendarList(accountId);

    const [formData, setFormData] = useState({
        summary: '',
        description: '',
        location: '',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    useEffect(() => {
        // If editing a calendar, populate the form
        if (calendarToEdit) {
            setFormData({
                summary: calendarToEdit.summary || '',
                description: calendarToEdit.description || '',
                location: calendarToEdit.location || '',
                timeZone: calendarToEdit.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
            });
        }
    }, [calendarToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (calendarToEdit) {
                // Update existing calendar
                await updateCalendar(calendarToEdit.id!, formData);
            } else {
                // Create new calendar
                await createCalendar(formData);
            }

            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Error saving calendar:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">{calendarToEdit ? 'Edit Calendar' : 'Create New Calendar'}</h2>

            {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>
            )}

            <div className="space-y-4">
                <div>
                    <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                        type="text"
                        id="summary"
                        name="summary"
                        value={formData.summary}
                        onChange={handleChange}
                        required
                        placeholder="Calendar name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Calendar description"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Calendar location"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="timeZone" className="block text-sm font-medium text-gray-700 mb-1">Time Zone</label>
                    <select
                        id="timeZone"
                        name="timeZone"
                        value={formData.timeZone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {COMMON_TIMEZONES.map(tz => (
                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition duration-200"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50"
                >
                    {loading
                        ? (calendarToEdit ? 'Updating...' : 'Creating...')
                        : (calendarToEdit ? 'Update Calendar' : 'Create Calendar')}
                </button>
            </div>
        </form>
    );
};

interface EventDetailsProps {
    accountId: string;
    eventId: string;
    calendarId?: string;
    onEdit?: (event: CalendarEvent) => void;
    onBack?: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({
    accountId,
    eventId,
    calendarId = 'primary',
    onEdit,
    onBack
}) => {
    const { event, loading, error, getEvent } = useCalendarEvents(accountId);

    useEffect(() => {
        // Load event when component mounts
        getEvent(eventId, calendarId);
    }, [eventId, calendarId, getEvent]);

    if (loading && !event) {
        return <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>;
    }

    if (error) {
        return <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>;
    }

    if (!event) {
        return <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md">Event not found</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Back
                    </button>
                )}

                <h2 className="text-2xl font-bold text-gray-800">{event.summary || 'Untitled Event'}</h2>

                {onEdit && (
                    <button
                        onClick={() => onEdit(event)}
                        className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit
                    </button>
                )}
            </div>

            <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Date & Time</h3>
                    <p className="text-gray-700">{event.start && event.end && formatDateRange(event.start, event.end, event.start.timeZone)}</p>
                    {event.recurrence && (
                        <p className="text-gray-600 mt-2 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                <path d="M17 1l4 4-4 4"></path>
                                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                                <path d="M7 23l-4-4 4-4"></path>
                                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                            </svg>
                            <span>Recurring: {event.recurrence[0].replace('RRULE:', '').replace(';', ', ').replace('=', ' ')}</span>
                        </p>
                    )}
                </div>

                {event.location && (
                    <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Location</h3>
                        <p className="text-gray-700 flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 mt-1">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span>{event.location}</span>
                        </p>
                    </div>
                )}

                {event.description && (
                    <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Description</h3>
                        <div className="text-gray-700 whitespace-pre-line">{event.description}</div>
                    </div>
                )}

                {event.conferenceData && event.hangoutLink && (
                    <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Video call</h3>
                        <a
                            href={event.hangoutLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                <path d="M23 7l-7 5 7 5V7z"></path>
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                            </svg>
                            Join with Google Meet
                        </a>
                    </div>
                )}

                {event.attendees && event.attendees.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Attendees</h3>
                        <ul className="divide-y divide-gray-200">
                            {event.attendees.map((attendee, index) => {
                                const statusInfo = getAttendeeStatusInfo(attendee.responseStatus);
                                return (
                                    <li key={index} className="py-3 flex justify-between items-center">
                                        <div>
                                            <div className="font-medium text-gray-800">
                                                {attendee.displayName || attendee.email}
                                                {attendee.organizer && <span className="ml-2 text-xs bg-blue-100 text-blue-800 py-1 px-2 rounded-full">Organizer</span>}
                                                {attendee.optional && <span className="ml-2 text-xs bg-gray-100 text-gray-800 py-1 px-2 rounded-full">Optional</span>}
                                            </div>
                                            {attendee.displayName && <div className="text-sm text-gray-500">{attendee.email}</div>}
                                        </div>
                                        <div
                                            className="text-sm font-medium"
                                            style={{ color: statusInfo.color }}
                                        >
                                            {statusInfo.text}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                {event.reminders && (
                    <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Reminders</h3>
                        {event.reminders.useDefault ? (
                            <p className="text-gray-700">Default reminders</p>
                        ) : (
                            <ul className="list-disc list-inside text-gray-700">
                                {event.reminders.overrides?.map((reminder, index) => (
                                    <li key={index}>
                                        {reminder.method === 'email' ? 'Email' : 'Notification'} {reminder.minutes} minute{reminder.minutes !== 1 ? 's' : ''} before
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {event.creator && (
                    <div className="text-sm text-gray-500 mt-6 border-t border-gray-200 pt-4">
                        <p>Created by {event.creator.displayName || event.creator.email}</p>
                        {event.created && (
                            <p>Created on {new Date(event.created).toLocaleDateString()} at {new Date(event.created).toLocaleTimeString()}</p>
                        )}
                        {event.updated && event.updated !== event.created && (
                            <p>Last modified on {new Date(event.updated).toLocaleDateString()} at {new Date(event.updated).toLocaleTimeString()}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

interface CalendarAppProps {
    accountId: string;
}

type AppView = 'calendars' | 'events' | 'event-details' | 'create-event' | 'edit-event' | 'create-calendar' | 'edit-calendar';

const CalendarApp: React.FC<CalendarAppProps> = ({ accountId }) => {
    const [currentView, setCurrentView] = useState<AppView>('calendars');
    const [selectedCalendar, setSelectedCalendar] = useState<CalendarResource | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    const handleSelectCalendar = (calendar: CalendarResource) => {
        setSelectedCalendar(calendar);
        setCurrentView('events');
    };

    const handleCreateCalendar = () => {
        setCurrentView('create-calendar');
    };

    const handleEditCalendar = (calendar: CalendarResource) => {
        setSelectedCalendar(calendar);
        setCurrentView('edit-calendar');
    };

    const handleCalendarSaved = () => {
        setCurrentView('calendars');
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setCurrentView('event-details');
    };

    const handleCreateEvent = () => {
        setSelectedEvent(null);
        setCurrentView('create-event');
    };

    const handleEditEvent = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setCurrentView('edit-event');
    };

    const handleEventSaved = () => {
        setCurrentView('events');
    };

    const handleBackToCalendars = () => {
        setCurrentView('calendars');
        setSelectedCalendar(null);
    };

    const handleBackToEvents = () => {
        setCurrentView('events');
        setSelectedEvent(null);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Google Calendar</h1>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <button
                                onClick={handleBackToCalendars}
                                className={`px-3 py-1 rounded-md ${currentView === 'calendars' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
                            >
                                Calendars
                            </button>

                            {selectedCalendar && (
                                <>
                                    <span className="mx-2 text-gray-400">&gt;</span>
                                    <button
                                        onClick={handleBackToEvents}
                                        className={`px-3 py-1 rounded-md ${currentView === 'events' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
                                    >
                                        {selectedCalendar.summary}
                                    </button>

                                    {selectedEvent && (
                                        <>
                                            <span className="mx-2 text-gray-400">&gt;</span>
                                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md">
                                                {currentView === 'event-details' ? 'Details' : 'Edit'}
                                            </span>
                                        </>
                                    )}
                                </>
                            )}

                            {currentView === 'create-event' && (
                                <>
                                    <span className="mx-2 text-gray-400">&gt;</span>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md">Create Event</span>
                                </>
                            )}

                            {currentView === 'create-calendar' && (
                                <>
                                    <span className="mx-2 text-gray-400">&gt;</span>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md">Create Calendar</span>
                                </>
                            )}

                            {currentView === 'edit-calendar' && (
                                <>
                                    <span className="mx-2 text-gray-400">&gt;</span>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md">Edit Calendar</span>
                                </>
                            )}
                        </div>

                        {currentView === 'calendars' && (
                            <button
                                onClick={handleCreateCalendar}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
                            >
                                Create Calendar
                            </button>
                        )}

                        {currentView === 'events' && (
                            <button
                                onClick={handleCreateEvent}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
                            >
                                Create Event
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {currentView === 'calendars' && (
                <CalendarsList
                    accountId={accountId}
                    onSelectCalendar={handleSelectCalendar}
                    onCreateCalendar={handleCreateCalendar}
                />
            )}

            {currentView === 'events' && selectedCalendar && (
                <EventsList
                    accountId={accountId}
                    calendarId={selectedCalendar.id}
                    onSelectEvent={handleSelectEvent}
                    onCreateEvent={handleCreateEvent}
                />
            )}

            {currentView === 'event-details' && selectedEvent && (
                <EventDetails
                    accountId={accountId}
                    eventId={selectedEvent.id!}
                    calendarId={selectedCalendar?.id}
                    onEdit={handleEditEvent}
                    onBack={handleBackToEvents}
                />
            )}

            {(currentView === 'create-event' || currentView === 'edit-event') && (
                <EventForm
                    accountId={accountId}
                    eventToEdit={currentView === 'edit-event' ? selectedEvent! : undefined}
                    onSuccess={handleEventSaved}
                    onCancel={handleBackToEvents}
                />
            )}

            {(currentView === 'create-calendar' || currentView === 'edit-calendar') && (
                <CalendarForm
                    accountId={accountId}
                    calendarToEdit={currentView === 'edit-calendar' ? selectedCalendar! : undefined}
                    onSuccess={handleCalendarSaved}
                    onCancel={handleBackToCalendars}
                />
            )}
        </div>
    );
};

const GoogleCalendarApi: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const { currentAccount } = useAccount();

    if (isLoading) {
        return (
            <div className="w-full h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm p-4">
                <div className="container mx-auto">
                    <h1 className="text-2xl font-bold text-gray-800">Google Calendar Manager</h1>
                </div>
            </header>
            <main className="container mx-auto p-4">
                {isAuthenticated && currentAccount?.accountId ? (
                    <CalendarApp accountId={currentAccount.accountId} />
                ) : (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
                        <p className="text-gray-600">Please sign in to access your calendars.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default GoogleCalendarApi;