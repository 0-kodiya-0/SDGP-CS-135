import { calendar_v3 } from 'googleapis';
import { GoogleListResponse, PaginationParams } from '../../types';

/**
 * Google Meet doesn't have a dedicated API, it's part of the Calendar API
 * Meet meetings are created as calendar events with conferenceData
 */

// Request types
export interface CreateMeetingParams {
    summary: string;
    description?: string;
    startTime: string; // ISO string format
    endTime: string;   // ISO string format
    timeZone?: string;
    attendees?: {
        email: string;
        displayName?: string;
        optional?: boolean;
    }[];
    notifyAttendees?: boolean;
    sendUpdates?: 'all' | 'externalOnly' | 'none';
    guestsCanModify?: boolean;
    guestsCanInviteOthers?: boolean;
    guestsCanSeeOtherGuests?: boolean;
}

export interface GetMeetingParams {
    meetingId: string;  // This is the event ID in the calendar API
}

export interface UpdateMeetingParams {
    meetingId: string;
    summary?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    timeZone?: string;
    attendees?: {
        email: string;
        displayName?: string;
        optional?: boolean;
    }[];
    notifyAttendees?: boolean;
    sendUpdates?: 'all' | 'externalOnly' | 'none';
    guestsCanModify?: boolean;
    guestsCanInviteOthers?: boolean;
    guestsCanSeeOtherGuests?: boolean;
}

export interface DeleteMeetingParams {
    meetingId: string;
    sendUpdates?: 'all' | 'externalOnly' | 'none';
}

export interface ListMeetingsParams extends PaginationParams {
    timeMin?: string;
    timeMax?: string;
    q?: string;
    singleEvents?: boolean;
    orderBy?: 'startTime' | 'updated';
}

// Response types
export interface MeetingData {
    id: string;
    summary: string;
    description?: string;
    start: {
        dateTime: string;
        timeZone?: string;
    };
    end: {
        dateTime: string;
        timeZone?: string;
    };
    conferenceData?: {
        conferenceId?: string;
        conferenceSolution?: {
            key?: {
                type?: string;
            };
            name?: string;
            iconUri?: string;
        };
        entryPoints?: {
            entryPointType?: string;
            uri?: string;
            label?: string;
            pin?: string;
            accessCode?: string;
            meetingCode?: string;
            passcode?: string;
            password?: string;
        }[];
    };
    hangoutLink?: string;
    meetLink?: string;
    attendees?: {
        email: string;
        displayName?: string;
        optional?: boolean;
        responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
    }[];
    organizer?: {
        email: string;
        displayName?: string;
    };
    created?: string;
    updated?: string;
    status?: string;
    guestsCanModify?: boolean;
    guestsCanInviteOthers?: boolean;
    guestsCanSeeOtherGuests?: boolean;
}

export type MeetingList = GoogleListResponse<MeetingData>;

// Helper function to safely transform conference data
function transformConferenceData(data: calendar_v3.Schema$ConferenceData | null | undefined) {
    if (!data) return undefined;

    return {
        conferenceId: data.conferenceId || undefined,
        conferenceSolution: data.conferenceSolution ? {
            key: data.conferenceSolution.key ? {
                type: data.conferenceSolution.key.type || undefined
            } : undefined,
            name: data.conferenceSolution.name || undefined,
            iconUri: data.conferenceSolution.iconUri || undefined
        } : undefined,
        entryPoints: data.entryPoints?.map(ep => ({
            entryPointType: ep.entryPointType || undefined,
            uri: ep.uri || undefined,
            label: ep.label || undefined,
            pin: ep.pin || undefined,
            accessCode: ep.accessCode || undefined,
            meetingCode: ep.meetingCode || undefined,
            passcode: ep.passcode || undefined,
            password: ep.password || undefined
        }))
    };
}

// Helper function to safely transform attendees
function transformAttendees(attendees: calendar_v3.Schema$EventAttendee[] | null | undefined) {
    if (!attendees) return undefined;

    return attendees
        .filter(a => a.email) // Filter out attendees without email
        .map(a => ({
            email: a.email!, // Already filtered out null/undefined emails
            displayName: a.displayName || undefined,
            optional: a.optional || undefined,
            responseStatus: (a.responseStatus as 'needsAction' | 'declined' | 'tentative' | 'accepted' | undefined) || undefined
        }));
}

// Helper function to safely transform organizer
function transformOrganizer(organizer: calendar_v3.Schema$EventAttendee | null | undefined) {
    if (!organizer || !organizer.email) return undefined;

    return {
        email: organizer.email,
        displayName: organizer.displayName || undefined
    };
}

// For internal use - calendar event to meeting mapping
export function calendarEventToMeeting(event: calendar_v3.Schema$Event): MeetingData {
    return {
        id: event.id || '',
        summary: event.summary || '',
        description: event.description || undefined,
        start: {
            dateTime: event.start?.dateTime || '',
            timeZone: event.start?.timeZone || undefined
        },
        end: {
            dateTime: event.end?.dateTime || '',
            timeZone: event.end?.timeZone || undefined
        },
        conferenceData: transformConferenceData(event.conferenceData),
        hangoutLink: event.hangoutLink || undefined,
        meetLink: event.hangoutLink || undefined, // Google Meet links are returned as hangoutLink
        attendees: transformAttendees(event.attendees),
        organizer: transformOrganizer(event.organizer),
        created: event.created || undefined,
        updated: event.updated || undefined,
        status: event.status || undefined,
        guestsCanModify: event.guestsCanModify || undefined,
        guestsCanInviteOthers: event.guestsCanInviteOthers || undefined,
        guestsCanSeeOtherGuests: event.guestsCanSeeOtherGuests || undefined,
    };
}