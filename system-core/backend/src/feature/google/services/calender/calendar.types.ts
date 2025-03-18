import { calendar_v3 } from 'googleapis';
import { GoogleListResponse, PaginationParams } from '../../types';

// Request types
export interface GetEventsParams extends PaginationParams {
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
    singleEvents?: boolean;
    orderBy?: 'startTime' | 'updated';
    q?: string;
}

export interface GetEventParams {
    calendarId?: string;
    eventId: string;
}

export interface EventAttendee {
    email: string;
    displayName?: string;
    optional?: boolean;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
}

export interface EventDateTime {
    dateTime?: string; // ISO format date-time with timezone
    date?: string;     // YYYY-MM-DD format for all-day events
    timeZone?: string; // IANA time zone format
}

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
        overrides?: {
            method: 'email' | 'popup';
            minutes: number;
        }[];
    };
    colorId?: string;
    transparency?: 'opaque' | 'transparent';
    visibility?: 'default' | 'public' | 'private' | 'confidential';
    conferenceData?: {
        createRequest?: {
            requestId?: string;
            conferenceSolutionKey?: {
                type: 'hangoutsMeet';
            };
        };
    };
}

export interface UpdateEventParams extends Partial<CreateEventParams> {
    calendarId?: string;
    eventId: string;
    sendUpdates?: 'all' | 'externalOnly' | 'none';
}

export interface DeleteEventParams {
    calendarId?: string;
    eventId: string;
    sendUpdates?: 'all' | 'externalOnly' | 'none';
}

export interface GetCalendarsParams extends PaginationParams { }

export interface CreateCalendarParams {
    summary: string;
    description?: string;
    location?: string;
    timeZone?: string;
}

export interface UpdateCalendarParams extends Partial<CreateCalendarParams> {
    calendarId: string;
}

// Response types
export type CalendarEvent = calendar_v3.Schema$Event;
export type CalendarEventList = GoogleListResponse<CalendarEvent>;
export type CalendarResource = calendar_v3.Schema$CalendarListEntry;
export type CalendarList = GoogleListResponse<CalendarResource>;