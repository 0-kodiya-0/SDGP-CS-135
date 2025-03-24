import React, { useEffect, useState } from 'react';
import { Calendar, SquarePlus, Search, X, RefreshCcw, Loader2, CalendarPlus } from 'lucide-react';
import { useTabStore } from '../../../required/tab_view';
import { useCalendarEvents } from '../hooks/useCalendarEvents.google';
import { useCalendarList } from '../hooks/useCalendarList.google';
import { CalendarEvent } from '../types/types.google.api';
import { getEventStatusColor, formatEventTime } from '../utils/utils.google.api';
import { ComponentTypes } from '../../../required/tab_view/types/types.views';

interface SummaryViewProps {
  accountId: string;
}

export default function CalendarSummaryView({ accountId }: SummaryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const { calendars, loading: loadingCalendars, error: calendarError, listCalendars } = useCalendarList(accountId);
  const { events, loading: loadingEvents, error: eventsError, listEvents } = useCalendarEvents(accountId);
  const addTab = useTabStore(state => state.addTab);

  // Initialize data on component mount
  useEffect(() => {
    if (accountId) {
      listCalendars();
    }
  }, [accountId, listCalendars]);

  // Set initial selected calendars once they're loaded
  useEffect(() => {
    if (myCalendars.length > 0 && selectedCalendarIds.length === 0) {
      // Initially select all "my calendars"
      setSelectedCalendarIds(myCalendars.map(cal => cal.id || '').filter(id => id));
    }
  }, [calendars, selectedCalendarIds]);

  // Fetch events when selected calendars change
  useEffect(() => {
    if (accountId && selectedCalendarIds.length > 0) {
      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get the end of the month
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

      // Format dates as ISO strings for the API
      const timeMin = today.toISOString();
      const timeMax = endOfMonth.toISOString();

      // Fetch events for the current month
      listEvents({
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime'
      });
    }
  }, [accountId, listEvents, selectedCalendarIds]);

  // Filter events by search query and selected calendars
  const filteredEvents = events.filter(event => {
    // First check if this event's calendar is selected
    const eventCalendarId = event.organizer?.email || '';
    const isCalendarSelected = selectedCalendarIds.includes(eventCalendarId);

    // Then check if it matches the search query
    const matchesSearch = searchQuery ? (
      (event.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchQuery.toLowerCase()))
    ) : true;

    return isCalendarSelected && matchesSearch;
  });

  // Open the full calendar view in a tab
  const handleOpenCalendarView = () => {
    addTab(
      "Calendar",
      null,
      ComponentTypes.CALENDAR_VIEW,
      { accountId }
    );
  };

  // Open an event detail view in a tab
  const handleViewEvent = (event: CalendarEvent) => {
    addTab(
      `Event: ${event.summary || 'Untitled'}`,
      null,
      ComponentTypes.CALENDAR_EVENT_VIEW,
      {
        accountId,
        eventId: event.id || '',
        calendarId: event.organizer?.email || ''
      }
    );
  };

  // Open create event view in a tab
  const handleAddEvent = () => {
    addTab(
      "New Event",
      null,
      ComponentTypes.CALENDAR_CREATE_EVENT_VIEW,
      { accountId }
    );
  };

  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const refreshData = () => {
    listCalendars();

    // If the user has any selected calendars, refresh upcoming events
    if (accountId && selectedCalendarIds.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
      const timeMin = today.toISOString();
      const timeMax = endOfMonth.toISOString();

      listEvents({
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime'
      });
    }
  };

  const myCalendars = calendars.filter(
    (calendar) => calendar.primary || calendar.accessRole === "owner"
  );

  // Handle opening the create calendar view
  const handleOpenCreateCalendarView = () => {
    addTab(
      "Create Calendar",
      null,
      ComponentTypes.CALENDAR_CREATE_CALENDAR_VIEW,
      { accountId }
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-500" />
          <h2 className="text-lg font-medium">Calendar</h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleOpenCalendarView}
            className="p-1 text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded"
            title="Open full calendar"
          >
            <Calendar className="w-4 h-4" />
          </button>
          <button
            onClick={handleAddEvent}
            className="p-1 text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded"
            title="Create new event"
          >
            <SquarePlus className="w-4 h-4" />
          </button>
          {/* Refresh button */}
          <button
            onClick={refreshData}
            className="p-1 text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded"
            title="Refresh"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenCreateCalendarView}
            className="p-1 text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded"
            title="Create new calendar"
          >
            <CalendarPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search events..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <button
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={handleClearSearch}
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Calendar list */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">My Calendars</h3>
        {loadingCalendars ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500 mr-2" />
            <span className="text-sm text-gray-500">Loading calendars...</span>
          </div>
        ) : calendarError ? (
          <div className="text-sm text-red-500 p-2">{calendarError}</div>
        ) : (
          <ul className="space-y-2">
            {myCalendars.map((calendar) => {
              const calendarStateId = `calendar-${calendar.id}`;
              const calendarId = calendar.id || '';
              const isSelected = selectedCalendarIds.includes(calendarId);

              return (
                <li key={calendar.id} className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    id={calendarStateId}
                    className="w-4 h-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCalendarIds(prev => [...prev, calendarId]);
                      } else {
                        setSelectedCalendarIds(prev => prev.filter(id => id !== calendarId));
                      }
                    }}
                  />
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: calendar.backgroundColor || '#4285F4' }}
                  />
                  <label htmlFor={calendarStateId} className="cursor-pointer flex-grow truncate">
                    {calendar.summary}
                    {calendar.primary && (
                      <span className="ml-1 text-xs text-gray-500">(Primary)</span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Upcoming events */}
      <div className="flex-grow overflow-y-auto">
        <h3 className="text-sm font-medium text-gray-700 p-4 pb-2">Upcoming Events</h3>
        {loadingEvents ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500 mr-2" />
            <span className="text-sm text-gray-500">Loading events...</span>
          </div>
        ) : eventsError ? (
          <div className="text-sm text-red-500 p-4">{eventsError}</div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-sm text-gray-500 p-4">
            {searchQuery ? 'No events match your search' : 'No upcoming events'}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredEvents.map((event) => (
              <li
                key={event.id}
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleViewEvent(event)}
              >
                <div className="flex items-start">
                  <div
                    className="w-1 self-stretch mr-3 rounded"
                    style={{ backgroundColor: getEventStatusColor(event) }}
                  />
                  <div className="flex-grow min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {event.summary || 'Untitled Event'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatEventTime(event)}
                    </p>
                    {event.location && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {event.location}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}