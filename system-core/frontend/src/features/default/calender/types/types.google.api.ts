// Define return types for each hook
export interface UseCalendarEventsReturn {
    events: CalendarEvent[];
    event: CalendarEvent | null;
    loading: boolean;
    error: string | null;
    nextPageToken?: string;

    // Event operations
    listEvents: (params?: {
        calendarId?: string;
        pageToken?: string;
        maxResults?: number;
        timeMin?: string;
        timeMax?: string;
        singleEvents?: boolean;
        orderBy?: 'startTime' | 'updated';
        q?: string;
    }) => Promise<void>;
    getEvent: (eventId: string, calendarId?: string) => Promise<CalendarEvent | null>;
    createEvent: (params: CreateEventParams) => Promise<CalendarEvent | null>;
    updateEvent: (eventId: string, params: Omit<UpdateEventParams, 'eventId'>) => Promise<CalendarEvent | null>;
    deleteEvent: (eventId: string, params?: { calendarId?: string, sendUpdates?: 'all' | 'externalOnly' | 'none' }) => Promise<boolean>;
}

export interface UseCalendarListReturn {
    calendars: CalendarResource[];
    loading: boolean;
    error: string | null;
    nextPageToken?: string;

    // Calendar operations
    listCalendars: (params?: {
        pageToken?: string;
        maxResults?: number;
    }) => Promise<void>;
    createCalendar: (params: CreateCalendarParams) => Promise<CalendarResource | null>;
    updateCalendar: (calendarId: string, params: Omit<UpdateCalendarParams, 'calendarId'>) => Promise<CalendarResource | null>;
    deleteCalendar: (calendarId: string) => Promise<boolean>;
}


// types.ts
// These types mirror the backend types but are adapted for frontend use

// Calendar Event types
export interface CalendarEvent {
    id?: string;
    summary?: string;
    description?: string;
    location?: string;
    htmlLink?: string;
    created?: string;
    updated?: string;
    start?: EventDateTime;
    end?: EventDateTime;
    attendees?: EventAttendee[];
    organizer?: {
        id?: string;
        email?: string;
        displayName?: string;
        self?: boolean;
    };
    creator?: {
        id?: string;
        email?: string;
        displayName?: string;
        self?: boolean;
    };
    recurrence?: string[];
    recurringEventId?: string;
    originalStartTime?: EventDateTime;
    transparency?: string;
    visibility?: string;
    iCalUID?: string;
    sequence?: number;
    status?: string;
    colorId?: string;
    hangoutLink?: string;
    conferenceData?: ConferenceData;
    reminders?: {
        useDefault?: boolean;
        overrides?: {
            method?: string;
            minutes?: number;
        }[];
    };
}

export interface EventDateTime {
    dateTime?: string; // ISO format date-time with timezone
    date?: string;     // YYYY-MM-DD format for all-day events
    timeZone?: string; // IANA time zone format
}

export interface EventAttendee {
    id?: string;
    email: string;
    displayName?: string;
    organizer?: boolean;
    self?: boolean;
    resource?: boolean;
    optional?: boolean;
    responseStatus?: string;
    comment?: string;
    additionalGuests?: number;
}

export interface ConferenceData {
    createRequest?: {
        requestId?: string;
        conferenceSolutionKey?: {
            type?: string;
        };
    };
    entryPoints?: Array<{
        entryPointType?: string;
        uri?: string;
        label?: string;
        pin?: string;
        accessCode?: string;
        meetingCode?: string;
        passcode?: string;
        password?: string;
    }>;
    conferenceSolution?: {
        key?: {
            type?: string;
        };
        name?: string;
        iconUri?: string;
    };
    conferenceId?: string;
    signature?: string;
    notes?: string;
}

// Calendar Resource types
export interface CalendarResource {
    id?: string;
    summary?: string;
    description?: string;
    location?: string;
    timeZone?: string;
    summaryOverride?: string;
    colorId?: string;
    backgroundColor?: string;
    foregroundColor?: string;
    hidden?: boolean;
    selected?: boolean;
    accessRole?: string;
    defaultReminders?: Array<{
        method?: string;
        minutes?: number;
    }>;
    notificationSettings?: {
        notifications?: Array<{
            type?: string;
            method?: string;
        }>;
    };
    primary?: boolean;
    deleted?: boolean;
    conferenceProperties?: {
        allowedConferenceSolutionTypes?: string[];
    };
}

// Request params for creating an event
export interface CreateEventParams {
    calendarId?: string;
    summary: string;
    description?: string;
    location?: string;
    start: EventDateTime;
    end: EventDateTime;
    attendees?: EventAttendee[];
    recurrence?: string[];
    reminders?: {
        useDefault?: boolean;
        overrides?: Array<{
            method: 'email' | 'popup';
            minutes: number;
        }>;
    };
    colorId?: string;
    transparency?: 'opaque' | 'transparent';
    visibility?: 'default' | 'public' | 'private' | 'confidential';
    conferenceData?: ConferenceData;
}

// Request params for updating an event
export interface UpdateEventParams extends Partial<CreateEventParams> {
    eventId: string;
    sendUpdates?: 'all' | 'externalOnly' | 'none';
}

// Request params for creating a calendar
export interface CreateCalendarParams {
    summary: string;
    description?: string;
    location?: string;
    timeZone?: string;
}

// Request params for updating a calendar
export interface UpdateCalendarParams extends Partial<CreateCalendarParams> {
    calendarId: string;
}

// Form data for creating/editing events
export interface EventFormData {
    calendarId?: string;
    summary: string;
    description: string;
    location: string;
    allDay: boolean;
    startDate: string; // YYYY-MM-DD
    startTime: string; // HH:MM
    endDate: string;   // YYYY-MM-DD
    endTime: string;   // HH:MM
    timeZone: string;
    attendees: string; // Comma-separated list of emails
    addConference: boolean;
    reminderMethod: 'email' | 'popup';
    reminderMinutes: number;
    useDefaultReminders: boolean;
}

// Event recurrence patterns
export const RECURRENCE_PATTERNS = {
    DAILY: 'RRULE:FREQ=DAILY',
    WEEKLY: 'RRULE:FREQ=WEEKLY',
    BIWEEKLY: 'RRULE:FREQ=WEEKLY;INTERVAL=2',
    MONTHLY: 'RRULE:FREQ=MONTHLY',
    YEARLY: 'RRULE:FREQ=YEARLY',
    WEEKDAYS: 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
    WEEKENDS: 'RRULE:FREQ=WEEKLY;BYDAY=SA,SU'
};

/**
 * Common time zones for dropdown menus
 */
export const COMMON_TIMEZONES = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
    { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
    { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' }
];