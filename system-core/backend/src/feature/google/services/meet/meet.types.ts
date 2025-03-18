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

// For internal use - calendar event to meeting mapping
export function calendarEventToMeeting(event: calendar_v3.Schema$Event): MeetingData {
    return {
        id: event.id || '',
        summary: event.summary || '',
        description: event.description,
        start: {
            dateTime: event.start?.dateTime || '',
            timeZone: event.start?.timeZone
        },
        end: {
            dateTime: event.end?.dateTime || '',
            timeZone: event.end?.timeZone
        },
        conferenceData: event.conferenceData,
        hangoutLink: event.hangoutLink,
        meetLink: event.hangoutLink, // Google Meet links are returned as hangoutLink
        attendees: event.attendees,
        organizer: event.organizer,
        created: event.created,
        updated: event.updated,
        status: event.status,
        guestsCanModify: event.guestsCanModify,
        guestsCanInviteOthers: event.guestsCanInviteOthers,
        guestsCanSeeOtherGuests: event.guestsCanSeeOtherGuests,
    };
}