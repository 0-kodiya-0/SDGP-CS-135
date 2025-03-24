import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, MapPin, Users, Video, Save, X } from 'lucide-react';
import { useTabStore } from '../../../required/tab_view';
import { COMMON_TIMEZONES } from '../../chat';
import { useCalendarEvents } from '../hooks/useCalendarEvents.google';
import { useCalendarList } from '../hooks/useCalendarList.google';
import { CalendarEvent, EventFormData } from '../types/types.google.api';
import { eventToFormData, formToEventParams } from '../utils/utils.google.api';

interface EditEventViewProps {
    accountId: string;
    event: CalendarEvent;
}

export default function EditEventView({ accountId, event }: EditEventViewProps) {
    const [formData, setFormData] = useState<EventFormData>(eventToFormData(event));
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const { calendars, loading: loadingCalendars, listCalendars } = useCalendarList(accountId);
    const { updateEvent, loading: loadingEvent } = useCalendarEvents(accountId);
    const { closeTab } = useTabStore();

    // Load calendars on component mount
    useEffect(() => {
        if (accountId) {
            listCalendars();
        }
    }, [accountId, listCalendars]);

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle checkbox change
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaveError(null);

        try {
            if (!event.id) {
                throw new Error('Event ID is missing');
            }

            // Convert form data to API parameters
            const eventParams = formToEventParams(formData);

            // Update the event
            const updatedEvent = await updateEvent(event.id, {
                ...eventParams,
                sendUpdates: 'all'
            });

            if (updatedEvent) {
                setSaveSuccess(true);
                // Close the tab after a short delay
                setTimeout(() => {
                    closeTab("current");
                }, 2000);
            } else {
                setSaveError('Failed to update event');
            }
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setSaving(false);
        }
    };

    if (saveSuccess) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4">
                <div className="text-green-500 text-lg mb-4">Event successfully updated!</div>
                <div className="text-gray-500">Closing this tab...</div>
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
                        title="Cancel"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-medium">Edit Event</h2>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => closeTab("current")}
                        className="flex items-center px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded border border-gray-300"
                    >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving || loadingEvent}
                        className={`flex items-center px-3 py-1 text-sm text-white rounded ${saving || loadingEvent
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                    >
                        <Save className="w-4 h-4 mr-1" />
                        {saving || loadingEvent ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Form content */}
            <div className="flex-grow p-6 overflow-y-auto">
                <div className="max-w-3xl mx-auto">
                    {saveError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                            {saveError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Event title */}
                        <div className="mb-6">
                            <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
                                Event Title*
                            </label>
                            <input
                                type="text"
                                id="summary"
                                name="summary"
                                value={formData.summary}
                                onChange={handleInputChange}
                                required
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Add title"
                            />
                        </div>

                        {/* Calendar selection */}
                        <div className="mb-6">
                            <label htmlFor="calendarId" className="block text-sm font-medium text-gray-700 mb-1">
                                Calendar
                            </label>
                            <select
                                id="calendarId"
                                name="calendarId"
                                value={formData.calendarId}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {loadingCalendars ? (
                                    <option>Loading calendars...</option>
                                ) : (
                                    calendars.map(calendar => (
                                        <option key={calendar.id} value={calendar.id}>
                                            {calendar.summary} {calendar.primary && '(Primary)'}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        {/* Date and time section */}
                        <div className="mb-6 p-4 border border-gray-200 rounded-md">
                            <div className="flex items-start mb-4">
                                <Calendar className="w-5 h-5 text-gray-500 mr-3 mt-1" />
                                <div className="flex-grow">
                                    <h3 className="text-sm font-medium text-gray-700 mb-3">Date & Time</h3>

                                    {/* All-day toggle */}
                                    <div className="mb-4 flex items-center">
                                        <input
                                            type="checkbox"
                                            id="allDay"
                                            name="allDay"
                                            checked={formData.allDay}
                                            onChange={handleCheckboxChange}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor="allDay" className="ml-2 text-sm text-gray-700">
                                            All-day event
                                        </label>
                                    </div>

                                    {/* Start date/time */}
                                    <div className="mb-4">
                                        <label htmlFor="startDate" className="block text-sm text-gray-700 mb-1">
                                            Start
                                        </label>
                                        <div className="flex space-x-2">
                                            <input
                                                type="date"
                                                id="startDate"
                                                name="startDate"
                                                value={formData.startDate}
                                                onChange={handleInputChange}
                                                required
                                                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            {!formData.allDay && (
                                                <input
                                                    type="time"
                                                    id="startTime"
                                                    name="startTime"
                                                    value={formData.startTime}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* End date/time */}
                                    <div className="mb-4">
                                        <label htmlFor="endDate" className="block text-sm text-gray-700 mb-1">
                                            End
                                        </label>
                                        <div className="flex space-x-2">
                                            <input
                                                type="date"
                                                id="endDate"
                                                name="endDate"
                                                value={formData.endDate}
                                                onChange={handleInputChange}
                                                required
                                                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            {!formData.allDay && (
                                                <input
                                                    type="time"
                                                    id="endTime"
                                                    name="endTime"
                                                    value={formData.endTime}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Time zone */}
                                    {!formData.allDay && (
                                        <div>
                                            <label htmlFor="timeZone" className="block text-sm text-gray-700 mb-1">
                                                Time Zone
                                            </label>
                                            <select
                                                id="timeZone"
                                                name="timeZone"
                                                value={formData.timeZone}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {COMMON_TIMEZONES.map(tz => (
                                                    <option key={tz.value} value={tz.value}>
                                                        {tz.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="mb-6">
                            <div className="flex items-start">
                                <MapPin className="w-5 h-5 text-gray-500 mr-3 mt-1" />
                                <div className="flex-grow">
                                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        id="location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Add location"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Video conference */}
                        <div className="mb-6">
                            <div className="flex items-start">
                                <Video className="w-5 h-5 text-gray-500 mr-3 mt-0.5" />
                                <div className="flex-grow">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="addConference"
                                            name="addConference"
                                            checked={formData.addConference}
                                            onChange={handleCheckboxChange}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor="addConference" className="ml-2 text-sm text-gray-700">
                                            Add Google Meet video conferencing
                                        </label>
                                    </div>
                                    {event.hangoutLink && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            Existing conference link: {event.hangoutLink}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Attendees */}
                        <div className="mb-6">
                            <div className="flex items-start">
                                <Users className="w-5 h-5 text-gray-500 mr-3 mt-1" />
                                <div className="flex-grow">
                                    <label htmlFor="attendees" className="block text-sm font-medium text-gray-700 mb-1">
                                        Attendees
                                    </label>
                                    <textarea
                                        id="attendees"
                                        name="attendees"
                                        value={formData.attendees}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Add guests (comma separated email addresses)"
                                        rows={3}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Separate multiple email addresses with commas
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-6">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Add description"
                                rows={5}
                            />
                        </div>

                        {/* Reminders */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Reminders</h3>
                            <div className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    id="useDefaultReminders"
                                    name="useDefaultReminders"
                                    checked={formData.useDefaultReminders}
                                    onChange={handleCheckboxChange}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="useDefaultReminders" className="ml-2 text-sm text-gray-700">
                                    Use default reminders
                                </label>
                            </div>

                            {!formData.useDefaultReminders && (
                                <div className="flex items-center space-x-2 pl-6">
                                    <select
                                        id="reminderMinutes"
                                        name="reminderMinutes"
                                        value={formData.reminderMinutes}
                                        onChange={handleInputChange}
                                        className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="0">0 minutes</option>
                                        <option value="5">5 minutes</option>
                                        <option value="10">10 minutes</option>
                                        <option value="15">15 minutes</option>
                                        <option value="30">30 minutes</option>
                                        <option value="60">1 hour</option>
                                        <option value="120">2 hours</option>
                                        <option value="1440">1 day</option>
                                    </select>

                                    <select
                                        id="reminderMethod"
                                        name="reminderMethod"
                                        value={formData.reminderMethod}
                                        onChange={handleInputChange}
                                        className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="popup">Notification</option>
                                        <option value="email">Email</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}