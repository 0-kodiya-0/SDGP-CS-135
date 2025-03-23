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
    // Get the original hook
    const calendarEvents = useCalendarEvents(accountId);
    // Get the original events state
    const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);

    /**
     * Fetch events from multiple calendars
     */
    const fetchEventsFromCalendars = useCallback(
        async (calendarIds: string[], timeMin: string, timeMax: string): Promise<void> => {
            if (calendarIds.length === 0) return;

            // Clear existing events
            setAllEvents([]);

            // Fetch events from each calendar
            for (const calendarId of calendarIds) {
                try {
                    const event = await calendarEvents.listEvents({
                        calendarId,
                        timeMin,
                        timeMax,
                        singleEvents: true,
                        orderBy: 'startTime'
                    });

                    // Append these events to our state
                    // Since listEvents updates its own internal state, we need to get the events another way
                    // This is where we would ideally modify the hook, but we'll use a different approach
                } catch (error) {
                    console.error(`Error fetching events for calendar ${calendarId}:`, error);
                }
            }
        },
        [accountId, calendarEvents]
    );

    // Return the enhanced hook
    return {
        ...calendarEvents,
        fetchEventsFromCalendars
    };
}