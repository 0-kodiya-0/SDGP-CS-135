import { EventDateTime, EventAttendee, EventFormData, CreateEventParams, CalendarEvent } from "../types/types.google.api";

/**
 * Create an event DateTime object
 */
export const createEventDateTime = (
    date: Date,
    allDay: boolean = false,
    timeZone?: string
): EventDateTime => {
    if (allDay) {
        // For all-day events, we only need the date part in YYYY-MM-DD format
        return {
            date: date.toISOString().split('T')[0]
        };
    } else {
        // For timed events, we need the full ISO datetime
        return {
            dateTime: date.toISOString(),
            timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }
};

/**
 * Format a date range for display
 */
export const formatDateRange = (
    startDateTime: EventDateTime,
    endDateTime: EventDateTime,
    timeZone?: string
): string => {
    // Set locale and timezone
    const options: Intl.DateTimeFormatOptions = {
        timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    // Check if this is an all-day event
    if (startDateTime.date && endDateTime.date) {
        // All-day event
        const startDate = new Date(startDateTime.date);
        const endDate = new Date(endDateTime.date);

        // Check if the event spans multiple days
        if (startDateTime.date === endDateTime.date) {
            // Single day event
            return startDate.toLocaleDateString(undefined, {
                ...options,
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else {
            // Multi-day event
            return `${startDate.toLocaleDateString(undefined, {
                ...options,
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            })} - ${endDate.toLocaleDateString(undefined, {
                ...options,
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            })}`;
        }
    } else if (startDateTime.dateTime && endDateTime.dateTime) {
        // Timed event
        const startDate = new Date(startDateTime.dateTime);
        const endDate = new Date(endDateTime.dateTime);

        // Check if the start and end dates are the same
        const sameDay = startDate.toDateString() === endDate.toDateString();

        if (sameDay) {
            // Same day event - show date once with start and end times
            return `${startDate.toLocaleDateString(undefined, {
                ...options,
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}, ${startDate.toLocaleTimeString(undefined, {
                ...options,
                hour: 'numeric',
                minute: '2-digit'
            })} - ${endDate.toLocaleTimeString(undefined, {
                ...options,
                hour: 'numeric',
                minute: '2-digit'
            })}`;
        } else {
            // Multi-day event with times
            return `${startDate.toLocaleDateString(undefined, {
                ...options,
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            })}, ${startDate.toLocaleTimeString(undefined, {
                ...options,
                hour: 'numeric',
                minute: '2-digit'
            })} - ${endDate.toLocaleDateString(undefined, {
                ...options,
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            })}, ${endDate.toLocaleTimeString(undefined, {
                ...options,
                hour: 'numeric',
                minute: '2-digit'
            })}`;
        }
    }

    // Fallback for invalid or mixed date format
    return "Invalid date range";
};

/**
 * Get the attendee status display text and color
 */
export const getAttendeeStatusInfo = (
    status: string | undefined
): { text: string; color: string } => {
    switch (status) {
        case 'accepted':
            return { text: 'Accepted', color: '#34A853' }; // Green
        case 'declined':
            return { text: 'Declined', color: '#EA4335' }; // Red
        case 'tentative':
            return { text: 'Maybe', color: '#FBBC05' }; // Yellow
        case 'needsAction':
        default:
            return { text: 'Not responded', color: '#9AA0A6' }; // Gray
    }
};

/**
 * Create attendee objects from email addresses
 */
export const createAttendees = (emails: string[]): EventAttendee[] => {
    return emails.map(email => ({ email }));
};

/**
 * Extract date and time parts from an ISO date string
 */
export const extractDateTimeParts = (
    isoString: string
): { date: string; time: string } => {
    const date = new Date(isoString);
    return {
        date: date.toISOString().split('T')[0], // YYYY-MM-DD
        time: date.toTimeString().slice(0, 5)   // HH:MM
    };
};



/**
 * Convert form data to API parameters
 */
export function formToEventParams(formData: EventFormData): CreateEventParams {
    // Create start and end date-time objects
    const start: EventDateTime = formData.allDay
        ? { date: formData.startDate }
        : {
            dateTime: `${formData.startDate}T${formData.startTime}:00`,
            timeZone: formData.timeZone
        };

    const end: EventDateTime = formData.allDay
        ? { date: formData.endDate }
        : {
            dateTime: `${formData.endDate}T${formData.endTime}:00`,
            timeZone: formData.timeZone
        };

    // Parse attendees from comma-separated list
    const attendees = formData.attendees
        ? formData.attendees
            .split(',')
            .map(email => email.trim())
            .filter(Boolean)
            .map(email => ({ email }))
        : undefined;

    // Create conference data if requested
    const conferenceData = formData.addConference
        ? {
            createRequest: {
                conferenceSolutionKey: {
                    type: 'hangoutsMeet'
                }
            }
        }
        : undefined;

    // Create reminders if not using defaults
    const reminders = !formData.useDefaultReminders
        ? {
            useDefault: false,
            overrides: [
                {
                    method: formData.reminderMethod,
                    minutes: formData.reminderMinutes
                }
            ]
        }
        : { useDefault: true };

    return {
        calendarId: formData.calendarId,
        summary: formData.summary,
        description: formData.description || undefined,
        location: formData.location || undefined,
        start,
        end,
        attendees,
        conferenceData,
        reminders
    };
}

/**
 * Convert event to form data
 */
export function eventToFormData(event: CalendarEvent): EventFormData {
    // Determine if it's an all-day event
    const isAllDay = Boolean(event.start?.date);

    // Extract start date and time
    let startDate = '';
    let startTime = '';
    if (isAllDay && event.start?.date) {
        startDate = event.start.date;
    } else if (event.start?.dateTime) {
        const dateTime = new Date(event.start.dateTime);
        startDate = dateTime.toISOString().split('T')[0];
        startTime = dateTime.toTimeString().slice(0, 5);
    }

    // Extract end date and time
    let endDate = '';
    let endTime = '';
    if (isAllDay && event.end?.date) {
        endDate = event.end.date;
    } else if (event.end?.dateTime) {
        const dateTime = new Date(event.end.dateTime);
        endDate = dateTime.toISOString().split('T')[0];
        endTime = dateTime.toTimeString().slice(0, 5);
    }

    // Get attendees as comma-separated string
    const attendeesString = event.attendees
        ? event.attendees
            .filter(a => !a.organizer && !a.self) // Exclude organizer and self
            .map(a => a.email)
            .join(', ')
        : '';

    // Determine if using default reminders
    const useDefaultReminders = event.reminders?.useDefault ?? true;

    // Get reminder method and minutes
    let reminderMethod: 'email' | 'popup' = 'popup';
    let reminderMinutes = 30;
    if (event.reminders?.overrides && event.reminders.overrides.length > 0) {
        reminderMethod = (event.reminders.overrides[0].method as 'email' | 'popup') || 'popup';
        reminderMinutes = event.reminders.overrides[0].minutes || 30;
    }

    return {
        calendarId: event.organizer?.email || undefined,
        summary: event.summary || '',
        description: event.description || '',
        location: event.location || '',
        allDay: isAllDay,
        startDate,
        startTime,
        endDate,
        endTime,
        timeZone: event.start?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        attendees: attendeesString,
        addConference: Boolean(event.conferenceData),
        reminderMethod,
        reminderMinutes,
        useDefaultReminders
    };
}

/**
 * Get event status color
 */
export function getEventStatusColor(event: CalendarEvent): string {
    if (event.status === 'cancelled') {
        return '#EA4335'; // Red
    }

    // Check if the user has responded
    const selfAttendee = event.attendees?.find(a => a.self);
    if (selfAttendee) {
        switch (selfAttendee.responseStatus) {
            case 'accepted':
                return '#34A853'; // Green
            case 'declined':
                return '#EA4335'; // Red
            case 'tentative':
                return '#FBBC05'; // Yellow
            default:
                return '#4285F4'; // Blue (default)
        }
    }

    return '#4285F4'; // Blue (default)
}

/**
 * Format event time based on all-day or timed
 */
export function formatEventTime(event: CalendarEvent): string {
    if (event.start?.date) {
        // All-day event
        const startDate = new Date(event.start.date);
        if (event.end?.date) {
            const endDate = new Date(event.end.date);
            // Subtract one day from end date because Google's end date is exclusive
            endDate.setDate(endDate.getDate() - 1);

            if (startDate.toDateString() === endDate.toDateString()) {
                // Single day
                return startDate.toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                });
            } else {
                // Multiple days
                return `${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
            }
        }
        return 'All day';
    } else if (event.start?.dateTime && event.end?.dateTime) {
        // Timed event
        const start = new Date(event.start.dateTime);
        const end = new Date(event.end.dateTime);
        return `${start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
    }

    return '';
}