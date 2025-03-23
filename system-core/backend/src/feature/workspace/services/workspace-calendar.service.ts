import {
    ShareContentRequest,
    WorkspaceFeatureType,
    WorkspaceContent
} from '../workspace.types';
import { shareContentToWorkspace, getWorkspaceContent } from '../workspace.service';

/**
 * Share a calendar event to a workspace
 * @param workspaceId The workspace ID
 * @param accountId The account ID of the user sharing the event
 * @param eventId The Google Calendar event ID
 * @param metadata Additional metadata about the event
 */
export const shareCalendarEventToWorkspace = async (
    workspaceId: string,
    accountId: string,
    eventId: string,
    metadata: {
        summary?: string;
        description?: string;
        location?: string;
        start?: { dateTime?: string, date?: string };
        end?: { dateTime?: string, date?: string };
        creator?: string;
        organizer?: string;
        attendees?: Array<{ email: string, responseStatus?: string }>;
        recurrence?: string[];
        htmlLink?: string;
    }
): Promise<WorkspaceContent | null> => {
    const request: ShareContentRequest = {
        contentId: eventId,
        contentType: WorkspaceFeatureType.Calendar,
        metadata: {
            title: metadata.summary || 'Untitled Event',
            description: metadata.description || '',
            createdAt: new Date().toISOString(),
            location: metadata.location,
            startDateTime: metadata.start?.dateTime || metadata.start?.date,
            endDateTime: metadata.end?.dateTime || metadata.end?.date,
            creator: metadata.creator,
            organizer: metadata.organizer,
            attendees: metadata.attendees,
            recurrence: metadata.recurrence,
            url: metadata.htmlLink
        }
    };

    return shareContentToWorkspace(workspaceId, accountId, request);
};

/**
 * Get all calendar events shared in a workspace
 * @param workspaceId The workspace ID
 */
export const getWorkspaceCalendarEvents = async (
    workspaceId: string
): Promise<WorkspaceContent[]> => {
    return getWorkspaceContent(workspaceId, WorkspaceFeatureType.Calendar);
};

/**
 * Format a Google Calendar event for workspace display
 * @param event The Google Calendar event object
 */
export const formatCalendarEventForWorkspace = (event: any): {
    summary: string;
    description: string;
    location: string;
    start: { dateTime?: string, date?: string };
    end: { dateTime?: string, date?: string };
    creator: string;
    organizer: string;
    attendees: Array<{ email: string, responseStatus?: string }>;
    recurrence: string[];
    htmlLink: string;
} => {
    return {
        summary: event.summary || 'Untitled Event',
        description: event.description || '',
        location: event.location || '',
        start: event.start || {},
        end: event.end || {},
        creator: event.creator?.email || '',
        organizer: event.organizer?.email || '',
        attendees: event.attendees || [],
        recurrence: event.recurrence || [],
        htmlLink: event.htmlLink || ''
    };
};