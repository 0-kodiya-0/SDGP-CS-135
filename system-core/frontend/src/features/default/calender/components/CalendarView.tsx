import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, SquarePlus, Loader2, Check, Filter, RefreshCcw, CalendarPlus } from 'lucide-react';
import Calendar from '@toast-ui/react-calendar';
import '@toast-ui/calendar/dist/toastui-calendar.min.css';
import CreateEventView from './CreateEventView';
import CalendarEventView from './CalendarEventView';
import { useTabs } from '../../../required/tab_view';
import { useCalendarList } from '../hooks/useCalendarList.google';
import { useEnhancedCalendarEvents } from '../hooks/useEnhancedCalendarEvents';
import CreateCalendarView from './CreateCalendarView';


interface CalendarViewProps {
    accountId: string;
}

export default function CalendarView({ accountId }: CalendarViewProps) {
    const calendarRef = useRef<any>(null);
    const [view, setView] = useState<'month' | 'week' | 'day'>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
    const [showCalendarSelector, setShowCalendarSelector] = useState(false);

    const { calendars, loading: loadingCalendars, error: calendarError, listCalendars } = useCalendarList(accountId);
    const { events, loading: loadingEvents, error: eventsError, fetchEventsFromCalendars } = useEnhancedCalendarEvents(accountId);
    const { addTab } = useTabs();

    // Format the date for display in the header
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: view === 'day' ? 'numeric' : undefined
        });
    };

    // Initialize data on component mount
    useEffect(() => {
        if (accountId) {
            listCalendars();
        }
    }, [accountId, listCalendars]);

    // Set initial selected calendars once they're loaded
    useEffect(() => {
        if (calendars.length > 0 && selectedCalendarIds.length === 0) {
            // Initially select all calendars
            setSelectedCalendarIds(calendars.map(cal => cal.id || '').filter(id => id));
        }

    }, [calendars, selectedCalendarIds]);

    // Refresh events when view, date or selected calendars change
    useEffect(() => {
        if (accountId && selectedCalendarIds.length > 0) {
            refreshEvents(currentDate);
        }
    }, [accountId, currentDate, view, selectedCalendarIds]);

    // Refresh events when view or date changes
    const refreshEvents = (date: Date) => {
        // Calculate date range based on view (same as before)
        let timeMin: Date, timeMax: Date;
        const year = date.getFullYear();
        const month = date.getMonth();
    
        if (view === 'month') {
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const firstDayOfWeek = firstDay.getDay();
            const lastDayOfWeek = lastDay.getDay();
            timeMin = new Date(year, month, 1 - firstDayOfWeek);
            timeMax = new Date(year, month + 1, 6 - lastDayOfWeek);
        } else if (view === 'week') {
            const day = date.getDate();
            const dayOfWeek = date.getDay();
            timeMin = new Date(year, month, day - dayOfWeek);
            timeMax = new Date(year, month, day + (6 - dayOfWeek), 23, 59, 59);
        } else {
            timeMin = new Date(year, month, date.getDate());
            timeMax = new Date(year, month, date.getDate(), 23, 59, 59);
        }
    
        // Use the enhanced hook to fetch events for all selected calendars
        fetchEventsFromCalendars(
            selectedCalendarIds,
            timeMin.toISOString(),
            timeMax.toISOString()
        );
    };
    

    // Navigate to previous period
    const handlePrev = () => {
        if (calendarRef.current) {
            calendarRef.current.getInstance().prev();
            const newDate = calendarRef.current.getInstance().getDate().toDate();
            setCurrentDate(newDate);
        }
    };

    // Navigate to next period
    const handleNext = () => {
        if (calendarRef.current) {
            calendarRef.current.getInstance().next();
            const newDate = calendarRef.current.getInstance().getDate().toDate();
            setCurrentDate(newDate);
        }
    };

    // Navigate to today
    const handleToday = () => {
        if (calendarRef.current) {
            calendarRef.current.getInstance().today();
            setCurrentDate(new Date());
        }
    };

    // Change view (day, week, month)
    const handleViewChange = (newView: 'month' | 'week' | 'day') => {
        setView(newView);
        if (calendarRef.current) {
            calendarRef.current.getInstance().changeView(newView);
        }
    };

    // Handle event creation
    const handleAddEvent = () => {
        addTab("New Event", <CreateEventView accountId={accountId} />);
    };

    // Handle event click
    const handleEventClick = (event: any) => {
        const eventDetails = event.event;
        addTab(`Event: ${event.title || 'Untitled'}`, <CalendarEventView accountId={accountId} eventId={eventDetails.id} calendarId={eventDetails.calendarId}/>);
    };

    // Toggle all calendars
    const toggleAllCalendars = (select: boolean) => {
        if (select) {
            setSelectedCalendarIds(calendars.map(cal => cal.id || '').filter(id => id));
        } else {
            setSelectedCalendarIds([]);
        }
    };

    // Transform calendars into format expected by toast-ui - only include selected calendars
    const calendarItems = calendars
        .filter(calendar => selectedCalendarIds.includes(calendar.id || ''))
        .map(calendar => ({
            id: calendar.id || '',
            name: calendar.summary || 'Untitled',
            color: calendar.foregroundColor || '#000000',
            backgroundColor: calendar.backgroundColor || '#4285F4',
            borderColor: calendar.backgroundColor || '#4285F4'
        }));

    // Transform events into format expected by toast-ui - only include events from selected calendars
    const calendarEvents = events
        .filter(event => {
            const eventCalendarId = event.organizer?.email || '';
            return selectedCalendarIds.includes(eventCalendarId);
        })
        .map(event => {
            const isAllDay = Boolean(event.start?.date);
            const startDate = isAllDay
                ? new Date(event.start?.date as string)
                : new Date(event.start?.dateTime as string);
            const endDate = isAllDay
                ? new Date(event.end?.date as string)
                : new Date(event.end?.dateTime as string);

            // Adjust end date for all-day events (Google's end date is exclusive)
            if (isAllDay) {
                endDate.setDate(endDate.getDate() - 1);
            }

            return {
                id: event.id || '',
                calendarId: event.organizer?.email || 'primary',
                title: event.summary || 'Untitled',
                body: event.description || '',
                location: event.location || '',
                isAllDay,
                start: startDate,
                end: endDate,
                attendees: event.attendees?.map(a => a.email) || [],
                category: isAllDay ? 'allday' : 'time',
                state: event.status === 'cancelled' ? 'cancelled' : 'busy'
            };
        });

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-medium">{formatDate(currentDate)}</h2>
                    <div className="flex space-x-1">
                        <button
                            onClick={handlePrev}
                            className="p-1 text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded"
                            aria-label="Previous"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleNext}
                            className="p-1 text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded"
                            aria-label="Next"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleToday}
                            className="ml-2 px-3 py-1 text-sm bg-white text-gray-700 hover:bg-gray-100 rounded border border-gray-300"
                        >
                            Today
                        </button>
                        <button
                            onClick={() => refreshEvents(currentDate)}
                            className="p-1 text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded"
                            title="Refresh"
                        >
                            <RefreshCcw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="flex border border-gray-300 rounded overflow-hidden">
                        <button
                            onClick={() => handleViewChange('month')}
                            className={`px-3 py-1 text-sm font-medium ${view === 'month' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => handleViewChange('week')}
                            className={`px-3 py-1 text-sm font-medium ${view === 'week' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => handleViewChange('day')}
                            className={`px-3 py-1 text-sm font-medium ${view === 'day' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Day
                        </button>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowCalendarSelector(!showCalendarSelector)}
                            className={`flex items-center px-3 py-1 text-sm font-medium rounded border ${showCalendarSelector
                                    ? 'bg-gray-100 border-gray-400 text-gray-800'
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            aria-expanded={showCalendarSelector}
                        >
                            <Filter className="w-4 h-4 mr-1" />
                            Calendars
                        </button>

                        {showCalendarSelector && (
                            <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 shadow-lg rounded-md z-10 overflow-hidden">
                                <div className="p-3 border-b border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">My Calendars</h3>
                                    <div className="flex justify-between text-xs mb-1">
                                        <button
                                            className="text-blue-500 hover:text-blue-700"
                                            onClick={() => toggleAllCalendars(true)}
                                        >
                                            Select all
                                        </button>
                                        <button
                                            className="text-blue-500 hover:text-blue-700"
                                            onClick={() => toggleAllCalendars(false)}
                                        >
                                            Deselect all
                                        </button>
                                    </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto p-2">
                                    {loadingCalendars ? (
                                        <div className="flex items-center justify-center p-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-blue-500 mr-2" />
                                            <span className="text-sm text-gray-500">Loading...</span>
                                        </div>
                                    ) : (
                                        <ul className="space-y-2">
                                            {calendars.map((calendar) => {
                                                const calendarId = calendar.id || '';
                                                const isSelected = selectedCalendarIds.includes(calendarId);

                                                return (
                                                    <li key={calendar.id} className="flex items-center text-sm">
                                                        <div
                                                            className={`flex items-center justify-center w-5 h-5 rounded mr-2 border ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                                                                }`}
                                                            onClick={() => {
                                                                if (isSelected) {
                                                                    setSelectedCalendarIds(prev => prev.filter(id => id !== calendarId));
                                                                } else {
                                                                    setSelectedCalendarIds(prev => [...prev, calendarId]);
                                                                }
                                                            }}
                                                            role="checkbox"
                                                            aria-checked={isSelected}
                                                            tabIndex={0}
                                                        >
                                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                                        </div>
                                                        <div
                                                            className="w-3 h-3 rounded-full mr-2"
                                                            style={{ backgroundColor: calendar.backgroundColor || '#4285F4' }}
                                                        />
                                                        <span className="cursor-pointer flex-grow truncate"
                                                            onClick={() => {
                                                                if (isSelected) {
                                                                    setSelectedCalendarIds(prev => prev.filter(id => id !== calendarId));
                                                                } else {
                                                                    setSelectedCalendarIds(prev => [...prev, calendarId]);
                                                                }
                                                            }}
                                                        >
                                                            {calendar.summary}
                                                            {calendar.primary && (
                                                                <span className="ml-1 text-xs text-gray-500">(Primary)</span>
                                                            )}
                                                        </span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleAddEvent}
                        className="flex items-center px-3 py-1 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded"
                    >
                        <SquarePlus className="w-4 h-4 mr-1" />
                        New Event
                    </button>

                    <button
                        onClick={() => addTab("Create Calendar", <CreateCalendarView accountId={accountId} />)}
                        className="flex items-center px-3 py-1 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded"
                    >
                        <CalendarPlus className="w-4 h-4 mr-1" />
                        New Calendar
                    </button>
                </div>
            </div>

            {/* Calendar container */}
            <div className="flex-grow relative">
                {(loadingCalendars || loadingEvents) && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                        <div className="flex items-center bg-white p-3 rounded-lg shadow-md">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-3" />
                            <span className="text-gray-600 font-medium">Loading calendar...</span>
                        </div>
                    </div>
                )}
                {(calendarError || eventsError) && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                        <div className="text-red-600 p-4 bg-red-50 rounded-md border border-red-200 max-w-md">
                            <h3 className="font-medium mb-1">Error</h3>
                            <p>{calendarError || eventsError}</p>
                        </div>
                    </div>
                )}
                <div className="h-full">
                    {selectedCalendarIds.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <Filter className="w-6 h-6 mb-2 text-gray-400" />
                            <p className="mb-2">No calendars selected.</p>
                            <button
                                className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                                onClick={() => toggleAllCalendars(true)}
                            >
                                Show all calendars
                            </button>
                        </div>
                    ) : calendarItems.length > 0 && (
                        <Calendar
                            ref={calendarRef}
                            height="100%"
                            view={view}
                            useDetailPopup={true}
                            calendars={calendarItems}
                            events={calendarEvents}
                            onClickEvent={handleEventClick}
                            onBeforeCreateSchedule={handleAddEvent}
                            isReadOnly={false}
                            month={{
                                dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                                isAlways6Weeks: true,
                                visibleWeeksCount: 0
                            }}
                            week={{
                                dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                                showTimezoneCollapseButton: true,
                                timezonesCollapsed: false,
                                eventView: true,
                                taskView: false
                            }}
                            template={{
                                milestone(event) {
                                    return `<span style="color: ${event.color}">${event.title}</span>`;
                                },
                                allday(event) {
                                    return `<span style="color: ${event.color}">${event.title}</span>`;
                                },
                                time(event) {
                                    return `<span style="color: ${event.color}">${event.title}</span>`;
                                }
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}