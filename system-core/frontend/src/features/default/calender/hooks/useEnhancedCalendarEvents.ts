import { useState, useCallback } from 'react';
import { UseCalendarEventsReturn, CalendarEvent } from '../types/types.google.api';
import { useCalendarEvents } from './useCalendarEvents.google';

/**
 * Enhanced version of useCalendarEvents that supports fetching from multiple calendars
 */
export function useEnhancedCalendarEvents(accountId: string): UseCalendarEventsReturn & {
    fetchEventsFromCalendars: (
        calendarIds: string[],
        timeMin: string,
        timeMax: string
    ) => Promise<void>;
} {
    // Use the base hook
    const calendarEvents = useCalendarEvents(accountId);
    // Local state for merged events
    const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);

    /**
     * Fetch events from multiple calendars and merge the results.
     */
    const fetchEventsFromCalendars = useCallback(
        async (calendarIds: string[], timeMin: string, timeMax: string): Promise<void> => {
            if (calendarIds.length === 0) {
                setAllEvents([]);
                return;
            }

            let mergedEvents: CalendarEvent[] = [];

            // For each calendar ID, fetch events and merge them.
            for (const calendarId of calendarIds) {
                try {
                    const eventsFromCalendar = await calendarEvents.listEvents({
                        calendarId,
                        timeMin,
                        timeMax,
                        singleEvents: true,
                        orderBy: 'startTime'
                    });
                    mergedEvents = mergedEvents.concat(eventsFromCalendar);
                } catch (error) {
                    console.error(`Error fetching events for calendar ${calendarId}:`, error);
                }
            }

            setAllEvents(mergedEvents);
        },
        [calendarEvents]
    );

    // Return the enhanced hook, overriding the 'events' property with the merged events.
    return {
        ...calendarEvents,
        events: allEvents,
        fetchEventsFromCalendars
    };
}
